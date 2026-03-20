import React, { useState, useEffect } from "react";
import AidWorkersTable from "./AidWorkerTable";
import { getAidWorkers } from "../services/reportsApi";

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
          callNumber: w.callNumber,
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
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  if (loading) return <p>Hulpverleners laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>Geen hulpverleners beschikbaar</p>;

  return <AidWorkersTable workers={workers} />;
}