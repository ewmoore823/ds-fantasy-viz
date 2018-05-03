for (i=2011; i < 2018; i++) {
    d3.json("https://s3.us-east-2.amazonaws.com/emmettwmoore-assets/league-"+i+".json",
        buildVisualization)
}

CHART_WIDTH = 960;
CHART_HEIGHT = 640;
CHART_MARGIN = { top: 20, right: 170, bottom: 30, left: 50 }


allScores = [];
scoreDict = {
    scores: allScores
}
setTimeout(buildAllScores, 2000);

function getBestWeeks(league) {
    if (scoreDict.league === undefined) {
        scoreDict.league = league;
    }
    teams = league.teams;
    year = league.year;

    for (i=0; i < teams.length; i++) {
        owner = teams[i].owner;
        team_name = teams[i].team_name;
        team_id = teams[i].team_id;
        matchups = teams[i].matchups;
        week = i;
        for (j=0; j < matchups.length; j++) {
            score = matchups[j].points_for;
            allScores.push({
                owner: owner,
                team_name: team_name,
                team_id: team_id,
                score: score,
                year: year,
                week: j
            });
        }
    }
    allScores.sort(function(a, b) {
        if (a.score < b.score) {
            return 1;
        }
        return -1
    });
    console.log({league: league, scores: allScores});
}

function buildAllScores() {
    svg = d3.select(".all-scores");
    sizeSVG(svg);
    var width = svg.attr("width") - CHART_MARGIN.left - CHART_MARGIN.right;
    var height = svg.attr("height") - CHART_MARGIN.top - CHART_MARGIN.bottom;
    g = svg.append("g")
        .attr("transform",
              "translate(" + CHART_MARGIN.left + "," + CHART_MARGIN.top + ")");

    xAxis = getXAxis(1, 14*7)
    yAxis = getYAxis()

    colorMap = d3.scaleOrdinal(d3.schemeCategory10);
    colorMap.domain(scoreDict.league.teams.map(function(team) { return team.team_id; }));

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

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    g.selectAll(".dot")
        .data(scoreDict.scores)
        .enter().append("circle")
        .attr("fill", function(d) { return colorMap(d.team_id);})
        .attr("r", 3.5)
        .attr("cx", function(d) {
            console.log(d.week)
            console.log(d.year - 2011)
            console.log(d.week + (14 * (d.year - 2011)))

            return xAxis(d.week + (14 * (d.year - 2011)));
        })
        .attr("cy", function(d) {
            return yAxis(d.score);
        })
        .on("mouseover", function(d) {
            div.transition()
            .duration(200)
            .style("opacity", .9);
            div.html(d.owner + ":" + " " + d.score + " points<br/>"+d.team_name+" ("+d.year+")")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 40) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
            .duration(500)
            .style("opacity", 0);
       });
}

function buildVisualization(league) {
    getBestWeeks(league);
    year = league.year;
    var svg = d3.select(".graph-" + year);
    sizeSVG(svg);

    xAxis = getXAxis(1, 14)
    yAxis = getYAxis()
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

    colorMap = d3.scaleOrdinal(d3.schemeCategory10);
    colorMap.domain(league.teams.map(function(team) { return team.team_id; }));

    buildChart(g, league.teams, year, colorMap, xAxis, yAxis);
    addLegend(svg, league.teams, year, colorMap);
}

function getXAxis(min, max) {
    return d3.scaleLinear().range([0, CHART_WIDTH]).domain([min, max])
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

function buildChart(g, teams, year, colorMap, xAxis, yAxis) {
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
        .attr("id", function(d) {return year +"-"+d.team_id+"-line"})
        .attr("d", function(d) { return line(d.matchups); })
        .attr("stroke-width", 1.5)
        .style("stroke", function(d) { return colorMap(d.team_id); });
    team.append("text")
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .attr("transform", function(d) { //14 == last week
            return "translate(" + xAxis(14) + "," + yAxis(d.matchups[13].points_for) + ")"; });
}

function addLegend(svg, teams, year, colorMap) {
    players = [];
    for (i=0; i< teams.length; i++) {
        player = {
            id: year + '-' + teams[i].team_id,
            team_id: teams[i].team_id,
            owner: teams[i].owner,
            team_name: teams[i].team_name,
        }
        players.push(player);
    }

    var legend = svg.selectAll('.legend')
        .data(players);

    var legendEnter = legend
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('id',function(d){ return d.id; })
        // onclick function to toggle off the lines
        .on('click', function (d) {
            // uses the opacity of the item clicked on to
            // determine whether to turn the line on or off
            console.log(d);
            if($(this).css("opacity") == 1){  // ACTUALLY uses `==`

                // grab the line that has the same ID as this point
                // along w/ "-line"  use get element cause ID has spaces
                var elemented = document.getElementById(this.id +"-line");

                d3.select(elemented)
                    .transition()
                    .duration(300)
                    .style("opacity", 0);

                d3.select(this)
                    .attr('fakeclass', 'fakelegend')
                   .transition()
                    .duration(300)
                    .style ("opacity", .2);
            } else {
                var elemented = document.getElementById(this.id +"-line");
                d3.select(elemented)
                    .style("display", "block")
                    .transition()
                    .duration(300)
                    .style("opacity",1);

                d3.select(this)
                    .attr('fakeclass','legend')
                    .transition()
                    .duration(300)
                    .style ("opacity", 1);}
        });

        var lastvalues = [];
        var legendscale= d3.scaleOrdinal()
            .domain(lastvalues)
            .range([0,30,60,90,120,150,180,210]);
        legendEnter.append('circle')
            .attr('cx', CHART_WIDTH +100)
            .attr('cy', function(d){
                return CHART_HEIGHT - 150 - (25 * d.team_id);
            })
            .attr('r', 7)
            .style('fill', function(d) {
                return colorMap(d.team_id);
            });

        //add the legend text
        legendEnter.append('text')
            .attr('font-size', "12")
            .attr('font-family', "Arial")
            .attr('x', CHART_WIDTH + 115)
            .attr('y', function(d){
                return CHART_HEIGHT - 150  - (25 * d.team_id);
            })
            .text(function(d){ return d.owner; });
}
