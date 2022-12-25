var ctx = {
    w : 1000,
    h : 400,
    byVar : 'genre',
    EU : ['040','056','100','191','196','203','208','233','246','250','276','300','348','372','380','428','440','442','470','528','616','620','642','703','705','724','752','826'],
    NA : ["660","028","533","052","084","060","535","092","124","136","188","192","531","212","214","222","304","308","312","320","332","340","388","474","484","500","530","558","591","630","652","659","662","663","666","670","534","044","780","796","840","850"],
    JP : '392',
    countryVar : 'Game'
}

// Forces for the graph
var simulation = d3.forceSimulation(ctx.videoGames)
        .force("x", d3.forceX(500 / 2).strength(0.15))
        .force("y", d3.forceY((ctx.h+100) / 2).strength(0.15))
        .force("collision", d3.forceCollide().radius(function(d){return d.value})) 
        .force("center", d3.forceCenter(500 / 2, ctx.h / 2));




// Load the data
function loadData(){
    // When the data is loaded, I prepare the different datasets needed for my visualisations
    d3.csv("video_games_sales.csv", function(data){
        // The whole dataset filtered
        ctx.data = data.filter(function(d){return (d.Year_of_Release != 'N/A') & (d.Genre != '')});
        
        // Datasets for the plot by time
        ctx.byYearGenre = d3.nest()
            .key(function(d) { return d.Genre;})
            .key(function(d) { return d.Year_of_Release;})
            .rollup(function(d) { return d3.sum(d, function(g) {return g.Global_Sales; });})
            .entries(ctx.data);
        // Here I sort by year in each group of Genre
        ctx.byYearGenre.forEach(function(el){return el.values.sort((a, b) => d3.ascending(a.key, b.key));});
        // Here I sort alphabetically
        ctx.byYearGenre.sort((a, b) => d3.ascending(a.key, b.key));

        ctx.byYearPlatform = d3.nest()
            .key(function(d) { return d.Platform;})
            .key(function(d) { return d.Year_of_Release;})
            .rollup(function(d) { return d3.sum(d, function(g) {return g.Global_Sales; });})
            .entries(ctx.data);
        // Here I sort by year in each group of Platform
        ctx.byYearPlatform.forEach(function(el){return el.values.sort((a, b) => d3.ascending(a.key, b.key));});
        // Here I sort alphabetically
        ctx.byYearPlatform.sort((a, b) => d3.ascending(a.key, b.key));
        // Here I sort by number of total global sales and keep only the 20 first Platforms
        ctx.byYearPlatform = ctx.byYearPlatform.sort((a,b)=>d3.descending(d3.sum(a.values, function(g) {return g.value; }), d3.sum(b.values, function(g) {return g.value; }))).slice(0,19);

        ctx.byYearPublisher= d3.nest()
            .key(function(d) { return d.Publisher;})
            .key(function(d) { return d.Year_of_Release;})
            .rollup(function(d) { return d3.sum(d, function(g) {return g.Global_Sales; });})
            .entries(ctx.data);
        // Here I sort by year in each group of Publicher
        ctx.byYearPublisher.forEach(function(el){return el.values.sort((a, b) => d3.ascending(a.key, b.key));});
        // Here I sort alphabetically
        ctx.byYearPublisher.sort((a, b) => d3.ascending(a.key, b.key));
        // Here I sort by number of total global sales and keep only the 20 first Publishers
        ctx.byYearPublisher = ctx.byYearPublisher.sort((a,b)=>d3.descending(d3.sum(a.values, function(g) {return g.value; }), d3.sum(b.values, function(g) {return g.value; }))).slice(0,19);

        // Tooltip for the plot
        ctx.Tooltip = d3.select("#plot")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color","white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px");

        // Then I create the plot
        createTimePlot(ctx.byVar);

        // Dataset for the graph
        ctx.videoGames = d3.nest()
            .key(function(d) { return d.Name;})
            .rollup(function(d) { return d3.sum(d, function(g) {return g.Global_Sales; });})
            .entries(ctx.data);
        ctx.videoGames = ctx.videoGames.sort((a, b) => d3.descending(a.value, b.value)).slice(0,19);

        // Create the Graph
        createGraph();
    
        //Dataset for the map
        ctx.location = ["EU","JP","NA","Other"];
        ctx.bestRegion = [];

        ctx.location.forEach(function(el){
            var game = d3.nest()
                .key(function(d) { return d.Name;})
                .rollup(function(d) { return d3.sum(d, function(g) {return g[el+"_Sales"]; });})
                .entries(ctx.data).sort((a, b) => d3.descending(a.value, b.value)).slice(0,1);
            var plat = d3.nest()
                .key(function(d) { return d.Platform;})
                .rollup(function(d) { return d3.sum(d, function(g) {return g[el+"_Sales"]; });})
                .entries(ctx.data).sort((a, b) => d3.descending(a.value, b.value)).slice(0,1);
            var pub = d3.nest()
                .key(function(d) { return d.Publisher;})
                .rollup(function(d) { return d3.sum(d, function(g) {return g[el+"_Sales"]; });})
                .entries(ctx.data).sort((a, b) => d3.descending(a.value, b.value)).slice(0,1);
            var genre = d3.nest()
                .key(function(d) { return d.Genre;})
                .rollup(function(d) { return d3.sum(d, function(g) {return g[el+"_Sales"]; });})
                .entries(ctx.data).sort((a, b) => d3.descending(a.value, b.value)).slice(0,1);
            
            ctx.bestRegion.push({"Game" : game, "Platform" : plat, "Publisher" : pub, "Genre" : genre});
        });

        createMap();
    })
};


