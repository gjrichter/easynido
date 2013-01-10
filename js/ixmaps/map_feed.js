/**********************************************************************
map_feed.js

$Comment: provides JavaScript for import of feeds
$Source :map_feed.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/01/15 $
$Author: guenter richter $
$Id:map_pipe.js 1 2012-01-15 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_feed.js,v $
**********************************************************************/

/** 
 * @fileoverview This file is a plugin for ixmaps.jsapi top import arbitrari georeferenced feeds
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

/**
 * define namespace ixmaps
 */

// Auto-load scripts
//
// specify which feed parser to load by using
// <script src="map_feed.js?(feedtype1,feedtype2)" ...
// in your HTML
//
// for each feed type map_feed.feedtype.js will be loaded
// modules 'map_feed.geojson.js,map_feed.geojsonr.js,map_feed.georss.js,map_feed.kml.js' are always loaded
//
var scriptBase;
(function() {
	var providers = null;
	var modules = 'georss,geojson,geojsonr,kml';
	var scripts = document.getElementsByTagName('script');
	// Determine which scripts we need to load	
	for (var i = 0; i < scripts.length; i++) {
		var match = scripts[i].src.replace(/%20/g , '').match(/^(.*?)map_feed\.js(\?\(\[?(.*?)\]?\))?$/);
		if (match !== null) {
			scriptBase = match[1];
			if (match[3]) {
				var settings = match[3].split(',[');
				providers = settings[0].replace(']' , '');
				modules += ',' + providers;
				if (settings[1]) {
					modules += ',' + settings[1];
				}
			}
			break;
	   }
	}
	modules = modules.replace(/ /g, '').split(',');

	// Actually load the scripts
	var scriptTagStart = '<script type="text/javascript" src="' + scriptBase + 'map_feed.';
	var scriptTagEnd = '.js"></script>';
	var scriptsAry = [];
	for (i = 0; i < modules.length; i++) {
		scriptsAry.push(scriptTagStart + modules[i] + scriptTagEnd);
	}
	document.write(scriptsAry.join(''));
})();

