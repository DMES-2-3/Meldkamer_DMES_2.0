import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
} from "../services/unitsApi";
import { STATUSES, UNIT_STATUSES } from "../constants";
import TeamModal from "../components/TeamModal";
import WorkerModal from "../components/WorkerModal";
import "../UnitsPage.css";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const getStatusLabelClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "label-green";
    case "NOTIFICATION":
      return "label-yellow";
    case "WAIT":
      return "label-blue";
    case "ACTIVE":
      return "label-green";
    case "BUSY":
      return "label-yellow";
    default:
      return "label-gray";
  }
};

const statusLabel = (status) =>
  UNIT_STATUSES[status]?.label ?? STATUSES[status]?.label ?? status;

const UNIT_STATUS_OPTIONS = Object.entries(UNIT_STATUSES).map(
  ([value, { label }]) => ({
    value,
    label,
    className: getStatusLabelClass(value),
  }),
);

const WORKER_STATUS_OPTIONS = Object.entries(STATUSES).map(
  ([value, { label }]) => ({
    value,
    label,
    className: getStatusLabelClass(value),
  }),
);

// ---------------------------------------------------------------------------
// SectionCards — dark header bar + cards grid
// ---------------------------------------------------------------------------

function SectionCards({ title, accent, items, emptyMsg }) {
  return (
    <section className="up-section">
      <div className="up-section-header">
        <span>{title}</span>
        <span className="up-section-count">{items.length}</span>
      </div>
      <div className="up-cards-wrapper">
        {items.length === 0 ? (
          <div className="up-td-empty">{emptyMsg}</div>
        ) : (
          <div className="units-unit-list">{items}</div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reusable form primitives
// ---------------------------------------------------------------------------

function Field({ label, error, children }) {
  return (
    <div className="up-field">
      {label && <label className="up-field-label">{label}</label>}
      {children}
      {error && <span className="up-field-error">{error}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      className="up-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      className="up-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }) {
  return (
    <div className="up-modal-backdrop" onClick={onClose}>
      <div className="up-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-modal-header">
          <h2 className="up-modal-title">{title}</h2>
          <button className="up-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="up-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status picker modal
// ---------------------------------------------------------------------------

function StatusPickerModal({
  title,
  currentStatus,
  options,
  saving,
  apiError,
  onClose,
  onSelect,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      {apiError && <div className="up-api-error">{apiError}</div>}

      <div className="up-status-picker">
        <p className="up-status-picker-subtitle">
          Kies een status. Na selectie wordt de status direct bijgewerkt.
        </p>

        <div className="up-status-legend">
          {options.map((option) => {
            const active = option.value === currentStatus;

            return (
              <button
                key={option.value}
                type="button"
                className={`up-status-option ${active ? "up-status-option--active" : ""}`}
                onClick={() => onSelect(option.value)}
                disabled={saving}
              >
                <span className={`unit-label ${option.className}`}>
                  {option.label}
                </span>

                <span className="up-status-option-check">
                  {active ? "✓ Huidig" : "Selecteer"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="up-modal-footer">
        <button
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Sluiten
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------

function DeleteModal({ label, onClose, onConfirm, deleting }) {
  return (
    <Modal title="Verwijderen bevestigen" onClose={onClose}>
      <p className="up-delete-msg">
        Weet je zeker dat je <strong>{label}</strong> wilt verwijderen?
      </p>
      <div className="up-modal-footer">
        <button
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={deleting}
        >
          Annuleren
        </button>
        <button
          className="up-btn up-btn-danger"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? "Verwijderen…" : "Verwijderen"}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Workers tab
// ---------------------------------------------------------------------------

function WorkersTab({ eventId, workers = [], reloadData }) {
  const [localWorkers, setLocalWorkers] = useState([]);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    setLocalWorkers(workers);
  }, [workers]);

  const handleEditClick = (worker) => {
    setEditTarget(worker);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      await deleteWorker(deleteTarget.id);
      setDeleteTarget(null);
      if (reloadData) await reloadData();
    } catch (err) {
      setError("Fout bij verwijderen: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleWorkerStatusChange = async (newStatus) => {
    if (!statusTarget) return;

    if (newStatus === statusTarget.status) {
      setStatusTarget(null);
      setStatusError("");
      return;
    }

    setStatusSaving(true);
    setStatusError("");

    try {
      await updateWorker(statusTarget.id, {
        ...statusTarget,
        status: newStatus,
        eventId,
      });

      setStatusTarget(null);
      if (reloadData) await reloadData();
    } catch (err) {
      setStatusError("Fout bij wijzigen status: " + err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const renderWorkerCard = (w, isAssigned) => (
    <div key={w.id} className="unit-card" onClick={() => setEditTarget(w)}>
      <div className="unit-card-header">
        <span className="unit-team-name">
          {w.firstName} {w.lastName}
        </span>
        <span
          className="up-delete-icon"
          onClick={(ev) => {
            ev.stopPropagation();
            setDeleteTarget(w);
          }}
          title="Verwijderen"
        >
          🗑
        </span>
      </div>
      <div className="unit-card-body">
        <span className={`unit-label ${getStatusLabelClass(w.status)}`}>
          {w.callNumber}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          {w.workerType}
        </span>
      </div>
      {isAssigned && (
        <div style={{ marginTop: "-4px" }}>
          <span className="up-team-badge">{w.teamName}</span>
        </div>
      )}
      <div className="unit-card-footer">
        <span
          className={`up-status-pill up-status-pill--${w.status?.toLowerCase()}`}
        >
          {statusLabel(w.status)}
        </span>
        <span className="up-td-muted" style={{ fontSize: "12px" }}>
          {w.updatedAt
            ? new Date(w.updatedAt).toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </span>
      </div>
      {w.note && <div className="up-td-note">{w.note}</div>}
    </div>
  );

  const unassigned = workers.filter((w) => !w.teamId);
  const assigned = workers.filter((w) => !!w.teamId);

  const unassignedCards = unassigned.map((w) => renderWorkerCard(w, false));
  const assignedCards = assigned.map((w) => renderWorkerCard(w, true));

  return (
    <div className="up-tab-content">
      <div className="up-tab-toolbar">
        <span className="up-tab-count">
          {localWorkers.length} hulpverlener(s)
        </span>
        <button
          className="up-btn up-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Toevoegen
        </button>
      </div>

      {error && <div className="up-api-error">{error}</div>}

      {!workers ? (
        <div className="up-loading">Laden…</div>
      ) : localWorkers.length === 0 ? (
        <div className="up-empty">
          Nog geen hulpverleners. Klik op "+ Toevoegen" om te beginnen.
        </div>
      ) : (
        <>
          <SectionCards
            title="Geen Team"
            accent="#6b7280"
            items={unassignedCards}
            emptyMsg="Alle hulpverleners zijn ingedeeld in een team"
          />
          <SectionCards
            title="In Team"
            accent="#1e1b4b"
            items={assignedCards}
            emptyMsg="Nog geen hulpverleners ingedeeld in een team"
          />
        </>
      )}

      {showAdd && (
        <WorkerModal
          eventId={eventId}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            if (reloadData) reloadData();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "shared_report_update" }),
            );
          }}
        />
      )}

      {editTarget && (
        <WorkerModal
          worker={editTarget}
          eventId={eventId}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            if (reloadData) reloadData();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "shared_report_update" }),
            );
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          label={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {statusTarget && (
        <StatusPickerModal
          title={`Status wijzigen — ${statusTarget.firstName} ${statusTarget.lastName}`}
          currentStatus={statusTarget.status}
          options={WORKER_STATUS_OPTIONS}
          saving={statusSaving}
          apiError={statusError}
          onClose={() => {
            setStatusTarget(null);
            setStatusError("");
          }}
          onSelect={handleWorkerStatusChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teams tab
// Three sections:
//   "Aangemeld"      — AVAILABLE + NOTIFICATION
//   "Wacht"            — WAIT only
//   "Afgemeld" — SHORT_BREAK + LONG_BREAK + UNAVAILABLE
// ---------------------------------------------------------------------------

function TeamsTab({ eventId, units = [], reloadData }) {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    setTeams(units);
  }, [units]);

  const handleEditClick = async (team) => {
    try {
      const res = await getUnit(team.id);
      setEditTarget(res?.data ?? res);
    } catch {
      setEditTarget(team);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      await deleteUnit(deleteTarget.id);
      setDeleteTarget(null);
      if (reloadData) await reloadData();
    } catch (err) {
      setError("Fout bij verwijderen: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleTeamStatusChange = async (newStatus) => {
    if (!statusTarget) return;

    if (newStatus === statusTarget.status) {
      setStatusTarget(null);
      setStatusError("");
      return;
    }

    setStatusSaving(true);
    setStatusError("");

    try {
      await updateUnit(statusTarget.id, {
        ...statusTarget,
        status: newStatus,
        eventId,
        workerIds: statusTarget.workers?.map((w) => w.id) ?? [],
      });

      setStatusTarget(null);
      if (reloadData) await reloadData();
    } catch (err) {
      setStatusError("Fout bij wijzigen status: " + err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const renderTeamCard = (t) => {
    const workerCount = t.workerCount ?? t.workers?.length ?? 0;

    return (
      <div key={t.id} className="unit-card" onClick={() => handleEditClick(t)}>
        <div className="unit-card-header">
          <span className="unit-team-name">{t.name}</span>
          <span
            className="up-delete-icon"
            onClick={(ev) => {
              ev.stopPropagation();
              setDeleteTarget(t);
            }}
            title="Verwijderen"
          >
            🗑
          </span>
        </div>
        <div className="unit-card-body">
          {t.callNumber ? (
            <span className={`unit-label ${getStatusLabelClass(t.status)}`}>
              {t.callNumber}
            </span>
          ) : (
            <span className="up-td-muted">—</span>
          )}
          <span className="up-team-badge">
            {workerCount} hulpverlener{workerCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="unit-card-footer">
          <span
            className={`up-status-pill up-status-pill--${t.status?.toLowerCase()}`}
          >
            {statusLabel(t.status)}
          </span>
          <span className="up-td-muted" style={{ fontSize: "12px" }}>
            {t.updatedAt
              ? new Date(t.updatedAt).toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>
        {t.note && <div className="up-td-note">{t.note}</div>}
      </div>
    );
  };

  const wachtrij = teams.filter((t) => t.status === "WAIT");
  const aangemeld = teams.filter((t) =>
    ["AVAILABLE", "NOTIFICATION"].includes(t.status),
  );
  const afgemeld = teams.filter((t) =>
    ["SHORT_BREAK", "LONG_BREAK", "SIGNED_OUT"].includes(t.status),
  );

  return (
    <div className="up-tab-content">
      <div className="up-tab-toolbar">
        <span className="up-tab-count">{teams.length} team(s)</span>
        <button
          className="up-btn up-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Aanmaken
        </button>
      </div>

      {error && <div className="up-api-error">{error}</div>}

      {!units ? (
        <div className="up-loading">Laden…</div>
      ) : teams.length === 0 ? (
        <div className="up-empty">
          Nog geen teams. Voeg eerst hulpverleners toe, daarna kun je hier een
          team aanmaken.
        </div>
      ) : (
        <>
          <SectionCards
            title="Aangemeld"
            accent="#1e1b4b"
            items={aangemeld.map(renderTeamCard)}
            emptyMsg="Geen aangemelde teams"
          />
          <SectionCards
            title="Wachtrij"
            accent="#1d6fb5"
            items={wachtrij.map(renderTeamCard)}
            emptyMsg="Geen teams in de wachtrij"
          />
          <SectionCards
            title="Afgemeld"
            accent="#6b7280"
            items={afgemeld.map(renderTeamCard)}
            emptyMsg="Geen afgemelde teams"
          />
        </>
      )}

      {showAdd && (
        <TeamModal
          eventId={eventId}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            if (reloadData) reloadData();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "shared_report_update" }),
            );
          }}
        />
      )}

      {editTarget && (
        <TeamModal
          team={editTarget}
          eventId={eventId}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            if (reloadData) reloadData();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "shared_report_update" }),
            );
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.name}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {statusTarget && (
        <StatusPickerModal
          title={`Status wijzigen — ${statusTarget.name}`}
          currentStatus={statusTarget.status}
          options={UNIT_STATUS_OPTIONS}
          saving={statusSaving}
          apiError={statusError}
          onClose={() => {
            setStatusTarget(null);
            setStatusError("");
          }}
          onSelect={handleTeamStatusChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function UnitsPage({ units = [], workers = [], reloadData }) {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("units_active_tab") || "teams";
  });

  useEffect(() => {
    sessionStorage.setItem("units_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + N om een nieuwe melding te maken
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        navigate("/melding");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (!stored) {
      navigate("/events");
      return;
    }

    try {
      setSelectedEvent(JSON.parse(stored));
    } catch {
      navigate("/events");
    }
  }, [navigate]);

  if (!selectedEvent) return null;

  return (
    <div className="units-wrapper">
      <div className="up-tabs">
        <button
          className={`up-tab ${activeTab === "teams" ? "up-tab--active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams
        </button>
        <button
          className={`up-tab ${activeTab === "workers" ? "up-tab--active" : ""}`}
          onClick={() => setActiveTab("workers")}
        >
          Hulpverleners
        </button>
      </div>

      {activeTab === "teams" ? (
        <TeamsTab
          eventId={selectedEvent.id}
          units={units}
          reloadData={reloadData}
        />
      ) : (
        <WorkersTab
          eventId={selectedEvent.id}
          workers={workers}
          reloadData={reloadData}
        />
      )}
    </div>
  );
}
