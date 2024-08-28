import React, { useEffect, useRef, useState } from 'react';
import '@arcgis/core/assets/esri/themes/light/main.css';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Legend from '@arcgis/core/widgets/Legend';
import Expand from '@arcgis/core/widgets/Expand';
import Search from '@arcgis/core/widgets/Search';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import esriRequest from '@arcgis/core/request';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Measurement from '@arcgis/core/widgets/Measurement';
import esriConfig from '@arcgis/core/config';
import * as locator from '@arcgis/core/rest/locator';
import sendJsonData from '../apiService';

const CORSMap = ({ onLocationFound, outputData }) => {
  const mapRef = useRef(null);
  const distanceRef = useRef(null);
  const areaRef = useRef(null);
  const clearRef = useRef(null);
  const toolbarDivRef = useRef(null); // Ref for toolbar div
  const [fetchedData, setFetchedData] = useState(null);  // State to store fetched data
  const [loading, setLoading] = useState(true);

   // Fetch data once on component mount if outputData is not provided
   useEffect(() => {
    if (!outputData) {
      const date = new Date('2024-04-14');  // or any date input you wish to use
      sendJsonData(date)
        .then(response => {
          setFetchedData(response.data);  // Store the fetched data in state
          console.log("Fetched data:", response.data);
          setLoading(false);  // Data has been fetched
        })
        .catch(error => {
          console.error("There was an error fetching data!", error);
          setLoading(false);  // Stop loading on error
        });
    } else {
      setLoading(false);  // No need to fetch data, so loading is done
    }
  }, []);

  // Set up the map once the outputData or fetchedData is available
  useEffect(() => {
    if (loading) return;  // Do not proceed if still loading

    if (!fetchedData && !outputData) {
      console.error("No data available to display on the map");
      return;
    }

    if (!mapRef.current) {
      console.error("Map container div is not available");
      return;
    }

    // Set the API key
    esriConfig.apiKey = 'AAPKdc7b2ff2df0643c9862ec9d816a967c68kookelLZzekcspoX5TtjXoVKK9lvFU3vJ6sILgSwqXg8efMFEBCc9NlnqYtlAid';  // Replace with your Esri API key
    console.log(outputData)

    let url;

    if (outputData) {
      const blob = new Blob([JSON.stringify(outputData)], {
        type: "application/json",
      });
      url = URL.createObjectURL(blob);
    } else if (fetchedData) {
      const blob = new Blob([JSON.stringify(fetchedData)], {
        type: "application/json",
      });
      url = URL.createObjectURL(blob);
    }


    // const url = "/CORS_Site_JSON_1.json";  // Replace with the correct path to your GeoJSON file

    
    const template = {
      title: "Site Info",
      content: `
        <b>Site ID:</b> {SITEID}<br>
        <!-- Add any additional properties from data.json you want to display -->
      `
    };

    const renderer = {
      type: "simple",  // Simple renderer for a single color
      symbol: {
        type: "simple-marker",
        color: "blue",
        size: "8px",
        outline: {
          color: "white",
          width: 1,
        },
      }
    };

    const geojsonLayer = new GeoJSONLayer({
      url: url,
      popupTemplate: template,
      renderer: renderer,
      orderBy: {
        field: "STATUS"
      }
    });

    const map = new Map({
      basemap: "gray-vector",
      layers: [geojsonLayer]
    });

    const view = new MapView({
      container: mapRef.current,  // Use ref to attach the map to the DOM element
      center: [-95.7129, 37.0902], // Longitude, latitude of the USA
      zoom: 4,
      map: map
    });

    view.when(() => {
      const legend = new Expand({
        content: new Legend({
          view: view,
          style: "card"
        }),
        view: view,
        expanded: true
      });

      view.ui.add(legend, "bottom-left");

      // Custom Search
      const customSearchSource = {
        placeholder: "Search by SITEID",
        getSuggestions: (params) => {
          return esriRequest(url, {
            responseType: "json"
          }).then((results) => {
            return results.data.features
              .filter((feature) => feature.properties.SITEID.includes(params.suggestTerm))
              .map((feature) => ({
                key: feature.properties.SITEID,
                text: feature.properties.SITEID,
                sourceIndex: params.sourceIndex
              }));
          });
        },
        getResults: (params) => {
          return esriRequest(url, {
            responseType: "json"
          }).then((results) => {
            const filteredFeatures = results.data.features.filter((feature) =>
              feature.properties.SITEID === params.suggestResult.text.trim()
            );

            const searchResults = filteredFeatures.map((feature) => {
              const graphic = new Graphic({
                geometry: new Point({
                  x: feature.geometry.coordinates[0],
                  y: feature.geometry.coordinates[1]
                }),
                attributes: feature.properties
              });

              const buffer = geometryEngine.geodesicBuffer(graphic.geometry, 100, "meters");
              const propertiesString = Object.entries(feature.properties)
                .slice(0, -1)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
              return {
                extent: buffer.extent,
                feature: graphic,
                name: propertiesString,
              };
            });

            return searchResults;
          });
        }
      };

      const searchWidget = new Search({
        view: view,
        sources: [customSearchSource]
      });

      view.ui.add(searchWidget, "top-right");

      // Basemap Gallery
      const basemapGallery = new Expand({
        content: new BasemapGallery({
          view: view,
          container: document.createElement("div"),
        }),
        view: view,
        expanded: false
      });

      view.ui.add(basemapGallery, "top-right");

      // Measurement widget
      const measurement = new Measurement({
        view: view
      });

      view.ui.add(measurement, "bottom-right");

      // Ensure toolbar elements are available before using them
      if (toolbarDivRef.current) {
        view.ui.add(toolbarDivRef.current, "top-left");
      } else {
        console.error("Toolbar div is not found");
      }

      // Toolbar functionality
      distanceRef.current.onclick = function () {
        measurement.activeTool = "distance";
      };

      areaRef.current.onclick = function () {
        measurement.activeTool = "area";
      };

      clearRef.current.onclick = function () {
        measurement.clear();
      };

      // Locator URL for address lookup
      const locatorUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

      // Add click event to view
      view.on("click", (event) => {
        const lat = event.mapPoint.latitude.toFixed(2);
        const lon = event.mapPoint.longitude.toFixed(2);

        // Get the clicked location's address
        locator.locationToAddress(locatorUrl, {
          location: event.mapPoint
        })
          .then((response) => {
            // Call the parent component's callback with the address, latitude, and longitude
            onLocationFound({
              address: response.address,
              latitude: lat,
              longitude: lon
            });
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
          });
      });
    });

    return () => {
      if (view) {
        view.container = null;
      }
    };
  }, [onLocationFound, outputData, fetchedData, loading]);

  return (
    <div>
      <div ref={toolbarDivRef} id="toolbarDiv" className="esri-component esri-widget absolute top-20 left-[1px] z-10">
        <button ref={distanceRef} className="esri-widget--button esri-interactive esri-icon-measure-line" title="Distance Measurement Tool"></button>
        <button ref={areaRef} className="esri-widget--button esri-interactive esri-icon-measure-area" title="Area Measurement Tool"></button>
        <button ref={clearRef} className="esri-widget--button esri-interactive esri-icon-trash" title="Clear Measurements"></button>
      </div>
      <div ref={mapRef} className="h-[88vh] w-full"></div>  {/* Attach the map view to this div */}
    </div>
  );
};

export default CORSMap;
