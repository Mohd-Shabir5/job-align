"use client";
import { Search, FileText, Target } from "lucide-react";

const MODES = [
  { id: "search",    icon: <Search size={20} strokeWidth={2.5} />, label: "Job Search" },
  { id: "optimizer", icon: <FileText size={20} strokeWidth={2.5} />, label: "CV Optimizer" },
  { id: "smart",     icon: <Target size={20} strokeWidth={2.5} />, label: "Smart Match" },
];

export default function ModeNav({ activeMode, onModeChange }) {
  return (
    <nav className="mode-nav">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className={`mode-nav-btn ${activeMode === mode.id ? "active" : ""}`}
          onClick={() => onModeChange(mode.id)}
        >
          <span className="nav-icon" style={{ display: "flex", alignItems: "center" }}>{mode.icon}</span>
          <span className="nav-label">{mode.label}</span>
        </button>
      ))}
    </nav>
  );
}
