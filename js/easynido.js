/**********************************************************************
easynido.js

$Comment: provides JavaScript for EasyNido mobile pages
$Source : easynido.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2012/07/30 $
$Author: guenter richter $
$Id:easynido.js 1 2012-07-30 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:easynido.js,v $
**********************************************************************/

/** 
 * @fileoverview This file provides JavaScript for EasyNido mobile pages
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

window.ixmaps = window.ixmaps || {};

// --------------
// constants 
// --------------

var __fDemo = false;
var __fDebug = false;
var __EasyNidoFBGroupId = "450635708304119";
var __nPostShowLimit = 25;

/** 
 * Important !
 * to parametrize Facebook login please see at __easynido_engageWithFacebook()
 */


// --------------
// fusion tables 
// --------------

/** 
 * le tabelle con i iscritti ai nidi di SBT si trivano su Google Drive 
 * account:		easynido@gmail.com
 * cartella:	iscritti 2012-13 ->	geolocated
 * file:		iscritti_meraviglie_2012.xls
 *				iscritti_mongilfiera_2012.xls
 *				iscritti_primavera_2012.xls
 *				iscritti_principe_2012.xls
 *
 * a questi corrispondono i seguenti id, usati nel programma
 */
var __FusionTableIdA = {"meraviglie"	: "5231226",
						"mongolfiera"	: "5231435",
						"principe"		: "5231136",
						"primavera"		: "5232223"
						};
var __FusionTableDefaultId = "5174915";

/** 
 * helper to get the FusionTable id  
 */
function __easynido_getFusionTableId(szNido, fAccess) {
	if (__fDemo) {
		return __FusionTableDefaultId;
	}
	return __FusionTableIdA[szNido];
}

/** 
 * helper to test valid string  
 */
function __ASSERT(szString){
	return (typeof(szString) != 'undefined') && (szString != 'undefined') && (szString.length);
}


// ---------------------------------------------------------------
//
// local storage (HTML5) 
//
// ---------------------------------------------------------------

// init HTML5 localStorage 
// ------------------------
// test if localStorage is upported by browser
// redefine the setItem and getItem procedures for Javascript objects
//
if (typeof (localStorage) === 'undefined') {

	alert('Your browser does not support HTML5 localStorage. Try upgrading.');

} else {

	// redefine storage setter and getter to handle Javascript Objects
	// ---------------------------------------------------------------
	//
	Storage.prototype._setItem = Storage.prototype.setItem;
	Storage.prototype.setItem = function (key, value) {
		this._setItem(key, JSON.stringify(value));
	};

	Storage.prototype._getItem = Storage.prototype.getItem;
	Storage.prototype.getItem = function (key) {
		try {
			return JSON.parse(this._getItem(key));
		} catch (e) {
			return this._getItem(key);
		}
	};
}

// ixmaps wrapper for store and retrieve
// ---------------------------------------------------
// in localStorage of HTML5 (if present and allowed)
//
var fAllowLOcalStorage = true;

ixmaps.getStoredObject = function (szKey) {
	var item = null;
	if ((typeof (localStorage) !== 'undefined') && fAllowLOcalStorage) {
		try {
			item = localStorage.getItem(szKey);
		} catch (e) {}
	}
	return item;
};

ixmaps.storeObject = function (szKey, object) {
	if ((typeof (localStorage) !== 'undefined') && fAllowLOcalStorage) {
		try {
			localStorage.setItem(szKey, object);
			return;
		} catch (e) {}
	}
};


// -------------------------------------------------------------
// global vars to keep selections and settings during a session 
//
// must be set every time, when, a page is loaded from external
// (not by jquery mobile). For this purpose they are passed 
// as URL parameter if possible (for OAUTH) or cached in local
// storage (see above) if history back points to an absolute URL 
// -------------------------------------------------------------

var __data = null;
var __szNido = null;
var __dialog = null;
var __user = null;
var __accessToken = null;
var __szInfoFilter = null;
var __FBMemberA = null;

/**
 * goNido - set actual nido and go to nido.html (using $.mobile.changePage(...))
 * @param szNido name of the nido
 * @type void
 */
var goNido = function(szNido){
	__szNido = szNido;
	$.mobile.changePage( "./nido.html", { transition: "slideup"} );
};


// --------------------------------------------
//
// local functions for dialogs and data loading 
//
// --------------------------------------------

