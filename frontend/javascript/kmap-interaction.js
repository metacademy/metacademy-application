/*
 PARAMETERS
 */

// controls right panel content widths and margins
var rp_content_width = 18;
var rp_lmarg_use = 1;
var rp_rmarg_use = 1;

/*
 HELPER FUNCTIONS
 */


function isUrl(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}

function wrapLink(title, loc, aclass) {
    aclass = aclass ? "class=" + aclass : "";
    return "<a target='_blank' href='" + loc + "'" + aclass + ">" + title + "</a>";
}

function wrapDiv(content, props) {
    return '<div' + (props ? ' ' + props : '') + '>' + content + '</div>';
}

function buildResourceDiv(rsrc_db_ent, rsrc_node) {
    /*
     Builds the additonal info resources div
     */
    var extra_info = [];
    var ignore_fields = ["source", "location", "mark"];
    for (attr in rsrc_node) {
        if (rsrc_node.hasOwnProperty(attr) && ignore_fields.indexOf(attr) === -1) {
            extra_info.push(wrapDiv(attr + ': ' + rsrc_node[attr], 'class="res-extra-ent"'));
        }
    }

    if ('notes' in rsrc_db_ent) {
        if (rsrc_db_ent.notes) {
            extra_info.push(wrapDiv('note: ' + rsrc_db_ent.notes, 'class="res-extra-ent"'));
        }
    }

    if (extra_info.length > 0) {
        var ret_text = wrapDiv(extra_info.join("\n"), 'class=res-extras') + wrapDiv('<a href="" class="moreres">' + '[additional info]' + '</a>');
    }
    else {
        var ret_text = "";
    }

    return ret_text;
}

function printError(xhr, status) {
    /*
     print errors from ajax calls
     */
    switch (status) {
        case 404:
            console.error('File not found');
            break;
        case 500:
            console.error('Server error');
            break;
        case 0:
            console.error('Request aborted');
            break;
        default:
            console.error('Unknown error ' + status + ' ' + xhr.status);
    }
}

function beautifyText() {
    /*
     shorten and clean up displayed text
     */
    $('.shorten').each(function () {
        var maxchar = 250;
        var content = $(this).html();
        if (content.length > maxchar) {
            var break_loc = content.substring(0, maxchar).indexOf(". ") + 1; // try to break on a sentence
            if (break_loc === 0) {
                break_loc = content.substring(0, maxchar).lastIndexOf(" ") + 1;
                if (break_loc === 0) {
                    break_loc = maxchar;
                }
            }
            var short_content = content.substring(0, break_loc);
            var long_content = content.substring(break_loc, content.length);
            var html = short_content + '<span>' + "..." + '&nbsp;</span> <span class="morecontent">' + long_content + '</span><a href="" class="morelink">' + '[more]' + '</a>';
            $(this).html(html);
        }
    });

    $('.morelink').on('click', function () {
        var $this = $(this);
        $this.hide();
        $this.prev().prev().hide();
        $this.prev().show();
        return false;
    });

    $('.moreres').on('click', function () {
        var $this = $(this);
        $this.hide();
        $this.parent().prev().show();
        return false;
    });
}


/*
 MAIN INTERACTION CODE
 */

