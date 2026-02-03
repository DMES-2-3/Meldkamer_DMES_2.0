export function PdfViewer({ fileUrl, pageNumber, zoom, pan, markers, onMarkerMouseDown }) {
  return (
    <Document file={fileUrl}>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <Page pageNumber={pageNumber} renderAnnotationLayer={false} renderTextLayer={false} />
        {markers.map(m => (
          <Marker key={m.id} marker={m} onMouseDown={onMarkerMouseDown} />
        ))}
      </div>
    </Document>
  );
}
