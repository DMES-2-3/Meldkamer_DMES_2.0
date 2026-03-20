import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { STATUSES } from "../constants";
import TeamsTable from "./TeamsTable";
import { apiUrl } from "../config/api";

export default function TeamsTableContainer() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchTeams = useCallback(async () => {
    const API_URL = `${apiUrl()}/v1`;
    try {
      const eventId = selectedEvent?.id;
      const url = eventId
        ? `${API_URL}/aidteam?eventId=${eventId}`
        : `${API_URL}/aidteam`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response: " + text.substring(0, 100));
      }

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

      const mapped = data.map((team) => ({
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
      setError(err.message);
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
      return;
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
