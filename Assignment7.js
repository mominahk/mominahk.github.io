var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var countyById = d3.map();

var legend_num = "one";
var boundary_displayed = true;

// function for button
// to switch scale and color
function switchVis(){

    if (legend_num==="one"){
        legend_num="two";
    }
    else{
        legend_num="one";
    }
    d3.selectAll("svg g").remove(); 
    drawMap(legend_num,boundary_displayed);
}

// function for button
// to toggle boundaries
function toggleBoundary(){
    
    if (boundary_displayed===true){
        boundary_displayed=false;
    }
    else{
        boundary_displayed=true;
    }
    d3.selectAll("svg g").remove();
    drawMap(legend_num,boundary_displayed);
    
}

// main function to draw map
function drawMap(legend_number, boundaries){
    // logic to switch legend
    // orinal legend option
    var legend_domain = [1, 10, 50, 200, 500, 1000, 2000, 4000];
    var x_domain =[0, 4500];
    var color_scheme = d3.schemeOrRd[9];
    if (legend_number === "two"){
        // second legend option
        legend_domain = [1, 3, 5, 8, 11, 15, 25, 35];
        x_domain =[0, 40];
        color_scheme = d3.schemeBlues[9];
    }
    var projection = d3.geoAlbersUsa()
    .scale(2350)
    .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    // drawing color legend 
    var color = d3.scaleThreshold()
        .domain(legend_domain)
        .range(color_scheme);
    
        var x = d3.scaleSqrt()
        .domain(x_domain)
        .rangeRound([440, 950]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

    g.selectAll("rect")
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); });

    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square mile");

    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickValues(color.domain()))
      .select(".domain")
        .remove();
    // convert csv file record to js object
    function rowConverter(d) {
        // console.log(data);
        if (d["GEO.display-label"] === "Wyoming"){
            countyById.set (
                d["GCT_STUB.target-geo-id2"],
                {
                    county_name:d["GCT_STUB.display-label"],
                    density:+d["Density per square mile of land area"],
                    state_name:d["GEO.display-label"]
                }
            )  
        }  
    }
    // id of wyoming counties to display
    const wyoming_counties_id = [ 56001, 56003, 56005, 56007, 56009, 56011,
                                 56013, 56015, 56017, 56019, 56021,56023,
                                 56025, 56027, 56029, 56031, 56033, 56035,
                                 56037, 56039, 56041, 56043, 56045];
    
    // function to display tooltip when mouse hover over county
    function mouseover(d){
        // console.log('mouseover', d);
        var county = countyById.get(d.id);
        // find div
        d3.select('#div_tooltip')
        // move div
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY + 'px')
        .style('opacity', 0.75).html(county.county_name + ' <br> Population Density : ' + county.density);
    }
    
    // function to hidee tool tip when mouse leaves county
    function mouseout(d){
        //console.log('mouseout', d);
        d3.select('#div_tooltip').style('opacity',0);
    }
    
    // read files
    d3.queue()
        .defer(d3.json, "us-10m.json")
        .defer(d3.csv, "Population-Density By County.csv", rowConverter)
        .await(ready);
    
    function ready(error, us) {
      if (error) throw error;

      // fill counties with color
      svg.append("g")
          .selectAll("path")
          .data(topojson.feature(us, us.objects.counties)
                .features
                    // filter out all except wyoming counties
                    .filter(function(d) {
                            // keep if id is in wyoming id array
                            return wyoming_counties_id.includes(d.id);
                            })
               )
          .enter()
            .append("path")
                .attr("fill", function(d) { return color(countyById.get(d.id).density); })
                .attr("d", path)
                .on('mouseover', mouseover)
                .on('mouseout', mouseout);
        
        // draw country boundaries
        if (boundaries){
            svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties)
                .features
                    .filter(function(d) {
                            return wyoming_counties_id.includes(d.id);
                            })
                 )
            .enter()
            .append("path")
            .attr("class", "county_boundary")
            .attr("d", path);
        }
        
    }
    
}

drawMap("one", true);
