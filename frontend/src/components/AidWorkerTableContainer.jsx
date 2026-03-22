import React, { useState, useEffect, useCallback } from "react";
import { STATUSES } from "../constants";
import AidWorkersTable from "./AidWorkerTable";
import StatusPickerModal from "./StatusPickerModal";

const API_URL = "http://localhost:8080/src/api/v1";

const getStatusColor = (status) => {
  const statusConfig = {
    REGISTERED: "#10B981",
    AVAILABLE: "#10B981",
    NOTIFICATION: "#F59E0B",
    WAIT: "#3B82F6",
    SHORT_BREAK: "#3B82F6",
    LONG_BREAK: "#3B82F6",
    SIGNED_OUT: "#6B7280",
    ACTIVE: "#10B981",
    BUSY: "#F59E0B",
    RESOLVED: "#6B7280",
    UNAVAILABLE: "#6B7280",
  };

  return statusConfig[status] || "#6B7280";
};

const STATUS_OPTIONS = Object.entries(STATUSES).map(([value, config]) => ({
  value,
  label: config.label,
  color: getStatusColor(value),
}));

export default function AidWorkersTableContainer({ selectedEventId }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const mapWorker = useCallback((w) => {
    // ondersteunt zowel flat objecten als wrapped objecten
    const worker = w.AidWorker || w;

    const firstName = worker.firstName || "";
    const lastName = worker.lastName || "";
    const fullName =
      worker.name || `${firstName} ${lastName}`.trim() || "Onbekende hulpverlener";

    const status = worker.status || "AVAILABLE";

    return {
      id: worker.id,
      callNumber: worker.callNumber || worker.callSign || "",
      name: fullName,
      role: worker.role || worker.workerType || "N/A",
      note: worker.note || worker.description || "",
      status,
      statusLabel: STATUSES[status]?.label || status,
      color: worker.color || getStatusColor(status),
      teamName: worker.teamName || worker.team?.name || "N/A",
    };
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);

      const url = selectedEventId
        ? `${API_URL}/aidworker?eventId=${selectedEventId}`
        : `${API_URL}/aidworker`;

      console.log("Fetching aid workers from:", url);

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response: " + text.substring(0, 100));
      }

      console.log("Aid worker response:", data);

      const mapped = Array.isArray(data) ? data.map(mapWorker) : [];
      setWorkers(mapped);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch aid workers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, mapWorker]);

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
      await fetchWorkers();
    } catch (err) {
      console.error("Failed to update worker status:", err);
      setStatusError(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  if (loading) return <p>Hulpverleners laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>Geen hulpverleners beschikbaar</p>;

  return (
    <>
      <AidWorkersTable
        workers={workers}
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