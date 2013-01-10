/**********************************************************************
easynido_map_ext.js

$Comment: provides JavaScript extensions for ixmaps Google Maps Mashup
$Source :easynido_map_ext.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/07/19 $
$Author: guenter richter $
$Id:easynido_map_ext.js 1 2012-07-19 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:easynido_map_ext.js,v $
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

	/* ...................................................................* 
	 *  local helpers                                                     * 
	 * ...................................................................*/ 

	/*
	 * translation dictionary for fusion table column names of Easy Nido tables - iscritti
	 */
	var dataFieldDictionary = new Array();
	dataFieldDictionary["Data nascita"] = "Nascita";
	dataFieldDictionary["Richiedente/Intestatario"] = "Intestatario";
	dataFieldDictionary["TELEFONO_RICH"] = "Tel";
	dataFieldDictionary["CELLULARE_RICH"] = "Cell";
	dataFieldDictionary["E_MAIL_RICH"] = "Mail";

	/*
	 * translate the data field name from fusion table colums names to internal names
	 * @param szId fusion table colums name 
	 * @return translated name
	 */
	function __getDataId(szId){
		return dataFieldDictionary[szId]?dataFieldDictionary[szId]:szId;
	}
	/*
	 * extract id value pairs from the fusion table kml item description
	 * translate them into internal ids if neccessary and create an JSON data object
	 * @param szDescription the fusion table kml item description (HTML coded)
	 * @return JSON data object 
	 */
	function __getDataObjFromFusionTableItemDescription(szDescription){

		// 1. try: is description == custom format == JSON string ? 
		// -----------------------------------------------------------
		var szJson = "{"+szDescription.split('<p>')[1].split('<p>')[0]+"}";
		var dataObj = JSON.parse(szJson);
		if ( dataObj ){
			return dataObj;
		}
		// 2. try: is description in fusion table default format ? 
		// -------------------------------------------------------
		szDescription = szDescription.replace( /[\n]/g, "" ).split('</div>')[0];
		var infoA = szDescription.split("<br>");

		var idA = new Array();
		var valueA = new Array();
		for ( i=0; i<infoA.length; i++ ){
			var id		= __getDataId(infoA[i].split('<b>')[1].split(':')[0]);
			var value	= infoA[i].split('</b> ')[1];
			idA.push(id);
			valueA.push(value);
		}

		var dataObj = new Object;
		for ( i=0; i<idA.length; i++ ){
			try{
				eval('dataObj.'+idA[i]+' = "' + valueA[i] + '"');
			}catch (e){}
		}
		return dataObj;
	}

	/* ...................................................................* 
	 *  map styling extensions                                            * 
	 * ...................................................................*/ 

	/*
	 * called before an info window is opened, gives the possibility to change the info title
	 * @param szTitle the actual (default) info window title
	 * @param info the JSON object that describes the window item (ixmaps layer JSON format)
	 * @type string
	 * @return new title
	 */

	ixmaps.jsapi.onInfoWindowTitle = function(szTitle,info) {

		// ===========================================
		// case A) we have data (nidi,...)
		// ===========================================
		if ( info.properties && info.properties.data ){
			return szTitle;
		}else{
		// ===========================================
		// case B) try to parse data from szInfo
		// ===========================================
			if ( info.properties && info.properties.description ){
				var dataObj = __getDataObjFromFusionTableItemDescription(info.properties.description);
				if ( dataObj ){
					if ( info.parent.properties.name.match(/Genitori/i) ) {
						return dataObj.Iscritto; //"";
					}
				}
			}
		}
		return szTitle;
	};


	/*
	 * called before an tooltip for the marker is defined
	 * @param szTooltip the actual (default) tooltip
	 * @param info the JSON object that describes the window item (ixmaps layer JSON format)
	 * @type string
	 * @return new tooltip
	 */

	ixmaps.jsapi.onMarkerTooltip = function(szTooltip,info) {

		// ===========================================
		// case A) we have data (nidi,...)
		// ===========================================
		if ( info.properties && info.properties.data ){
			return szTooltip;
		}else{
		// ===========================================
		// case B) try to parse data from szInfo
		// ===========================================
			if ( info.properties && info.properties.description ){
				var dataObj = __getDataObjFromFusionTableItemDescription(info.properties.description);
				if ( dataObj ){
					if ( info.parent.properties.name.match(/Genitori/i) ) {
						return dataObj.Intestatario;
					}
				}
			}
		}
		return szTooltip;
	};

	/*
	 * called before an info window is opened, gives the possibility to add/change the content
	 * @param szInfo the actual (default) info window content
	 * @param info the JSON object that describes the window item (ixmaps layer JSON format)
	 * @type string
	 * @return new description
	 */
	ixmaps.jsapi.onOpenInfoWindow = function(szInfo,info,szContext) {

		var szNidiA = new Array();
		szNidiA["primavera"] = null;
		szNidiA["mongolfiera"] = null;
		szNidiA["meraviglie"] = null;
		szNidiA["principe"] = null;

		var szNido = null;
		var szExcludeNido = "";

		// ===========================================
		// case A) we have data  
		// ===========================================
		if ( info.properties && info.properties.data ){

			// special case: layer Nidi 
			// ----------------------------
			// create buttons to load nido data or layer 
			// ----------------------------------------------------------
			for ( i in szNidiA ){
				if ( eval("info.properties.name.match(\/"+i+"\/i)") ){
					szNido = i;
				}else{
					szExcludeNido += (szExcludeNido.length?"|":"") + i;
				}
			}
			if ( szNido ){
				// GR 12.10.2012 switched off, to see later
				if ( 0 && !this.isLayer("Genitori") ){
					var szLoadData = "";
					var szFilter = "";

					var szTableId = __easynido_getFusionTableId(szNido,true);
					var nGeoCol = 5;
					szLoadData = "javascript:ixmaps.feed.addFusionTableLayer('"+szTableId+"',"+nGeoCol+",\'zoomto\',\'Genitori\');";
					//szLoadData = "javascript:ixmaps.jsapi.addMyMapFeed(\'https://www.google.com/fusiontables/exporttable?query=select+col5+from+"+szTableId+"+&o=kmllink&g=col5\',\'Google_Maps_My_Map_KML_YQL\',\'json\',\'zoomto\',\'Genitori\');" ;

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
					szInfo += '<div style="float:left;margin-right:5px;text-align:center">'+
							  '<a style="text-align:center" href="'+szLoadData+szFilter+'"><div style="background:#dd5566;border:#ddd solid 1;width:50px;height:50px;">'+
							  '<img src="./resources/ui/112-group.png" style="margin-top:5px;margin-bottom:-5px;"/>'+
							  '<br><span style="text-align:center:text-decoration:none;">genitori</span></div></a></div>';
					/**
					szInfo += '<div style="float:left;margin-right:5px;">'+
							  '<a style="text-align:center" href="#"><div style="background:#55dd66;border:#ddd solid 1;width:50px;height:50px;">'+
							  '<img src="./resources/ui/glyphish_icons/179-notepad.png" height="22px;" style="margin-top:5px;margin-bottom:-5px;"/>'+
							  '<br><span style="text-align:center">lista</span></div></a></div>';
					szInfo += '<div style="float:left;margin-right:5px;">'+
							  '<a style="text-align:center" href="#"><div style="background:#5566dd;border:#ddd solid 1;width:50px;height:50px;">'+
							  '<img src="./resources/ui/glyphish_icons/48-fork-and-knife.png" height="22px;" style="margin-top:5px;margin-bottom:-5px;"/>'+
							  '<br><span style="text-align:center">menu</span></div></a></div>';
					 **/
				}else{
					szInfo = "";
				}
			}

			// default 
			// --------------------------------------------
			// add buttons for tel, mail and directions 
			// --------------------------------------------
			szInfo += "<div class='InfoWindowBody' >";
			if ( info.properties && info.properties.data ){
			
				// szInfo = "";
				szInfo += (info.properties.data.INDIRIZZO?info.properties.data.INDIRIZZO:"") +"<div style='margin:0px;padding:0px;height:0px;'></div>"; 
				szInfo += "<br>";
				szInfo += (info.properties.data.TELEFONO?("<a href='tel:"+info.properties.data.TELEFONO+"' class='tel-link-map' data-role='button' data-inline='true'data-theme='c' >"+info.properties.data.TELEFONO+"</a>"):""); 
			}
			if ( info.geometry && info.geometry.coordinates && szContext == "map" ){

				var szStreet  = "<div style='float:right;margin-top:0px;margin-left:5px;'>";
					szStreet += ixmaps.jsapi.getStreetLink(info.geometry.coordinates[1]+","+info.geometry.coordinates[0]);
					szStreet += "</div>";
				szInfo += szStreet;

				var szRoute  = "<div style='float:right;margin-top:0px;margin-left:5px;'>";
					szRoute += ixmaps.jsapi.getNavLink(info.geometry.coordinates[1]+","+info.geometry.coordinates[0]);
					szRoute += "</div>";
				szInfo += szRoute;

				szInfo += "<p style='margin:0px;padding:0px;height:10px;'></p>";
			}
			szInfo += "</div>";

		}else{
			// ===========================================
			// case B) we have no data, so keep szInfo
			// ===========================================

			if ( info.parent && info.parent.properties && info.parent.properties.name && info.parent.properties.name.match(/Genitori/i) ) {

				// special case: layer Genitori 
				// ----------------------------
				// szInfo is configured as serialized JSON (in fusion tables) 
				// so we can parse it and take the data from there
				// ----------------------------------------------------------
				try	{
					var dataObj = __getDataObjFromFusionTableItemDescription(szInfo);
					if ( dataObj ){

						var szPre  = '<div class="InfoWindowBody">';
						var szSuff = '</div>';

						szTel  = "<a href='tel:"+dataObj.Tel+"' class='tel-link-map' data-role='button' data-inline='true' data-theme='c' >"+dataObj.Tel+"</a>";
						szCell = "<a href='tel:"+dataObj.Cell+"' class='tel-link-map' data-role='button' data-inline='true' data-theme='c' >"+dataObj.Cell+"</a>";
						szMail = "<a href='mail:"+dataObj.Mail+"' class='mail-link-map' data-role='button' data-inline='true' data-theme='c' >"+dataObj.Mail+"</a>";

						var szTable  = '<table>';
							//szTable += '<tr><td><span style="font-size:0.9em;color:#aaa;">Intestatario:<span></td></tr>';
							szTable += '<tr><td><strong>'+dataObj.Intestatario+'</strong></td><td width="40px;">&nbsp;</td></tr>';
							szTable += '<tr><td>'+dataObj.Indirizzo+'</td></tr>';
							szTable += '<tr height="1px;"><td></td></tr>';
							if ( dataObj.Tel && dataObj.Tel.length ){
								szTable += '<tr height="12px;"><td></td></tr>';
								szTable += '<tr><td>'+szTel+'</td></tr>';
								szTable += '<tr height="4px;"><td></td></tr>';
							}
							if ( dataObj.Cell && dataObj.Cell.length ){
								szTable += '<tr height="12px;"><td></td></tr>';
								szTable += '<tr><td>'+szCell+'</td></tr>';
								szTable += '<tr height="4px;"><td></td></tr>';
							}
							if ( dataObj.Mail && dataObj.Mail.length ){
								szTable += '<tr height="12px;"><td></td></tr>';
								szTable += '<tr><td>'+szMail+'</td></tr>';
								szTable += '<tr height="4px;"><td></td></tr>';
							}
							szTable  += '</table>';

						if ( szContext == "map" ){
							var szAddress = dataObj.Indirizzo;
							var szRoute  = "<div style='float:right;margin-right:0px;margin-top:-24px;'>";
								szRoute += ixmaps.jsapi.getNavLink(szAddress+",san benedetto del tronto");
								szRoute += "</div>";
						}else{
							var szRoute = "";
						}

						
						
						return szPre + szTable + szRoute + szSuff;
					}
				}catch (e){}
			}
			
			// --------------------------------------------
			// add only streetview and directions buttons
			// --------------------------------------------
			else
			if ( info.geometry && info.geometry.coordinates ){

				szInfo += "<div class='InfoWindowBody' style='margin-bottom:30px;'>";
				var szStreet  = "<div style='float:right;margin-top:0px;margin-left:5px;margin-bottom:7px;'>";
					szStreet += ixmaps.jsapi.getStreetLink(info.geometry.coordinates[1]+","+info.geometry.coordinates[0]);
					szStreet += "</div>";
				szInfo += szStreet;

				var szRoute  = "<div style='float:right;margin-top:0px;margin-left:5px;margin-bottom:7px;'>";
					szRoute += ixmaps.jsapi.getNavLink(info.geometry.coordinates[1]+","+info.geometry.coordinates[0]);
					szRoute += "</div>";
				szInfo += szRoute;

				szInfo += "<p></p>";

				szInfo += "</div>";
			}

			return szInfo;
		}
		return szInfo;
	};

	// helper

	// create link to call navigator from destination string
	// ----------------------------------------------------------------
	ixmaps.jsapi.getNavLink = function(szDestination){
		return ("<a href='http://maps.google.com/maps?daddr="+szDestination+"' class='dir-link-map' data-role='button' data-inline='true' data-theme='c' ></a>");
	};
	// create link to call streetview from destination string
	// ----------------------------------------------------------------
	ixmaps.jsapi.getStreetLink = function(szDestination){
		return ("<a href='javascript:ixmaps.jsapi.showStreeView("+szDestination+");' class='streetview-link-map' data-role='button' data-inline='true' data-theme='c' ></a>");
	};
	// use yahoo YQL webservice as proxy to get around origin problems
	// ----------------------------------------------------------------
	ixmaps.jsapi.addMyMapFeed = function(szLayer,szName,szType,szFlag,szTitle){
		var szUrl  = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D";
			szUrl += "'"+encodeURIComponent(szLayer)+"'";
			szUrl += szName.match(/GeoRSS/)?"&format=rss&diagnostics=true":"&format=json&diagnostics=true";
		ixmaps.feed.addFeed(szUrl,{"name":szName,"type":szType,"flag":szFlag,'title':szTitle});
	};
	// switch map to street view 
	// ----------------------------------------------------------------
	ixmaps.jsapi.showStreeView = function(lat,lng){
		var map = ixmaps.jsapi.getMapHandle();
		var panorama = map.getStreetView();

		panorama.setPosition(new google.maps.LatLng(lat,lng));
		panorama.setPov({
			heading: 265,
			zoom:1,
			pitch:0}
			);
		panorama.setVisible(true);

		if (event.stopPropagation){
			event.stopPropagation();
		}
		else if(window.event){
			window.event.cancelBubble=true;
		}
	};

	/*
	 * called when an icon is requested by the map
	 * @param icon the actual (default) icon
	 * @param info the JSON object that describes the window item (ixmaps layer JSON format)
	 */
	ixmaps.jsapi.onGetIcon = function(icon,info,i) {
		if ( !info.properties.description || !info.properties.description.match(/intestatario/i) ){
			return null;
		}
		try{
			var dataObj = __getDataObjFromFusionTableItemDescription(info.properties.description);
			if ( dataObj ){
				if ( dataObj.Adesione == "si" ){
					if ( info.parent.properties.name.match(/Meraviglie/i) ){
						icon.image = "resources/icons/user1/dummy_user_orange.png";
					}else
					if ( info.parent.properties.name.match(/Primavera/i) ){
						icon.image = "resources/icons/user1/dummy_user_green.png";
					}else
					if ( info.parent.properties.name.match(/Principe/i) ){
						icon.image = "resources/icons/user1/dummy_user_yellow.png";
					}else{
						icon.image = "resources/icons/user1/dummy_user_blue.png";
					}
					return icon;
				}
			}
		}catch (e){}

		icon.image="resources/icons/user1/dummy_user_suppress.png";
		info.fSuppressInfo = true;
		return icon;
	};


	/* ...................................................................* 
	 *  handle views (map,list,both)                                      * 
	 * ...................................................................*/ 

	var fFooterTransparent = false;
	var fFullScreenList = false; 

	/*
	 * make map visible 
	 */
	ixmaps.jsapi.forceMap = function(){
		if ( !fFullScreenList ){
			return;
		}
		if ( ixmaps.jsapi.szAcualView && (ixmaps.jsapi.szAcualView == "list") ){
			this.setView("map");
		}
		if ( ixmaps.jsapi.szAcualView && (ixmaps.jsapi.szAcualView == "both") ){
		}
	};
	/*
	 * set actual view 
	 * @param szMode the new map view mode
	 */
	ixmaps.jsapi.setView = function(szMode){
		switch(szMode){
			case "map":
				setMap();
				$("#view-select-icon").attr("src","resources/ui/list.png");
				break;
			case "list":
				if ( setList() ){
					$("#view-select-icon").attr("src","resources/ui/map-marker.png");
				}else{
					$("#view-select-icon").attr("src","resources/ui/close-left.png");
				}
				break;
			case "next":
				if ( this.szAcualView == 'map' ){
					this.setView('list');
					return;
				}else if ( this.szAcualView == 'both' ){
					this.setView('list');
					return;
				}else if ( this.szAcualView == 'list' ){
					this.setView('map');
					return;
				}
				break;
			default:
				setBoth();
		}
		ixmaps.jsapi.szAcualView = szMode;
	};
	/*
	 * get actual view 
	 * @return the actual view (map|list|both)
	 */
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

	/*
	 * intercept window resize, and autoadapt the map view to the aspect ratio  
	 */
	var __nHeaderHeight = 0;
	ixmaps.jsapi.onWindowResize = function(){

		var ratio = window.innerWidth / window.innerHeight;
		if ( ratio > 1.5 ){
			if ( ixmaps.jsapi.szAcualView == "both" ){
				ixmaps.jsapi.checkResize();
				return;
			}
			if (0){
				__nHeaderHeight = $("#hdr").height();
				$("#hdr").css("height","0px");
				$("#hdr").css("visibility","hidden");
			}
			ixmaps.jsapi.setView("both");
		}else{
			if (0){
				$("#hdr").css("height",__nHeaderHeight+"px");
				$("#hdr").css("visibility","visible");
			}
			ixmaps.jsapi.setView("map");
		}
	};

	/*
	 * show only the map 
	 */
	setMap = function(){

		var headerHeight = $("#hdr").height();
		var footerHeight = $("#ftr").height();
		var maxHeight = window.innerHeight - headerHeight - footerHeight;
		var maxWidth  = window.innerWidth;

		$("#content").css("height",(maxHeight-1)+"px");
		$("#content").css("width",(maxWidth)+"px");
		$("#content").css("overflow","hidden");

		$("#map").css("top",(0)+"px");
		$("#map").animate({left:(0)+'px'},500);
		$("#map").css("width",(maxWidth)+"px");
		$("#map").css("height",(maxHeight)+"px");

		$("#sidebar").css("position","absolute");
		$("#sidebar").css("top","0px");
		$("#sidebar").css("left","0px");
		$("#sidebar").css("width","0px");
		$("#sidebar").css("height",(maxHeight)+"px");

		$("#layer-dialog-button").css("visibility","visible");

		ixmaps.jsapi.setSidebarClipping(false);
		ixmaps.jsapi.setSidebarAutoScroll(true);
		ixmaps.jsapi.setSidebarTooltips(true);
		ixmaps.jsapi.checkResize();
	};

	/*
	 * show only the list of the map items 
	 */
	setList = function(){

		var headerHeight = $("#hdr").height();
		var footerHeight = $("#ftr").height();
		var maxHeight = window.innerHeight - headerHeight - footerHeight;
		var maxWidth  = window.innerWidth;

		$("#content").css("height",(maxHeight-1)+"px");
		$("#content").css("width",(maxWidth)+"px");
		$("#content").css("overflow","hidden");

		$("#sidebar").css("position","absolute");
		$("#sidebar").css("top","0px");
		$("#sidebar").css("left","0px");
		$("#sidebar").css("width","0px");
		$("#sidebar").css("height",(maxHeight)+"px");

		var sidebarFooterHeight = 0||$("#sidebar-footer").height();
		$("#itemlist").css("height",(maxHeight-sidebarFooterHeight-7)+"px");



		fFullScreenList = (maxWidth <= 500);
		
		if ( fFullScreenList ){
//			$("#sidebar").css("position","relative");
			$("#sidebar").css("width",(maxWidth-1)+"px");
//			$("#sidebar").css("height",(maxHeight-1)+"px");
//			$("#map").css("position","");
//			$("#map").css("height","0px");
			$("#map").animate({left:(maxWidth)+'px'},500);
		}else{
			var sidebarWidth = Math.max(250,Math.floor(maxWidth/4));
			$("#sidebar").css('width',(sidebarWidth)+'px');
			$("#map").animate({left:(sidebarWidth)+'px'},500);
			$("#map").animate({width:(maxWidth-sidebarWidth)+'px'},500);
//			$("#map").css("width",maxWidth-sidebarWidth+'px');
		}

		$("#layer-dialog-button").css("visibility","hidden");

		ixmaps.jsapi.setSidebarClipping(true);
		ixmaps.jsapi.setSidebarAutoScroll(true);
		ixmaps.jsapi.setSidebarTooltips(true);
		ixmaps.jsapi.setSidebarTooltips(true,true);
		ixmaps.jsapi.checkResize();

		if ( 0 && !fFullScreenList ){
			if ( !document.getElementById("sidebar-delete-button") ){
				var deleteButton = document.createElement("div");
				deleteButton.setAttribute("id","sidebar-delete-button");
				var szHTML = "<a href=\"javascript:ixmaps.jsapi.setView('map');\"><img src='resources/ui/delete.png' height='22' style=\"position:absolute;top:10px;right:10px;\" /></a>";
				deleteButton.innerHTML = szHTML;
				$("#sidebar")[0].appendChild(deleteButton);
			}
		}
		return fFullScreenList;
	};

	/*
	 * show map and list (sidebar)
	 */
	setBoth = function(){

		var headerHeight = $("#hdr").height();
		var footerHeight = $("#ftr").height();
		var maxHeight = window.innerHeight - headerHeight - footerHeight;
		var maxWidth  = window.innerWidth;

		$("#content").css("height",(maxHeight-1)+"px");
		$("#content").css("width",(maxWidth)+"px");
		$("#content").css("overflow","hidden");

		if ( 1 ){
			var sidebarWidth = Math.max(250,maxWidth*0.3);
			$("#sidebar").css("position","absolute");
			$("#sidebar").css("top",(-2)+"px");
			//$("#sidebar").css("left",(maxWidth-sidebarWidth)+"px");
			$("#sidebar").css("width",sidebarWidth+"px");
			$("#sidebar").css("height",maxHeight+"px");
			$("#sidebar").animate({left:(maxWidth-sidebarWidth+5)+'px'},500);

			$("#map").css("top",(0)+"px");
			$("#map").css("left","0px");
			$("#map").animate({width:(maxWidth-sidebarWidth)+'px'},500);
			//$("#map").css("width",(maxWidth-sidebarWidth)+"px");
			$("#map").css("height",(maxHeight)+"px");


		}else{
			$("#map").css("width","100%");
			$("#map").css("height",maxHeight*0.66+"px");
			$("#sidebar").css("position","relative");
			$("#sidebar").css("top","0px");
			$("#sidebar").css("left","0px");
			$("#sidebar").css("width","100%");
			$("#sidebar").css("height","100%");
		}

		$("#layer-dialog-button").css("visibility","hidden");

		ixmaps.jsapi.setSidebarClipping(false);
		ixmaps.jsapi.setSidebarAutoScroll(true);
		ixmaps.jsapi.setSidebarTooltips(true,true);
		ixmaps.jsapi.redraw();

		ixmaps.jsapi.checkResize();
	};

})();

