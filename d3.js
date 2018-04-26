d3.json("https://s3.us-east-2.amazonaws.com/emmettwmoore-assets/league-2015.json",
    buildChart)

CHART_WIDTH = 960;
CHART_HEIGHT = 800;
CHART_MARGIN = { top: 20, right: 80, bottom: 30, left: 50 }

function buildChart(data) {
    console.log(data);
    var svg = d3.select(".line-graph");
    sizeSVG(svg);
    xAxis = getXAxis();
    yAxis = getYAxis();
    var width = svg.attr("width") - CHART_MARGIN.left - CHART_MARGIN.right;
    var height = svg.attr("height") - CHART_MARGIN.top - CHART_MARGIN.bottom;
    g = svg.append("g")
        .attr("transform",
              "translate(" + CHART_MARGIN.left + "," + CHART_MARGIN.top + ")");

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

    doIt(g, data.teams, xAxis, yAxis)
}

function getXAxis() {
    return d3.scaleLinear().range([0, CHART_WIDTH]).domain([1, 14])
}

function getYAxis() {
    return d3.scaleLinear()
        .range([0, CHART_HEIGHT])
        .domain([200, 20])
}

function sizeSVG(svg) {
    svg.attr(
        "width",
        CHART_WIDTH + CHART_MARGIN.left + CHART_MARGIN.right
    )
    .attr(
        "height",
        CHART_HEIGHT + CHART_MARGIN.top + CHART_MARGIN.bottom
     ) // svg height
}

function doIt(g, teams, xAxis, yAxis) {
    z = d3.scaleOrdinal(d3.schemeCategory10);
    z.domain(teams.map(function(team) { return team.team_id; }));
    var line = d3.line()
        .curve(d3.curveCatmullRom.alpha(0.5))
        .x(function(d) { return xAxis(d.week); })
        .y(function(d) { return yAxis(d.points_for); });

    var team = g.selectAll(".team")
        .data(teams)
        .enter().append("g")
        .attr("class", "team");

    team.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.matchups); })
        .style("stroke", function(d) { return z(d.team_id); });
    team.append("text")
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .attr("transform", function(d) { //14 == last week
            return "translate(" + xAxis(14) + "," + yAxis(d.matchups[13].points_for) + ")"; })
        .text(function(d) { console.log(d); return d.owner });
}