// Functions for the map
var mouseover2 = function(d) {
    ctx.Tooltip
      .style("opacity", 1);
    d3.select(this)
        .style("opacity", 1);
}
var mousemove2 = function(d) {
    ctx.Tooltip
      .html(function(){ if (ctx.EU.includes(d.id)){
        return ctx.bestRegion[0][ctx.countryVar][0].key + " : " + ctx.bestRegion[0][ctx.countryVar][0].value.toFixed(2) + " M";
        }else if (ctx.NA.includes(d.id)){
            return ctx.bestRegion[2][ctx.countryVar][0].key + " : " + ctx.bestRegion[2][ctx.countryVar][0].value.toFixed(2)+ " M";
        }else if (ctx.JP == d.id){
            return ctx.bestRegion[1][ctx.countryVar][0].key + " : " + ctx.bestRegion[1][ctx.countryVar][0].value.toFixed(2)+ " M";
        }else{
            return ctx.bestRegion[3][ctx.countryVar][0].key + " : " + ctx.bestRegion[3][ctx.countryVar][0].value.toFixed(2)+ " M";
        }})
      .style("top", (d3.event.pageY+10) + "px")
      .style("left",(d3.event.pageX+10) + "px")
      .style("color",function(){ if (ctx.EU.includes(d.id)){
        return ctx.color2(ctx.bestRegion[0][ctx.countryVar][0].key);
        }else if (ctx.NA.includes(d.id)){
            return ctx.color2(ctx.bestRegion[2][ctx.countryVar][0].key);
        }else if (ctx.JP == d.id){
            return ctx.color2(ctx.bestRegion[1][ctx.countryVar][0].key);
        }else{
            return ctx.color2(ctx.bestRegion[3][ctx.countryVar][0].key);
        }})
      .style("font-size",5)
      .style("font-weight", "bold");
}
var mouseleave2 = function(d) {
    ctx.Tooltip
      .style("opacity", 0);
    d3.select(this)
      .style("opacity", 0.8);
}


// Creation of the map
var createMap = function() {
    let svgEl = d3.select("#salesMap").append("svg");
    svgEl.attr("width", ctx.w-250);
    svgEl.attr("height", ctx.h);
    svgEl.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#bcd1f1");

    var projection = d3.geoMercator().center([50,10]).scale(120);

    ctx.color2 = d3.scaleOrdinal()
        .domain(ctx.bestRegion.map(function(d){ return d[ctx.countryVar][0].key }))
        .range(["#2535C5","#15D635","#EA0000","#FFB535"]);

    var path = d3.geoPath().projection(projection);
    d3.json("countries-50m.json", function(error, world) {
        if (error) throw error;
        svgEl.selectAll("path")
            .data(topojson.feature(world,world.objects.countries).features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill",function(d){ if (ctx.EU.includes(d.id)){
                    return ctx.color2(ctx.bestRegion[0].Game[0].key);
                }else if (ctx.NA.includes(d.id)){
                    return ctx.color2(ctx.bestRegion[2].Game[0].key);
                }else if (ctx.JP == d.id){
                    return ctx.color2(ctx.bestRegion[1].Game[0].key);
                }else{
                    return ctx.color2(ctx.bestRegion[3].Game[0].key);
                }
            }).on("mouseover", mouseover2)
            .on("mousemove", mousemove2)
            .on("mouseleave", mouseleave2)
            .style("opacity", 0.8);
    });

}

