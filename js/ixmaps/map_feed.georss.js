/**********************************************************************
map_feed.georss.js

$Comment: provides JavaScript for import of feeds
$Source : map_feed.georss,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/01/15 $
$Author: guenter richter $
$Id:map_pipe.js 1 2012-01-15 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_feed.georss,v $
**********************************************************************/

/** 
 * @fileoverview This file is a georss plugin for ixmaps.jsapi top import arbitrari georeferenced feeds
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
	ixmaps.feed.parse.GeoRSS = function(data,opt){

		if ( opt.type == "xml" ) {

			var layerset = null;
			var layer = null;
			var fonte = null;

			var channelLat = null;
			var channelLng = null;

			var version = $(data).find('rss').attr("version");

			$(data).find('channel').each(function(){
				var title = $(this).find('title:first').text();
				fonte = $(this).find('link:first').text();

				// create ixmaps layerset
				// ----------------------
				layerset = new ixmaps.feed.LayerSet(title);

				// create one and only layer
				// -------------------------

				layer = layerset.addLayer(title);
				layer.properties.fGallery = false;
				layer.properties.open = "1";

				// get a channel geo position, if defined
				// GeoRSS 1.0
				if ( version && version.match(/1.0/) ){
					var pointA = $(this).find('georss:point,point').text().split(" ");
					channelLat = pointA[1];
					channelLng = pointA[0];
				}else
				// GeoRSS 2.0
				if ( version && version.match(/2.0/) ){
					channelLat = $(this).find('geo:lat,lat').text();
					channelLng = $(this).find('geo:long,long').text();
				}else				
				// GeoRSS 1.0
				if ( $(this).find('georss:point,point').text().length ){
					var pointA = $(this).find('georss:point,point').text().split(" ");
					channelLat = pointA[1];
					channelLng = pointA[0];
				}else
				// GeoRSS 2.0
				if ( $(this).find('geo:lat,lat').text().length ){
					channelLat = $(this).find('geo:lat,lat').text();
					channelLng = $(this).find('geo:long,long').text();
				}				
			
			});

			var i=0;

			$(data).find('item').each(function(){

				// parse one feature
				// -----------------
				var szImageUrl = "";
				var szText		= $(this).find('description:first').text();
				var szTitle		= $(this).find('title:first').text();
				var szLink		= $(this).find('link:first').text();
				var szDate		= $(this).find('pubDate').text();
				// test
				if ( $(this).find('category') )	{
					var szCategory	= $(this).find('category').text();
				}else{
					var szCategory	= null;
				}

				szText = "<span class=\"feed_description\" >"+szText+"</span>";

				var szHtml =  "";
					if ( szCategory ){
						szHtml += "<span class=\"category\" style='color:#aac;font-size:0.9em;'>&nbsp;"+ szCategory +"&nbsp;</span><br>";
					}
					szHtml += "<div>"+szText+"</div>";
					szHtml += "<div style='font-size:0.8em;line-height:1.2em;padding-top:5px;padding-left:1px;padding-bottom:5px;'>fonte: <a href='"+szLink+"' target='blank'>"+fonte+"</a>";
					szHtml += "<br>publ.: <span style='color:#aac;font-size:0.9em;'>"+ szDate +" </span>";
					szHtml += "</div>";

				if ( i<20 ){
					var szIcon = "./resources/icons/map-icons-collection/numeric/blue"+ (i+1) +".png";
					var szSmallIcon = null; //"./resources/icons/google/blu-circle.png";
				}else{
					var szIcon = null; // "./resources/icons/google/blu-circle.png";
					var szSmallIcon = "./resources/icons/google/blu-circle.png";
				}

				// add one feature
				// ---------------
				var feature = layer.addFeature(szTitle);
					feature.properties.description	= szHtml;
					feature.properties.icon			= szIcon;
					feature.properties.smallicon	= szSmallIcon;
					feature.properties.category		= szCategory;
					feature.properties.legenditem	= "Piceno News";

					var d = new Date(szDate);
					feature.properties.utime = d.getTime();

					// search date within description 
					// ------------------------------
					var dateA = new Array();
					while( szText.length ){ 
						var index = szText.search(/([0-2]\d|[3][0-1])\/([0]\d|[1][0-9])\/([1-2]\d|[0-9][0-9][0-9])/);
						if ( index > 0 ){
							dateA.push(szText.substr(index,10).split('/'));
							szText = szText.substr(index+10,szText.length-index-10);
						}else{
							szText = "";
						}
					}
					if ( dateA.length && (dateA[0][2].length == 4) ){
						var d1 =  new Date(dateA[0][2],dateA[0][1]-1,dateA[0][0]);
						feature.properties.utime = d1;
					}
					// GeoRSS 1.0
					if ( version && version.match(/1.0/) ){
						var pointA = $(this).find('georss:point,point').text().split(" ");
						feature.setPosition(pointA[1],pointA[0]);
					}else
					// GeoRSS 2.0
					if ( version && version.match(/2.0/) ){
						var lat = $(this).find('geo:lat,lat').text();
						var lng = $(this).find('geo:long,long').text();
						feature.setPosition(lng,lat);
					}else
					// GeoRSS 1.0
					if ( $(this).find('georss:point,point').text().length ){
						var pointA = $(this).find('georss:point,point').text().split(" ");
						feature.setPosition(pointA[1],pointA[0]);
					}else
					// GeoRSS 2.0
					if ( $(this).find('geo:lat,lat').text().length ){
						var lat = $(this).find('geo:lat,lat').text();
						var lng = $(this).find('geo:long,long').text();
						feature.setPosition(lng,lat);
					}else
					// default = channel position, if defined
					if ( channelLat && channelLng ){
						feature.setPosition(channelLng,channelLat);
					}else{
					// we don't have a position
						ixmaps.feed.unresolvedPosition++;
					}

				i++;

			});


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