/**
 * open/close the layer select dialog (menu like)  
 * @param flag 'show' or 'hide'
 * @type void
 */
function __easynido_selectLayerDialog(flag){

	if ( $("#layer-dialog").css("display") === "block" ){
		flag = 'hide';
	}
	if ( flag && flag === 'hide' ){
		$("#layer-dialog").hide('slide', {direction: 'right'}, 150);
	}else{
		$('#layer-dialog').load('./layer.html'+' #layerlist', function(response, status, xhr) {
			  if (status === "error") {
				var msg = "Sorry but there was an error: ";
				alert(msg + xhr.status + "\n" + xhr.statusText);
			  }
			$("#layer-dialog").css("visibility","visible");
			$("#layer-dialog").css("height","100%");
			$("#layer-dialog").hide();
			$("#layer-dialog").show('slide', {direction: 'right'}, 150);
		});
	}
}

/**
 * open/close the feed select dialog 
 * @param flag 'show' or 'hide'
 * @type void
 */
function __easynido_selectFeedDialog(flag){

	if ( $("#feed-dialog").css("display") === "block" ){
		flag = 'hide';
	}
	if ( flag && flag === 'hide' ){
		$("#feed-dialog").hide('slide', {direction: 'right'}, 150);
	}else{
		$("#feed-dialog").css("visibility","visible");
		$("#feed-dialog").css("height","100%");
		$("#feed-list").css("height","98%");
		$("#feed-dialog").hide();

		$("head").append($("<link rel='stylesheet' href='./feedlist.css"+ "' type='text/css' media='screen' />"));

		$('#feed-list').load('./feeds.html'+' #feedlist', function(response, status, xhr) {
			  if (status === "error") {
				var msg = "Sorry but there was an error: ";
				alert(msg + xhr.status + "\n" + xhr.statusText);
			  }
			ixmaps.touchScroll("feed-list");

			var deleteButton = document.createElement("div");
			deleteButton.setAttribute("id","feedsdialog-delete-button");
			var szHTML = "<a href=\"javascript:__easynido_selectFeedDialog('hide');\"><img src='resources/ui/delete.png' height='22' style=\"position:absolute;top:10px;right:10px;\" /></a>";
			deleteButton.innerHTML = szHTML;
			$("#feed-dialog-div")[0].appendChild(deleteButton);

			$("#feed-dialog").show();
		});
	}
}

/**
 * open/close the help screen dialog 
 * @param flag 'show' or 'hide'
 * @type void
 */
function __easynido_selectHelpDialog(flag){

	if ( $("#feed-dialog").css("display") === "block" ){
		flag = 'hide';
	}
	if ( flag && flag === 'hide' ){
		$("#feed-dialog").hide('slide', {direction: 'right'}, 150);
	}else{
		$("#feed-dialog").css("visibility","visible");
		$("#feed-dialog").css("height","100%");
		$("#feed-list").css("height","98%");
		$("#feed-dialog").hide();

		$("head").append($("<link rel='stylesheet' href='./help.css"+ "' type='text/css' media='screen' />"));

		$('#feed-list').load('./help.html'+' #content', function(response, status, xhr) {
			  if (status === "error") {
				var msg = "Sorry but there was an error: ";
				alert(msg + xhr.status + "\n" + xhr.statusText);
			  }
			ixmaps.touchScroll("feed-list");

			var deleteButton = document.createElement("div");
			deleteButton.setAttribute("id","feedsdialog-delete-button");
			var szHTML = "<a href=\"javascript:__easynido_selectFeedDialog('hide');\"><img src='resources/ui/delete.png' height='22' style=\"position:absolute;top:10px;right:10px;\" /></a>";
			deleteButton.innerHTML = szHTML;
			$("#feed-dialog-div")[0].appendChild(deleteButton);
			$("#feed-dialog").show();

		});
	}
}

// use yahoo YQL webservice as proxy to get around origin problems
// ----------------------------------------------------------------
addFeedLayer_YQL = function(szLayer,szName,szType,szFlag,szTitle){
	ixmaps.jsapi.addFeedLayer_YQL(szLayer,szName,szType,szFlag,szTitle);
	__easynido_selectFeedDialog('hide');
};

