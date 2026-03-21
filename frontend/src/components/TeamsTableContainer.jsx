import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { STATUSES } from "../constants";
import TeamsTable from "./TeamsTable";
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

export default function TeamsTableContainer() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const mapTeam = useCallback((team) => {
    const status = team.status || "UNAVAILABLE";

    return {
      id: team.aidTeamId || team.id,
      name: team.aidTeamName || team.name,
      callNumber: team.callNumber || "",
      status,
      statusLabel: STATUSES[status]?.label || status,
      color: getStatusColor(status),
      note: team.description || team.note || "",
      workers: team.workers || [],
    };
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);

      const eventId = selectedEvent?.id;
      const url = eventId
        ? `${API_URL}/aidteam?eventId=${eventId}`
        : `${API_URL}/aidteam`;

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

      const mapped = Array.isArray(data) ? data.map(mapTeam) : [];
      setTeams(mapped);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, mapTeam]);

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

      const res = await fetch(`${API_URL}/aidteam/${statusTarget.id}`, {
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
      await fetchTeams();
    } catch (err) {
      console.error("Failed to update team status:", err);
      setStatusError(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

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
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedEvent) {
      fetchTeams();
    }
  }, [selectedEvent, fetchTeams]);

  if (loading) return <p>Teams inladen...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!teams.length) return <p>Geen teams beschikbaar</p>;

  return (
    <>
      <TeamsTable
        teams={teams}
        onStatusClick={(team) => {
          setStatusError("");
          setStatusTarget(team);
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