// Update the map
var updateMap = function(){
    ctx.color2.domain(ctx.bestRegion.map(function(d){ return d[ctx.countryVar][0].key  }));
    
    d3.select("#salesMap")
        .selectAll("path")
        .attr("fill",function(d){ if (ctx.EU.includes(d.id)){
                    return ctx.color2(ctx.bestRegion[0][ctx.countryVar][0].key);
                }else if (ctx.NA.includes(d.id)){
                    return ctx.color2(ctx.bestRegion[2][ctx.countryVar][0].key);
                }else if (ctx.JP == d.id){
                    return ctx.color2(ctx.bestRegion[1][ctx.countryVar][0].key);
                }else{
                    return ctx.color2(ctx.bestRegion[3][ctx.countryVar][0].key);
                }
        });
}



// Functions to drag the nodes
function dragsubject() {
    return simulation.find(d3.event.x, d3.event.y);
  }

function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}



// Creation of the graph
var createGraph = function() {
    var svg = d3.select("#salesGraph")
        .append("svg")
            .attr("width", 500)
            .attr("height", ctx.h+100)
    
    svg.append("g")
        .append("text")
        .text("Top 10 most sold games Worldwide")
        .attr("x",150)
        .attr("y",ctx.h+50);
    
    var circles = svg.append("g")
        .attr("id","nodes")
        .selectAll("circle")
            .data(ctx.videoGames)
            .enter()
            .append("circle")
            .attr("r", function(d){return d.value;})
            .attr("fill", function(d){return ctx.color(d.key);})
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
            
    svg.append("g")
        .attr("id","titles")
        .selectAll("text")
        .data(ctx.videoGames)
        .enter()
        .append("text")
        .attr("id",function(d) { return d.key.split(" ").join("").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); })
        .text(function(d) { return d.value.toFixed(2) + " M"; })
        .attr("font-weight","bold")
        .attr("text-anchor","middle")
        .attr("alignment-baseline","middle");
   
    circles.call(d3.drag()
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    simulation.nodes(ctx.videoGames)
        .on("tick", simStep);
}


// Position of the nodes
function simStep(){
    d3.selectAll("#nodes circle")
        .attr("cx", function(d){
            var text = d3.select("#"+d.key.split(" ").join("").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""))
                .attr("x",d.x)
                .attr("font-size",d.value*0.35);
            return d.x;})
        .attr("cy", function(d){
            d3.select("#"+d.key.split(" ").join("").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""))
                .attr("y",d.y);
            return d.y;}); 
}



// Functions for the tooltip of the plot and graph
var mouseover = function(d) {
    ctx.Tooltip
      .style("opacity", 1);
    d3.select(this)
        .style("opacity", 1)
        .attr("stroke-width", 3);
}
var mousemove = function(d) {
    ctx.Tooltip
      .html(d.key)
      .style("top", (d3.event.pageY+10) + "px")
      .style("left",(d3.event.pageX+10) + "px")
      .style("color",ctx.color(d.key) )
      .style("font-size",5)
      .style("font-weight", "bold");
}
var mouseleave = function(d) {
    ctx.Tooltip
      .style("opacity", 0);
    d3.select(this)
      .style("stroke", function(a){ return ctx.color(a.key) })
      .style("opacity", 0.8)
      .attr("stroke-width", 2);
}



