import React from "react";
import { FILTER_OPTIONS } from "../utils";

export default function FilterControls({ statusFilter, priorityFilter, onStatusChange, onPriorityChange }) {
  return (
    <div 
      className="filters"
      style={{ display: "flex", gap: 16, alignItems: "center"}}>
      <div>
        <span style={{ marginRight: 8, fontWeight: "bold"}}>
          Status:
        </span>
          <select  
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value)}
            style={{border: "1.5px solid #dddddd",borderRadius: 4, padding: 4, width: 120}}
            >
            {FILTER_OPTIONS.status.map(o => <option key={o}>{o}</option>)}
          </select>
      </div>
      <div>
        <span style={{ marginRight: 8, fontWeight: "bold"}}>
          Prioriteit:
        </span>
          <select 
            value={priorityFilter} 
            onChange={e => onPriorityChange(e.target.value)}
            style={{border: "1.5px solid #dddddd",borderRadius: 4, padding: 4, width: 120}}>
            {FILTER_OPTIONS.priority.map(o => <option key={o}>{o}</option>)}
          </select>
      </div>
    </div>
  );
}
