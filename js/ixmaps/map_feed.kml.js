/**********************************************************************
map_feed.kml.js

$Comment: provides JavaScript for import of kml coded feeds
$Source : map_feed.kml,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/02/27 $
$Author: guenter richter $
$Id:map_feed.kml.js 1 2012-02-27 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_feed.kml,v $
**********************************************************************/

/** 
 * @fileoverview This file is a kml plugin for ixmaps.jsapi top import arbitrari georeferenced feeds
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

/**
 * define namespace ixmaps
 */

window.ixmaps = window.ixmaps || {};
ixmaps.feed = ixmaps.feed || {};
ixmaps.feed.parse = ixmaps.feed.parse || {};
(function() {

/**
 * parse the feed data and make an ixmaps layer object  
 * @param the data object received from the feed
 * @param opt optional parameter object
 * @type object
 * @return an ixmaps layer object
 */
	ixmaps.feed.parse.MyMapsKLM = function(data,opt){

		var kml = data.value.items[0].Document;

		// create ixmaps layerset
		// ----------------------
		var layerset = new ixmaps.feed.LayerSet("Google Maps Feed");

		// create one and only layer
		// -------------------------
		var layer    = layerset.addLayer(kml.name);

		// parse the feeds elements and create layere features
		// ---------------------------------------------------
		for ( i=0; i<kml.Placemark.length; i++ ){

			var pl = kml.Placemark[i];

			// parse one feature
			// -----------------
			var szImageUrl = "";
			var szText = pl.description||"&nbsp;";
			var szTitle = pl.name;

			var szHtml  = "<p>"+szText+"<p>";
				if ( opt.fonte ){
					szHtml += "<p style='font-size:0.7em;margin-top:10px;'><span style='color:#ddd;'>fonte: </span><a href='"+opt.fonte+"'>"+opt.fonte+"</a></p>";
				}

			var szIcon = "./resources/icons/google/kml/paddle/blu-blank.png";
			var szSmallIcon = "./resources/icons/google/blu-circle.png";

			// add one feature
			// ---------------
			var feature = layer.addFeature(szTitle);
				feature.properties.description	= szHtml;
				feature.properties.icon			= szIcon;
				feature.properties.smallicon	= szSmallIcon;
				feature.properties.legenditem	= szIcon;
				var position = pl.Point.coordinates.split(",");
				feature.setPosition(position[0],position[1]);
		}

		return layerset;
	};
/**
 * parse the feed data and make an ixmaps layer object 
 * the data must be a KML transcoded by YQL into GeoJson
 * @param the data object received from the feed
 * @param opt optional parameter object
 * @type object
 * @return an ixmaps layer object
 */
	ixmaps.feed.parse.MyMapsKLM_YQL = function(data,opt){

		if ( !data.query || !data.query.results || !data.query.results.kml || !data.query.results.kml.Document  ){
			// alert("no valid KML!");
			alert("http status message: "+data.query.diagnostics.url["http-status-message"]);
			return null;
		}

		var kml = data.query.results.kml.Document;

		if ( !kml ){
			// alert("no valid KML!");
			return null;
		}
		if ( kml.Folder ){
			kml = kml.Folder;
		}
		if ( !kml.Placemark ){
			// alert("no valid KML!");
			return null;
		}
		var	szTitle = opt.title?opt.title:kml.name;
		if ( (szTitle == null) || (szTitle.length == 0) ){
			szTitle = "no name-";
		}

		// create ixmaps layerset
		// ----------------------
		var layerset = new ixmaps.feed.LayerSet(szTitle);

		// create one and only layer
		// -------------------------
		var layer    = layerset.addLayer(szTitle);

		// parse the feeds elements and create layere features
		// ---------------------------------------------------
		for ( i=0; i<kml.Placemark.length; i++ ){

			var pl = kml.Placemark[i];

			if ( pl.Point )	{

				// parse one point feature
				// -----------------------
				var szImageUrl = "";
				var szText = pl.description||"&nbsp;";
				var szTitle = pl.name;

				var szHtml  = "<p>"+szText+"<p>";
				if ( opt.fonte ){
					szHtml += "<p style='font-size:0.7em;margin-top:10px;'><span style='color:#ddd;'>fonte: </span><a href='"+opt.fonte+"'>"+opt.fonte+"</a></p>";
				}

				var szIcon = "./resources/icons/default/kml/default.png";
				var szSmallIcon = "./resources/icons/default/kml/default-small.png";

				try	{
					szStyleId = pl.styleUrl.split(/#/)[1];
					for ( s=0; s<kml.Style.length; s++ ){
						if (kml.Style[s].id == szStyleId ){
							szIcon = kml.Style[s].IconStyle.Icon.href;
							if ( szIcon.match(/red/)){
								szSmallIcon = "./resources/icons/google/red-circle.png";
							}else
							if ( szIcon.match(/green/)){
								szSmallIcon = "./resources/icons/google/grn-circle.png";
							}else
							if ( szIcon.match(/blu/)){
								szSmallIcon = "./resources/icons/google/blu-circle.png";
							}else
							if ( szIcon.match(/yel/)){
								szSmallIcon = "./resources/icons/google/yel-circle.png";
							}else
							if ( szIcon.match(/viol/)){
								szSmallIcon = "./resources/icons/google/viola-circle.png";
							}
						}
					}
				}catch (e){
				}

				// add one feature
				// ---------------
				var feature = layer.addFeature(szTitle);
					feature.properties.description	= szHtml;
					feature.properties.icon			= szIcon;
					feature.properties.smallicon	= szSmallIcon;
					feature.properties.legenditem	= szIcon;
					var position = pl.Point.coordinates.split(",");
					feature.setPosition(position[0],position[1]);
			}
			if ( pl.LineString )	{

				// parse one line feature
				// -----------------------
				var szText = pl.description||"&nbsp;";
				var szTitle = pl.name;

				var szHtml  = "<p>"+szText+"<p>";
				if ( opt.fonte ){
					szHtml += "<p style='font-size:0.7em;margin-top:10px;'><span style='color:#ddd;'>fonte: </span><a href='"+opt.fonte+"'>"+opt.fonte+"</a></p>";
				}
                var style = { "lineStyle": {"color": "#66cc00","width": "5" } };
				try	{
					szStyleId = pl.styleUrl.split(/#/)[1];
					for ( s=0; s<kml.Style.length; s++ ){
						if (kml.Style[s].id == szStyleId ){
							szColor = kml.Style[s].LineStyle.color;
							szWidth = kml.Style[s].LineStyle.width;
							var aa = szColor.substr(0,2);
							var bb = szColor.substr(2,2);
							var gg = szColor.substr(4,2);
							var rr = szColor.substr(6,2);
							szColor = "#"+rr+gg+bb;
							style = { "lineStyle": {"color": szColor,"width": szWidth } };
						}
					}
				}catch (e){
				}

				// add one feature
				// ---------------
				var feature = layer.addFeature(szTitle);
					feature.properties.description	= szHtml;
					feature.properties.legenditem	= szTitle;
					feature.properties.style		= style;
					var positionA = pl.LineString.coordinates.split(" ");
					var coordA = new Array(0);
					for ( var v=0; v<positionA.length; v++ ){
						if ( !isNaN(parseFloat(positionA[v]))){
							var position = positionA[v].split(",");
							coordA.push(new Array(position[0],position[1]));
						}
					}
					feature.setLine(coordA);
			}

		}
		return layerset;
	};

/**
 * end of namespace
 */

})();

// -----------------------------
// EOF
// -----------------------------
