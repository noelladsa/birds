var $ = jQuery.noConflict();

state_polygons = null;
map = null;
main_list = [] ;
var pack = null;

function color_map(states){

    for ( var i=0; i < state_polygons.features.length; i++){
        chk_state = state_polygons.features[i].properties.name;
        value = 0;
        if (states.hasOwnProperty(chk_state)){
            value = states[chk_state];
        }
        state_polygons.features[i].properties.density = value;
    }        
    if (map !== null){
        L.geoJson(state_polygons, {style:style}).addTo(map);
    }
}

function initialize_map()
{
    diameter = 960; 
    format = d3.format(",d");
    color = d3.scale.category20c();

    pack = d3.layout.pack()
        .size([diameter - 4, diameter - 4])
        .padding(5);

     svg = d3.select("#bird_circles").append("svg")
        .attr("viewBox","0 0 960 960")
        .attr("perserveAspectRatio","xMinYMid")       
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");
 
     var chart = $(".bubble"),
        aspect = chart.width() / chart.height(),
        container = chart.parent();
    $(window).on("resize", function() {
        console.log("resize called");
        var targetWidth = container.width();
        chart.attr("width", targetWidth);
        chart.attr("height", Math.round(targetWidth / aspect));
    }).trigger("resize");

    
}

function update_visual(birds)
{
    var nodeStringLenth = d3.selectAll("g.node").toString().length; 
    if ( nodeStringLenth > 0) {
        d3.selectAll("g.node")
        .remove();
    }
    var node = svg.selectAll(".node").sort().data(pack.nodes(classes(birds)).filter(
        function(d) { return !d.children; }))
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
        .text(function(d) { return d.className ; });

    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return color(d.packageName); });

    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return main_list[d.className].name.substring(0, d.r / 3); });
   
    for (var key in birds)
        get_info(key);

}

// Returns a flattened hierarchy containing all leaf nodes under the root.

function classes(birds) {
   var data = [];
    for (var key in birds)
    {
        data.push({packageName:"Flare", className:key, value:birds[key]});
    }
    return {children: data};
}

function uri_encode(data)
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
    var nodes = d3.selectAll(".node")
                .filter(function(d,i){return d.className === sci_name; });
    nodes.append("image")
        .attr("xlink:href", image_url)
	    .attr("height", function (d) {
            console.log("Height",0.95 * Math.sqrt(2) * d.r);
			return d.r * 2;
		})
		.attr("width", function (d) { 
            console.log("Width",0.95 * Math.sqrt(2) * d.r);
			return d.r * 2;
		})
        // must be transitioned in update but not append because the circles may change in size
        .attr("x", function (d) {
			return - d.r + "px";
		})
		.attr("y", function (d) {
			return - d.r + "px";
		});
}


function get_info(sci_name)
{
    console.log("Calling");
    obj = main_list[sci_name];
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
    console.log("",query);

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



$(bird_list).change(function(){
    var sci_name = $(this).val();
    $.ajax({
        url: "birds/"+sci_name,
        cache: false,
        success:function(data)
        {
            var aggreg = JSON.parse(data);
            color_map(aggreg.states);
            update_visual(aggreg.birds);
        }
    });
});

function populate_birdlist (bird_list){
    var jbird_list= JSON.parse(bird_list);
    $.each(jbird_list, function (i,bird_entry){
        var obj = []; 
        obj.name = bird_entry.primary_com_name; 
        main_list[bird_entry.sci_name] = obj;
         var select_bird="<option value="+bird_entry.sci_name+">"+
             bird_entry.primary_com_name+"</option>";
         $(select_bird).appendTo("#bird_list");
    });
 }

 function load_maps(){
    L.mapbox.accessToken = 'pk.eyJ1Ijoibm9lbGxhZHNhIiwiYSI6IjA5MTRmMjRkN2E1OWZmMzVhN2ZlYmM2NzZlNmU5NGJiIn0.xdlk0qvi3tOpks2Fn74MGw';
    var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
         id: 'noelladsa.b77644d9'
    });
    map = L.map('map')
            .addLayer(mapboxTiles)
            .setView([36.492, -99.756], 4);
    $.ajax({
        url: "static/us.geojson",
        success:function(statesData){
            state_polygons = JSON.parse(statesData);
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
    load_maps();
    initialize_map();
    $.ajax({
        url: "birds/list",
        cache: false,
        success:populate_birdlist
    });
});


