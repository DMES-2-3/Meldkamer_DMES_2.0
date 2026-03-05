import React, { useState, useEffect } from "react";
import AidWorkersTable from "./AidWorkerTable";
import { getAidWorkers } from "../services/reportsApi";

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
      try {
        const data = await getAidWorkers();

        const mapped = (data || []).map((w) => ({
          id: w.id,
          name: w.name,
          role: w.role || "N/A",
          note: w.description || "",
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

  if (loading) return <p>Aid workers laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>Geen aid workers beschikbaar</p>;

  return <AidWorkersTable workers={workers} />;
}