/**
 * end of namespace
 */

/* ...................................................................* 
 *  scroll div workaround for adroid browser < 4.0                    * 
 * ...................................................................*/ 

window.ixmaps = window.ixmaps || {};
(function() {

	/*
	 * local helper function
	 */
	TS_isTouchDevice = function(){
		try{
			document.createEvent("TouchEvent");
			return true;
		}catch(e){
			return false;
		}
	};

	/*
	 * continue scrolling a while
	 */
	TS_touchScrollTail = function(){
		if ( TS_lastTouchElement && TS_lastTouchOff ){
			TS_lastTouchElement.scrollTop -= TS_lastTouchOff;
			var dOff = Math.abs(Math.round(TS_lastTouchOff/3));
			if ( dOff ){
				TS_lastTouchOff -= TS_lastTouchOff<0?-dOff:dOff;
				setTimeout("TS_touchScrollTail()",20);
			}else{ 
				var mouseupEvent = document.createEvent ("MouseEvent");
				mouseupEvent.initMouseEvent ("mouseup", true, true, window, 0, 
											event.screenX, event.screenY, event.clientX, event.clientY, 
											event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, 
											0, null);
                TS_lastTouchElement.dispatchEvent (mouseupEvent);
			}
		}
	};

	var TS_lastTouchY = 0;
	var TS_lastTouchOff = 0;
	var TS_lastTouchElement = 0;

	/*
	 * apply scroll workaround to one HTML element (div) given by its id
	 * @param id the id of the element (div)
	 */
	ixmaps.touchScroll = function(id){
		if(TS_isTouchDevice()){ //if touch events exist...
			var el=document.getElementById(id);
			var scrollStartPos=0;

			document.getElementById(id).addEventListener("touchstart", function(event) {
				scrollStartPos=this.scrollTop+event.touches[0].pageY;
				TS_lastTouchY = event.touches[0].pageY;
				//event.preventDefault();
			},false);

			document.getElementById(id).addEventListener("touchmove", function(event) {
				this.scrollTop=scrollStartPos-event.touches[0].pageY;
				TS_lastTouchOff = event.touches[0].pageY-TS_lastTouchY;
				TS_lastTouchY = event.touches[0].pageY;
				event.preventDefault();
			},false);

			document.getElementById(id).addEventListener("touchend", function(event) {
				setTimeout("TS_touchScrollTail()",20);
				TS_lastTouchElement = this;
				//event.preventDefault();
			},false);
		}
	};

})();

/**
 * end of namespace
 */

// -----------------------------
// EOF
// -----------------------------
