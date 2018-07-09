CHART_WIDTH = 960;
CHART_HEIGHT = 640;
CHART_MARGIN = { top: 20, right: 170, bottom: 30, left: 50 }

function buildAllScores() {
    svg = d3.select("#all-scores");
    sizeSVG(svg);
    var width = svg.attr("width") - CHART_MARGIN.left - CHART_MARGIN.right;
    var height = svg.attr("height") - CHART_MARGIN.top - CHART_MARGIN.bottom;
    g = svg.append("g")
        .attr("transform",
              "translate(" + CHART_MARGIN.left + "," + CHART_MARGIN.top + ")");

    xAxis = getXAxisAllTime(1, (14*League.seasons.length))
    yAxis = getYAxisAllTime()

    colorMap = d3.scaleOrdinal(d3.schemeCategory10);
    colorMap.domain(League.allTime.weeks.map(function(team) { return team.team_id; }));

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis))
        .append("text")
        .attr("y", -10)
        .attr("x", CHART_WIDTH)
        .attr("fill", "#000")
        .text("Week #");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yAxis))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Points");

    g.selectAll(".dot")
        .data(League.allTime.weeks)
        .enter().append("circle")
        .attr("fill", function(d) { return colorMap(d.team_id);})
        .attr("r", 3.5)
        .attr("cx", function(d) {
            return xAxis(d.week + (14 * (d.year - League.seasons[0].year)));  // FIXME
        })
        .attr("cy", function(d) {
            return yAxis(d.score);
        })
        .on("mouseover", function(d) {
            div.transition()
            .duration(200)
            .style("opacity", .9);
            div.html(d.owner + ":" + " " + d.score + " points<br/>"+d.team_name+"<br/>"+d.year+"<br/>Week "+d.week)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 40) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
            .duration(500)
            .style("opacity", 0);
       });
}

function getXAxisAllTime(min, max) {
    return d3.scaleLinear().range([0, CHART_WIDTH]).domain([min, max])
}

function getYAxisAllTime() {
    return d3.scaleLinear()
        .range([0, CHART_HEIGHT])
        .domain([200, 20])
}

function sizeSVG(svg) {  // TODO this is duplicated
    svg.attr(
        "width",
        CHART_WIDTH + CHART_MARGIN.left + CHART_MARGIN.right
    )
    .attr(
        "height",
        CHART_HEIGHT + CHART_MARGIN.top + CHART_MARGIN.bottom
     ) // svg height
}

$(document).ready(function() {
    buildAllScores();
});
