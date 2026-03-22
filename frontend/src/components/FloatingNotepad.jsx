import React, { useEffect, useMemo, useState, useRef } from "react";
import { Rnd } from "react-rnd";

function storageKeyFor(context) {
  if (!context) return null;
  if (context.type === "event") return `notepad:event:${context.eventName}`;
  return null;
}

function titleFor(context) {
  if (!context) return "Kladblok";
  if (context.type === "event") return `Kladblok — ${context.eventName}`;
  return "Kladblok";
}

function uiKeyFor(context) {
  const key = storageKeyFor(context);
  return key ? `${key}:ui` : null;
}

export default function FloatingNotepad({ open, context, onClose }) {
  const key = useMemo(() => storageKeyFor(context), [context]);
  const uiKey = useMemo(() => uiKeyFor(context), [context]);
  const textareaRef = useRef(null);

  const [text, setText] = useState("");

  // default window state
  const [win, setWin] = useState({
    x: 40,
    y: 80,
    width: 420,
    height: 320,
  });

  // Load note + optional UI state when opening / switching context
  useEffect(() => {
    if (!open || !key) return;

    const stored = localStorage.getItem(key);
    setText(stored ?? "");
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    if (uiKey) {
      const uiStored = localStorage.getItem(uiKey);
      if (uiStored) {
        try {
          const parsed = JSON.parse(uiStored);
          // basic sanity checks
          if (
            typeof parsed?.x === "number" &&
            typeof parsed?.y === "number" &&
            typeof parsed?.width === "number" &&
            typeof parsed?.height === "number"
          ) {
            setWin(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [open, key, uiKey]);

  // Persist note
  useEffect(() => {
    if (!open || !key) return;
    localStorage.setItem(key, text);
  }, [open, key, text]);

  // Persist window UI (position/size)
  useEffect(() => {
    if (!open || !uiKey) return;
    localStorage.setItem(uiKey, JSON.stringify(win));
  }, [open, uiKey, win]);

  if (!open) return null;

  return (
    <Rnd
      bounds="window"
      size={{ width: win.width, height: win.height }}
      position={{ x: win.x, y: win.y }}
      minWidth={280}
      minHeight={200}
      onDragStop={(e, d) => setWin((p) => ({ ...p, x: d.x, y: d.y }))}
      onResizeStop={(e, direction, ref, delta, position) => {
        setWin({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
      style={{
        zIndex: 3000,
      }}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      dragHandleClassName="notepad-drag-handle"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "white",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header = drag handle */}
        <div
          className="notepad-drag-handle"
          style={{
            cursor: "move",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            background: "rgba(0,0,0,0.03)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {titleFor(context)}
          </div>
          <button className="btn-small" onClick={onClose}>
            Sluiten
          </button>
        </div>

        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schrijf je aantekeningen…"
            style={{
              width: "100%",
              height: "100%",
              flex: 1,
              resize: "none",
              borderRadius: 10,
              border: "1px solid #ddd",
              padding: 10,
              outline: "none",
              fontSize: 14,
              lineHeight: 1.4,
            }}
          />
        </div>
      </div>
    </Rnd>
  );
}