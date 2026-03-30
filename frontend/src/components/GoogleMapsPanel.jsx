import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  REPORT_STATUS_COLORS,
  PRIORITY_COLORS,
  getSelectedEvent,
  createMarkerIcon,
  normalizeReportStatus,
  normalizePriority
} from "../utils/utils";
import "../Dashboard.css";

const defaultCenter = { lat: 52.0907, lng: 5.1214 };

export default function GoogleMapsPanel({
  onMapClick,
  reports,
  onMarkerDragEnd,
  colorMode,
  activeLegendFilters,
  isAddingMarker,
  onMarkerClick,
  onMarkersUpdate,
  teamMarkers = [],
  teams = [],
  onTeamMarkerDragEnd
}) {
  const navigate = useNavigate();

  const [center, setCenter] = useState(defaultCenter);
  const [markers, setMarkers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const parseCoordinates = (str) => {
    if (!str) return null;
    const parts = str.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 2) return null;
    const [lat, lng] = parts;
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  };

  useEffect(() => {
    const evt = getSelectedEvent(navigate);
    if (!evt) return;
    setSelectedEvent(evt);

    if (evt.postcode && isLoaded && window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: evt.postcode }, (results, status) => {
        if (status === "OK") {
          const loc = results[0].geometry.location;
          setCenter({ lat: loc.lat(), lng: loc.lng() });
        } else {
          console.warn("Could not geocode postcode:", status);
        }
      });
    }
  }, [navigate, isLoaded]);

  useEffect(() => {
    if (!reports || !selectedEvent) return;

    const newMarkers = reports
      .map((r) => r.Report || r)
      .filter((r) => r.NameEvent === selectedEvent.name)
      .map((r) => {
        // FIX: Check both lowercase 'location' and uppercase 'Location'
        const locationStr = r.location || r.Location;
        console.log("Report location:", locationStr, "for report:", r.id); // Debug log
        const coords = parseCoordinates(locationStr);
        
        if (!coords) {
          console.warn("Could not parse coordinates for report:", r.id, locationStr);
          return null;
        }
        
        return {
          id: r.id,
          position: coords,
          title: r.subject || r.Subject || "Geen onderwerp",
          status: normalizeReportStatus(r.status || r.Status),
          priority: normalizePriority(r.priority || r.Prioriteit),
        };
      })
      .filter(Boolean);

    console.log("Parsed markers:", newMarkers); // Debug log
    setMarkers(newMarkers);
  }, [reports, selectedEvent]);

  const filteredMarkers = React.useMemo(() => {
    return markers.filter((m) => {
      const matchesStatus =
        !activeLegendFilters?.status?.length ||
        activeLegendFilters.status.includes(m.status);

      const matchesPriority =
        !activeLegendFilters?.priority?.length ||
        activeLegendFilters.priority.includes(m.priority);

      return matchesStatus && matchesPriority;
    });
  }, [markers, activeLegendFilters]);

  useEffect(() => {
    if (onMarkersUpdate) {
      onMarkersUpdate(filteredMarkers);
    }
  }, [filteredMarkers, onMarkersUpdate]);

  // if (loadError) {
  //   return (
  //     <div className="map-error">
  //       <h3>Google Maps kon niet geladen worden</h3>
  //       <p>
  //         {loadError.message?.includes("InvalidKeyMapError") ||
  //         loadError.message?.includes("ApiNotActivatedMapError")
  //           ? "Google Maps API key is niet geldig of de API is niet geactiveerd."
  //           : "Er is een fout opgetreden bij het laden van Google Maps."}
  //       </p>
  //       <p>
  //         Controleer of je Google Maps API key correct is ingesteld in het .env
  //         bestand en of de Maps JavaScript API en Geocoding API zijn
  //         geactiveerd.
  //       </p>
  //     </div>
  //   );
  // }

  // if (
  //   !process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  //   process.env.REACT_APP_GOOGLE_MAPS_API_KEY ===
  //     "placeholder_key_replace_with_actual_key"
  // ) {
  //   return (
  //     <div className="map-error">
  //       <h3>Google Maps API key ontbreekt</h3>
  //       <p>Om Google Maps te gebruiken, moet je een API key instellen:</p>
  //       <ol>
  //         <li>
  //           Ga naar{" "}
  //           <a
  //             href="https://console.cloud.google.com/"
  //             target="_blank"
  //             rel="noopener noreferrer"
  //           >
  //             Google Cloud Console
  //           </a>
  //         </li>
  //         <li>Activeer de Maps JavaScript API en Geocoding API</li>
  //         <li>Maak een API key aan</li>
  //         <li>
  //           Voeg deze toe aan het .env bestand:
  //           REACT_APP_GOOGLE_MAPS_API_KEY=je_api_key
  //         </li>
  //         <li>Herstart de ontwikkelserver</li>
  //       </ol>
  //     </div>
  //   );
  // }

  if (!isLoaded)
    return <div className="map-loading">Google Maps wordt geladen…</div>;

  return (
    <div className="google-map-container">
      <GoogleMap
        mapContainerClassName="google-map-inner"
        center={center}
        zoom={15}
        options={{
          draggableCursor: isAddingMarker ? "crosshair" : "default",
        }}
        onClick={(e) => {
          if (onMapClick) {
            onMapClick({
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            });
          }
        }}
      >
        {filteredMarkers.map((m) => {
          let color = PRIORITY_COLORS.default;

          if (colorMode === "priority" && m.priority) {
            color = PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.default;
          } else if (colorMode === "status" && m.status) {
            color = REPORT_STATUS_COLORS[m.status] || REPORT_STATUS_COLORS.default;
          }

          const icon = createMarkerIcon(color);
          const shortLabel = m.title
            ? m.title.length <= 25
              ? m.title
              : m.title.slice(0, 25).trim() + "..."
            : "";
            
          return (
            <Marker
              key={m.id}
              position={m.position}
              title={m.title}
              label={{
                text: shortLabel,
                className: "marker-label",
              }}
              icon={icon}
              draggable={true}
              onDragEnd={(e) => {
                const newLocation = `${e.latLng.lat()}, ${e.latLng.lng()}`;
                if (onMarkerDragEnd) onMarkerDragEnd(m.id, newLocation);
              }}
              onClick={() => {
                if (onMarkerClick) {
                  onMarkerClick(m);
                } else {
                  const reportWrapper = reports.find(
                    (r) => String((r.Report || r).id) === String(m.id),
                  );
                  navigate("/melding", {
                    state: {
                      report: reportWrapper,
                      from: "google-maps",
                    },
                  });
                }
              }}
            />
          );
        })}
        {teamMarkers.map((m) => {
          const team = teams.find(t => String(t.id) === String(m.teamId));
          let color = "#6B7280"; // default gray
          
          if (team && team.status) {
            const statusConfig = {
              REGISTERED: "#10B981",
              AVAILABLE: "#10B981",
              NOTIFICATION: "#F59E0B",
              WAIT: "#3B82F6",
              SHORT_BREAK: "#3B82F6",
              LONG_BREAK: "#3B82F6",
              SIGNED_OUT: "#6B7280",
              ACTIVE: "#10B981",
              BUSY: "#F59E0B",
              RESOLVED: "#6B7280",
              UNAVAILABLE: "#6B7280",
            };
            color = statusConfig[team.status] || "#6B7280";
          }
          
          const icon = {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
                  <path fill="${color}" stroke="#fff" stroke-width="2" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"/>
                  <path fill="#fff" d="M12 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-4.5 9a4.5 4.5 0 019 0v1h-9v-1z"/>
                </svg>
              `),
            scaledSize: window.google ? new window.google.maps.Size(24, 32) : null,
            origin: window.google ? new window.google.maps.Point(0, 0) : null,
            anchor: window.google ? new window.google.maps.Point(12, 32) : null,
            labelOrigin: window.google ? new window.google.maps.Point(12, 36) : null,
          };
          
          const title = team?.name || m.label || "Team Marker";
          const shortLabel = title.length <= 25 ? title : title.slice(0, 25).trim() + "...";
          
          return (
            <Marker
              key={m.id}
              position={{ lat: m.lat, lng: m.lng }}
              title={title}
              label={{
                text: shortLabel,
                className: "marker-label",
              }}
              icon={icon}
              draggable={!!onTeamMarkerDragEnd}
              onDragEnd={(e) => {
                if (onTeamMarkerDragEnd) {
                  onTeamMarkerDragEnd(m.id, {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  });
                }
              }}
              onClick={() => {
                if (onMarkerClick) {
                  onMarkerClick({ ...m, title, teamId: m.teamId });
                }
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}