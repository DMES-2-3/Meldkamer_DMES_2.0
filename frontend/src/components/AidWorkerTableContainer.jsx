import React, { useState, useEffect } from "react"; 
import AidWorkersTable from "./AidWorkerTable";
import { getAidWorkers } from "../services/reportsApi";

const DUMMY_WORKERS = [
  {
    id: 1,
    callNumber: "A-10",
    name: "John Doe",
    workerType: "Medic",
    note: "Experienced",
    status: "AVAILABLE",
    color: "#10B981",
    teamName: "Alpha Team",
  },
];

export default function AidWorkersTableContainer({ selectedEventId }) 
{
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => 
  {
    if (!selectedEventId) return;

    const fetchWorkers = async () => 
    {
      setLoading(true);
      try 
      {
        const data = await getAidWorkers({ eventId: selectedEventId });
        setWorkers(data || []);
        setError(null);
      } 
      catch (err) 
      {
        console.error("Failed to fetch aid workers:", err);
        setError(err.message);
        setWorkers(DUMMY_WORKERS);
      } 
      finally 
      {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [selectedEventId]);

  if (loading) return <p>Hulpverleners laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!workers.length) return <p>Geen hulpverleners beschikbaar voor dit evenement</p>;

  return <AidWorkersTable workers={workers} />;
}