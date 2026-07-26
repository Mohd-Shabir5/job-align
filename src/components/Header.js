"use client";
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="header-grid">
      {/* Brand Column */}
      <div className="header-brand">
        <div className="header-brand-icon">
          <Zap size={48} strokeWidth={2.5} />
        </div>
        <h1>JOBALIGN AI</h1>
        <p>AI-Powered Career Discovery</p>
      </div>

      {/* Main Title Column */}
      <div className="header-main">
        <div className="header-main-badge">
          AI-DRIVEN • SMARTER SEARCH • BETTER MATCHES
        </div>
        <h2>
          FIND JOBS.<br />
          <span className="highlight-purple">PERFECT MATCH.</span>
        </h2>
        <p>
          Job search &amp; multi-agent CV optimizer<br />
          powered by Google Gemini.
        </p>
      </div>

      {/* Features Column */}
      <div className="header-stats">
        <div className="stat-item">
          <div className="stat-value">Search</div>
          <div className="stat-label">Live Job Listings</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">Optimize</div>
          <div className="stat-label">AI CV Tailoring</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">Match</div>
          <div className="stat-label">Smart AI Scoring</div>
        </div>
      </div>
    </header>
  );
}
