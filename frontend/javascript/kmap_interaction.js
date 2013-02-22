

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

// object to control window resizing
var windowSize = {
    height:0,
    mainHeight:0,
    rightPanelHeight:0,
    headerHeight:0,
    setDimensions:function () {
        windowSize.height = $(window).height();
        windowSize.headerHeight = $('#header').height();
        windowSize.mainHeight = windowSize.height - windowSize.headerHeight;
        windowSize.rightPanelHeight = windowSize.height;
        windowSize.updateSizes();
    },
    updateSizes:function () {
        $('#main').css('height', windowSize.mainHeight + 'px');
        $('#rightpanel').css('height', (windowSize.rightPanelHeight) + 'px');
    },
    init:function () {
        if ($('#main').length) {
            windowSize.setDimensions();
            $(window).resize(function () {
                windowSize.setDimensions();
            });
        }
    }
};

function setRightPanelWidth(rp_width, rp_lmarg, rp_rmarg) {
    /*
     Changes display size of the right margin
     See corresponding CSS entries for description of values
     */
    rp_lmarg = rp_lmarg || 0;
    rp_rmarg = rp_rmarg || 0;
    var rper_width = rp_width + "%";

    $(".colcontainer").css("right", rper_width);
    $("#leftpanel").css("left", rper_width)
        .css("width", (100 - rp_width) + "%");
    $("#rightpanel").css("width", (rp_width - rp_lmarg - rp_rmarg) + "%")
        .css("left", (rp_width + rp_lmarg) + "%")
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


/*
 MAIN INTERACTION CODE
 */

// load the SVG file using AJAX
var jdata = null;
function load_svg(node_name) {
    if (node_name.length == 0) {
        return
    }

    if (node_name == 'full_graph') {
        var get_url = '/full_graph'
    } else {
        var get_url = '/nodes/' + node_name.replace(/_/g, '-') + '/map'
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
                if (d3.select(itm).attr('class') == 'node') {
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

            // make the svg canvas fill the entire screen TODO: more elegant way to do this?
            d3.select('svg').attr('width', '10000pt');
            d3.select('svg').attr('height', '10000pt');


            // *************************************************
            // *****   add dynamic properties to nodes    ******
            // *************************************************

            var last_node = -1;
            d3.selectAll(".node")
                .on("mouseover", function () {
                    node = d3.select(this);
                    if (node.attr('clicked') == null) {
                        node.select('ellipse').attr('fill', '#E6EEEE')
                    }
                })
                .on("mouseout", function () {
                    node = d3.select(this);
                    if (node.attr('clicked') == null) {
                        node.select('ellipse').attr('fill', 'white')
                    }
                })
                .on("click", function (d) {
                    var this_node = d3.select(this).attr('clicked', 'true');
                    var text_panel = d3.select("#righttext");

                    // First check to see if the node was already clicked and change previous node properties
                    if (last_node == -1) {
                        last_node = this_node;
                        setRightPanelWidth(rp_content_width, rp_lmarg_use, rp_rmarg_use);
                    }
                    else {
                        last_node.attr("clicked", null)
                            .select('ellipse')
                            .attr("fill", "white");

                        if (this_node.attr('id') == last_node.attr('id')) {
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
                    var node_data = jdata[this_node.attr('id')];
                    text_panel.html("");

                    text_panel.append("div")
                        .attr("class", "data-title")
                        .text(node_data['title']);

                    text_panel.append("div")
                        .attr("class", "data-description")
                        .text("[lorem ipsum]");  // TODO -- add data content/references (wikipedia for starters?)

                    // add pointer (see-also) info
                    if (node_data['pointers'].length > 0) {
                        text_panel.append('div')
                            .attr('class', 'data-subtitle')
                            .text('See Also');
                        var dp_enter = text_panel.append("div")
                            .attr("class", "data-pointers")
                            .selectAll('div')
                            .data(node_data['pointers'])
                            .enter()
                            .append('div')
                            .attr('class', 'list-entry');

                        dp_enter.append('div')
                            .attr('class', 'help-ptr')
                            .append('img')
                            .attr('src', '/static/images/qmark.jpg')
                            .attr('class', 'list-img hastip')
                            .attr('title', function (d) {
                                return d.blurb == "None" ? "" : d.blurb;
                            });
                        dp_enter.append('div')
                            .attr('class', 'list-text')
                            .text(function (d) {
                                return d.to_tag.replace('-', ' ');
                            });
                    }

                    // add dependencies info
                    if (node_data['dependencies'].length > 0) {
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
                            .attr('class', 'help-ptr')
                            .append('img')
                            .attr('src', '/static/images/qmark.jpg')
                            .attr('class', 'list-img hastip')
                            .attr('title', function (d) {
                                return d.reason == "None" ? "" : d.reason;
                            });

                        lent.append('div')
                            .attr('class', 'list-text')
                            .text(function (d) {
                                return d.from_tag.replace('-', ' ');
                            });

                    }

                    // add "focus" button
                    text_panel.append("div")
                        .attr('class', 'topic-focus')
                        .append("button")
                        .text('Focus on Topic')
                        .attr('class', 'topic-focus')
                        .on('click', function (d) {
                            load_svg(this_node.attr('id').replace('_', '-'));
                        });

                    // tooltip for pretty hover info TODO consider writing this yourself
                    $('.hastip').tooltipsy();

                })

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
    });

    // 2nd AJAX call: get json graph data (dependencies, see-also, etc)
    $.ajax({
        type:'GET',
        url:get_url + '?format=json',
        async:false,
        success:function (data) {
            jdata = data;
            console.log("valid AJAX call for json graph data");
        },
        error:printError
    });

}

// load the first dataset in the list (for now) TODO make better initialization
$(document).ready(function () {
    windowSize.init();
    setRightPanelWidth(0);
    load_svg($('#data-select').val());
});
