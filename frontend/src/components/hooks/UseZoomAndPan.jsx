import { useState, useEffect } from "react";

const ZOOM_STEP = 1.1, ZOOM_LIMITS = { min: 0.25, max: 4 }, WHEEL_SENS = 0.0015;

export default function useZoomAndPan(wrapperRef) {
  const [zoom, setZoom] = useState(() => +sessionStorage.getItem("zoom") || 1);
  const [panPosition, setPanPosition] = useState(() => JSON.parse(sessionStorage.getItem("panPosition") || "{\"x\":0,\"y\":0}"));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => { sessionStorage.setItem("zoom", zoom); }, [zoom]);
  useEffect(() => { sessionStorage.setItem("panPosition", JSON.stringify(panPosition)); }, [panPosition]);

  const handleWheel = e => {
    e.preventDefault();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top;
    const prevZoom = zoom;
    const newZoom = Math.min(Math.max(zoom * (1 - e.deltaY * WHEEL_SENS), ZOOM_LIMITS.min), ZOOM_LIMITS.max);
    setPanPosition({ x: panPosition.x - (offsetX - panPosition.x)*(newZoom/prevZoom-1), y: panPosition.y - (offsetY - panPosition.y)*(newZoom/prevZoom-1) });
    setZoom(newZoom);
  };

  const handleMouseDown = e => { setIsDragging(true); setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y }); };
  const handleMouseMove = e => { if(isDragging) setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setIsDragging(false);

  return {
    zoom, panPosition, isDragging, handleWheel,
    zoomIn: () => setZoom(z => Math.min(z*ZOOM_STEP, ZOOM_LIMITS.max)),
    zoomOut: () => setZoom(z => Math.max(z/ZOOM_STEP, ZOOM_LIMITS.min)),
    resetZoom: () => { setZoom(1); setPanPosition({ x:0, y:0 }); },
    handleMouseDown, handleMouseMove, handleMouseUp
  };
}
