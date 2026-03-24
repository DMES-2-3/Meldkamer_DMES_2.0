import React, { useState, useRef, useEffect } from "react";
import {
  getStoredMapState,
  saveStoredMapState,
  createMapSyncChannel,
  broadcastMapState,
} from "../../utils/mapSync";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import GoogleMapsPanel from "../GoogleMapsPanel";
import MapModal from "./MapModal";
import MarkerModal from "./MarkerModal";
import Marker from "./Marker";
import { getPriorityColor, PRIORITY_COLORS, REPORT_STATUS_COLORS, normalizePriority, normalizeReportStatus } from "../../utils/utils";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const MAPS_URL = "http://localhost:8080/src/api/v1/maps";
const NOTIFICATIONS_URL = "http://localhost:8080/src/api/v1/notification";
const ZOOM_LIMITS = { min: 0.25, max: 4 };
const ZOOM_STEP = 1.1;
const WHEEL_SENSITIVITY = 0.0015;

export default function MapPanel({
  onMapSelect,
  pendingReport,
  onRequestMarkerAdd,
  selectedEventId,
  initialMaps = [],
  onMapsUpdate = () => {},
  reports = [],
  updateReportLocation,
  colorMode = "priority",
  activeLegendFilters,
  initialMapType = "PDF",
  isPopout = false,
}) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const pdfPageRef = useRef(null);
  const fileInputRef = useRef(null);

  const [maps, setMaps] = useState(initialMaps);
  const sharedState = getStoredMapState();

  const [currentMapId, setCurrentMapId] = useState(sharedState.currentMapId || null);
  const [pageNumber, setPageNumber] = useState(sharedState.pageNumber || 1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(sharedState.zoom || 1);
  const [panPosition, setPanPosition] = useState(sharedState.panPosition || { x: 0, y: 0 });
  const [markers, setMarkers] = useState(sharedState.markers || []);

  const [showMapModal, setShowMapModal] = useState(false);
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [tempMarkerLabel, setTempMarkerLabel] = useState("");
  const [tempMarkerReportId, setTempMarkerReportId] = useState("");
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingMarkerId, setDraggingMarkerId] = useState(null);
  const [markerDragOffset, setMarkerDragOffset] = useState({ x: 0, y: 0 });
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [markerClickCandidate, setMarkerClickCandidate] = useState(null);
  const [mapType, setMapType] = useState(initialMapType); // "PDF" or "GoogleMaps"

  const currentMap = maps.find((m) => m.mapId === currentMapId) || null;
  const currentMarkers = markers.filter(
    (m) => m.mapId === currentMapId && m.page === pageNumber,
  );

  const filteredPdfMarkers = currentMarkers.filter((marker) => {
    if (!marker.reportId) return true;

    const reportWrapper = reports.find(r => (r.Report?.id || r?.id)?.toString() === marker.reportId.toString());
    const report = reportWrapper?.Report || reportWrapper;
    if (!report) return true;

    const matchesStatus =
      !activeLegendFilters?.status?.length ||
      activeLegendFilters.status.includes(normalizeReportStatus(report.status || report.Status));

    const matchesPriority =
      !activeLegendFilters?.priority?.length ||
      activeLegendFilters.priority.includes(normalizePriority(report.priority || report.Prioriteit));

    return matchesStatus && matchesPriority;
  });

  const getShortLabel = (description, maxLength = 25) => {
    if (!description) return "";
    return description.length <= maxLength
      ? description
      : description.slice(0, maxLength).trim() + "...";
  };

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (initialMapType) {
      setMapType(initialMapType);
    }
  }, [initialMapType]);

  useEffect(() => {
    setMaps(initialMaps);

    if (initialMaps.length === 0) {
      setCurrentMapId(null);
      setPageNumber(1);
      setNumPages(null);
      return;
    }

    const mapStillExists = initialMaps.some((m) => m.mapId === currentMapId);

    if (!mapStillExists) {
      setCurrentMapId(initialMaps[0].mapId);
      setPageNumber(1);
      setNumPages(null);
      setZoom(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [initialMaps, selectedEventId]);

  // Check for a completed pending PDF marker (coming back from ReportScreen)
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingPdfMarker");
    if (!stored) return;
    try {
      const pending = JSON.parse(stored);
      if (pending.reportId) {
        const newMarker = {
          id: Date.now(),
          x: pending.x,
          y: pending.y,
          label: pending.label || `Report ${pending.reportId}`,
          page: pending.page,
          mapId: pending.mapId,
          reportId: pending.reportId.toString(),
        };
        setMarkers((prev) => [...prev, newMarker]);
        sessionStorage.removeItem("pendingPdfMarker");
      }
    } catch {
      sessionStorage.removeItem("pendingPdfMarker");
    }
  }, []);

  const syncStateRef = useRef({
    currentMapId,
    pageNumber,
    markers,
    zoom,
    panPosition,
  });

  useEffect(() => {
    if (syncStateRef.current.currentMapId !== currentMapId) {
      syncStateRef.current.currentMapId = currentMapId;
      broadcastMapState({ currentMapId });
    }
  }, [currentMapId]);

  useEffect(() => {
    if (syncStateRef.current.pageNumber !== pageNumber) {
      syncStateRef.current.pageNumber = pageNumber;
      broadcastMapState({ pageNumber });
    }
  }, [pageNumber]);

  useEffect(() => {
    if (JSON.stringify(syncStateRef.current.markers) !== JSON.stringify(markers)) {
      syncStateRef.current.markers = markers;
      broadcastMapState({ markers });
    }
  }, [markers]);

  useEffect(() => {
    if (syncStateRef.current.zoom !== zoom) {
      syncStateRef.current.zoom = zoom;
      broadcastMapState({ zoom });
    }
  }, [zoom]);

  useEffect(() => {
    if (
      syncStateRef.current.panPosition?.x !== panPosition.x ||
      syncStateRef.current.panPosition?.y !== panPosition.y
    ) {
      syncStateRef.current.panPosition = panPosition;
      broadcastMapState({ panPosition });
    }
  }, [panPosition]);

  useEffect(() => {
    if (onRequestMarkerAdd) onRequestMarkerAdd(() => setIsAddingMarker(false));
  }, [onRequestMarkerAdd]);

  useEffect(() => {
    if (pendingReport && isAddingMarker)
      setMessage({
        type: "info",
        text: `Click on the map to add a marker for: ${pendingReport.event}`,
      });
  }, [pendingReport, isAddingMarker]);

  useEffect(() => {
    if (!tempMarkerReportId) return;
    const reportWrapper = reports.find(
      (r) => (r.Report?.id || r?.id)?.toString() === tempMarkerReportId?.toString(),
    );
    const report = reportWrapper?.Report || reportWrapper;
    if (report)
      setTempMarkerLabel(getShortLabel(report.description || report.event, 25));
  }, [tempMarkerReportId, reports]);

  useEffect(() => {
    const channel = createMapSyncChannel();

    const applyState = (next) => {
      if (!next) return;

      if (next.currentMapId !== undefined) {
        syncStateRef.current.currentMapId = next.currentMapId;
        setCurrentMapId((prev) => (prev === next.currentMapId ? prev : next.currentMapId));
      }
      if (next.pageNumber !== undefined) {
        syncStateRef.current.pageNumber = next.pageNumber;
        setPageNumber((prev) => (prev === next.pageNumber ? prev : next.pageNumber));
      }
      if (next.zoom !== undefined) {
        syncStateRef.current.zoom = next.zoom;
        setZoom((prev) => (prev === next.zoom ? prev : next.zoom));
      }
      if (next.panPosition !== undefined) {
        syncStateRef.current.panPosition = next.panPosition;
        setPanPosition((prev) =>
          prev.x === next.panPosition.x && prev.y === next.panPosition.y
            ? prev
            : next.panPosition
        );
      }
      if (next.markers !== undefined) {
        syncStateRef.current.markers = next.markers;
        setMarkers((prev) =>
          JSON.stringify(prev) === JSON.stringify(next.markers) ? prev : next.markers
        );
      }
    };

    const onStorage = (e) => {
      if (e.key === "shared_map_state" && e.newValue) {
        try {
          applyState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse shared_map_state", err);
        }
      }
    };

    if (channel) {
      channel.onmessage = (event) => {
        applyState(event.data);
      };
    }

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (channel) channel.close();
    };
  }, []);

  const fetchMapsForEvent = async (eventId) => {
    if (!eventId) return;

    try {
      const res = await fetch(`${MAPS_URL}?eventId=${eventId}`);
      const data = await res.json();
      const eventMaps = Array.isArray(data) ? data : [];

      setMaps(eventMaps);
      onMapsUpdate(eventMaps);

      if (eventMaps.length === 0) {
        setCurrentMapId(null);
        setPageNumber(1);
        setNumPages(null);
        return;
      }

      const mapStillExists = eventMaps.some((m) => m.mapId === currentMapId);
      if (!mapStillExists) {
        setCurrentMapId(eventMaps[0].mapId);
        setPageNumber(1);
        setNumPages(null);
        setZoom(1);
        setPanPosition({ x: 0, y: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const prevZoom = zoom;
    const newZoom = Math.min(
      Math.max(zoom * (1 - e.deltaY * WHEEL_SENSITIVITY), ZOOM_LIMITS.min),
      ZOOM_LIMITS.max,
    );

    const dx = (offsetX - panPosition.x) * (newZoom / prevZoom - 1);
    const dy = (offsetY - panPosition.y) * (newZoom / prevZoom - 1);

    setZoom(newZoom);
    setPanPosition({ x: panPosition.x - dx, y: panPosition.y - dy });
  };

  const zoomIn = () => setZoom((z) => Math.min(z * ZOOM_STEP, ZOOM_LIMITS.max));
  const zoomOut = () =>
    setZoom((z) => Math.max(z / ZOOM_STEP, ZOOM_LIMITS.min));
  const resetZoom = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const DRAG_THRESHOLD = 5;

  const handleMouseDown = (e) => {
    if (isAddingMarker) {
      if (!currentMapId || !currentMap?.hasFile) {
        setMessage({ type: "error", text: "Cannot add marker: No map loaded" });
        setIsAddingMarker(false);
        return;
      }

      e.preventDefault();
      const rect = pdfPageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      // Store pending marker position in sessionStorage and navigate to ReportScreen
      const pendingPdfMarker = {
        x,
        y,
        page: pageNumber,
        mapId: currentMapId,
      };
      sessionStorage.setItem(
        "pendingPdfMarker",
        JSON.stringify(pendingPdfMarker),
      );

      setIsAddingMarker(false);
      setMessage(null);

      navigate("/melding", {
        state: {
          report: {
            Prioriteit: "Laag",
            Status: "Open",
          },
          from: "pdf-map",
        },
      });
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (draggingMarkerId) {
      const rect = pdfPageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - markerDragOffset.x) / zoom;
      const y = (e.clientY - rect.top - markerDragOffset.y) / zoom;

      setMarkers((prev) =>
        prev.map((m) => (m.id === draggingMarkerId ? { ...m, x, y } : m)),
      );

      if (markerClickCandidate) {
        const dx = e.clientX - markerClickCandidate.startX;
        const dy = e.clientY - markerClickCandidate.startY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          setMarkerClickCandidate((c) => c && { ...c, isDrag: true });
        }
      }
      return;
    }

    if (isDragging)
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingMarkerId(null);

    if (markerClickCandidate && !markerClickCandidate.isDrag) {
      const marker = currentMarkers.find(
        (m) => m.id === markerClickCandidate.id,
      );
      if (marker) openMarkerModal(marker);
    }
    setMarkerClickCandidate(null);
    setDraggingMarkerId(null);
  };

  const handleMarkerMouseDown = (e, marker) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMarkerDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingMarkerId(marker.id);
    setSelectedMarkerId(marker.id);

    setMarkerClickCandidate({
      id: marker.id,
      startX: e.clientX,
      startY: e.clientY,
      isDrag: false,
    });
  };

  const openMarkerModal = (marker) => {
    setEditingMarker(marker);
    setTempMarkerLabel(marker.label);
    setTempMarkerReportId(marker.reportId || "");
    setShowMarkerModal(true);
  };

  const saveMarker = (updatedMarker) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
    );
    setEditingMarker(null);
    setShowMarkerModal(false);
  };

  const deleteMarker = (markerId) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    setEditingMarker(null);
    setShowMarkerModal(false);
  };

  const handleMapSelect = (map) => {
    if (currentMapId === map.mapId) return setShowMapModal(false);
    setCurrentMapId(map.mapId);
    setPageNumber(1);
    resetZoom();
    setShowMapModal(false);
    if (onMapSelect) onMapSelect(map.mapId);
  };

    const openMapPopout = () => {
    const url = `${window.location.origin}/map-popout`;

    window.open(
      url,
      "MapPopoutWindow",
      "width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes"
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedEventId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", selectedEventId);

    try {
      const res = await fetch(MAPS_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok)
        setMessage({ type: "error", text: data.error || "Upload mislukt" });
      else {
        setMessage({ type: "success", text: "Upload succesvol!" });
        const newMap = data.data;
        const updatedMaps = [...maps, newMap];
        setMaps(updatedMaps);
        onMapsUpdate(updatedMaps);
        setCurrentMapId(newMap.mapId);
        setPageNumber(1);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Google Maps click handler
  const handleMapClick = (coords) => {
    navigate("/melding", {
      state: {
        report: {
          Location: `${coords.lat}, ${coords.lng}`,
          Prioriteit: "Groen",
          Status: "Open",
        },
        from: "google-maps",
      },
    });
  };

  return (
    <div className="map-panel">
      {message && (
        <div className={`map-message map-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="map-type-tabs">
        <button
          className={mapType === "PDF" ? "active-tab" : ""}
          onClick={() => setMapType("PDF")}
        >
          PDF
        </button>
        <button
          className={mapType === "GoogleMaps" ? "active-tab" : ""}
          onClick={() => setMapType("GoogleMaps")}
        >
          Google Maps
        </button>
      </div>

      {mapType === "GoogleMaps" ? (
        <GoogleMapsPanel
          onMapClick={handleMapClick}
          reports={reports}
          onMarkerDragEnd={updateReportLocation}
          colorMode={colorMode}
          activeLegendFilters={activeLegendFilters}
        />
      ) : (
        <div
          ref={wrapperRef}
          className="map-wrapper"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isAddingMarker
              ? "crosshair"
              : isDragging
                ? "grabbing"
                : "grab",
          }}
        >
          {currentMapId && currentMap?.hasFile ? (
            <Document
              key={currentMapId}
              file={`${MAPS_URL}/${currentMapId}/file`}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                if (pageNumber > numPages) setPageNumber(1);
              }}
            >
              <div
                ref={pdfPageRef}
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
                  transformOrigin: "0 0",
                  position: "relative",
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
                {filteredPdfMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    marker={marker}
                    reports={reports}
                    colorMode={colorMode}
                    isSelected={selectedMarkerId === marker.id}
                    onMouseDown={handleMarkerMouseDown}
                  />
                ))}
              </div>
            </Document>
          ) : (
            <div className="map-no-content">
              {currentMapId
                ? "Map bestand niet beschikbaar"
                : "Geen map geladen. Upload een map om te beginnen."}
            </div>
          )}

          {!isPopout && (
            <>
              <div className="map-buttons">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                >
                  Vorige
                </button>
                <button
                  disabled={!numPages || pageNumber >= numPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Volgende
                </button>
                <button onClick={zoomIn}>Zoom +</button>
                <button onClick={zoomOut}>Zoom -</button>
                <button onClick={resetZoom}>Reset</button>
                <button
                  className={isAddingMarker ? "btn-marker-active" : ""}
                  onClick={() => setIsAddingMarker(!isAddingMarker)}
                  disabled={!currentMapId || !currentMap?.hasFile}
                >
                  {isAddingMarker ? "Annuleren" : "Voeg Marker toe"}
                </button>
                <button
                  onClick={() => {
                    setEditingMarker(null);
                    setShowMarkerModal(true);
                  }}
                >
                  Markers ({currentMarkers.length})
                </button>
                <button onClick={() => setShowMapModal(true)}>Maps</button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploaden..." : "Upload"}
                </button>
                <button onClick={openMapPopout}>Pop-out</button>
                <span className="zoom-percentage">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>
      )}

      <MapModal
        show={showMapModal}
        onClose={() => setShowMapModal(false)}
        maps={maps}
        onMapSelect={handleMapSelect}
        uploading={uploading}
        onUploadClick={() => fileInputRef.current?.click()}
        onDeleteClick={(map) => {
          if (window.confirm(`Verwijder map "${map.name}"?`)) {
            fetch(`${MAPS_URL}/${map.mapId}`, { method: "DELETE" })
              .then((res) => res.json())
              .then(() => fetchMapsForEvent(selectedEventId));
          }
        }}
        currentMapId={currentMapId}
      />

      <MarkerModal
        show={showMarkerModal}
        onClose={() => setShowMarkerModal(false)}
        editingMarker={editingMarker}
        markers={currentMarkers}
        localReports={reports}
        selectedEventId={selectedEventId}
        onSave={(updatedMarker) => {
          setMarkers((prev) =>
            prev.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
          );
          setEditingMarker(null);
          setShowMarkerModal(false);
        }}
        onDelete={(markerId) => {
          setMarkers((prev) => prev.filter((m) => m.id !== markerId));
          setEditingMarker(null);
          setShowMarkerModal(false);
        }}
        onEditMarker={(marker) => {
          setEditingMarker(marker);

          if (!marker) {
            setShowMarkerModal(true);
            return;
          }

          setShowMarkerModal(true);
        }}
      />
    </div>
  );
}
