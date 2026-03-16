import React, { useState, useEffect } from "react"; 
import AidWorkersTable from "./AidWorkerTable";
import { getAidWorkers } from "../services/reportsApi";

const DUMMY_WORKERS = [
  {
    id: 1,
    callNumber: "A-10",
    name: "John Doe",
    role: "Medic",
    note: "Experienced",
    status: "AVAILABLE",
    color: "#10B981",
    teamName: "Alpha Team",
    eventId: 1, 
  },
];

export default function AidWorkersTableContainer({ selectedEventId }) 
{
  const [allWorkers, setAllWorkers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Haal alle workers op
  useEffect(() => 
  {
    const fetchWorkers = async () => 
    {
      setLoading(true);
      try 
      {
        const data = await getAidWorkers();
        setAllWorkers(data || []);
        setError(null);
      } 
      catch (err) 
      {
        console.error("Failed to fetch aid workers:", err);
        setError(err.message);
        setAllWorkers(DUMMY_WORKERS);
      } 
      finally 
      {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Filter op geselecteerd evenement
  useEffect(() => 
  {
    if (!selectedEventId) return;
    const filtered = allWorkers.filter(w => w.eventId === selectedEventId);
    setWorkers(filtered.map(w => ({
      id: w.id,
      callNumber: w.callNumber,
      name: w.name,
      role: w.role || "N/A",
      note: w.note || "",
      status: w.status || "AVAILABLE",
      color: w.color || "#10B981",
      teamName: w.teamName || "N/A",
    })));
  }, [allWorkers, selectedEventId]);

  if (loading) return <p>Hulpverleners laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>Geen hulpverleners beschikbaar voor dit evenement</p>;

  return <AidWorkersTable workers={workers} />;
}