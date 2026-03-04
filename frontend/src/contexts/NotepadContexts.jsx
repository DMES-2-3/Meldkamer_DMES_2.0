import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const NotepadContext = createContext(null);

export const NotepadProvider = ({ children }) => {
  const [activeKey, setActiveKey] = useState(null);
  const [notes, setNotes] = useState("");

  // Load notes whenever the active key changes
  useEffect(() => {
    if (!activeKey) {
      setNotes("");
      return;
    }
    const stored = localStorage.getItem(activeKey);
    setNotes(stored ?? "");
  }, [activeKey]);

  // Persist notes whenever notes change (for current active key)
  useEffect(() => {
    if (!activeKey) return;
    localStorage.setItem(activeKey, notes);
  }, [activeKey, notes]);

  const value = useMemo(
    () => ({ notes, setNotes, activeKey, setActiveKey }),
    [notes, activeKey]
  );

  return <NotepadContext.Provider value={value}>{children}</NotepadContext.Provider>;
};

export const useNotepad = () => {
  const ctx = useContext(NotepadContext);
  if (!ctx) throw new Error("useNotepad must be used within a NotepadProvider");
  return ctx;
};