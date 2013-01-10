/*
@ -----------------------------------------------------------------------------
@ l o a d i n g   d a t a    f r o m    F u s i o n T a b l e
@ -----------------------------------------------------------------------------
*/
var	ftLoaderPool = new FTLoaderPool();

/**
 * Create a new FTLoaderPool instance.  
 * @class It realizes an object to coordinate data loading
 * @constructor
 * @throws 
 * @return A new FTLoaderPool
 */
function FTLoaderPool(){
	/** holds the created {@link FTLoader} instances @type array */
	this.loaderA = new Array(0);
	/** array of all scripts (URLs) already loaded @type string */
	this.loadedUrlA = new Array(0);
	/** array of the scripts (URLs) in progress of beeing loaded @type string */
	this.loadingUrlA = new Array(0);
	/** array of all scripts (URLs) that could not be loaded @type string */
	this.errorUrlA = new Array(0);
}
/**
 * adds one created loader object to the pool  
 * @param  loaderObj the loader object to add
 */
FTLoaderPool.prototype.add = function(loaderObj){
	this.loaderA[this.loaderA.length] = loaderObj;
};
/**
 * evaluates all loaded script, in order to make them functional  
 */
FTLoaderPool.prototype.doneAll = function(){

//	_TRACE("****** try eval scripts *******");

	if ( this.isLoading() == false ){

		for ( i=0; i<this.loaderA.length; i++ ){
			var loader = this.loaderA[i];
			for(var ii=0; ii<loader.loadedScripts.length; ii++){
				if ( !this.isScriptLoaded(loader.szUrl) ){
					// _TRACE("**** eval: "+loader.szUrl);
					this.evalScript(loader.loadedScripts[ii]);
					this.setScriptLoaded(loader.szUrl);
				}
			}
		}
		this.loaderA.length = 0;
	}
};
/**
 * evaluates a loaded script, in order to make it functional  
 */
FTLoaderPool.prototype.done= function(){
	eval(arguments[0]);
};
/**
 * adds this url to the array of non loadable scripts  
 * @param  szUrl the URL of the script, that caused a loading error
 */
FTLoaderPool.prototype.setScriptError = function(szUrl){
	this.errorUrlA[this.errorUrlA.length] = szUrl;
};
/**
 * adds this url to the array of loaded scripts  
 * @param  szUrl the URL of the script, that has successfully been loaded
 */
FTLoaderPool.prototype.setScriptLoaded = function(szUrl){
	this.loadedUrlA[this.loadedUrlA.length] = szUrl;
};
/**
 * adds this url to the array of loads in progress  
 * @param  szUrl the URL of the script 
 */
FTLoaderPool.prototype.setScriptLoading = function(szUrl){
	this.loadingUrlA[this.loadingUrlA.length] = szUrl;
};
/**
 * check the loaded state of a script  
 * @type boolean
 * @param  szUrl the URL of the script to be checked
 * @return true if the script has successfully been loaded
 */
FTLoaderPool.prototype.isScriptLoaded = function(szUrl){
	for (var i=0; i<this.loadedUrlA.length; i++ ){
		if ( this.loadedUrlA[i] == szUrl ){
			return true;
		}
	}
	return false;
};
/**
 * check the loading state of a script  
 * @type boolean
 * @param  szUrl the URL of the script to be checked
 * @return true if the loading of the script is in progress
 */
FTLoaderPool.prototype.isScriptLoading = function(szUrl){
	for (var i=0; i<this.loadingUrlA.length; i++ ){
		if ( this.loadingUrlA[i] == szUrl ){
			return true;
		}
	}
	return false;
};
/**
 * check the error state of a script  
 * @type boolean
 * @param  szUrl the URL of the script to be checked
 * @return true if the script could not be loaded
 */
FTLoaderPool.prototype.isScriptError = function(szUrl){
	for (var i=0; i<this.errorUrlA.length; i++ ){
		if ( this.errorUrlA[i] == szUrl ){
			return true;
		}
	}
	return false;
};
/**
 * uncheck the loaded state of a script  
 * @type boolean
 * @param  szUrl the URL of the script to be checked
 */
