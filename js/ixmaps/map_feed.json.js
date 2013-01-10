/**********************************************************************
map_feed.json.js

$Comment: provides JavaScript for import of feeds
$Source : map_feed.json,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/01/15 $
$Author: guenter richter $
$Id:map_pipe.js 1 2012-01-15 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_feed.json,v $
**********************************************************************/

/** 
 * @fileoverview This file is a json plugin for ixmaps.jsapi to import cross domain json feeds
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
	ixmaps.feed.parse.json = function(data,opt){

		console.log(data);
		return data.query.results.json;

	};
/**
 * end of namespace
 */

})();

// -----------------------------
// EOF
// -----------------------------
