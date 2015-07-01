var $ = jQuery.noConflict();

var statePolygons = null;
var map = null;
var birdList = [] ;
var pack = null, svg = null;
var w = 600, h = 600;
var duration = 300, delay = 30;

function setMapColours(states){

    for ( var i=0; i < statePolygons.features.length; i++){
        chk_state = statePolygons.features[i].properties.name;
        value = 0;
        if (states.hasOwnProperty(chk_state)){
            value = states[chk_state];
        }
        statePolygons.features[i].properties.density = value;
    }        
    if (map !== null){
        L.geoJson(statePolygons, {style:style}).addTo(map);
    }
}

function initBirdVisual()
{
    pack = d3.layout.pack()
        .size([w, h])
        .sort(function(a, b) { return -(a.value - b.value);})        
        .padding(1.5);

    svg = d3.select("#bird_circles").append("svg")
        .attr("viewBox","0 0 "+w+" "+h)
        .attr("perserveAspectRatio","xMinYMid")       
        .attr("width", w)
        .attr("height", h )
        .attr("class", "bubble");
 
     var chart = $(".bubble"),
        aspect = chart.width() / chart.height(),
        container = chart.parent();
    $(window).on("resize", function() {
        w = container.width();
        h = Math.round(w/ aspect);
        chart.attr("width", w);
        chart.attr("height", h);
    }).trigger("resize");
}

function zoomIn(nodeData, i)
{
    var gNode = svg.selectAll("g")
                .filter(function(d,i){return d.className === nodeData.className; })
                //.transition()
                //.attr("transform", function(d) 
                  //    { return "translate(" + w/2 + "," + h/2 + ")"; })
                .selectAll("circle")
                .attr("r", function(d){return d.r;})
                .transition()
                .attr("r", "200");

    svg.selectAll("g")
        .sort(function(nodeData_a, nodeData_b){
            //This ensures that the zoomed in bird is always on top
            if (nodeData_a.className != nodeData.className)
                return -1;
            return 1;
          }
        );
    //How do I use 'this' in place of circles, since the correct circle element
    //has triggered this event
}

function zoomOut(nodeData, i)
{
    var sci_name = nodeData.className;
    circles = svg.selectAll("g")
                .filter(function(d,i){
                    return d.className === sci_name; })
                .selectAll("circle")
                .transition()
                .attr("r",function(d){return d.r;})
                .attr("transform", null);
}

function updateGNode(g)
{
    g.selectAll("g")
        .attr("orig_x", function(d, i) { return d.x; })
        .attr("orig_y", function(d, i) { return d.y; });
   //Circle zooming effect each time a new visualization appears
    g.selectAll("circle")
        .style("stroke", function(d) { return "black"; })
        .style("fill", function(d) { return "red"; })
        .data(function(d) { return [d]; })
        .attr("r", 0)
        .transition()
        .duration(function (d, i) { return duration;})
        .delay(function (d, i) { return i * delay; })
        .attr("r", function (d) {return d.r;})
        .attr("rInit", function(d, i) { return d.r; });
    //Adding zooming events to circles

/*
    g.selectAll("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return birdList[d.className].name.substring(0, d.r / 3); });
*/

}

