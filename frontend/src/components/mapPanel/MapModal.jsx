import React from "react";
import Modal from "../common/Modal";

export default function MapModal({
  show,
  onClose,
  maps,
  onMapSelect,
  uploading,
  onUploadClick,
  onDeleteClick,
  currentMapId
}) {
  return (
    <Modal show={show} onClose={onClose} title="Select a Map">
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={onUploadClick}
          disabled={uploading}
          className="btn-save"
        >
          {uploading ? "Uploaden..." : "+ Upload PDF"}
        </button>
      </div>

      {maps.length === 0 && (
        <p style={{ fontStyle: "italic", color: "#888" }}>
          Geen mappen beschikbaar. Upload een PDF om te beginnen.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {maps.map((m) => (
          <div
            key={m.mapId}
            className={`modal-map-item ${currentMapId === m.mapId ? "active" : ""}`}
            onClick={() => onMapSelect(m)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
          >
            <span>{m.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                onDeleteClick(m);
              }}
              className="btn-delete"
            >
              Verwijder
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