// load the SVG file using AJAX
var jdata = null;
function load_svg(node_name) {

    if (node_name === 'nodes' || node_name==='') {
        var get_url = window.CONTENT_SERVER +'/nodes'
    } else {
        var get_url = window.CONTENT_SERVER + '/nodes/' + node_name + '/map'
    }

    // 1st ajax call: load the kmap svg file (output from graphviz)
    $.ajax({
        type:'GET',
        url:get_url + '?format=svg',
        async:false,
        success:function (svgFileData) {
            // remove previous data
            $("svg").remove();

            // load new data
            var svgd = document.importNode(svgFileData.documentElement, true);
            $('#leftpanel').append(svgd);

            // *************************************************
            // ***** post-processing from graphviz output ******
            // *************************************************

            // sort the edges and nodes so that edges don't overlap the nodes
            var gelems = d3.selectAll('.node,.edge');
            var gdata = gelems[0].map(function (itm) {
                if (d3.select(itm).attr('class') === 'node') {
                    return 1
                }
                return 0
            });
            gelems.data(gdata).sort();

            // change title to id and remove title
            gelems.attr('id', function () {
                return d3.select(this).select('title').text()
            })
            gelems.selectAll("title").remove(); // remove the title for a cleaner hovering experience
            d3.select('g').selectAll("title").remove(); // also remove title from graph

            // make the svg canvas fill the entire screen
            d3.select('svg').attr('width', '100%');
            d3.select('svg').attr('height', '100%');
            $('#leftpanel').css('overflow','hidden');


            // *************************************************
            // *****   add dynamic properties to nodes    ******
            // *************************************************

            var last_node = -1;
            d3.selectAll(".node")
                .on("mouseover", function () {
                    var node = d3.select(this);
                    if (node.attr('clicked') == null) {
                        node.select('ellipse').attr('fill', '#E6EEEE')
                    }
                })
                .on("mouseout", function () {
                    var node = d3.select(this);
                    if (node.attr('clicked') == null) {
                        node.select('ellipse').attr('fill', 'white')
                    }
                })
                .on("click", function (d) {
                    var this_node = d3.select(this).attr('clicked', 'true');
                    var text_panel = d3.select("#righttext");

                    // First check to see if the node was already clicked and change previous node properties
                    if (last_node === -1) {
                        last_node = this_node;
                        setRightPanelWidth(rp_content_width, rp_lmarg_use, rp_rmarg_use);
                    }
                    else {
                        last_node.attr("clicked", null)
                            .select('ellipse')
                            .attr("fill", "white");

                        if (this_node.attr('id') === last_node.attr('id')) {
                            last_node = -1;
                            text_panel.html("");
                            setRightPanelWidth(0);
                            return;
                        }

                        last_node = this_node;
                    }

                    this_node.select('ellipse')
                        .attr("fill", "#F5EEEE");

                    // TODO make sure we have jdata & handle errors appropriately
                    var node_data = jdata.nodes[this_node.attr('id')];
                    text_panel.html("");

                    // add title
                    if ('title' in node_data) {
                        text_panel.append("div")
                            .attr("class", "data-title")
                            .text(node_data['title']);
                    }

                    // add summary
                    if ('summary' in node_data) {
                        var spanel = text_panel.append('div')
                            .attr('class', 'data-description');
                        var sum = node_data['summary']
                        // check if summary is from wikipedia
                        if (sum.substring(0, 6) === '*Wiki*') {
                            sum = sum.substring(6);
                            spanel.append('a')
                                .attr('target', '_blank')
                                .attr('href', 'http://www.en.wikipedia.org/wiki/'
                                + encodeURI(node_data['title'] ? node_data['title'] : this_node.attr('id')))
                                .append('img')
                                .attr('class', 'hastip wiki-img')
                                .attr('title', 'summary from wikipedia -- click to load wikipedia entry')
                                .attr('src', '/static/images/wiki.png');
                        }
                        spanel.append("span")
                            .attr("class", "shorten")
                            .text(sum);
                    }
                    // add resources
                    if ('resources' in node_data) {
                        // sort the elements so starred entries come first
                        node_data['resources'].sort(function (a, b) {
                            var ma = Number("mark" in a);
                            var mb = Number("mark" in b);
                            return (mb > ma) ? 1 : ((ma > mb) ? -1 : 0);
                        });
                        text_panel.append('div')
                            .attr('class', 'data-subtitle')
                            .text('Learning Resources');
                        var rents = text_panel.append('div')
                            .attr("class", "resources")
                            .selectAll('div')
                            .data(node_data['resources'])
                            .enter()
                            .append('div')
                            .attr('class', 'resource-entry');
                        rents.append('div')
                            .attr('class', 'list-entry')
                            .html(function (d) {
                                // Add an appropriate styled bullet with appropriate title
                                var bullet = "mark" in d ? '<span class="gold-text">&#9733;</span>' : '&#8226;';
                                bullet = '<div class="bullet-ptr">' + bullet + '</div>'

                                // obtain resource info
                                var rsrc = jdata.node_resources[d.source];
                                var title = "title" in rsrc ? rsrc.title : d.source;
                                title = "location" in rsrc ? wrapLink(title, rsrc.location) : title;
                                var info_loc = "location" in d ? d.location : "";
                                if (isUrl(info_loc)) {
                                    info_loc = wrapLink("direct link", info_loc, "direct-link");
                                }
                                // is it free?
                                var cost_mark = Number(rsrc.free) ? "" : '<span class="cost-dollar"> $</span>';

                                // create display
                                var disp = '<div class="list-text">' + title + cost_mark
                                    + '<div class="info-loc">[' + info_loc + "]</div>" + buildResourceDiv(rsrc, d) + "</div>";
                                return bullet + disp;
                            })
                    }

                    // add comprehension questions
                    if ('ckeys' in node_data) {
                        text_panel.append('div')
                            .attr('class', 'data-subtitle')
                            .text('Comprehension');

                        var ckents = text_panel.append("div")
                            .attr('class', 'ckeys')
                            .selectAll('div')
                            .data(node_data['ckeys'])
                            .enter()
                            .append('div')
                            .attr('class', 'list-entry resource-entry')
                            .html(function (d) {
                                return  '<div class="bullet-ptr"> &#8226;</div><div class="list-text">' + d.text.replace('* ', '') + '</div>';
                            });
                    }

                    // add dependencies info
                    if ('dependencies' in node_data) {
                        text_panel.append('div')
                            .attr('class', 'data-subtitle')
                            .text('Dependencies');

                        var lent = text_panel.append("div")
                            .attr("class", "data-dependencies")
                            .selectAll('div')
                            .data(node_data['dependencies'])
                            .enter()
                            .append('div')
                            .attr('class', 'list-entry');

                        lent.append('div')
                            .attr('class', 'bullet-ptr')
                            .append('img')
                            .attr('src', '/static/images/qmark.jpg')
                            .attr('class', 'list-img hastip')
                            .attr('title', function (d) {
                                return d.reason === "None" ? "" : d.reason;
                            });

                        lent.append('div')
                            .attr('class', 'list-text')
                            .text(function (d) {
                                return jdata.nodes[d.from_tag].title;
                            });
                    }

                    // add pointer (see-also) info
                    // if ('pointers' in node_data) {
                    //     var ptrs = $.trim(node_data['pointers']).split(/([^\*]|^)\*[^\*]/) 
                    //     text_panel.append('div')
                    //         .attr('class', 'data-subtitle')
                    //         .text('See Also')
                    //     var dp_enter = text_panel.append("div")
                    //         .attr("class", "data-pointers")
                    //         .selectAll('div')
                    //         .data(ptrs)
                    //         .enter()
                    //         .append('div')
                    //         .attr('class', 'list-entry')
                    //         .html(function(d){
                    //             var rethtml = "";
                    //             var subdiv = d.split(/\*\*/);
                    //             rethtml = "<li>" + subdiv[0] + "</li>";
                    //             if (subdiv.length > 1){
                    //                 rethtml += "<li>\n<ul>";
                    //                 for (var jj=1; jj < subdiv.length; jj++ ){
                    //                     rethtml += "<li>" + subdiv[jj] + "</li>";
                    //                 }
                    //                 rethtml += "</ul></li>"
                    //             }
                    //             return rethtml
                    //         });

                    //     // dp_enter.append('div')
                    //     //     .attr('class', 'bullet-ptr')
                    //     //     .append('img')
                    //     //     .attr('src', '/static/images/qmark.jpg')
                    //     //     .attr('class', 'list-img hastip')
                    //     //     .attr('title', function (d) {
                    //     //         return d.reason === "None" ? "" : d.reason;
                    //     //     });
                    //     // dp_enter.append('div')
                    //     //     .attr('class', 'list-text')
                    //     //     .text(function (d) {
                    //     //         return jdata.nodes[d.to_tag].title;
                    //     //     });
                    // }


                    // add "focus" button
                    text_panel.append("div")
                        .attr('class', 'topic-focus')
                        .append("button")
                        .text('Focus on Topic')
                        .attr('class', 'topic-focus')
                        .on('click', function (d) {
                            load_svg(this_node.attr('id'));
                        });

                    // tooltip for pretty hover info TODO consider writing this yourself since it is GPL
                    $('.hastip').tooltipsy({offset:[1, 1]});
                    beautifyText();

                });

            // *************************************************
            // **************   Post Processing   **************
            // *************************************************
            // obtain orginal transformation since graphviz produces unnormalized coordinates
            var transprops = d3.select(".graph").attr("transform").match(/[0-9]+( [0-9]+)?/g);
            var otrans = transprops[2].split(" ").map(Number);
            var dzoom = d3.behavior.zoom();
            dzoom.translate(otrans);

            // make graph zoomable/translatable
            var vis = d3.select("svg")
                .attr("pointer-events", "all")
                .attr("viewBox", null)
                .call(dzoom.on("zoom", redraw))
                .select(".graph");

            // helper function to redraw svg graph with correct coordinates
            function redraw() {
                vis.attr("transform",
                    "translate(" + d3.event.translate + ")"
                        + " scale(" + d3.event.scale + ")");
            }

        },
        error:printError
    })
    ;

// 2nd AJAX call: get json graph data (dependencies, see-also, etc)
    $.ajax({
        type:'GET',
        url:get_url + '?format=json',
	dataType:'json',
        async:false,
        scriptCharset:"utf-8",
        success:function (data) {
            jdata = data;
            console.log("valid AJAX call for json graph data");
        },
        error:printError
    });

}

// load the first dataset in the list (for now) TODO make better initialization
$(document).ready(function () {
    scaleWindowSize("header", "main", "rightpanel", "leftpanel");
    setRightPanelWidth(0);
    load_svg($('#data-select').val());

});