// add layer defined by feed ( rss, georss, kml, geojson )
// ----------------------------------------------------------------
addFeedLayer = function(szLayer,szName,szType,szFlag,szTitle){
	ixmaps.feed.addFeed(szLayer,{"name":szName,"type":szType,"flag":szFlag,'title':szTitle});
	__easynido_selectFeedDialog('hide');
};

// add layer defined by my own json
// ----------------------------------------------------------------
addLayer = function(szLayer,szFlag,szFilter,szSource){
	if ( szFlag && szFlag.match(/zoomto/) ){
		ixmaps.jsapi.addDataAndZoomTo(szLayer,szFilter,szSource);
	}else{
		ixmaps.jsapi.addData(szLayer,szFilter,szSource);
	}
	__easynido_selectFeedDialog('hide');
};


// --------------------------------------------
//
// local functions to set dynamic page content
//
// --------------------------------------------

/**
 * do all the dynamic HTML for nido pages
 * with and without access to the EasyNido FB group 
 * @param szNido the nido name
 * @param fAccess true if we have access to the FB group (authentication successfull)
 * @type void
 */
function __easynido_setInfo(szNido,fAccess){

	var szDefaultPageLink	= "www.comunesbt.it/Engine/RAServePG.php/P/411310010121";
	var szPrimaveraPageLink = "www.comunesbt.it/Engine/RAServePG.php/P/569310010100/M/377110010107";
	var szEasyNidoPageLink	= "http://www.comunesbt.it/Engine/RAServePG.php/P/324610010107";
	var szEasyNidoFBLink	= "https://www.facebook.com/groups/450635708304119/";
	var szEasyNidoTWLink	= "http://twitter.com/easyNido";

	// check if we have a nido selected, if not goto index.html

	if ( typeof(szNido) === 'undefined' || !szNido || !szNido.length ){
		$.mobile.changePage( "./index.html", { transition: "slideup"} );
		return;
	}
	
	// we use global data stored in:
	// __user	a user object set by the FB authentication landing page
	// __data	a nido data object loaded by .live binding  

	try{
		var szUserMessage	= "Benvenuto " + __user.name + " !";
		$("#usermessage").html(szUserMessage);
	}catch (e){}

	var nidi = __data.layers[0].features;
	var nidoData = null;
	var i;
	for ( i=0; i<nidi.length; i++ ){
		if ( eval("nidi[i].properties.name.match(/"+szNido+"/i)") ){
			nidoData = nidi[i].properties;
		}
	}
	
	// first part:
	// general information, always visible 
	// -----------------------------------	
	try{
		var szInfo = "";
		var szInfoLinks ="";

		if ( szNido === "primavera" ){
			szDefaultPageLink = szPrimaveraPageLink;
		}

		// prepare data presentation 
		// -------------------------
		if ( nidoData.data ){
			szInfo += "<div style='text-align:left;margin-left:100px;'>";
			szInfo += "<b>"+nidoData.name +"</b>" +"<br>"; 
			szInfo += (nidoData.data.INDIRIZZO || "") +"<div style='margin:0px;padding:0px;height:0px;'></div>"; 
			szInfo += "</div>";
			szInfoLinks += "<div style='text-align:right;'>";

			// add facebook and twitter buttons if we have access
			// --------------------------------------------------
			if ( fAccess ){
				szInfoLinks += "<span style='vertical-align:-17px;'>";
				szInfoLinks += "<a href='"+szEasyNidoFBLink+"' >";
				szInfoLinks += "<img src=\"resources/images/buttons/facebook-button.png\" style='height:36px;' />";
				szInfoLinks += "</a>";
				szInfoLinks += "&nbsp;&nbsp;&nbsp;";
				szInfoLinks += "<a href='"+szEasyNidoTWLink+"' >";
				szInfoLinks += "<img src=\"resources/images/buttons/twitter-button.png\" style='height:36px;' />";
				szInfoLinks += "</a>";
				szInfoLinks += "</span>";
			}

			// szInfoLinks += "<a id='nido-map-link-info' href='nido_map.html?mode=noinfo' class='map-link' data-role='button' data-inline='true' data-theme='c' >map</a>";
			szInfoLinks += (nidoData.data.TELEFONO?("<a href='tel:"+nidoData.data.TELEFONO+"' class='tel-link' data-role='button' data-inline='true' data-theme='c' >"+nidoData.data.TELEFONO+"</a>"):""); 
			szInfoLinks += "</div>";
		}
		// complete info and insert into page
		// ----------------------------------
		var szPrimaryInfo = "";
			szPrimaryInfo += "<div style='float:left'>";
			szPrimaryInfo += "<img src=\"resources/images/easy_nido/"+szNido+".png\"/>";
			szPrimaryInfo += "</div>";
			szPrimaryInfo += "<div style='position:relative;left:10px;'>";
			szPrimaryInfo += szInfo;
			szPrimaryInfo += "</div>";
			szPrimaryInfo += szInfoLinks;


		// update page rendering
		// ----------------------------------
		$("#nido-info-primary").html(szPrimaryInfo);
		$("#nido-info-primary").trigger('create');

	}catch (e){alert("error 1 :"+__data+','+szNido);}

	// second part:
	// specific information, show/hide 
	// depends on access yes/no
	// -----------------------------------	
	try{
		var szIntro				= "Con <strong>EasyNido</strong>  il Comune intende attuare una gestione più efficiente dei nidi della città grazie alle nuove tecnologie e <strong>all'uso dei social networks</strong>. Si tratta di mappare, su base Google, la posizione delle strutture, ed abbinare alle stesse, oltre alle indicazioni logistiche, anche il numero degli iscritti e l'elenco degli ammessi.";
			szIntro			   += "<br>";
			szIntro			   += "<div style='height:8px;'></div>"; 
			szIntro			   += "Tale consultazione, disponibile anche mediante apposita App, consente ai familiari degli iscritti di seguire in tempo reale l'ammissione alla struttura prescelta, instaurando poi con la stessa un filo diretto attraverso un gruppo <strong>FaceBook</strong> dedicato alla <strong>'community' dei familiari</strong>, che potranno quindi conoscersi a fondo da subito, condividere l'inserimento e creare delle sinergie fra loro, con gli uffici competenti dell'Ente, con le singole responsabili di struttura, ad esempio vedendo pubblicato sulla bacheca il menu del giorno o il calendario degli eventi dedicati alla socializzazione.";
			szIntro			   += "<br>";
			szIntro			   += "<div style='height:8px;'></div>"; 
			szIntro			   += "Inoltre, previo <strong>consenso a rendere nota la propria residenza</strong> e ad essere inseriti nell'apposito profilo <strong>'mobilità casa-nido'</strong>, i genitori potranno accedere ad  un'altra <strong>mappa</strong> che evidenzierà la <strong>provenienza</strong> dei singoli ammessi, in modo che di giorno in giorno, tramite <strong>Twitter</strong>, gli accompagnatori dei bambini possano creare economie di scala nel trasporto da e per il nido con evidenti vantaggi dal punto di vista ambientale e ponendo le basi di una <strong>comunicazione 'smart'</strong>, a cui abituarsi fin dal primo grado della scolarizzazione.";
			szIntro			   += "<br>";
			szIntro			   += "<div style='height:8px;'></div>"; 
		
		var szSecondaryInfo = "";
			szSecondaryInfo += "<div>";

			if (!fAccess){
				szSecondaryInfo += "<div>"+szIntro+"</div>";
			}
			szSecondaryInfo += "<div id='info-gruppo-FB'></div><br>"; 

			szSecondaryInfo += "Per saperne di più: <br><br>"; 

			szSecondaryInfo += "<a href='http://"+szDefaultPageLink+"' class='www-link' data-inline='true' data-role='button' data-theme='c' >"+"più informazioni ..."+"</a>"; 
			szSecondaryInfo += "<a href='"+szEasyNidoPageLink+"' class='www-link' data-inline='true' data-role='button' data-theme='c' >"+"progetto EasyNido ..."+"</a>"; 
			szSecondaryInfo += (nidoData.data.EMAIL?("<a href='mailto:"+nidoData.data.EMAIL+"' class='mail-link'  data-inline='true' data-role='button' data-theme='c' >"+nidoData.data.EMAIL+"</a>"):""); 

			szInfo += "<div style='height:12px;'></div>"; 

			if (fAccess){
				szSecondaryInfo += "<a href='"+szEasyNidoFBLink+"' class='www-link'  data-role='button'>"+"gruppo facebook"+"</a>";
			}

			szInfo += "</div>";

		$("#nido-info-secondary").html(szSecondaryInfo);
		$("#nido-info-secondary").trigger('create');

	}
	catch (e){alert("error 2");}

	// third part:
	// set buttons handlers
	// -----------------------------------	

	// map button
	try{
		var szMapRef = __easynido_getMapRef(__szNido,true);
		if (szMapRef){
			$("#map-access-utenti")[0].setAttribute("href",szMapRef);
		}
	}
	catch (e){}

	// button for OAUTH user authentication
	try{
		// $("#engage-link")[0].setAttribute("href","nido_engage.html?nido="+szNido);
		$("#engage-link")[0].setAttribute("href","javascript:__easynido_engageWithFacebook();");
	}
	catch (e){}

	// forth part:
	// insert infos and posts from the FB group
	// ----------------------------------------	

	try{
		__easynido_setGroupInfo(szNido,fAccess);
	}
	catch (e){}
}