window.ixmaps = window.ixmaps || {};
ixmaps.jsapi = ixmaps.jsapi || {};
ixmaps.feed = ixmaps.feed || {};
ixmaps.feed.parse = ixmaps.feed.parse || {};
(function() {

var debug = false;

/**
 * feed channel object  
 * @class a feed channel object
 * @constructor
 * @throws 
 * @return A new Channel
 */
	ixmaps.feed.Channel = Channel = function(szUrl){
		this.szUrl = szUrl;
	};

/**
 * add a feed to the map  
 * @param the URL of the feed
 * @param opt optional parameter object
 * @type void
 */
	ixmaps.feed.addFeed = function(szSource,opt,callback){

		_TRACE("ixmaps.feed.addFeed: "+JSON.stringify(opt));

		ixmaps.feed.unresolvedPosition = 0;
		ixmaps.message("loading",true);

		if ( !callback ){
			callback = function(){};
		}

		if ( opt.type == 'json' ){
			$.get(szSource,
				function(data){
					ixmaps.message("loading",false);
					callback(ixmaps.feed.processFeed(data,opt));
				}).error(function() { alert("error"); });
		}
		if ( opt.type == 'text' ){
            $.ajax({
                 type: "GET",
                 url: szSource,
                 dataType: "text",
                 success: function(xml) {
					ixmaps.message("loading",false);
					// alert(xml);
					var test = JSON.parse(xml);
					// alert(test.value.items[0].content);
					szTest = "{\"map\":"+String(test.value.items[0].content);
					// alert(szTest);
					eval ("var obj='"+szTest+"');");
					// alert(obj);
					callback(ixmaps.feed.processFeed(xml,opt));
                 },
                 error: function(xml) {
					ixmaps.message("loading",false);
					callback(false);
                 }
            });
		}
		if ( opt.type == 'xml' ){
            $.ajax({
                 type: "GET",
                 url: szSource,
                 dataType: "xml",
                 success: function(xml) {
					ixmaps.message("loading",false);
					callback(ixmaps.feed.processFeed(xml,opt));
                 },
                 error: function(xml) {
					ixmaps.message("loading",false);
 					callback(false);
                }
            });
		}
	};


/**
 * process the feeds data feed to the map  
 * @param the data object received from the feed
 * @param opt optional parameter object
 * @type void
 */
	ixmaps.feed.processFeed = function(data,opt){

		_TRACE("processFeed: " + opt.type + " " + typeof(data) + JSON.stringify(opt));

		if ( opt.type == "json" && typeof(data) == "string" ){
			data = JSON.parse(data);
		}

		if ( data == null ){
			// alert("no data");
			return false;
		}
		// console.log(data);
		try {
			switch(opt.name){
				// deprecated, keep for compatibility, use 'MyMapsKLM_YQL'
				case 'Google_Maps_My_Map_KML_YQL':
					var feedLayer = this.parse.MyMapsKLM_YQL(data,opt);
					break;
				// deprecated, keep for compatibility, use 'MyMapsKLM'
				case 'Google_Maps_My_Map_KML':
					var feedLayer = this.parse.MyMapsKLM(data,opt);
					break;
				// the one and only for the future
				default:
					if ( eval("typeof(this.parse."+opt.name+")") == "function" ){
						var feedLayer = eval("this.parse."+opt.name+"(data,opt)");
					}else{
						$.getScript(scriptBase + 'map_feed.' + opt.name + ".js")
						.done(function(script, textStatus) {
						  ixmaps.feed.processFeed(data,opt);
						  return;
						})
						.fail(function(jqxhr, settings, exception) {
						  ixmaps.errorMessage("'"+opt.name+"' unknown feed format !",2000);
						});
						return;
					}
					break;
			}
		} catch (e){
			ixmaps.errorMessage("'"+opt.name+"' unknown feed format !",2000);
			return false;
		}

		if ( feedLayer == null ){
			// alert(data);
			alert("no valid data");
			return false;
		}
		// console.log(feedLayer);

		if ( ixmaps.feed.unresolvedPosition ){
			ixmaps.errorMessage(ixmaps.feed.unresolvedPosition+" unresolved position(s)",2000);
		}

		if ( opt.flag && opt.flag.match(/gallery/) ){
			feedLayer.layers[0].properties.fGallery = true;
		}
		if ( opt.flag && opt.flag.match(/open/) ){
			feedLayer.layers[0].properties.open = true;
			feedLayer.layers[0].properties.visibility = true;
		}
		if ( opt.flag && opt.flag.match(/closed/) ){
			feedLayer.layers[0].properties.open = false;
		}
		if ( opt.flag && opt.flag.match(/noinfo/) ){
			feedLayer.layers[0].fShowInfoInList = false;
		}
		if ( opt.flag && opt.flag.match(/showinfo/) ){
			feedLayer.layers[0].fShowInfoInList = true;
		}
		_TRACE("addNewData from feed: "+feedLayer.name);
		ixmaps.jsapi.addNewData(feedLayer.name?feedLayer.name:"feed-test",feedLayer);
		if ( opt.flag && opt.flag.match(/zoomto/) ){
			ixmaps.jsapi.zoomToLayer(feedLayer.name);
		}
//		setTimeout("ixmaps.jsapi.zoomToLayer();",1000);
//		ixmaps.jsapi.redraw();
//		ixmaps.jsapi.zoomToLayer();

		return true;

	};

	ixmaps.feed.LayerSet = function(szName){
		this.type	= "Map";
		this.name	= szName?szName:"Feed";
		this.comment = "generated by map_feed";
		this.bbox = new Array(180,90,-180,-90);
		this.layers = new Array();
	};
	ixmaps.feed.LayerSet.prototype.addLayer = function(szName){
		var ret = new ixmaps.feed.Layer(szName);
		ret.parent = this;
		this.layers.push(ret);
		return ret;
	};

	ixmaps.feed.Layer = function(szName){
		this.type = "FeatureCollection";
		this.properties = { "name": szName ,
							 "description": "",
							 "Snippet": "",
							 "visibility": "1",
							 "open": "0",
							 "legendstyle": "CHECKSUBLAYER",
							 "icon": "./resources/icons/google/kml/paddle/red-diamond.png",
							 "end": "" };
		this.features = new Array();
	};
	ixmaps.feed.Layer.prototype.addFeature = function(szName){
		var ret = new ixmaps.feed.Feature(szName);
		ret.parent = this;
		this.features.push(ret);
		return ret;
	};

	ixmaps.feed.Feature = function(szName){
		this.type		=	"Feature";
		this.properties = { "name": szName,
							"description": "" ,
							"icon": "./resources/icons/google/kml/paddle/red-diamond.png",
							"smallicon": "./resources/icons/google/red-circle.png",
							"iconscale": "1.000000",
							"legenditem": "Test",
							"end": "" };
	};

	ixmaps.feed.Feature.prototype.setPosition = function(lat,lng){
		this.geometry   = { "type": "Point",
							"coordinates": new Array(lat,lng) };
		obj = this.parent.parent;
		if ( obj ){
			obj.bbox[0] = Math.min(obj.bbox[0],lat);
			obj.bbox[1] = Math.min(obj.bbox[1],lng);
			obj.bbox[2] = Math.max(obj.bbox[2],lat);
			obj.bbox[3] = Math.max(obj.bbox[3],lng);
		}
	};

	ixmaps.feed.Feature.prototype.setLine = function(latlngA){
		this.multigeometry   = [{ "type": "LineString",
								  "coordinates": latlngA }];
	};


/**
 * end of namespace
 */

})();

// -----------------------------
// EOF
// -----------------------------