function updateBirdVisual(birds)
{
    gNodeData =  convertBirdPredictions(birds);

    var gNode = svg.selectAll("g")
        .sort()
        .data(pack.nodes(gNodeData)
        .filter(function(d) { return !d.children; }),function(d){return d.className;});

    gNode.transition()
        .duration(function (d, i) { return duration;})
        .delay(function (d, i) { return i * delay; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    updateGNode(gNode);

    var newGNode = gNode.enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("class", "gNode")
        .on('mouseover', zoomIn) 
        .on('mouseout', zoomOut);

    newGNode.append("title").text(function(d) { return d.className ; });
    newGNode.append("circle");
    newGNode.append("text");
    updateGNode(newGNode);
    //Remove gNodes
    gNode.exit().remove();

   // for (var key in birdList)
     //   get_info(key);

}

function convertBirdPredictions(birds) {
   var data = [];
    for (var key in birds)
    {
        data.push({packageName:"Flare", className:key, value:birds[key]});
    }
    return {children: data};
}

function encodeParams(data)
{
    if (data === null)
        return "";
    var params = [];
    for (var key in data)
    {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
    }
    return params.join("&");
}


function add_image(sci_name,image_url)
{
    var dx = null;
    var nodes = d3.selectAll("g")
        .filter(function(d,i){return d.className === sci_name; })
        .append("image")
        .attr("class",sci_name)
        .attr("xlink:href", image_url)
	    .attr("height", function (d) {
			return d.r * 2;
		})
		.attr("width", function (d) { 
			return d.r * 2;
		})
        // must be transitioned in update but not append because the circles may change in size
        .attr("x", function (d) {
            dx = d.r + "px";
			return - d.r + "px";
		})
		.attr("y", function (d) {
			return - d.r + "px";
		});
     var css_prop1 = "clip-path: circle("+dx+" at center);";
     var css_prop2 = "-webkit-clip-path: circle("+dx+" at center);";
     
     $("<style>")
        .html("."+sci_name+" {"+css_prop1+css_prop2+" }")
        .appendTo("head");
}

function get_info(sci_name)
{
    obj = birdList[sci_name];
    common_name = obj.name ;
    if ("url" in obj) 
    {
        add_image(sci_name, obj.url);
        return;
    }
    /*jshint multistr: true */
    var url = "http://dbpedia.org/sparql";
    var query = "PREFIX dbpedia2: <http://dbpedia.org/property/>\
                 PREFIX foaf: <http://xmlns.com/foaf/0.1/>\
                    SELECT ?o\
                        WHERE {\
                    ?s dbpedia2:name \""+common_name+"\"@en;\
                        foaf:depiction ?o\
                }";

    var queryUrl = encodeURI( url+"?query="+query+"&format=json" );
     $.ajax({
             dataType: "jsonp",  
             url: queryUrl,
             success: function( data ) {
                 var results = data.results.bindings;
                 for ( var i in results ) {
                    obj.url =  results[i].o.value;
                    add_image(sci_name,obj.url);

                 }
             }
         });
}


$('#toggleSidebar').on('click', function () {
    $('#content').toggleClass('col-lg-6 col-lg-1');
    $('#sidebar').toggleClass('col-lg-6 col-lg-11');
    map._onResize();
    $(this).parent().one( 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() { map._onResize();});
});

$(bird_list).change(function(){
    var sci_name = $(this).val();
    $.ajax({
        url: "birds/"+sci_name,
        cache: false,
        success:function(data)
        {
            var aggreg = JSON.parse(data);
            setMapColours(aggreg.states);
            updateBirdVisual(aggreg.birds);
        }
    });
});

function populateBirdList (bird_list){
    var jbird_list= JSON.parse(bird_list);
    $.each(jbird_list, function (i,bird_entry){
        var obj = []; 
        obj.name = bird_entry.primary_com_name; 
        birdList[bird_entry.sci_name] = obj;
         var select_bird="<option value="+bird_entry.sci_name+">"+
             bird_entry.primary_com_name+"</option>";
         $(select_bird).appendTo("#bird_list");
    });
 }

 function loadMap(){
    L.mapbox.accessToken = 'pk.eyJ1Ijoibm9lbGxhZHNhIiwiYSI6IjA5MTRmMjRkN2E1OWZmMzVhN2ZlYmM2NzZlNmU5NGJiIn0.xdlk0qvi3tOpks2Fn74MGw';
    var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
         id: 'noelladsa.b77644d9'
    });
    map = L.map('map')
            .addLayer(mapboxTiles)
            .setView([36.492, -99.756], 4); // TODO Mk local variables
            
    $.ajax({
        url: "static/us.geojson",
        success:function(statesData){
            statePolygons = JSON.parse(statesData);
       }
    });
 }

function style(feature) {
    return {
            fillColor: getColor(feature.properties.density),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
}


function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}

$(function(){
    loadMap();
    initBirdVisual();
    $.ajax({
        url: "birds/list",
        cache: false,
        success:populateBirdList
    });
});