/**
 * create the map URL with nido spezific parameter
 * with and without access to the EasyNido FB group 
 * @param szNido the nido name
 * @param fAccess true if we have access to the FB group (authentication successfull)
 * @type string
 * @return map URL
 */
function __easynido_getMapRef(szNido,fAccess){

	if ( !szNido ){
		return null;
	}
	var szLoadData = null;
	var szFilter = null;

	var szFusionTableId = __easynido_getFusionTableId(szNido,fAccess);
	szFilter   = "Nidi:"+szNido;
	szLoadData = "https://www.google.com/fusiontables/exporttable?query=select+col5+from+"+szFusionTableId+"&o=kmllink&g=col5";

	if ( fAccess ){
		// GR 06.12.2012 because of problems with firefox and encoded URI components, in combination with jquery mobile, replaced with bookmarks	
		//return "nido_map.html?mode=noinfo&kml="+encodeURIComponent(szLoadData)+"&kmlname=Genitori%20"+szNido+"&itemfilter="+encodeURIComponent(szFilter);
		return "nido_map.html?mode=noinfo&bookmark="+ szNido +"&itemfilter="+encodeURIComponent(szFilter);
	}else{
		return "nido_map.html?mode=noinfo&itemfilter="+encodeURIComponent(szFilter);
	}
}

