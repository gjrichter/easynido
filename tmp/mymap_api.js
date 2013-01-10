/**********************************************************************
mymap_api.js

$Comment: provides private JavaScript extensions for Google Mashup from geojson layer generated by ixmaps
$Source :mymap_api.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/07/19 $
$Author: guenter richter $
$Id:mymap_app.js 1 2012-07-19 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:mymap_api.js,v $
**********************************************************************/

/** 
 * @fileoverview This file defines user extensions to the Google Maps Mashup from geojson layer data created by ixmaps
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

/**
 * define namespace ixmaps
 */

window.ixmaps = window.ixmaps || {};
ixmaps.jsapi = ixmaps.jsapi || {};
(function() {


	/**
	 * Is called before an info window is opened, gives the possobility to add/change the content 
	 */
	ixmaps.jsapi.onOpenInfoWindow = function(szInfo,info) {

		var szNidiA = new Array();
		szNidiA["primavera"] = null;
		szNidiA["mongolfiera"] = null;
		szNidiA["meraviglie"] = null;
		szNidiA["principe"] = null;

		var szNido = null;
		var szExcludeNido = "";

		for ( i in szNidiA ){
			if ( eval("info.properties.name.match(\/"+i+"\/i)") ){
				szNido = i;
			}else{
				szExcludeNido += (szExcludeNido.length?"|":"") + i;
			}
		}

		if ( !szNido && ixmaps.jsapi.isLayer("Genitori")) {

			try	{
				var szJson = "{"+szInfo.split('<p>')[1].split('<p>')[0]+"}";
				var dataObj = JSON.parse(szJson);
				if ( dataObj ){

					var szPre  = '<div class="InfoWindowBody"><p>';
					var szSuff = '</p></div>';

					szTel  = "<a href='tel:"+dataObj.Tel+"' class='tel-link-map' data-role='button' data-inline='true'data-theme='c' >"+dataObj.Tel+"</a>";
					szCell = "<a href='tel:"+dataObj.Cell+"' class='tel-link-map' data-role='button' data-inline='true'data-theme='c' >"+dataObj.Cell+"</a>";
					szMail = "<a href='tel:"+dataObj.Mail+"' class='mail-link-map' data-role='button' data-inline='true'data-theme='c' >"+dataObj.Mail+"</a>";

					var szTable  = '<table>';
						szTable += '<tr><td>Intestatario:</td></tr>';
						szTable += '<tr><td><strong>'+dataObj.Intestatario+'</strong></td></tr>';
						szTable += '<tr><td>'+dataObj.Indirizzo+'</td></tr>';
						if ( dataObj.Tel && dataObj.Tel.length ){
							szTable += '<tr height="5px;"><td></td></tr>';
							szTable += '<tr><td>'+szTel+'</td></tr>';
						}
						if ( dataObj.Cell && dataObj.Cell.length ){
							szTable += '<tr height="5px;"><td></td></tr>';
							szTable += '<tr><td>'+szCell+'</td></tr>';
						}
						if ( dataObj.Mail && dataObj.Mail.length ){
							szTable += '<tr height="5px;"><td></td></tr>';
							szTable += '<tr><td>'+szMail+'</td></tr>';
						}
						szTable  += '</table>';

					return szPre + szTable + szSuff;
				}
			}catch (e){}

			if ( szInfo.match(/tel-link/) ){
				szInfo += "<a href='tel:1234567890' class='tel-link' data-role='button' data-inline='true'data-theme='c' >"+1234567890+"</a>";
			}
			return szInfo;

		}else
		if ( !__fAccessToData ) {
			return "";
		}

		// ok, ist a nido, so make the button 
		// ---------------------------------------

		var szLoadData = "";
		var szFilter = "";

		var szTableId = __easynido_getFusionTableId(szNido,true);
		szLoadData = "javascript:ixmaps.jsapi.addMyMapFeed(\'https://www.google.com/fusiontables/exporttable?query=select+col5+from+"+szTableId+"+&o=kmllink&g=col5\',\'Google_Maps_My_Map_KML_YQL\',\'json\',\'zoomto\',\'Genitori\');" ;

		if ( szNido == "meraviglie" ){
			szFilter = "ixmaps.jsapi.setExcludeFilter(\'"+szExcludeNido+"\');";
		}else
		if ( szNido == "mongolfiera" ){
			szFilter = "ixmaps.jsapi.setExcludeFilter(\'"+szExcludeNido+"\');";
		}else
		if ( szNido == "principe" ){
			szFilter = "ixmaps.jsapi.setExcludeFilter(\'"+szExcludeNido+"\');";
		}else
		if ( szNido == "primavera" ){
			szFilter = "ixmaps.jsapi.setExcludeFilter(\'"+szExcludeNido+"\');";
		}else{
			szLoadData = "javascript:alert(\'da fare !\');";
		}

		szInfo = "";

		if ( !ixmaps.jsapi.isLayer("Genitori") ){
			szInfo += '<div style="float:left;margin-right:5px;text-align:center">'+
					  '<a style="text-align:center" href="'+szLoadData+szFilter+'"><div style="background:#dd5566;border:#ddd solid 1;width:50px;height:50px;">'+
					  '<img src="./resources/icons/glyphish_icons/112-group.png" style="margin-top:5px;margin-bottom:-5px;"/>'+
					  '<br><span style="text-align:center">genitori</span></div></a></div>';
		}

		/**
		szInfo += '<div style="float:left;margin-right:5px;">'+
				  '<a style="text-align:center" href="#"><div style="background:#55dd66;border:#ddd solid 1;width:50px;height:50px;">'+
				  '<img src="./resources/icons/glyphish_icons/179-notepad.png" height="22px;" style="margin-top:5px;margin-bottom:-5px;"/>'+
				  '<br><span style="text-align:center">lista</span></div></a></div>';
		szInfo += '<div style="float:left;margin-right:5px;">'+
				  '<a style="text-align:center" href="#"><div style="background:#5566dd;border:#ddd solid 1;width:50px;height:50px;">'+
				  '<img src="./resources/icons/glyphish_icons/48-fork-and-knife.png" height="22px;" style="margin-top:5px;margin-bottom:-5px;"/>'+
				  '<br><span style="text-align:center">menu</span></div></a></div>';
		 **/
		return szInfo;
	};


	// use yahoo YQL webservice as proxy to get around origin problems
	// ----------------------------------------------------------------
	ixmaps.jsapi.addMyMapFeed = function(szLayer,szName,szType,szFlag,szTitle){
		var szUrl  = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D";
			szUrl += "'"+encodeURIComponent(szLayer)+"'";
			szUrl += szName.match(/GeoRSS/)?"&format=rss&diagnostics=true":"&format=json&diagnostics=true";
		ixmaps.feed.addFeed(szUrl,{"name":szName,"type":szType,"flag":szFlag,'title':szTitle});
	};


	/**
	 * Is called when an icon is requested by the map  
	 */
	ixmaps.jsapi.onGetIcon = function(icon,info,i) {

		if ( !info.properties.description || !info.properties.description.match(/intestatario/i) ){
			return null;
		}
		try{
			var szJson = "{"+info.properties.description.split('<p>')[1].split('<p>')[0]+"}";
			var dataObj = JSON.parse(szJson);
			if ( dataObj ){
				if ( dataObj.Adesione == "si" ){
					icon.image = "resources/icons/user1/dummy_user_blue.png";
					return icon;
				}
			}
		}catch (e){}

		icon.image="resources/icons/user1/dummy_user_grey.png";
		info.fSuppressInfo = true;
		return icon;
	};


	/***
	***	diverse views (map,list,both)
	***/

	ixmaps.jsapi.forceMap = function(){
		if ( ixmaps.jsapi.szAcualView && (ixmaps.jsapi.szAcualView == "list") ){
			this.setView("map");
		}
		if ( ixmaps.jsapi.szAcualView && (ixmaps.jsapi.szAcualView == "both") ){
		}
	};
	ixmaps.jsapi.setView = function(szMode){
		switch(szMode){
			case "map":
				setMap();
				break;
			case "list":
				setList();
				break;
			default:
				setBoth();
		}
		ixmaps.jsapi.szAcualView = szMode;
	};
	ixmaps.jsapi.getView = function(){
		if ( $("#sidebar").css("visibility") == "hidden" ){
			return "map";
		} else
		if ( $("#map-content").css("visibility") == "hidden" ){
			return "list";
		} else {
			return "both";
		}
	};

	setMap = function(){

		var maxHeight = window.innerHeight - $("#hdr").height() - $("#ftr").height();

		$("#content").css("height",(maxHeight-5)+"px");
		$("#map").css("height",(maxHeight)+"px");
		// $("#map-content").css("visibility","visible");
		$("#sidebar").css("height","0px");
		// $("#sidebar").css("visibility","hidden");
		ixmaps.jsapi.setSidebarClipping(false);
		ixmaps.jsapi.setSidebarAutoScroll(true);
		ixmaps.jsapi.setSidebarTooltips(false);
		ixmaps.jsapi.checkResize();
	};
	setList = function(){
		var maxHeight = window.innerHeight - $("#hdr").height() - $("#ftr").height();

		$("#content").css("height","100%");
//		$("#map-content").css("visibility","hidden");
		$("#map").css("height","0px");
		// $("#sidebar").css("visibility","visible");
		$("#sidebar").css("height","100%");
		// ixmaps.jsapi.checkResize();
		ixmaps.jsapi.setSidebarClipping(false);
		ixmaps.jsapi.setSidebarAutoScroll(false);
		ixmaps.jsapi.setSidebarTooltips(false);
		ixmaps.jsapi.checkResize();
	};
	setBoth = function(){

		var maxHeight = window.innerHeight - $("#hdr").height() - $("#ftr").height();
		var maxWidth  = window.innerWidth;

		// $("#content").css("height","100%");

		if ( maxWidth > 500 ){
			var sidebarWidth = Math.max(250,maxWidth*0.3);
			$("#map").css("width",(maxWidth-sidebarWidth)+"px");
			$("#map").css("height",maxHeight+"px");
			$("#sidebar").css("position","absolute");
			$("#sidebar").css("top",$("#hdr").height()+"px");
			$("#sidebar").css("left",(maxWidth-sidebarWidth)+"px");
			$("#sidebar").css("width",sidebarWidth+"px");
			$("#sidebar").css("height",maxHeight+"px");

		}else{
			$("#map").css("width","100%");
			$("#map").css("height",maxHeight*0.66+"px");
			$("#sidebar").css("position","relative");
			$("#sidebar").css("top","0px");
			$("#sidebar").css("left","0px");
			$("#sidebar").css("width","100%");
			$("#sidebar").css("height","100%");
		}
		ixmaps.jsapi.setSidebarClipping(false);
		ixmaps.jsapi.setSidebarAutoScroll(false);
		ixmaps.jsapi.setSidebarTooltips(true,true);
		ixmaps.jsapi.redraw();

		ixmaps.jsapi.checkResize();
	};




/**
 * end of namespace
 */

})();

// -----------------------------
// EOF
// -----------------------------