FTLoaderPool.prototype.resetScriptLoading= function(szUrl){
	for (var i=0; i<this.loadingUrlA.length; i++ ){
		if ( this.loadingUrlA[i] == szUrl ){
			this.loadingUrlA[i] = "";
		}
	}
	for (var i=0; i<this.loadedUrlA.length; i++ ){
		if ( this.loadedUrlA[i] == szUrl ){
			this.loadedUrlA[i] = "";
		}
	}
	for (var i=0; i<this.errorUrlA.length; i++ ){
		if ( this.errorUrlA[i] == szUrl ){
			this.errorUrlA[i] = "";
		}
	}
};

/**
 * check the loading state of all loader in the pool  
 * @type boolean
 * @return true if any loader is in progress of loading
 */
FTLoaderPool.prototype.isLoading = function(){
	var i;
	for ( i=0; i<this.loaderA.length; i++ ){
		if ( this.loaderA[i].reqCnt>0 ){
//			displayMessage(this.loaderA[i].szMessage+":"+(this.loaderA[i].szUrl?this.loaderA[i].szUrl:""),1000);
			displayMessage(this.loaderA[i].szMessage,10000);
			return true;
		}
	}
	return false;
};
/*
@ -----------------------------------------------------------------------------
@ F T - L o a d e r 
@ -----------------------------------------------------------------------------
*/
/**
 * Create a new FTLoader instance.  
 * @class It realizes an object to load scripts from URL and evaluate them on load success
 * @constructor
 * @throws 
 * @return A new FTLoader
 */
function FTLoader(){
	/** array of strings which each can hold a loaded scripts @type array */
	this.loadedScripts = [];
	/** array of strings which each can hold a loaded scripts @type array */
	this.loadedScriptsNames = [];
	/** number of requests (loadings in progress) @type int */
	this.reqCnt =0;
	/** flag to indicate any loading process in progress @type boolean */
	this.isLoading = false;
	/** function to be called on loading error @type string */
	this.errorCallback=null;
	/** function to be called on loading success @type string */
	this.finishedCallback=null;
	/** message to be displayed on loading */
	this.szMessage = "... loading script ...";
	/** link to a parent class ({@link FTLoaderPool}) that controlls all created FTLoader @type FTLoaderPool */
	this.pool = ftLoaderPool;
	this.pool.add(this);
}

/**
 * start loading the specified script  
 * @param  szUrl the URL of the script to be loaded
 */
FTLoader.prototype.loadData = function(szUrl,szName,fRefresh){

	if ( fRefresh ){
		this.pool.resetScriptLoading(szUrl);
	}

	try{
		this.szUrl = szUrl;
		this.szName = szName;
		if ( this.pool.isScriptError(this.szUrl) ){
			eval(this.errorCallback);
			return;
		}
		if ( !this.pool.isScriptLoading(this.szUrl) ){
			this.isLoading = true;
			this.reqCnt++;
			this.pool.setScriptLoading(this.szUrl);
	//alert("get: "+this.reqCnt);
	//alert("get: "+szUrl);
			__getFTData(szUrl, this, szName);
		}
	}
	catch (e){
	}
};

/**
 * callback function to terminate the data request
 * checks the error state and in case of success, activates the loaded content
 * @param  s the result of the loading process
 */
FTLoader.prototype.operationComplete= function(response,szName){

	//alert("complete: "+this.reqCnt);
	if ( !response.getDataTable() ){
		alert("error: "+this.reqCnt);
		//alert(JSON.stringify(response));
		// _TRACE('JS-Loader: "'+this.szUrl+'" not loaded ! ERROR:'+s.content);
		this.pool.setScriptError(this.szUrl);
		if(this.errorCallback){
			this.finishedCallback = null;
			eval(this.errorCallback);
		}
	}else{
		// _TRACE('JS-Loader: '+this.szUrl+' (loaded)');
		this.loadedScripts.push(response.getDataTable() );
		this.loadedScriptsNames.push(szName);
	}
	this.reqCnt--;
	if(this.reqCnt <= 0){
		this.evalData();
	}
};