// Creation of the tme plot
var createTimePlot = function(byVar){

    // I create the svg
    var svg = d3.select("#plot")
        .append("svg")
            .attr("width", ctx.w+300)
            .attr("height", ctx.h)
        .append("g")
            .attr("transform", "translate(" + 40 + "," + 10 + ")");

    var byYearGenre = ctx.byYearGenre;
    var data = ctx.data;

    // Add of the X axis (time format)
    ctx.x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.Year_of_Release; }))
        .range([ 0, ctx.w-60 ]);
    svg.append("g")
        .attr("transform", "translate(0," + (ctx.h-30) + ")")
        .call(d3.axisBottom(ctx.x).ticks(15));

    // Add of the Y axis
    ctx.y = d3.scaleLinear()
        .domain([0, 220])
        .range([ ctx.h-30, 0 ]);
    svg.append("g")
        .call(d3.axisLeft(ctx.y));

    // Create the color palette (I generated a color palette with https://hihayk.github.io/scale/#15/20/78/55/-360/-360/100/100/DB13DA/205/185/134/white)
    ctx.color = d3.scaleOrdinal()
        .domain(byYearGenre.map(function(d){ return d.key }))
        .range(["#FF0000","#FF00A6","#FF00FF","#0600FF","#004FFF","#00FFFF","#00FF63","#16FF00","#FFDB00","#FFA100","#FF0500","#FF0699","#E30CFF","#3212FF","#1865FF","#1DFFFF","#23FF75","#29FF29","#FFC835","#FF3B3B"]);

    // Draw the lines
    ctx.lines = svg.selectAll(".line");
    ctx.lines.data(byYearGenre)
        .enter()
        .append("path")
            .attr("id",function(d){ return "a"+d.key.split(' ')[0];})
            .attr("fill", "none")
            .attr("stroke", function(d){ return ctx.color(d.key) })
            .attr("stroke-width", 2)
            .attr("opacity", 0.8)
            .attr("d", function(d){
            return d3.line()
                .x(function(d) { return ctx.x(d.key); })
                .y(function(d) { return ctx.y(d.value); })
                (d.values)
            })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    
    // Creation of the legend with https://d3-legend.susielu.com/
    svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(955,10)");
    
    ctx.colorLegend = d3.legendColor()
        .scale(ctx.color)
        .title("Genre")
        .on("cellover",function(d) {
            d3.select("#"+"a"+d.split(' ')[0])
                .style("opacity", 1)
                .attr("stroke-width", 3);
        })
        .on("cellout",function(d) {
            d3.select("#"+"a"+d.split(' ')[0])
                .style("opacity", 0.8)
                .attr("stroke-width", 1.5);
        });

    svg.select(".legendOrdinal")
        .call(ctx.colorLegend);
};




// Update the plot
var updateScatterPlot = function(){
    var data;
    if (ctx.byVar == "Genre"){
        data = ctx.byYearGenre;
    }else if (ctx.byVar == "Platform"){
        data = ctx.byYearPlatform;
    }else if (ctx.byVar == "Publisher"){
        data = ctx.byYearPublisher;
    }
    //ctx.color.domain(data.map(function(d){ return d.key }));
    ctx.colorLegend = d3.legendColor()
        .scale(ctx.color)
        .title(ctx.byVar)
        .on("cellover",function(d) {
            d3.select("#"+"a"+d.split(' ')[0])
                .style("opacity", 1)
                .attr("stroke-width", 3);
        })
        .on("cellout",function(d) {
            d3.select("#"+"a"+d.split(' ')[0])
                .style("opacity", 0.8)
                .attr("stroke-width", 1.5);
        });

    d3.select("#plot").select(".legendOrdinal")
        .call(ctx.colorLegend);
    
    var d = ctx.lines.data(data);
    var d2 = d3.select("#globalSalesPlot").selectAll("path").data(data);
    d2.exit().remove();
    d.exit().remove();

    d.enter()
        .append("path")
        .attr("id",function(d){ return "a"+d.key.split(' ')[0];})
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8)
        .attr("stroke", function(d){ return ctx.color(d.key) })
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return ctx.x(d.key); })
                .y(function(d) { return ctx.y(d.value); })
                (d.values)
            })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    d2.enter()
        .append("path")
        .attr("id",function(d){ return "a"+d.key.split(' ')[0];})
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8)
        .attr("stroke", function(d){ return ctx.color(d.key) })
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return ctx.x(d.key); })
                .y(function(d) { return ctx.y(d.value); })
                (d.values)
            })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    d.transition()
        .duration(1000)
        .attr("stroke", function(d){ return ctx.color(d.key) })
        .attr("id",function(d){ return "a"+d.key.split(' ')[0];})
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return ctx.x(d.key); })
                .y(function(d) { return ctx.y(d.value); })
                (d.values)
            });
    d2.transition()
        .duration(1000)
        .attr("stroke", function(d){ return ctx.color(d.key) })
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return ctx.x(d.key); })
                .y(function(d) { return ctx.y(d.value); })
                (d.values)
            });
    
};


// Selection of the var for the plot
var setVarBy = function(){
    ctx.byVar = document.querySelector('#plotBy').value;
    updateScatterPlot();
};


// Selection of the var for the map
var setVarByRegion = function(){
    ctx.countryVar = document.querySelector('#mapBy').value;
    updateMap();
}


// Create the visualisation
var createViz = function(){
    loadData();
};
