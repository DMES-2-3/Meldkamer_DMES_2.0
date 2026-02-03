import React, { useState, useEffect } from "react";
import AidWorkersTable from "./AidWorkerTable";

const DUMMY_WORKERS = [
  {
    id: 1,
    name: "John Doe",
    role: "Medic",
    note: "Experienced",
    status: "AVAILABLE",
    color: "#10B981",
    teamName: "Alpha Team",
  },
];

export default function AidWorkersTableContainer() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      const API_URL = "http://localhost:8080/src/api/v1/aidworker";
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const text = await res.text();
        let data = JSON.parse(text);

        if (data && typeof data === "object" && Array.isArray(data.data)) {
          data = data.data;
        }

        if (!Array.isArray(data))
          throw new Error("API response is not an array");

        const mapped = data.map((w) => ({
          id: w.id,
          name: w.name,
          role: w.role || "N/A",
          note: w.note || "",
          status: w.status || "AVAILABLE",
          color: w.color || "#10B981",
          teamName: w.teamName || "N/A",
        }));

        setWorkers(mapped);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch aid workers:", err);
        setError(err.message);
        setWorkers(DUMMY_WORKERS);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  if (loading) return <p>Loading aid workers…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>No aid workers available</p>;

  return <AidWorkersTable workers={workers} />;
}
