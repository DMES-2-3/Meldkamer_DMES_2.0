import React, { createContext, useContext, useState, useEffect } from "react";

const NotepadContext = createContext();

export const NotepadProvider = ({ children }) => {
  const [notes, setNotesState] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("shared_notes");
    if (stored) setNotesState(stored);
  }, []);

  const setNotes = (text) => {
    setNotesState(text);
    localStorage.setItem("shared_notes", text);
  };

  return (
    <NotepadContext.Provider value={{ notes, setNotes }}>
      {children}
    </NotepadContext.Provider>
  );
};

export const useNotepad = () => useContext(NotepadContext);