/**
 * must not occur, if does instead, gives alert
 * @param  s the result of the loading process
 */
FTLoader.prototype.processImported= function(s){
	alert(s);
};

/**
 * activate all new loaded scripts, uses the appropriate methods of the pool !
 */
FTLoader.prototype.evalData = function(){

	// alert("evalData: "+this.loadedScripts.length);

	for(var i=0; i<this.loadedScripts.length; i++){
		// alert(JSON.stringify(this.loadedScripts[i]));
	}

	this.isLoading = false;
	if( this.finishedCallback ){
		if ( typeof(this.finishedCallback) == "string" ){
			eval(this.finishedCallback);
		}else{
			this.finishedCallback(this);
		}
	}
};

/**
 * returns the loading state of the loader object
 * Note: because is called periodically, does the 'loading...' message
 * @type boolean
 * @return true if the loader is loading (waiting)
 */
FTLoader.prototype.isLoading = function(){
//	_TRACE("isLoading="+this.reqCnt);
//	displayMessage(this.szMessage+":"+(this.szUrl?this.szUrl:""),1000);
	displayMessage(this.szMessage,10000);
	return 	(this.reqCnt>0);
};


/*
@ -----------------------------------------------------------------------------
@ C a l l i n g - t h e - F T - A P I
@ -----------------------------------------------------------------------------
*/

/**
 * executes all !! asynchronous data loading (SVG,XML,Scrips,...); 
 * every loader uses this function, to achieve browser and XMLHttpRequest compatibility 
 * @param  szUrl the URL of the data to be loaded 
 * @param  getDataCallback the callback function to process the imported data
 */
function __getFTData(query,getDataCallback,szName) { 

	var queryText = encodeURIComponent(query);
	var gvizQuery = new google.visualization.Query(
		'http://www.google.com/fusiontables/gvizdata?tq='  + queryText);

    gvizQuery.send(function(response) {
		getDataCallback.operationComplete(response,szName);
	});

	// Send query and draw table with data in response
	//gvizQuery.send(getDataCallback.operationComplete);
}

/*
@ -----------------------------------------------------------------------------
@ C a l l i n g - t h e - F T - A P I
@ -----------------------------------------------------------------------------
*/
FTLoader.prototype.mergeLoadedTables = function(){

	// alert("makeResultTable");

	var resTable = new Object;
	resTable.cols = new Array(0);
	resTable.rows = new Array(0);

	for(var i=0; i<this.loadedScripts.length; i++){

		// MAGIC: make JSON object of fusion table result !! 
		// stringify and then parse two times makes the table object, function but why ???
		var table = JSON.parse(JSON.parse(JSON.stringify(this.loadedScripts[i])));
		var szName = this.loadedScriptsNames[i];

		if ( resTable.cols.length == 0 ){
			resTable.cols.push({"id":"-1","label":"table","type":"hide"});
			for ( c=0; c<table.cols.length ; c++){
				resTable.cols.push({"id":table.cols[c].id,"label":table.cols[c].label,"type":table.cols[c].type});
			}
		}
		for ( r=0; r<table.rows.length ; r++){
			var col = new Array(0);
				col.push({"v":szName});
				for ( c=0; c<table.cols.length ; c++){
					col.push({"v":table.rows[r].c[c].v});
				}
			resTable.rows.push({"c":col});
		}

		//alert(JSON.stringify(table));
	}
	//alert(resTable.rows.length);
	//alert(JSON.stringify(resTable));

	resTable.getDataTable = function(){
		return new FTGetter(resTable);
	};

	this.mergedTable = resTable;
};

function FTGetter(table){
	this.table = table;
}
FTGetter.prototype.getNumberOfRows = function(){
	return this.table.rows.length;
};
FTGetter.prototype.getNumberOfColumns = function(){
	return this.table.cols.length;
};
FTGetter.prototype.getColumnLabel = function(c){
	return this.table.cols[c].label;
};
FTGetter.prototype.getValue = function(r, c){
	if ( this.table.rows[r] && this.table.rows[r].c[c] ){
		return this.table.rows[r].c[c].v;
	}else{
		return "";
	}
};


