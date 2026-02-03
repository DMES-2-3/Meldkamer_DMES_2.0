import React from "react";
import { FILTER_OPTIONS } from "../utils";

export default function FilterControls({ statusFilter, priorityFilter, onStatusChange, onPriorityChange }) {
  return (
    <div className="filters">
      <label>
        Status:
        <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}>
          {FILTER_OPTIONS.status.map(o => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label>
        Prioriteit:
        <select value={priorityFilter} onChange={e => onPriorityChange(e.target.value)}>
          {FILTER_OPTIONS.priority.map(o => <option key={o}>{o}</option>)}
        </select>
      </label>
    </div>
  );
}
