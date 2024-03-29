/**********************************************************************
map_api.js

$Comment: provides JavaScript for Google Mashup from geojson layer generated by ixmaps
$Source :map_api.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2009/12/05 $
$Author: guenter richter $
$Id:map_app.js 1 2009-12-05 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:map_api.js,v $
**********************************************************************/

/** 
 * @fileoverview This file is the main JavaScript for Google Mashup from geojson layer data created by ixmaps
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

var _TRACE = function(szMessage){
	if ( typeof(console) != "undefined"  && typeof(console.log) != "undefined"  ){
		console.log("_TRACE:"+szMessage);
	}
};

/**
 * define namespace ixmaps
 */

var ixmaps = window.ixmaps = window.ixmaps || {};
ixmaps.jsapi = ixmaps.jsapi || {};
(function() {

var fNoMap = false;

/* ...................................................................* 
 *  global vars                                                       * 
 * ...................................................................*/ 

ixmaps.jsapi.fCheckLayer = false;
ixmaps.jsapi.fShowExpanded = false;
ixmaps.jsapi.resetTimeout = null;
ixmaps.jsapi.searchDelayTimeout = null;
ixmaps.jsapi.fShowInfoInList = false;
ixmaps.jsapi.onFocus = false;

/* ...................................................................* 
 *  local vars                                                       * 
 * ...................................................................*/ 

var __map = null;
var __mapUp = null;

var __fShowInfoInList = false;
var __fShowLinkInList = false;
var __fShowTooltips = false;
var __szItemFilter = null;

var __resourceRoot = "";

/* ...................................................................* 
 *  read and parse URL parameter                                      * 
 * ...................................................................*/ 

function _mapapi_getResourceRoot() {
	if (document.URL.match(/http:/)){
		var url = document.URL.split("?")[0];
		var urlA = url.split("/");
		for ( var i=0; i<urlA.length-1; i++){
			__resourceRoot += urlA[i]+"/";
		}
	}else{
		__resourceRoot = "";
	}
}
_mapapi_getResourceRoot();

var _mapapi_queryParam = null;
function _mapapi_readParam() {
	_mapapi_queryParam = [];
	var query = window.location.hash.split('?')[1];
	if ( !query || query.length === 0 ){
		query = window.location.search.substring(1);
	}
	if ( query ){
		var parms = query.split('&');
		for (var i=0; i<parms.length; i++) {
			var pos = parms[i].indexOf('=');
			if (pos > 0) {
			  var key = parms[i].substring(0,pos);
			  var val = parms[i].substring(pos+1);
			  _mapapi_queryParam[key] = val;
			}
		}
	}
}

function _mapapi_getParam(){

	ixmaps.jsapi.szKML = null;
	ixmaps.jsapi.szGeoRSS = null;
	ixmaps.jsapi.szKMLName = null;
	ixmaps.jsapi.filterA = null;
	ixmaps.jsapi.szBookmark = null;

	for ( var a in _mapapi_queryParam ){
		_mapapi_setParam(a,_mapapi_queryParam[a]);
	}
}

function _mapapi_setParam(szParam,szValue){

	switch ( szParam ) {
		case "mode":
			switch ( szValue ){
				case "info":
					__fShowInfoInList = true;
					break;	
				case "testall":
					__fShowInfoInList = true;
				case "testlinks":
					__fShowLinkInList = true;
					break;
				case "checklayer":
					ixmaps.jsapi.fCheckLayer = true;
					break;
				default:
					break;
			}
			break;

		case "filter":
			__szItemFilter = szValue;
			break;

		case "expanded":
			ixmaps.jsapi.fShowExpanded = szValue;
			break;

		case "kml":
			ixmaps.jsapi.szKML = szValue;
			break;
		case "georss":
			ixmaps.jsapi.szGeoRSS = szValue;
			break;
		case "kmlname":
			ixmaps.jsapi.szKMLName = unescape(szValue);
			break;
		case "itemfilter":
			ixmaps.jsapi.filterA = ixmaps.jsapi.getFilterArray(unescape(szValue));
			break;
		case "bookmark":
			ixmaps.jsapi.szBookmark = szValue;
			break;

		default: 
			break;
	}
}

/* ...................................................................* 
 *  wrapper for the GMap eventhandling                                * 
 * ...................................................................*/

 var __myApp = null;

_mapapi_synchronize = function(app) {
	__myApp = app;
	setTimeout("_mapapi_doSynchronize()",100);
};
_mapapi_doSynchronize = function() {
	__myApp.synchronize();
};
_mapapi_onInfoWindowClose = function(app) {
	app.onInfoWindowClose();
};

/* ...................................................................* 
 *  Map application					                                  * 
 * ...................................................................*/
  
ixmaps.jsapi.MapUp = function(szMapDiv,szItemlistDiv,szLegendDiv,szDirectionsDiv){
	return _mapapi_initialize_all(szMapDiv,szItemlistDiv,szLegendDiv,szDirectionsDiv);
};

/**
 * Is called 'onload' to start creating the map
 */
function _mapapi_initialize_all(szMapDiv,szItemlistDiv,szLegendDiv,szDirectionsDiv){
	// read params from the query
	//_mapapi_readParam();
	//_mapapi_getParam();

	// create base map
	__map = _map_loadMap($("#"+szMapDiv+"")[0]);
	// create map application
	// ----------------------
	__mapUp = new ixmaps.MapUp(__map,$("#"+szItemlistDiv+"")[0],$("#"+szLegendDiv+"")[0]);

	// create map listener for synchronizing
	// -------------------------------------
	_map_addEventListner(__map,"moveend",function() {_mapapi_synchronize(__mapUp);});
	_map_addEventListner(__map,"infowindowclose",_mapapi_onInfoWindowClose,__mapUp);

	// add directions service
	// ----------------------
	_map_addDirections(__map,$("#"+szDirectionsDiv+"")[0]);

	// add traffic service
	// ----------------------
	_map_addTrafficLayer(__map);

	// load the first layer
	// look if MapData has been loaded by 'dataloader.js' and contains a valid map object
	// if not, load layer from the start
	// ----------------------------------------------------------------------------------
	if ( (typeof(szMapDataLoaded) != "undefined") && szMapDataLoaded.length )
	{
		if ( typeof(MapData) == "undefined") {
			eval("var szType=typeof("+szMapDataLoaded+");");
			if ( szType == "object" ){
				eval("MapData="+szMapDataLoaded+";");
			}
		}
		if ( (typeof(MapData) == "object") && MapData.type && (MapData.type == "Map") ){
			__mapUp.addLayer(szMapDataLoaded,MapData);
		}else{
			ixmaps.jsapi.loadData(szMapDataLoaded,__szItemFilter);
		}

		ixmaps.jsapi.setDataCheckBox(szMapDataLoaded,true);
		__mapUp.setExtent("maximal");

		__mapUp.drawLayer();
		__mapUp.drawSidebar();

	}else{
		// no data preloaded, so try default data
		// --------------------------------------
		__mapUp.setExtent("world");

	}

	// set window resize handler
	// --------------------------------------
	$(window).resize(function() { try{ 
									ixmaps.jsapi.onWindowResize(null,false); 
									} catch (e){} 
	});


	// call reset on timeout to start the map display
	// ----------------------------------------------
	setTimeout("ixmaps.jsapi.reset()",1);

	return __mapUp;
}

/**
 * Is called 'onunload' to clear objects
 */
function _mapapi_unload_all(){
	if (__map){
		_map_unloadMap(__map);
	}
}

/**
 * Is called to set a new GeoJson data 
 */
function _mapapi_setNewData(szLayerDataName,mapData) {

	__mapUp.clearMap();
	__mapUp.layer.length = 0;

	ixmaps.jsapi.addNewData(szLayerDataName,mapData);

	__mapUp.setExtent("maximal");
}


/* ...................................................................* 
 *  helper                                                            * 
 * ...................................................................*/ 

ixmaps.message = function(szMessage,fFlag){

	var top  = (window.innerHeight/2);
	var left = (window.innerWidth/2);
	var gmapDiv = $("#map")[0];
	if (gmapDiv){
		left = gmapDiv.clientWidth/2;
		top  = gmapDiv.clientHeight/2;
	}
	var loadingDiv = $("#footerloading")[0];
	if ( loadingDiv ){
		loadingDiv.style.top = (top+10) + "px";
		loadingDiv.style.left = (left-100) + "px";
	}
	var messageObj = $("#loading")[0];
	if ( messageObj ){
		messageObj.style.visibility = (fFlag==true?"visible":"hidden");
	}
};
ixmaps.errorMessage = function(szMessage,nTimeout){

	if ( !nTimeout ){
		nTimeout = 1000;
	}
	if ( $("#error")[0] ){
		$("#error").css("visibility","visible");
		$("#error-message").html(szMessage);
		setTimeout("$(\"#error\").css(\"visibility\",\"hidden\");$(\"#error-message\").html(\"\");",nTimeout);
	}
};

function _mapapi_getMimeType(url){
	var mimeType = "audio/mpeg";
	var theExtension = url.substr(url.lastIndexOf('.')+1, 3); // truncates .aiff to aif
	if (theExtension.toLowerCase() == "wav") { mimeType = "audio/x-wav";}
	if (theExtension.toLowerCase() == "aif") { mimeType = "audio/x-aiff";} 
	if (theExtension.toLowerCase() == "wma") { mimeType = "audio/x-ms-wma";}
	if (theExtension.toLowerCase() == "mid") { mimeType = "audio/mid";}
	return mimeType;
}

/* ...................................................................* 
 *  exported functions                                                * 
 *																	  *	
 *  the real API                                                      * 
 * ...................................................................*/ 

/**
 * Is called to add a new GeoJson data 
 */
ixmaps.jsapi.addNewData = function(szLayerDataName,mapData) {

	this.setSearchFilter('');

	__mapUp.removeLayerBySourceName(szLayerDataName);

	if ( mapData ){
		__mapUp.addLayer(szLayerDataName,mapData);
	}
	else{
		// wrap layer data
		if ( typeof(szLayerDataName) == "string" ){
			eval("MapData="+szLayerDataName+";");
		}
		if ( typeof(MapData) == "undefined") {
			eval("MapData="+szMapDataLoaded+";");
		}

		__mapUp.addLayer(szLayerDataName,MapData);
	}

	if ( __fShowInfoInList || ixmaps.jsapi.fShowInfoInList ){
		var layerA = __mapUp.getAllLayerOfSource(szLayerDataName);
		for ( var i=0; i<layerA.length; i++ ){
			if ( typeof(layerA[i].data.fShowInfoInList) == "undefined" ){
				layerA[i].data.fShowInfoInList = (__fShowInfoInList || ixmaps.jsapi.fShowInfoInList);
			}
		}
	}

	__mapUp.clearLegend();
	__mapUp.redraw();

	// GR 12.11.2012 if first layer, set extent to layer !!
	if ( __mapUp.layer.length == 1 ){
		__mapUp.fSynchronized = false;
		__mapUp.setExtent("actual");
	}
};

/**
 * Is called to remove GeoJson data 
 */
ixmaps.jsapi.removeData = function(szLayerDataName) {

	__mapUp.removeLayerBySourceName(szLayerDataName);

	__mapUp.clearLegend();
	__mapUp.redraw();

//	__mapUp.setExtent("maximal");

};
ixmaps.jsapi.removeLayer = function(szLayer)
{
	__mapUp.removeLayer(szLayer);

	__mapUp.clearLegend();
	__mapUp.redraw();
};
ixmaps.jsapi.isLayer = function(szLayer)
{
	return __mapUp.isLayer(szLayer);
};

/**
 * general redraw function
 */
ixmaps.jsapi.redraw = function() {
	__mapUp.redraw();
};

/**
 * set item list clipping
 */
ixmaps.jsapi.setSidebarClipping = function(flag) {
	__mapUp.fClipSidebarToMapExtent = flag;
	__mapUp.redraw();
};

/**
 * set item list autoscroll
 */
ixmaps.jsapi.setSidebarAutoScroll = function(flag) {
	__mapUp.fAutoScrollSidebar = flag;
};

/**
 * set item list tooltips
 */
ixmaps.jsapi.setSidebarTooltips = function(flag,autopan) {
	__mapUp.fSidebarTooltips = flag;
	__mapUp.fSidebarTooltipsAutoPan = autopan;
};

/**
 * set item list autoscroll
 */
ixmaps.jsapi.setListStateButtons = function(flag) {
	__mapUp.fUseListStateButtons = flag;
};

/**
 * position the actual sidbar item title to the top
 */
ixmaps.jsapi.fixItemListTitles = function() {
	if ( this.fixItemListTitlesTimer ){
		clearTimeout(this.fixItemListTitlesTimer);
	}
	this.fixItemListTitlesTimer = setTimeout("ixmaps.jsapi.doFixItemListTitles()",250);
};
ixmaps.jsapi.doFixItemListTitles = function() {
	__mapUp.fixItemListTitles();
};


/**
 * redraw with search filter from HTML form
 */
ixmaps.jsapi.search = function() {
	if ( ixmaps.jsapi.searchDelayTimeout ){
		clearTimeout(ixmaps.jsapi.searchDelayTimeout);		
	}
	ixmaps.jsapi.searchDelayTimeout = setTimeout("ixmaps.jsapi.searchDelay()",500);
};

/**
 * delayed redraw with search filter from HTML form
 */
ixmaps.jsapi.searchDelay = function() {
	__mapUp.szSearchString = $("#IndicatorFilterForm > input").val();
	__mapUp.redraw();
};

/**
 * redraw with search filter given as parameter
 */
ixmaps.jsapi.getFilterArray = function(szString) {
	return __getStyleArray(szString);
};
/**
 * transform a style string: name:value;name:value ... into a named array
 * @param szStyle the style string
 * @return an object of the kind: object.name = value
 */
function __getStyleArray(szStyle){
	if ( szStyle == null || szStyle.length < 2 ){
		return null;
	}
	try{
		var styleA = new Array(0);
		var szPartsA = szStyle.split(';');
		for ( var i=0;i<szPartsA.length;i++ ){
			if (szPartsA[i].length){
				var szPartA = szPartsA[i].split(':');
				styleA[szPartA[0]] = szPartA[1];
			}
		}
		return styleA;
	}
	catch (e){
		alert("ERROR parsing: "+szStyle);
	}
	return null;
}

/**
 * redraw with search filter given as parameter
 */
ixmaps.jsapi.setSearchFilter = function(szString) {
	__mapUp.szSearchString = szString;
	__mapUp.redraw();
};

/**
 * redraw with exclude filter given as parameter
 */
ixmaps.jsapi.setExcludeFilter = function(szString) {
	__mapUp.szExcludeString = szString;
};


ixmaps.jsapi.setMarkerStyle = function(szStyle)
{
	var layersP = ixmaps.jsapi.mapParam.layers;
	for ( var i=0; i<layersP.length; i++ ){
		if ( layersP[i].markerType ){
			layersP[i].markerType = szStyle;
		}
	}
	__mapUp.clearMap();
	__mapUp.redraw();
};


var __setListContent = function(layer,szLayerName,szListContent){

	switch ( szListContent ){
		case "info" : 
			layer.fShowInfoInList = true; 
			layer.properties.fGallery = false; 
			__fShowLinkInList = false; 
			break;
		case "link" : 
			__fShowLinkInList = true;
			if ( szLayerName ){
				layer.fShowInfoInList = true; 
			}
			for ( var i=0; i<__mapUp.layer.length; i++ ){
				__mapUp.layer[i].data.fShowInfoInList = true;
			}
			break;
		case "gallery" : 
			layer.fShowInfoInList = false; 
			layer.properties.fGallery = true; 
			__fShowLinkInList = false; 
			break;
		case "none" : 
			layer.fShowInfoInList = false; 
			layer.properties.fGallery = false; 
			__fShowLinkInList = false; 
			break;
		case "show" :
			layer.legend = "expanded";
			__fShowLinkInList = false; 
			break;
		case "hide" : 
			layer.legend = "collapsed";
			__fShowLinkInList = false; 
			break;
		case "piu" :
			layer.fShowAll = true;
//			ixmaps.jsapi.zoomToLayer(layer.name);
			break;
		case "extent" :
			layer.fShowAll = true;
			ixmaps.jsapi.zoomToLayer(layer.name);
			break;
		case "clip" :
			layer.fShowAll = false;
			break;
	}
};

ixmaps.jsapi.setListContent = function(szLayerName,szListContent)
{
	var layer = null;
	if ( szLayerName ){
		for ( var i=0; i<__mapUp.layer.length; i++ ){
			if ( __decode_utf8(__mapUp.layer[i].name) == __decode_utf8(szLayerName) ){
				layer = __mapUp.layer[i].data;
				__setListContent(layer,szLayerName,szListContent);
			}
		}
		if ( layer == null ){
			for ( var i=0; i<__mapUp.layer.length; i++ ){
				if ( __decode_utf8(__mapUp.layer[i].source) == __decode_utf8(szLayerName) ){
					layer = __mapUp.layer[i].data;
					__setListContent(layer,szLayerName,szListContent);
				}
			}
		}
	}else{
		__mapUp.szListContent = szListContent;
		for ( var i=0; i<__mapUp.layer.length; i++ ){
			layer = __mapUp.layer[i].data;
			__setListContent(layer,__mapUp.layer[i].name,szListContent);
		}
	}
	if ( layer == null ){
		return;
	}
	layer.fShowAll = false; 

	// GR 02.02.2012 needed to scroll the itemlist to the layer
	__mapUp.itemListLayer = layer;
	__mapUp.saveSidebarScroll();

	__mapUp.clearLegend();
	if ( !this.fCheckLayer && !(layer.properties.legendstyle && layer.properties.legendstyle.match(/CHECKSUBLAYER/))){
		this.setMapContent(szLayerName,szListContent);
	}
	__mapUp.clearMap();
	__mapUp.redraw();

};

ixmaps.jsapi.setMapContent = function(szLayerName,szMapContent)
{
	var layer = null;
	if ( szLayerName ){
		for ( var i=0; i<__mapUp.layer.length; i++ ){
			if ( __decode_utf8(__mapUp.layer[i].name) == __decode_utf8(szLayerName) ){
				layer = __mapUp.layer[i].data;
			}
		}
	}
	if ( layer == null ){
		return;
	}

	layer.visibility = "1"; 

	switch ( szMapContent ){
		case "show" : 
			layer.properties.visibility = "1"; 
			break;
		case "hide" : 
			layer.properties.visibility = "0"; 
			break;
	}

	__mapUp.redraw();
};

ixmaps.jsapi.loadDefaultMap = function() {


		if ( (typeof(ixmaps.jsapi.mapParam) == "object") && ixmaps.jsapi.mapParam.defaultmap && ixmaps.jsapi.mapParam.defaultmap.data ){
			this.loadData(ixmaps.jsapi.mapParam.defaultmap.data,null,"add");
		}
		if ( (typeof(ixmaps.jsapi.mapParam) == "object") && ixmaps.jsapi.mapParam.defaultmap && ixmaps.jsapi.mapParam.defaultmap.feed ){
			this.addFeedLayer_YQL(ixmaps.jsapi.mapParam.defaultmap.feed.url,'GeoRSS','xml',ixmaps.jsapi.mapParam.defaultmap.feed.mode);
		}
};

ixmaps.jsapi.reset = function() {

	if ( ixmaps.jsapi.resetTimeout ){
		clearTimeout(ixmaps.jsapi.resetTimeout);		
	}
	ixmaps.jsapi.resetTimeout = setTimeout("ixmaps.jsapi.doreset()",10);
};

ixmaps.jsapi.doreset = function() {


	__mapUp.clearMap();
	__mapUp.layer.length = 0;


	_mapapi_readParam();
	_mapapi_getParam();

	
	this.closeFullDescription();
	this.loadDefaultMap();


	this.getHashFeed();
	this.setSearchFilter('');
	this.setExcludeFilter('');

	__mapUp.setExtent("maximal");
};

// use yahoo YQL webservice as proxy to get around origin problems
// ----------------------------------------------------------------
ixmaps.jsapi.addFeedLayer_YQL = function(szLayer,szName,szType,szFlag,szTitle) {
	var szUrl  = "http:\/\/query.yahooapis.com\/v1\/public\/yql?q=select%20*%20from%20xml%20where%20url%3D";
		szUrl += "'"+encodeURIComponent(szLayer)+"'";
		szUrl += szName.match(/GeoRSS/)?"&format=rss&diagnostics=true":"&format=json&diagnostics=true";
	ixmaps.feed.addFeed(szUrl,{"name":szName,"type":szType,"flag":szFlag,'title':szTitle});
};

// GR 17.05.2012 must bee done more elegant !
ixmaps.jsapi.getHashFeed = function() {

	if ( (typeof(szMapDataLoaded) != "undefined") && szMapDataLoaded.length ){
		if ( (typeof(MapData) == "object") && MapData.type && (MapData.type == "Map") ){
			__mapUp.addLayer(szMapDataLoaded,MapData);
		}else{
			ixmaps.jsapi.loadData(szMapDataLoaded,__szItemFilter,"add|zoomto");
		}
	}
	if ( ixmaps.jsapi.szKML ){
		var szUrl  = "http:\/\/query.yahooapis.com\/v1\/public\/yql?q=select%20*%20from%20xml%20where%20url%3D";
		szUrl += "'"+ixmaps.jsapi.szKML+"'";
		szUrl += "&format=json&diagnostics=true";
		ixmaps.feed.addFeed(szUrl,{"name":'Google_Maps_My_Map_KML_YQL',"type":'json',"flag":'zoomto','title':ixmaps.jsapi.szKMLName});
	}
	if ( ixmaps.jsapi.szGeoRSS ){
		var szUrl  = "http:\/\/query.yahooapis.com\/v1\/public\/yql?q=select%20*%20from%20xml%20where%20url%3D";
		szUrl += "'"+ixmaps.jsapi.szGoeRss+"'";
		szUrl += "&format=rss&diagnostics=true";
		ixmaps.feed.addFeed(szUrl,{"name":'GeoRSS',"type":'xml',"flag":'zoomto'});
	}
	if ( ixmaps.jsapi.szBookmark ){
		_TRACE("get bookmark: "+ixmaps.jsapi.szBookmark);
		$.getScript("./"+ixmaps.jsapi.szBookmark+".js").fail(function() { alert("error loading: "+ixmaps.jsapi.szBookmark+".js"); });
	}

};

ixmaps.jsapi.__loadData = function(szLayer,szFilter,szFlag,szSource,szFallBackSource)
{
	ixmaps.message("loading",true);
	if ( !szSource ){
		return;
	}
	$.get(szSource,
		function(data){
			ixmaps.message("loading",false);
			var obj = false;
			if ( typeof(data) == "object" ){
				obj = data;
			}else{
				try {
					obj = $.parseJSON(data);
				} catch (e) {
					alert(e);
					if ( data.substr(0,3) == "var" ){
						eval(data);
						eval("obj = "+szLayer+";");
					}else{
						eval("obj = "+data+";");
					}
				}
			}
			// GR 15.10.2012 
			obj.szSource = szSource;
			__mapUp.szItemFilter = (typeof(szFilter)!="undefined")?szFilter:null;
			if ( szFlag && szFlag.match(/add/)){
				ixmaps.jsapi.addNewData(szLayer,obj);
			}else{
				_mapapi_setNewData(szLayer,obj);
			}
			ixmaps.jsapi.showTooltips(__fShowTooltips);
			ixmaps.jsapi.setDataCheckBox(szLayer,true);
			__mapUp.szItemFilter = null;
			if ( !ixmaps.jsapi.onFocus || (szFlag && szFlag.match(/zoomto/)) ){
				ixmaps.jsapi.zoomToLayer(szLayer);
			}
        },"JSON").error(function() { ixmaps.message("loading",false);
									 if(szFallBackSource){
										 ixmaps.jsapi.__loadData(szLayer,szFilter,szFlag,szFallBackSource);
									 }else{
										 ixmaps.errorMessage("error loading: "+szLayer);
									 }
	});
};
ixmaps.jsapi.loadData = function(szLayer,szFilter,szFlag,szSource)
{

	ixmaps.message("loading",true);
	if ( szSource ){
		ixmaps.jsapi.__loadData(szLayer,szFilter,szFlag,szSource);
	}else{
		ixmaps.jsapi.__loadData(szLayer,szFilter,szFlag ,"./data/gz/" + szLayer + ".js.gz"
														,"./data/" + szLayer + ".js");
	}
};
ixmaps.jsapi.addData = function(szLayer,szFilter,szSource)
{
	this.loadData(szLayer,szFilter,"add",szSource);
	return;
};
ixmaps.jsapi.addDataAndZoomTo = function(szLayer,szFilter,szSource)
{
	this.loadData(szLayer,szFilter,"add|zoomto",szSource);
	return;
};
ixmaps.jsapi.toggleData = function(szLayer,szSource){

	var target = $("#"+szLayer)[0];
	if ( !target ){
		target = this.event.srcElement ? this.event.srcElement : this.event.target;
	}	
	if ( target && target.checked ){
		__mapUp.szItemFilter = null;	
		ixmaps.jsapi.addData(szLayer,null,szSource);
	}
	else{
		ixmaps.jsapi.removeData(szLayer);
	}
};
ixmaps.jsapi.setDataCheckBox = function(szLayer,value){

	var target = $("#"+szLayer)[0];
	if ( target ){
		target.checked = value;
	}	
};
ixmaps.jsapi.showTooltips = function(fShow){
	__fShowTooltips = fShow;
	if ( __fShowTooltips && (__mapUp.actualMapZoom > 15) ){
		__mapUp.showTooltips(true);
	}else{
		__mapUp.showTooltips(false);
	}
};
ixmaps.jsapi.setTimeScope = function(szScope){
	__mapUp.setTimeScope(szScope);
};
ixmaps.jsapi.toggleServiceLayer = function(szServiceUrl){

	var target = $("#"+szServiceUrl)[0];
	if ( !target ){
		target = this.event.srcElement ? this.event.srcElement : this.event.target;
	}	
	if ( target && target.checked ){
		__mapUp.loadServiceLayer(szServiceUrl);
	}
	else{
		__mapUp.removeServiceLayer(szServiceUrl);
	}
};
ixmaps.jsapi.loadServiceLayer = function(szServiceUrl){
	__mapUp.loadServiceLayer(szServiceUrl);
};
ixmaps.jsapi.setDirections = function(fromAddress, toAddress, toHidden, locale){
	_map_setDirections(__map,fromAddress, toAddress, toHidden, locale);
};
ixmaps.jsapi.killaudio = function(url){
	var div = $("#audioplayer")[0];
	if ( div.hasChildNodes() )	{
		while ( div.childNodes.length >= 1 ) {
			div.removeChild( div.firstChild );       
		} 
	}	
};
ixmaps.jsapi.playaudio = function(url){

	var div = $("#audioplayer")[0];
	if ( div.hasChildNodes() )	{
		while ( div.childNodes.length >= 1 ) {
			div.removeChild( div.firstChild );       
		} 
	}

	// Get the MIME type of the audio file from its extension (for non-Windows browsers)
	var mimeType = "audio/mpeg"; // assume MP3/M3U
	var objTypeTag = "application/x-mplayer2"; // The Windows MIME type to load the WMP plug-in in Firefox, etc.

	mimeType = _mapapi_getMimeType(url);

	var object = document.createElement('object');
	object.setAttribute("type",objTypeTag); 
	
	var embed = document.createElement('embed');
	embed.setAttribute("src",ixmaps.jsapi.getResourceUrl(url));
	embed.setAttribute("width","200");
	embed.setAttribute("height","16"); 
	embed.setAttribute("type",mimeType); 
	embed.setAttribute("autostart","true"); 
	div.appendChild(embed);
	embed = document.createElement('text');
	embed.innerHTML += "&nbsp; <a  style=\"text-decoration: none\" href=\"javascript:ixmaps.jsapi.killaudio()\" title='stop' >[x]</a>";
	div.appendChild(embed);
	
};
ixmaps.jsapi.getEmbedAudioHTML = function(url,width){
	var szInfo="";
	var mimeType = _mapapi_getMimeType(url);
	szInfo += "<object width=\""+width+"\" height=\"40\">";
	szInfo += "<param name=\"src\" value=\""+url+"\" >";
	szInfo += "<param name=\"type\" value=\""+mimeType+"\" >";
	szInfo += "<param name=\"autoplay\" value=\"false\" >";
	szInfo += "<param name=\"controller\" value=\"true\" >";
	szInfo += "<embed src=\""+url+"\" type=\""+mimeType+"\" width=\"220\" height=\"40\" autostart=\"false\" loop=\"false\" >";
	szInfo += "</embed>";
	szInfo += "</object>";
	return szInfo;
};
ixmaps.jsapi.setEmbedAudioInInfo = function(state) {
	fEmbedAudioInInfo = state;
};



/**
 * display full description of item as popup window
 * @param void
 * @return void
 */
ixmaps.jsapi.popupFullDescription = function() {

	$("#myPopupDiv")[0].innerHTML = "";


	var divDescription = document.createElement("div");
	divDescription.setAttribute("id","myPopupDiv-content");
	divDescription.setAttribute("style","margin-top:30px;height:92%;overflow:auto;");
	divDescription.innerHTML = ixmaps.jsapi.szInfoWindowFullDescription;
	$("#myPopupDiv")[0].appendChild(divDescription);

	var deleteButton = document.createElement("div");
	deleteButton.setAttribute("id","myPopupDiv-delete-button");
	var szHTML = "<a href=\"javascript:ixmaps.jsapi.closeFullDescription();\"><img src='resources/ui/delete.png' height='22' style=\"position:absolute;top:10px;right:10px;\" /></a>";
	deleteButton.innerHTML = szHTML;
	$("#myPopupDiv")[0].appendChild(deleteButton);

	var offset = $("#map").position();
	$("#myPopupDiv").css("position","absolute");
	$("#myPopupDiv").css("top",offset.top+"px");
	$("#myPopupDiv").css("left",offset.left+"px");
	$("#myPopupDiv").css("background","#fff");
	$("#myPopupDiv").css("margin","10px");
	$("#myPopupDiv").css("padding","10px");
	$("#myPopupDiv").css("visibility","visible");
	$("#myPopupDiv").css("max-width",$("#map").width());
	$("#myPopupDiv").css("height",$("#map").height()-50);

	$("#myPopupDivBG").css("visibility","visible");
	$("#myPopupDivBG").css("position","absolute");
	$("#myPopupDivBG").css("top",offset.top+"px");
	$("#myPopupDivBG").css("left",offset.left+"px");
	$("#myPopupDivBG").css("width",$("#map").width());
	$("#myPopupDivBG").css("height",$("#map").height());

	ixmaps.touchScroll("myPopupDiv");
	ixmaps.touchScroll("myPopupDiv-content");

	// $( "#myPopupDiv" ).popup();
	// $( "#myPopupDiv" ).popup( "open" );
};
ixmaps.jsapi.closeFullDescription = function() {
	$("#myPopupDiv").css("visibility","hidden");
	$("#myPopupDivBG").css("visibility","hidden");
};

_fZoomToSmooth = false;
// wrapper for timeout to pass __map
ixmaps.jsapi.setCenterAndZoom = function(center,zoom){
	_map_setCenterAndZoom(__map,center,zoom);
};
ixmaps.jsapi.zoomTo = function(lat,lon){

	var nZoomToLevel = 16;

	if (!_fZoomToSmooth ){

		_map_setCenter(__map,new GLatLng(lat,lon));

		var nZoom = _map_getZoom(__map);
		_map_setCenterAndZoom(__map,new GLatLng(lat,lon),nZoomToLevel);

		var nTimeOutStep = 250;
		var nTimeOut = nTimeOutStep;
		while ( nZoom < nZoomToLevel ){
			setTimeout("ixmaps.jsapi.setCenterAndZoom(new GLatLng("+lat+","+lon+"),"+(++nZoom)+");",nTimeOut);
			nTimeOut += nTimeOutStep;
		}
		while ( nZoom > nZoomToLevel ){
			setTimeout("ixmaps.jsapi.setCenterAndZoom(new GLatLng("+lat+","+lon+"),"+(--nZoom)+");",nTimeOut);
			nTimeOut += nTimeOutStep;
		}
		return;
	}

	var nZoom = _map_getZoom(__map);
	var nTimeOutStep = 500;
	var nTimeOut = nTimeOutStep;

	var actualLat = _map_getCenter(__map).y;
	var actualLon = _map_getCenter(__map).x;

	var dLat = (lat-actualLat)/10;
	var dLon = (lon-actualLon)/10;
	
	actualLat += dLat;
	actualLon += dLon;
	for ( var i=0; i<10; i++ ){
		setTimeout("ixmaps.jsapi.setCenterAndZoom(new GLatLng("+actualLat+","+actualLon+"),"+nZoom+");",nTimeOut);
		actualLat += dLat;
		actualLon += dLon;
		nTimeOut += nTimeOutStep/3;
	}
		nTimeOut += nTimeOutStep;
	while ( ++nZoom <= nZoomToLevel ){
		setTimeout("ixmaps.jsapi.setCenterAndZoom(new GLatLng("+lat+","+lon+"),"+nZoom+");",nTimeOut);
		nTimeOut += nTimeOutStep;
	}
};
ixmaps.jsapi.zoomTo_step = function(lat,lon){
	_map_setCenter(__map,new GLatLng(lat,lon));
	var nZoom = _map_getZoom(__map);
	_map_setCenterAndZoom(__map,new GLatLng(lat,lon),++nZoom);
};
ixmaps.jsapi.zoomToLayer = function(szName){
	this.onFocus = true;
	__mapUp.fSynchronized = false;
	if ( szName && szName.length ){
		__mapUp.setExtent("tolayer",szName);
	}else{
		__mapUp.setExtent("maximal");
	}
};
ixmaps.jsapi.changeZoom = function(nDelta){
	__mapUp.fSynchronized = false;
	__mapUp.changeZoom(nDelta);
};
ixmaps.jsapi.changeZoomToScale = function(nScale){
	__mapUp.fSynchronized = false;
	__mapUp.changeZoomToScale(nScale);
};
ixmaps.jsapi.fixMarkerClipping = function(){
	__mapUp.fFixMarkerClipping = true;
};

ixmaps.jsapi.checkResize = function(){
	__mapUp.checkResize();
};
ixmaps.jsapi.openlink = function(url){

	if ( !url.match(/http:\\/) ){
		url = "http:\\\\" + url;
	}
	window.open(url,url);
};

ixmaps.jsapi.getResourceUrl = function(url){
	if ( url ){
		return url.match(/http:/)?url:__resourceRoot+url;
	}
	return url;
};
ixmaps.jsapi.playLayer = function(szName){
	__mapUp.playTimelineOfLayer("start",szName);
};

ixmaps.jsapi.setMapType = function(szType){
	__mapUp.setMapType(szType);
};

ixmaps.jsapi.getMapHandle = function(){
	return __mapUp.map;
};


/* ...................................................................* 
 *  onload / unload                                                   * 
 * ...................................................................*/ 

window.onunload = _mapapi_unload_all; 


/**
 * end of namespace
 */

})();

// -----------------------------
// EOF
// -----------------------------
