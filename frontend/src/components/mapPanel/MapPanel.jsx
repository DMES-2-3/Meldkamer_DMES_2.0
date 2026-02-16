import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import GoogleMapsPanel from "../GoogleMapsPanel";
import MapModal from "./MapModal";
import MarkerModal from "./MarkerModal";
import { getPriorityColor } from "../../utils";

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
  reports: dashboardReports = [],
  updateReportLocation,
  colorMode = "priority",
  initialMapType = "PDF",
}) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const pdfPageRef = useRef(null);
  const fileInputRef = useRef(null);

  const [maps, setMaps] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(
    () => JSON.parse(sessionStorage.getItem("currentMapId")) || null,
  );
  const [pageNumber, setPageNumber] = useState(
    () => JSON.parse(sessionStorage.getItem("pageNumber")) || 1,
  );
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(
    () => JSON.parse(sessionStorage.getItem("zoom")) || 1,
  );
  const [panPosition, setPanPosition] = useState(
    () => JSON.parse(sessionStorage.getItem("panPosition")) || { x: 0, y: 0 },
  );
  const [markers, setMarkers] = useState(
    () => JSON.parse(sessionStorage.getItem("markers")) || [],
  );

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

  const fetchReports = async () => {
    try {
      const res = await fetch(NOTIFICATIONS_URL);
      const data = await res.json();
      const mappedReports = (Array.isArray(data.data) ? data.data : [])
        .map((n) => ({
          id: n.id || n.notificationId,
          event: n.Subject,
          priority: n.Prioriteit,
          status: n.Status,
          team: n.Team,
          location: n.Location,
          description: n.Note,
          reportedBy: n.ReportedBy,
          time: n.Time,
        }))
        .filter((report) => report.id !== null && report.id !== undefined);
      setReports(mappedReports);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const getShortLabel = (description, maxLength = 25) => {
    if (!description) return "";
    return description.length <= maxLength
      ? description
      : description.slice(0, maxLength).trim() + "...";
  };

  const fetchValidEventId = async () => {
    if (selectedEventId) return selectedEventId;

    try {
      const res = await fetch("http://localhost:8080/src/api/v1/event");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        return data.data[0].id;
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
    return 1; // Final fallback
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
    fetchMaps();
    fetchReports();
  }, []);

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

  useEffect(() => {
    sessionStorage.setItem("currentMapId", JSON.stringify(currentMapId));
  }, [currentMapId]);
  useEffect(() => {
    sessionStorage.setItem("pageNumber", JSON.stringify(pageNumber));
  }, [pageNumber]);
  useEffect(() => {
    sessionStorage.setItem("markers", JSON.stringify(markers));
  }, [markers]);
  useEffect(() => {
    sessionStorage.setItem("zoom", JSON.stringify(zoom));
  }, [zoom]);
  useEffect(() => {
    sessionStorage.setItem("panPosition", JSON.stringify(panPosition));
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
    const report = reports.find(
      (r) => r.id.toString() === tempMarkerReportId.toString(),
    );
    if (report)
      setTempMarkerLabel(getShortLabel(report.description || report.event, 25));
  }, [tempMarkerReportId, reports]);

  const fetchMaps = async () => {
    try {
      const res = await fetch(MAPS_URL);
      const data = await res.json();
      setMaps(Array.isArray(data.data) ? data.data : []);
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
            Prioriteit: "Groen",
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const validEventId = await fetchValidEventId();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", validEventId);

    try {
      const res = await fetch(MAPS_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok)
        setMessage({ type: "error", text: data.error || "Upload failed" });
      else {
        setMessage({ type: "success", text: "Upload successful!" });
        await fetchMaps();
        setCurrentMapId(data.data.mapId);
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

  const getMarkerColor = (marker) => {
    if (!marker.reportId) return "#9ca3af";
    const report = reports.find(
      (r) => r.id.toString() === marker.reportId.toString(),
    );
    return report ? getPriorityColor(report.priority) : "#9ca3af";
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
          reports={dashboardReports}
          onMarkerDragEnd={updateReportLocation}
          colorMode={colorMode}
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
              file={`${MAPS_URL}/${currentMapId}/file`}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
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
                {currentMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    style={{
                      left: marker.x,
                      top: marker.y,
                      position: "absolute",
                      zIndex: selectedMarkerId === marker.id ? 20 : 10,
                    }}
                    onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                  >
                    <svg width="24" height="32" viewBox="0 0 24 32">
                      <path
                        d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"
                        fill={getMarkerColor(marker)}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="8" r="3" fill="#fff" />
                    </svg>
                    <div className="marker-label">{marker.label}</div>
                  </div>
                ))}
              </div>
            </Document>
          ) : (
            <div className="map-no-content">
              {currentMapId
                ? "Map file not available"
                : "No map loaded. Upload a map to get started."}
            </div>
          )}

          <div className="map-buttons">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              Prev
            </button>
            <button
              disabled={!numPages || pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </button>
            <button onClick={zoomIn}>Zoom +</button>
            <button onClick={zoomOut}>Zoom -</button>
            <button onClick={resetZoom}>Reset</button>
            <button
              className={isAddingMarker ? "btn-marker-active" : ""}
              onClick={() => setIsAddingMarker(!isAddingMarker)}
              disabled={!currentMapId || !currentMap?.hasFile}
            >
              {isAddingMarker ? "Cancel" : "Add Marker"}
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
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <span className="zoom-percentage">{Math.round(zoom * 100)}%</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
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
          if (window.confirm(`Delete map "${map.name}"?`)) {
            fetch(`${MAPS_URL}/${map.mapId}`, { method: "DELETE" })
              .then((res) => res.json())
              .then(() => fetchMaps());
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