/**
 * query and display some information of the EasyNido FB group
 * @param szNido actually selected nido
 * @param fAccess flag if access is granted
 * @return void
 */
function __easynido_setGroupInfo(szNido,fAccess){

	if ( !fAccess ){
		return;
	}
	var path = "https://api.facebook.com/method/fql.query?query=select+gid%2C+uid+from+group_member+where+gid+%3D+"+__EasyNidoFBGroupId+"+limit+500&";
	var queryParams = ['access_token='+__accessToken, 'format=json','callback=__easynido_doSetGroupInfo'];
	var query = queryParams.join('&');
	var url = path + query;

	// use jsonp to call the graph
	var script = document.createElement('script');
	script.src = url;

	document.body.appendChild(script);  

}
/**
 * callback to display group members 
 * @param memberA FB object; array of members
 * @return void
 */
function __easynido_doSetGroupInfo(memberA){

	var graphQuery = 'https://graph.facebook.com/'+__EasyNidoFBGroupId+'/feed';
	var url =  graphQuery +'?access_token='+ __accessToken +'&limit='+__nPostShowLimit+'&callback=?';  

	if (!memberA){
		memberA = __FBMemberA;
	}else{
		__FBMemberA = memberA;
	}

	$.getJSON(url,function(data){ 
		
		var	szGroupInfo  = "Attualmente il gruppo FB di EasyNido ha <strong>"+ memberA.length +" </strong>membri";
		szGroupInfo		+= "<br>Ultimi post del gruppo: ";
		if ( __szInfoFilter && __szInfoFilter.length ){
			szGroupInfo += " <a data-role='button' data-inline='true' data-mini='true' data-theme='c' href='javascript:__szInfoFilter=\"\";__easynido_doSetGroupInfo();'>tutti</a>"; 
		}else{
			szGroupInfo += " <a data-role='button' data-inline='true' data-mini='true' data-theme='c' href='javascript:__szInfoFilter=\"men\";__easynido_doSetGroupInfo();'>solo Menu</a>"; 
		}
		szGroupInfo		+= "</br></br>"; 

		var one_hour = 1000*60*60;
		var one_day  = one_hour*24;

		for( i=0; i < data.data.length; i++){

			// if (global var) __szInfoFilter is set, do filter data
			if ( __szInfoFilter ){
				var fHit = false;
				fHit =	(data.data[i].caption		&& eval('data.data[i].caption.match(/'+__szInfoFilter+'/i)'))	  ||
						(data.data[i].description	&& eval('data.data[i].description.match(/'+__szInfoFilter+'/i)')) ||
						(data.data[i].message		&& eval('data.data[i].message.match(/'+__szInfoFilter+'/i)'))	  ;
				if ( !fHit ){
					continue;
				}
			}

			var timeString  = "";
			if ( __ASSERT(data.data[i].from.name) ){
				// GR 24.10.2012 clear string before parse (error from android 3.x browser)
				var test = String(data.data[i].created_time.split("T")[0]+" "+data.data[i].created_time.split("T")[1].split("+")[0]);
				var postDate	= Date.parse(test);
				var days		= Math.floor((new Date().getTime()-postDate)/(one_day)); 
				var hours		= Math.floor((new Date().getTime()-postDate)%(one_day)/(one_hour));
				if ( days ){
					timeString	+= (days>1)  ? (days+" giorni fa") : (days+" giorno fa");
				}else 
				if ( hours ){
					timeString	+= (hours>1) ? (hours+" ore fa")   : (hours+" ora fa");
				}
			}

			szGroupInfo += '<p style="list-style-type:none;background:#fff;padding:5px;padding-left:15px;padding-bottom:15px;margin:0px;margin-left:-15px;margin-right:-15px;margin-bottom:2px;border:#ddd solid 0px;">';
			szGroupInfo += __ASSERT(data.data[i].from.name)		?('<span style="line-height:1.5em;">da: <span style="color:#89a;font-style:italic">'+ data.data[i].from.name +'</span> &nbsp; <span style="color:#aaa;font-size:0.8em"> '+ timeString +' </span></span>'):'';   
			szGroupInfo += __ASSERT(data.data[i].name)			?('<br><strong>'+ data.data[i].name+'</strong>'):'';
			szGroupInfo += __ASSERT(data.data[i].caption)		?('<br><span style="font-size:0.8em;font-weight:bold;vertical-align:7px;">'+ data.data[i].caption+'</span>'):'';   
			szGroupInfo += __ASSERT(data.data[i].description)	?('<br><span style="font-size:0.8em;font-weight:bold;vertical-align:7px;">'+ data.data[i].description+'</span>'):'';   
			szGroupInfo += __ASSERT(data.data[i].message)		?('<br>'+ data.data[i].message):'';   
			szGroupInfo += __ASSERT(data.data[i].picture)		?('<br><img src='+ data.data[i].picture)+'>':'';   
			szGroupInfo +='</p>';
		}               
		$("#info-gruppo-FB").html(szGroupInfo);
		$("#info-gruppo-FB").trigger('create');
	}); 	

	// preset info
	// -----------
	var	szGroupInfo = "Attualmente il gruppo FB di EasyNido ha <strong>"+ memberA.length +" </strong>membri</br>Ultimi post del gruppo: <img style='position:relative;left:25px;top:12px;' alt='mill' src='resources/icons/loading.gif' height='44px' /></br>"; 
	$("#info-gruppo-FB").html(szGroupInfo);
	$("#info-gruppo-FB").trigger('create');
}


