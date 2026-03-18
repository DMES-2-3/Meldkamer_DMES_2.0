import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEvents,
  addEvent,
  deleteEventById,
  updateEvent,
} from "../services/eventsApi"; // Use eventsApi for real backend
import "../Events.css";
import dmesLogo from "../assets/logos/DMES_Vierkant_Logo.png";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";

export default function EventsPage() {

  const { user, clearUser } = useAuth();
  const [events, setEvents] = useState([]);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("createdAt_desc"); // Default sort

  // Info side-panel (read-only)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Add/Edit side-panel (form)
  const [showEdit, setShowEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editEvent, setEditEvent] = useState({
    id: null,
    name: "",
    postcode: "",
  });

  // Toast notification
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    variant: "success",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data || []);
      } catch (err) {
        console.error("Failed to load events", err);
      }
    };

    loadEvents();
  }, []);

  const reloadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to reload events", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Weet je zeker dat je dit evenement wilt verwijderen?"))
      return;

    try {
      await deleteEventById(id);
      await reloadEvents();
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Er is iets misgegaan bij het verwijderen van het evenement.");
    }
  };

  const handleEventClick = (event) => {
    const normalized = {
      ...event,
      name: event.name || event.eventName || "",
    };
    localStorage.setItem("selected_event", JSON.stringify(normalized));
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/user/logout`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Clear any localStorage data
      localStorage.removeItem("selected_event");

      // Clear the auth context so Protected doesn't redirect back
      clearUser();

      // Navigate to login regardless of response status
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Clear localStorage and navigate even if API call fails
      localStorage.removeItem("selected_event");
      clearUser();
      navigate("/login", { replace: true });
    }
  };

  // INFO PANEL
  const openInfo = (event) => {
    setSelectedEvent(event);
    setShowInfo(true);
  };

  const closeInfo = () => {
    setShowInfo(false);
    setSelectedEvent(null);
  };

  // ADD PANEL (new event)
  const openAddPanel = () => {
    setIsEditing(false);

    setEditEvent({
      id: null,
      name: "",
      postcode: "",
    });
    setShowEdit(true);
  };

  // EDIT PANEL (existing event)
  const openEditPanelFromInfo = () => {
    if (!selectedEvent) return;

    setIsEditing(true);

    setEditEvent({
      id: selectedEvent.id,
      name: selectedEvent.name || selectedEvent.eventName || "",
      postcode: selectedEvent.postcode || "",
    });

    setShowEdit(true);
    setShowInfo(false);
  };

  const closeEditPanel = () => {
    setShowEdit(false);
  };

  const handleEditChange = (field, value) => {
    if (field === "postcode") {
      setEditEvent((prev) => ({ ...prev, postcode: value.trim() }));
      return;
    }

    setEditEvent((prev) => ({ ...prev, [field]: value }));
  };

  const showToast = (message, variant = "success", duration = 2500) => {
    setToast({ visible: true, message, variant });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  const handleSaveEvent = async () => {
    const trimmedName = editEvent.name.trim();

    if (!trimmedName) {
      alert("Naam is verplicht.");
      return;
    }

    const trimmedPostcode = (editEvent.postcode || "").trim();

    if (!/^[0-9]{4}[A-Za-z]{2}$/.test(trimmedPostcode)) {
      alert("Ongeldige postcode. Gebruik bijvoorbeeld 3511AD.");
      return;
    }

    const payload = {
      id: editEvent.id || undefined,
      name: trimmedName,
      postcode: trimmedPostcode,
    };

    try {
      const isCreate = !isEditing || !payload.id;

      if (isEditing && payload.id) {
        await updateEvent(payload);
      } else {
        await addEvent(payload);
      }

      await reloadEvents();

      setShowEdit(false);

      if (isCreate) {
        showToast("Evenement is succesvol aangemaakt.", "success");
      } else {
        showToast("Evenement is succesvol bijgewerkt.", "success");
      }
    } catch (err) {
      console.error("Failed to save event", err);
      alert("Er is iets misgegaan bij het opslaan van het evenement.");
    }
  };

  // Sort and filter events for display
  const processedEvents = useMemo(() => {
    const [key, direction] = sortOption.split("_");

    // 1. Sort the array
    const sorted = [...events].sort((a, b) => {
      const valA = a[key] || "";
      const valB = b[key] || "";

      let comparison = 0;
      // Locale-aware string comparison for names
      if (key === "name") {
        comparison = valA.localeCompare(valB, "nl", { sensitivity: "base" });
      } else {
        // Standard comparison for dates or other values
        if (valA > valB) {
          comparison = 1;
        } else if (valA < valB) {
          comparison = -1;
        }
      }

      return direction === "desc" ? comparison * -1 : comparison;
    });

    // 2. Filter the sorted array
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return sorted; // Return sorted list if no search term
    }

    return sorted.filter((e) => {
      const name = (e.name || e.eventName || "").toLowerCase();
      return name.includes(term);
    });
  }, [events, sortOption, searchTerm]);

  return (
    <div className="events-page">
      <div className="events-header">
        <img
          src={dmesLogo}
          alt="Dutch Medical Event Service"
          style={{ height: "40px", width: "auto", marginRight: "auto" }}
        />
        {user?.isAdmin && (
          <button
            className="register-user-button"
            onClick={() => navigate("/register")}
          >
            Registreer Gebruiker
          </button>
        )}
        <button className="logout-button" onClick={handleLogout}>
          Uitloggen
        </button>
      </div>

      <div className="events-card">
        <div className="events-card-header">
          <span>
            <label>Evenementen</label>
          </span>
          <div className="events-header-controls">
            <select
              className="events-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="createdAt_desc">Nieuwste eerst</option>
              <option value="createdAt_asc">Oudste eerst</option>
              <option value="name_asc">Alfabetisch (A-Z)</option>
              <option value="name_desc">Alfabetisch (Z-A)</option>
              <option value="updatedAt_desc">Laatst bijgewerkt</option>
            </select>
            <input
              type="text"
              className="events-search-input"
              placeholder="Zoek evenement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="events-list">
          {processedEvents.length === 0 ? (
            <div className="events-empty">
              {events.length === 0
                ? "Nog geen evenementen toegevoegd."
                : "Geen evenementen gevonden voor deze zoekopdracht."}
            </div>
          ) : (
            processedEvents.map((e) => (
              <button
                key={e.id}
                className="event-row"
                type="button"
                onClick={() => handleEventClick(e)}
              >
                <span className="event-name">{e.name || e.eventName}</span>

                <span
                  className="event-info"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    openInfo(e);
                  }}
                  aria-label="Informatie over evenement"
                  title="Info"
                >
                  ℹ
                </span>

                <span
                  className="event-delete"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDelete(e.id);
                  }}
                  aria-label="Verwijder evenement"
                  title="Verwijderen"
                >
                  🗑
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer: only the button that opens the side modal */}
      <div className="events-footer">
        <button className="event-add" onClick={openAddPanel}>
          Voeg evenement toe
        </button>
      </div>

      {/* INFO SIDE MODAL */}
      {showInfo && selectedEvent && (
        <div className="event-info-backdrop" onClick={closeInfo}>
          <aside
            className="event-info-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="event-info-header">
              <h2>{selectedEvent.name || selectedEvent.eventName}</h2>
              <div className="event-info-header-actions">
                <button
                  type="button"
                  className="btn-edit-event"
                  onClick={openEditPanelFromInfo}
                >
                  Bewerken
                </button>
                <button
                  className="event-info-close"
                  type="button"
                  onClick={closeInfo}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="event-info-body">
              <div className="event-info-row">
                <span className="event-info-label">Naam</span>
                <span className="event-info-value">
                  {selectedEvent.name || selectedEvent.eventName}
                </span>
              </div>
              <div className="event-info-row">
                <span className="event-info-label">Postcode</span>
                <span className="event-info-value">
                  {selectedEvent.postcode}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {showEdit && (
        <div className="event-info-backdrop" onClick={closeEditPanel}>
          <aside
            className="event-info-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="event-info-header">
              <h2>{isEditing ? "Evenement bewerken" : "Nieuw evenement"}</h2>

              <button
                className="event-info-close"
                type="button"
                onClick={closeEditPanel}
              >
                ×
              </button>
            </div>

            <div className="event-info-body">
              <div className="event-form-group">
                <label className="event-info-label">Naam *</label>

                <input
                  type="text"
                  className="event-form-input"
                  value={editEvent.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Naam van het evenement"
                />
              </div>

              <div className="event-form-group">
                <label className="event-info-label">Postcode *</label>

                <input
                  type="text"
                  className="event-form-input"
                  value={editEvent.postcode || ""}
                  onChange={(e) => handleEditChange("postcode", e.target.value)}
                  placeholder="Bijv. 3511AD"
                />
              </div>
            </div>

            <div className="event-form-footer">
              <button
                type="button"
                className="btn-cancel-event"
                onClick={closeEditPanel}
              >
                Annuleren
              </button>

              <button
                type="button"
                className="btn-save-event"
                onClick={handleSaveEvent}
              >
                Opslaan
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Toast notification */}
      <div
        className={`toast-container ${
          toast.visible ? "toast-visible" : "toast-hidden"
        } ${toast.variant === "success" ? "toast-success" : ""}`}
      >
        <span className="toast-message">{toast.message}</span>
      </div>
    </div>
  );
}
