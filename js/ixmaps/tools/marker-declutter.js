function MarkerDeclutter(map, opt_markers, opt_options) {

  this.map_ = map;

  /**
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

}

/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerDeclutter.prototype.addMarkers = function(markers, opt_nodraw) {
  for (var i = 0, marker; marker = markers[i]; i++) {
    this.pushMarkerTo_(marker);
  }
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerDeclutter.prototype.pushMarkerTo_ = function(marker) {
  marker.isAdded = false;
  if (marker['draggable']) {
    // If the marker is draggable add a listener so we update the clusters on
    // the drag end.
    var that = this;
    google.maps.event.addListener(marker, 'dragend', function() {
      marker.isAdded = false;
      that.repaint();
    });
  }
  this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerDeclutter.prototype.addMarker = function(marker, opt_nodraw) {
  this.pushMarkerTo_(marker);
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerDeclutter.prototype.removeMarker_ = function(marker) {
  var index = -1;
  if (this.markers_.indexOf) {
    index = this.markers_.indexOf(marker);
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        index = i;
        break;
      }
    }
  }

  if (index == -1) {
    // Marker is not in our list of markers.
    return false;
  }
  this.markers_.splice(index, 1);

  return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerDeclutter.prototype.removeMarker = function(marker, opt_nodraw) {
  var removed = this.removeMarker_(marker);

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  } else {
   return false;
  }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerDeclutter.prototype.removeMarkers = function(markers, opt_nodraw) {

  for (var i = 0, marker; marker = markers[i]; i++) {
    var r = this.removeMarker_(marker);
    removed = removed || r;
  }

  this.resetViewport();
  this.redraw();
  return true;
};



/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerDeclutter.prototype.clearMarkers = function() {
  this.resetViewport(true);

  // Set the markers a empty array.
  this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerDeclutter.prototype.resetViewport = function(opt_hide) {
  this.clusters_ = [];
};

/**
 *
 */
MarkerDeclutter.prototype.repaint = function() {
  this.redraw();
};


/**
 * Redraws the clusters.
 */
MarkerDeclutter.prototype.redraw = function() {
  
  var posA = new Array(0);
  var baseA = new Array(0);
	
  for (var i = 0, marker; marker = this.markers_[i]; i++) {
	szPos = String(marker.getPosition());
	if ( posA[szPos] ){
		var icon = marker.getIcon();
		if ( icon && icon.anchor ){
			icon.anchor.x = baseA[szPos].x - posA[szPos] * 1;
			icon.anchor.y = baseA[szPos].y + posA[szPos] * 3;
			marker.setIcon(icon);
		}
		posA[szPos]++;
	}else{	
		posA[szPos] = 1;
		var icon = marker.getIcon();
		if ( icon && icon.anchor ){
			baseA[szPos] = icon.anchor;
		}else{
			baseA[szPos] = {x:0,y:0};
		}
	}
	marker.setZIndex(9999-i);
  }
};