// --------------------------------------------------
//
// user authentication (at this moment only Facebook)
//
// --------------------------------------------------

/**
 * use Facebook oauth to verify the user and to grant access 
 * @return void
 */
function __easynido_engageWithFacebook(){

	// **************************************************************************************************
	// change here to point to your server !!
	// **************************************************************************************************

	// this is the id of the Facebook API created for the OAUTH process
	// change this to the api you want to use 
    var appID = "155517361252995";
	// this is the default landing path needed if native app (phonegap) -> document.location = file://...
	// change this to the domain and path, where to find "nido_landing_fb.html" 
    var landingPath = "http://maps.ixmaps.com/app/EasyNido-test";

	// *************************************************************************************************

    var path = 'http://www.facebook.com/dialog/oauth?';
	var tokenUrl = "";

	// create the landing page url
	// ---------------------------
	if ( (document.location.host == 'localhost') || document.location.href.match(/file:/) ){
		// for testing ! from localhost
		tokenUrl = landingPath + '/' + 'nido_landing_fb.html?nido='+__szNido;
	}else{
		// '#' because jquery mobile loads pages with AJAX and refers them by a hash parameter
		var rootA = document.location.href.split('?')[0].split('#')[0].split('/');
		rootA.pop();
		tokenUrl = rootA.join('/') + '/' + 'nido_landing_fb.html?nido='+__szNido;
	}

	// build the engage query
	// ---------------------
	var queryParams = [
		'client_id=' + appID,
		'response_type=token',
		'state=' + __EasyNidoFBGroupId,
		// !request permission to read group data
		'scope=user_groups',
		'redirect_uri=' + tokenUrl ];
	var query = queryParams.join('&');
	var url = path + query;

	window.open(url,'_self');
}

