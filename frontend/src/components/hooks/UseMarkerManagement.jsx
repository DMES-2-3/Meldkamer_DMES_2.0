import { useState, useEffect } from "react";
import { getPriorityColor, getReportStatusColor, normalizePriority, normalizeReportStatus } from "../../utils";

export default function useMarkerManagement(currentMapId, pageNumber, reports=[], onMarkerAdded) {
  const [markers, setMarkers] = useState(() => JSON.parse(sessionStorage.getItem("markers")||"[]"));
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState(null);
  const [markerDragOffset, setMarkerDragOffset] = useState({ x:0, y:0 });

  useEffect(() => { sessionStorage.setItem("markers", JSON.stringify(markers)); }, [markers]);

  const currentMarkers = markers.filter(m => m.mapId===currentMapId && m.page===pageNumber);

  const addMarker = (x,y,zoom,pendingReport) => {
    const newMarker = { id: Date.now(), x:x/zoom, y:y/zoom, label:pendingReport?.event || `Marker ${markers.length+1}`, page:pageNumber, mapId:currentMapId, reportId:pendingReport?.id?.toString() || null };
    setMarkers(prev=>[...prev,newMarker]); setIsAddingMarker(false); onMarkerAdded?.(); return newMarker;
  };

  const updateMarker = (id, updates) => setMarkers(prev=>prev.map(m=>m.id===id?{...m,...updates}:m));
  const deleteMarker = (id) => { setMarkers(prev=>prev.filter(m=>m.id!==id)); if(selectedMarkerId===id) setSelectedMarkerId(null); };
  const removeMarkersForMap = (mapId) => setMarkers(prev=>prev.filter(m=>m.mapId!==mapId));
  const getMarkerColor = m => {
    if (!m.reportId) return "#9ca3af";
    const reportWrapper = reports.find(r => (r.Report?.id || r?.id)?.toString() === m.reportId.toString());
    const report = reportWrapper?.Report || reportWrapper;
    return getPriorityColor(report?.priority || report?.Prioriteit);
  };

  return { markers, currentMarkers, isAddingMarker, setIsAddingMarker, selectedMarkerId, setSelectedMarkerId, draggingMarkerId, setDraggingMarkerId, markerDragOffset, setMarkerDragOffset, addMarker, updateMarker, deleteMarker, removeMarkersForMap, getMarkerColor };
}
