import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnits,
  updateUnit,
  createUnit,
  deleteUnit,
} from "../services/unitsApi";
import { STATUSES } from "../constants";
import "../UnitsPage.css";

// Check of het roepnummer het juiste formaat heeft
const isValidCallNumber = (callNumber) => {
  const regex = /^\d{2}-\d{2}$/;
  return regex.test(callNumber);
};

const getStatusLabelClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "label-green";
    case "NOTIFICATION":
      return "label-yellow";
    case "WAIT":
      return "label-blue";
    default:
      return "label-gray";
  }
};

const mapUnitFromApi = (u) => ({
  id: u.aidTeamId || u.id,
  callNumber: u.callNumber,
  teamName: u.aidTeamName || u.name,
  status: u.status,
  note: u.description || u.note,
  updatedAt: u.updatedAt,
});

export default function UnitsPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("edit"); // "edit", "add" of "delete"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formUnit, setFormUnit] = useState({
    callNumber: "",
    teamName: "",
    status: "",
    note: "",
  });

  const resetForm = () => {
    setFormUnit({
      callNumber: "",
      teamName: "",
      status: "",
      note: "",
    });
    setError("");
  };

  const fetchUnits = useCallback(async () => {
    try {
      const eventId = selectedEvent?.id;
      const data = await getUnits(eventId);
      const mapped = (data || []).map(mapUnitFromApi);
      setUnits(mapped);
    } catch (err) {
      setError("Fout bij het ophalen van eenheden: " + err.message);
    }
  }, [selectedEvent]);

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (!stored) {
      navigate("/events");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setSelectedEvent(parsed);
    } catch {
      navigate("/events");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedEvent) {
      fetchUnits();
    }
  }, [selectedEvent, fetchUnits]);

  const handleAddUnit = async () => {
    // Add mode validatie: alles verplicht behalve note
    if (!formUnit.callNumber || !formUnit.teamName || !formUnit.status) {
      setError("Roepnummer, teamnaam en status zijn verplicht");
      return;
    }

    // Controleer formaat roepnummer
    if (!isValidCallNumber(formUnit.callNumber)) {
      setError("Roepnummer moet het formaat xx-xx hebben");
      return;
    }

    try {
      await createUnit({
        ...formUnit,
        aidTeamName: formUnit.teamName,
        description: formUnit.note,
        eventId: selectedEvent?.id,
      });
      await fetchUnits();
      resetForm();
      setMode("edit");
    } catch (err) {
      setError("Fout bij het toevoegen van eenheid: " + err.message);
    }
  };

  const handleEditUnit = async () => {
    // Edit mode validatie
    if (!formUnit.callNumber) {
      setError("Selecteer eerst een roepnummer");
      return;
    }

    const found = units.find((u) => u.callNumber === formUnit.callNumber);
    if (!found) {
      setError("Eenheid niet gevonden");
      return;
    }

    // Controleer of er minstens één wijziging is
    if (!formUnit.status && !formUnit.note) {
      setError("Voer minimaal één wijziging in");
      return;
    }

    try {
      await updateUnit(found.id, {
        aidTeamName: found.teamName,
        status: formUnit.status || found.status,
        description: formUnit.note || found.note,
        eventId: selectedEvent?.id,
      });
      await fetchUnits();
      resetForm();
    } catch (err) {
      setError("Fout bij het bijwerken van eenheid: " + err.message);
    }
  };

  const handleDeleteUnit = async () => {
    // Delete mode validatie
    if (!formUnit.callNumber) {
      setError("Selecteer eerst een roepnummer om te verwijderen");
      return;
    }

    const found = units.find((u) => u.callNumber === formUnit.callNumber);
    if (!found) {
      setError("Eenheid niet gevonden");
      return;
    }

    if (
      !window.confirm(
        `Weet je zeker dat je eenheid ${found.callNumber} wilt verwijderen?`,
      )
    )
      return;

    try {
      await deleteUnit(found.id);
      await fetchUnits();
      resetForm();
    } catch (err) {
      setError("Fout bij het verwijderen van eenheid: " + err.message);
    }
  };

  const onSubmit = async () => {
    if (mode === "add") await handleAddUnit();
    else if (mode === "edit") await handleEditUnit();
    else if (mode === "delete") await handleDeleteUnit();
  };

  const groups = {
    Wachtrij: units.filter((u) => STATUSES[u.status]?.group === "Wachtrij"),
    Aangemeld: units.filter((u) => STATUSES[u.status]?.group === "Aangemeld"),
    Afgemeld: units.filter((u) => STATUSES[u.status]?.group === "Afgemeld"),
  };

  return (
    <div className="units-wrapper">
      <div className="units-actionbar-wrapper">
        {error && <div className="units-error">{error}</div>}

        <div className="units-actionbar">
          {mode === "edit" || mode === "delete" ? (
            <select
              value={formUnit.callNumber}
              onChange={(e) =>
                setFormUnit({ ...formUnit, callNumber: e.target.value })
              }
            >
              <option value="">
                {mode === "delete"
                  ? "Kies te verwijderen roepnummer"
                  : "Kies roepnummer"}
              </option>
              {[...new Set(units.map((u) => u.callNumber))].map((cn) => (
                <option key={cn} value={cn}>
                  {cn}
                </option>
              ))}
            </select>
          ) : (
            <input
              placeholder="Roepnummer"
              value={formUnit.callNumber}
              onChange={(e) =>
                setFormUnit({ ...formUnit, callNumber: e.target.value })
              }
            />
          )}

          {mode === "add" && (
            <input
              placeholder="Teamnaam"
              value={formUnit.teamName}
              onChange={(e) =>
                setFormUnit({ ...formUnit, teamName: e.target.value })
              }
            />
          )}

          {mode !== "delete" && (
            <>
              <select
                value={formUnit.status}
                onChange={(e) =>
                  setFormUnit({ ...formUnit, status: e.target.value })
                }
              >
                <option value="">Status</option>
                {Object.entries(STATUSES).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <input
                placeholder="Notitie"
                value={formUnit.note}
                onChange={(e) =>
                  setFormUnit({ ...formUnit, note: e.target.value })
                }
                className="units-input-note"
              />
            </>
          )}

          <button className="units-btn-update" onClick={onSubmit}>
            {mode === "add"
              ? "Toevoegen"
              : mode === "delete"
                ? "Verwijderen"
                : "Bijwerken"}
          </button>
        </div>

        <div className="units-mode-toggle">
          <span
            className={mode === "add" ? "active" : ""}
            onClick={() => {
              setMode("add");
              resetForm();
            }}
          >
            Toevoegen
          </span>{" "}
          |{" "}
          <span
            className={mode === "edit" ? "active" : ""}
            onClick={() => {
              setMode("edit");
              resetForm();
            }}
          >
            Bewerken
          </span>{" "}
          |{" "}
          <span
            className={mode === "delete" ? "active" : ""}
            onClick={() => {
              setMode("delete");
              resetForm();
            }}
          >
            Verwijderen
          </span>
        </div>
      </div>

      {/* 3 SECTIES */}
      {Object.entries(groups).map(([groupName, list]) => (
        <section key={groupName} className="units-section">
          <div className="units-section-header">{groupName}</div>

          <div className="units-unit-list">
            {list.length === 0 && (
              <div className="units-empty">Geen eenheden</div>
            )}

            {list.map((u) => (
              <div key={u.id} className="unit-card">
                <div className={`unit-label ${getStatusLabelClass(u.status)}`}>
                  {u.callNumber}
                </div>

                <div className="unit-team-name">{u.teamName}</div>

                {u.updatedAt && (
                  <div className="unit-updated">
                    {STATUSES[u.status]?.label || u.status} –{" "}
                    {new Date(u.updatedAt).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