// ============================================================
//
// jquery mobile page handler
//
// ============================================================

	// ---------------------------------
	// global
	// ---------------------------------

	/**
	 * hook page loaded (in jquery mobile done by AJAX load), to get the URL  
	 * is necessary for the return(-1) 'go back' feature
	 */
	$( document ).bind( 'pagebeforechange',function(event,obj){

		if ( typeof obj.toPage === "string" ){

			var szUrl = obj.toPage;

			// check if internal page to load is OAUTH landing page
			// this is not allowed, and can only appear by 'page back'
			// intercept and foreawrd to the initial page 
			// 
			if ( szUrl.match(/nido_landing/) ){
				$.mobile.changePage( "./index.html", { transition: "slideup"} );
				event.preventDefault();
			}
		}
	});


	// ---------------------------------
	// dymnamic content for the pages
	// ---------------------------------

	/**
	 * page 'nido.html'   
	 */
	$( '#nido' ).live( 'pagebeforeshow',function(event){

		$.getJSON("./data/Nidi.js", function(json){
			__data = json;
			__easynido_setInfo(__szNido,false);
		});
	});

	/**
	 * page 'nido_access_fb.html'   
	 */
	$( '#nido_access_fb' ).live( 'pagebeforeshow',function(event){

		var user;
		
		// if we enter page with global parameters set by parent page ( jquery mobile ) 
		// -------------------------------------------------------------------------------
		if ( __szNido){

			// store access values for further usage 
			// -----------------------------------------------
			user = { nido:	__szNido,
					 user:  __user,
					token:  __accessToken
					};
			ixmaps.storeObject("EasyNido",user);

		}else{
			// if not,
			// try to get the parameter from localstore (HTML5)
			// -------------------------------------------------------------------------------
			user = ixmaps.getStoredObject("EasyNido");
			if ( user ){
				__szNido = user.nido;
				__user = user.user;
				__accessToken = user.token;
			}
		}

		$.getJSON("./data/Nidi.js", function(json){
			__data = json;
			__easynido_setInfo(__szNido,true);
		});
		
	});


	// ---------------------------------
	// initialize map 
	// ---------------------------------

	/**
	 * page 'nido_map.html'  !! on page show !!
	 */
	var defaultLayerDialog = "./layer.html";
	var defaultParamFile = "./param.js";

	$( '#nido_map' ).live( 'pageshow',function(event){

		if (__dialog){
			setTimeout( function(){ixmaps.jsapi.setView("map");},200);
			__dialog = false;
			return;
		}
		var paramFile = $(document).getUrlParam('param');
		$.get(paramFile || defaultParamFile,
			function(data){
				if ( typeof(data) == "string" ){
					eval(data);
				}
				// compatible with old param.js;
				if ( typeof(MapParam) == "object" ){
					ixmaps.jsapi.mapParam = MapParam;
				}
				if ( ixmaps.jsapi.mapParam.defaultmap ){
					ixmaps.jsapi.reset();
				}
			
			}).error(function() { alert("error loading MapParam:" +(paramFile || defaultParamFile)); });
		  
		// create map !!!
		// ---------------------------------------------------------------------------------------
		var mapUp = new ixmaps.jsapi.MapUp("map","itemlist","legend",null);

		ixmaps.jsapi.setView("map");

		__fAccessToData = $(document).getUrlParam('accesstodata');

		ixmaps.touchScroll("sidebar");

	});

	/**
	 * needed to force map display (see above) after 'add feed' dialog 
	 */
	$( '#dialog' ).live( 'pageshow',function(event){
		__dialog = true;
	});

// -------------------------------------
//
// end - jquery mobile handler
//
// -------------------------------------

// -----------------------------
// EOF
// -----------------------------
