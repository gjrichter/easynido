	// define default marker style for layers
	var MapParam = {
		"all":
			{
			"thumbnailRoot" : "resources/images/tn/",
			"markerImageRoot" : "resources/icons/map-icons-collection/numeric/orange",
			"markerImageType" : "png",

			"initListState" : "expanded",
			"initListMode" : "showinfo",

			"smallInfoKeepImage": "true",
			"smallInfoClipDescription": "200"
			}
		,
		"defaultmap": 
			{ "data": "Nidi"
			}
		,
		"layerdialog" :{"href":"layer.html"}
		,
		"layers": [
			{ "name": "Nidi",
			  "initListState" : "expanded|showinfo|nocontrols"
			},	
			{ "name": "Genitori",
			  "initListState" : "expanded|showinfo|nocontrols",
			  "markerType" : "custom",
			  "markerImage" : "resources/icons/dummy_user.png"
			},	
			{ "name": "Genitori meraviglie",
			  "initListState" : "expanded|showinfo|nocontrols",
			  "markerType" : "custom",
			  "markerImage" : "resources/icons/dummy_user.png"
			},	
			{ "name": "Genitori principe",
			  "initListState" : "expanded|showinfo|nocontrols",
			  "markerType" : "custom",
			  "markerImage" : "resources/icons/dummy_user.png"
			},	
			{ "name": "Genitori mongolfiera",
			  "initListState" : "expanded|showinfo|nocontrols",
			  "markerType" : "custom",
			  "markerImage" : "resources/icons/dummy_user.png"
			},	
			{ "name": "Genitori primavera",
			  "initListState" : "expanded|showinfo|nocontrols",
			  "markerType" : "custom",
			  "markerImage" : "resources/icons/dummy_user.png"
			},	
			{ "name": "Itinerario Arte e Storia",
			  "markerType" : "numeric",
			  "markerImageRoot" : "resources/icons/map-icons-collection/numeric/orange",
			  "markerImageType" : "png"
			},
			{ "name": "Itinerario Giardini tematici",
			  "markerType" : "numeric",
			  "markerImageRoot" : "resources/icons/map-icons-collection/numeric/orange",
			  "markerImageType" : "png"
			},
			{ "name": "Luoghi di diporto",
			  "markerType" : "numeric",
			  "markerImageRoot" : "resources/icons/map-icons-collection/numeric/red",
			  "markerImageType" : "png"
			},
			{ "name": "CHIESE RUPESTRI DI MATERA",
			  "initListState" : "expanded|showinfo",
			},
			{ "name": "Recent Earthquakes in Italy",
			  "markerType" : "numeric",
			  "markerImageRoot" : "resources/icons/map-icons-collection/numeric/red",
			  "markerImageType" : "png",
			  "initListState" : "noinfo",

			  "markerSizeRule": {
				  "source": "name",
					// regex to get the size value
					// get the float after " Magnitude(xx) "
					// sample source: 2012/05/30, 14:15:56 UTC  -  Magnitude(Ml) 3.00  -  Pianura padana emiliana
				  "regex" : "/Magnitude\\([a-zA-Z]{2}\\) ?(\\b[0-9]+\\.([0-9]+\\b)?|\\.[0-9]+\\b)?/i",
				  "index" : 1,
				  "normalSize" : 4
			      }
			},
			{ "name": "evento",
			  "markerType" : "numeric",
			  "markerImageRoot" : "resources/icons/map-icons-collection/numeric/orange",
			  "markerImageType" : "png"
			}

		]
	};
