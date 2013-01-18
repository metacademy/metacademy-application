function loaddoc(title) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else { // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("bottomtext").innerHTML = xmlhttp.responseText;
        }
    }
    document.getElementById("bottomtitle").innerHTML = title.split("-").slice(0, -1).join(" ");
    xmlhttp.open("GET", "../doc-text/" + title, true);
    xmlhttp.send();

}

function openlw(doc) {
    myLightWindow.activateWindow({
        href: '../documents/' + doc,
        type: 'external',
        width: '950'
    });
}

d3.select("#doc-button").on("click", function() {
    d3.select("#doc-button").classed("active", true);
    d3.select("#terms-button").classed("active", false);
    gload(doc_data, top_data);
});
d3.select("#terms-button").on("click", function() {
    d3.select("#doc-button").classed("active", false);
    d3.select("#terms-button").classed("active", true);
    gload(term_data, top_data);
});

var gload = function(jdata, leg_data) {
    var w = document.getElementById("leftpanel").clientWidth;
    var h = document.getElementById("leftpanel").clientHeight - document.getElementById("leftheader").clientHeight - 5;
    var fill = d3.scale.category20();
    d3.select("#legend").remove()
    d3.selectAll("line.link").remove();
    d3.selectAll("circle.node").remove();
    d3.select("#fgraph").remove();
    var vis = d3.select("#leftpanel").append("div")
        .attr("id", "fgraph")
        .append("svg:svg")
        .attr("height", h)
        .attr("width", w)
        .attr("pointer-events", "all")
        .call(d3.behavior.zoom().on("zoom", redraw))
        .append('svg:g');


    vis.append('svg:rect')
        .attr('height', h)
        .attr('fill', 'white');

    function redraw() {
        vis.attr("transform",
            "translate(" + d3.event.translate + ")"
                + " scale(" + d3.event.scale + ")");
    }

    var force = d3.layout.force()
        .charge(-120)
        .gravity(0.20)
        .linkDistance(12)
        .theta(.8)
        .nodes(jdata.nodes)
        .links(jdata.links)
        .size([w, h])
        .start();

    var link = vis.selectAll("line.link")
        .data(jdata.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) {
            return 1;
        })// Math.sqrt(d.value)
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });

    var lastNode = -1;
    var littleR = 5;
    var bigR = 10;
    var node = vis.selectAll("circle.node")
        .data(jdata.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("r", 5)
        .on("click", function(d) {
            if (lastNode != -1) {
                lastNode.setAttribute("r", littleR);
                lastNode.removeAttribute("clicked")
            }
            lastNode = this;
            this.setAttribute("r", bigR)
            this.setAttribute("clicked", true)
            loaddoc(d.name);
            return null;
        })
        .on('mouseover', function(d) {
            this.setAttribute("r", bigR)
        })
        .on('mouseout', function(d) {
            if (!this.hasAttribute("clicked")) {
                this.setAttribute("r", littleR)
            }
        })
        .style("fill", function(d) {
            return fill(d.group);
        });

    node.append("title")
        .text(function(d) {
            return d.name;
        });

    force.on("tick", function() {
        link.attr("x1", function(d) {
            return d.source.x;
        })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node.attr("cx", function(d) {
            return d.x;
        })
            .attr("cy", function(d) {
                return d.y;
            });
    });

    // topic selector function for legend
    function compareTopic(topic, doc){
        return topic.id == doc.group;
    }
    function fade(d, bo) {
            var opacity = bo ? 0.1 : 1;
            node.style('fill-opacity', function(o) {
                var thisOpac = compareTopic(d, o) ? 1 : opacity;
                this.setAttribute('stroke-opacity', thisOpac);
                return thisOpac;
            });
    }

    var legend = d3.select("#rightpanel")
        .append("div")
        .attr("id", "legend")
        .selectAll("circle")
        .data(leg_data)
        .enter()
        .append("div")
        .attr("class", "leg_entry");

    legend.append("div")
        .attr("class", "leg_node")
        .append("svg:svg")
        .attr("height", 24)
        .attr("width", 24)
        .append("svg:circle")
        .on("mouseover", function(d, i) {
            fade(d, true);
        })
        .on("mouseout", function(d, i) {
            if (!d.clicked)
                fade(d, false);
        })
        .on("click", function(d){
            if (d.clicked)
                d.clicked = false
            else
                d.clicked = true
        })
        .style("fill", function(d) {
            return fill(d.id)
        })
        .attr("r", 10)
        .attr("cx", 12)
        .attr("cy", 12)


    legend.append("div")
        .attr("class", "leg_text")
        .text(function(d) {
            return d.title
        });
}
gload(doc_data, top_data)