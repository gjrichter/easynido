/**********************************************************************
map_feed.geojsonr.js

$Comment: provides JavaScript for import of feeds
$Source : map_feed.geojsonr.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/02/06 $
$Author: guenter richter $
$Id:map_pipe.js 1 2012-02-06 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_feed.geojsonr,v $
**********************************************************************/

/** 
 * @fileoverview This file is a geojson plugin for ixmaps.jsapi top import arbitrari georeferenced feeds
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
	ixmaps.feed.parse.GeoJsonR = function(data,opt){

		var data = data.query.results.json;

		if ( opt.type == "json" ) {

			// create ixmaps layerset
			// ----------------------
			var layerset = new ixmaps.feed.LayerSet("test");

			// create one and only layer
			// -------------------------

			var layer    = layerset.addLayer("test");
			layer.properties.fGallery = false;
			layer.properties.open = "1";

			var itemA = data.features;

			// parse the feeds elements and create layere features
			// ---------------------------------------------------
			for ( i=0; i<itemA.length; i++ ){

				// parse one feature
				// -----------------
				var szImageUrl = "";
				var szText		= itemA[i].properties.description;
				var szTitle		= itemA[i].properties.title;
				var szLink		= itemA[i].properties.link;

				szText = "<span style='font-family:courier new;font-size:12px;'>"+szText+"</span>";

				var szHtml  = "<table><tr><td>"+szText+"</td></tr><tr><td>" + "</td></tr></table>";
					szHtml += "<div style='font-size:0.6em;line-height:1.2em;margin-bottom:0px'>fonte: <a href='"+szLink+"'>Provincia di Ascoli Piceno</a>";

				var szIcon = "./resources/icons/google/kml/paddle/blu-blank.png";
				var szSmallIcon = "./resources/icons/google/blu-circle.png";

				// add one feature
				// ---------------
				var feature = layer.addFeature(szTitle);
					feature.properties.description	= szHtml;
					feature.properties.icon			= szIcon;
					feature.properties.smallicon	= szSmallIcon;
					feature.properties.legenditem	= "GeoJson";

					var d = new Date();
					feature.properties.utime = d.getTime();

					feature.geometry = { type:"Point", coordinates: [ itemA[i].geometry.coordinates[1],itemA[i].geometry.coordinates[0] ] } ;
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
