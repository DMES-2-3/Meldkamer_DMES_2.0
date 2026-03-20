import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { STATUSES } from "../constants";
import TeamsTable from "./TeamsTable";
import { getUnits } from "../services/unitsApi";

export default function TeamsTableContainer() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      const eventId = selectedEvent?.id ?? null;
      const data = await getUnits(eventId);

      const statusConfig = {
        REGISTERED: { color: "#10B981" },
        AVAILABLE: { color: "#10B981" },
        NOTIFICATION: { color: "#F59E0B" },
        WAIT: { color: "#3B82F6" },
        SHORT_BREAK: { color: "#3B82F6" },
        LONG_BREAK: { color: "#3B82F6" },
        SIGNED_OUT: { color: "#6B7280" },
        ACTIVE: { color: "#10B981" },
        BUSY: { color: "#F59E0B" },
        RESOLVED: { color: "#6B7280" },
        UNAVAILABLE: { color: "#6B7280" },
      };

      const mapped = (Array.isArray(data) ? data : []).map((team) => ({
        id: team.aidTeamId || team.id,
        name: team.aidTeamName || team.name,
        callNumber: team.callNumber,
        status: team.status || "UNAVAILABLE",
        statusLabel: STATUSES[team.status]?.label || team.status,
        color: statusConfig[team.status]?.color || "#6B7280",
        note: team.description || team.note || "",
        workers: team.workers || [],
      }));

      setTeams(mapped);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setError(err.message || "Onbekende fout");
    } finally {
      setLoading(false);
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

  return <TeamsTable teams={teams} />;
}