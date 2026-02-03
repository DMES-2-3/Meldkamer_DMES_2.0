import React from "react";

export default function Modal({ show, onClose, title, children }) {
  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "300px",
        maxWidth: "90%",
        maxHeight: "90%",
        overflowY: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ fontSize: "20px", lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
