import { useState, useEffect } from "react";

const MAPS_URL = "http://localhost:8080/src/api/v1/index.php/maps";

export default function useMapData(setMessage) {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(MAPS_URL);
      const data = await res.json();
      if (res.ok) setMaps(data.data || []);
      else setMessage?.({ type: "error", text: data.error || "Failed to fetch maps" });
    } catch (err) {
      setMessage?.({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaps(); }, []);

  return { maps, refreshMaps: fetchMaps, loading };
}
