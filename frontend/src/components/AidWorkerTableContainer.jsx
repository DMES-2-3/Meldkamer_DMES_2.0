import React, { useState, useEffect, useCallback } from "react";
import { STATUSES } from "../constants";
import AidWorkersTable from "./AidWorkerTable";
import StatusPickerModal from "./StatusPickerModal";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/src/api/v1`;

const getStatusColor = (status) => {
  const statusConfig = {
    REGISTERED: "#10B981",   // groen
    AVAILABLE: "#10B981",    // groen
    ACTIVE: "#10B981",       // groen

    NOTIFICATION: "#F59E0B", // oranje
    BUSY: "#F59E0B",         // oranje

    WAIT: "#3B82F6",         // blauw
    SHORT_BREAK: "#6366F1",  // indigo / paarsblauw
    LONG_BREAK: "#8B5CF6",   // paars

    SIGNED_OUT: "#6B7280",   // grijs
    RESOLVED: "#6B7280",     // grijs
    UNAVAILABLE: "#6B7280",  // grijs
  };

  return statusConfig[status] || "#6B7280";
};

const getStatusLabel = (status) => {
  const fallbackLabels = {
    AVAILABLE: "Beschikbaar",
    SHORT_BREAK: "Korte pauze",
    LONG_BREAK: "Lange pauze",
    WAIT: "Wacht",
    NOTIFICATION: "Oproep",
    SIGNED_OUT: "Uitgelogd",
    ACTIVE: "Actief",
    BUSY: "Bezet",
    UNAVAILABLE: "Niet beschikbaar",
    REGISTERED: "Geregistreerd",
    RESOLVED: "Afgerond",
  };

  return STATUSES?.[status]?.label || fallbackLabels[status] || status;
};

const STATUS_OPTIONS = Object.keys(STATUSES).map((value) => ({
  value,
  label: getStatusLabel(value),
  color: getStatusColor(value),
}));

export default function AidWorkersTableContainer({ workers = [] }) {
  const [mappedWorkers, setMappedWorkers] = useState([]);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const mapWorker = useCallback((w) => {
    const firstName = w.firstName || w.firstname || "";
    const lastName = w.lastName || w.lastname || "";
    const fullName =
      w.name || `${firstName} ${lastName}`.trim() || "Onbekende hulpverlener";

    const status = w.status || "AVAILABLE";

    const workerType =
      w.aidWorkerType ||
      w.workerType ||
      w.role ||
      w.type ||
      "N/A";

    return {
      id: w.id || w.aidWorkerId,
      name: fullName,
      callNumber: w.callNumber || w.callSign || "",
      status,
      statusLabel: getStatusLabel(status),
      color: getStatusColor(status),
      workerType,
      type: workerType,
      role: workerType,
      note: w.note || w.description || "",
      teamName:
        w.teamName ||
        w.team?.name ||
        w.AidTeam?.name ||
        `TEST${w.FK_AidTeam ?? ""}` ||
        "N/A",
    };
  }, []);

  useEffect(() => {
    setMappedWorkers(workers.map(mapWorker));
  }, [workers, mapWorker]);

  const handleStatusChange = async (newStatus) => {
    if (!statusTarget) return;

    if (newStatus === statusTarget.status) {
      setStatusTarget(null);
      setStatusError("");
      return;
    }

    try {
      setStatusSaving(true);
      setStatusError("");

      const res = await fetch(`${API_URL}/aidworker/${statusTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP error! Status: ${res.status}`);
      }

      setStatusTarget(null);
      window.dispatchEvent(new StorageEvent("storage", { key: "shared_report_update" }));
    } catch (err) {
      console.error("Failed to update worker status:", err);
      setStatusError(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  if (!mappedWorkers.length) return <p>Geen hulpverleners beschikbaar</p>;

  return (
    <>
      <AidWorkersTable
        workers={mappedWorkers}
        onStatusClick={(worker) => {
          setStatusError("");
          setStatusTarget(worker);
        }}
      />

      {statusTarget && (
        <StatusPickerModal
          title={`Status wijzigen — ${statusTarget.name}`}
          currentStatus={statusTarget.status}
          options={STATUS_OPTIONS}
          saving={statusSaving}
          error={statusError}
          onClose={() => {
            if (statusSaving) return;
            setStatusTarget(null);
            setStatusError("");
          }}
          onSelect={handleStatusChange}
        />
      )}
    </>
  );
}