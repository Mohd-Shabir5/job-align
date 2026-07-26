"use client";
import { useState } from "react";
import { Zap, Target, TrendingUp, ShieldCheck, Search, MapPin, ArrowRight } from "lucide-react";

const COUNTRY_OPTIONS = [
  { code: "us", label: "🇺🇸 United States" },
  { code: "gb", label: "🇬🇧 United Kingdom" },
  { code: "in", label: "🇮🇳 India" },
  { code: "sg", label: "🇸🇬 Singapore" },
  { code: "ca", label: "🇨🇦 Canada" },
  { code: "au", label: "🇦🇺 Australia" },
];

export default function JobSearch({ onSelectJob }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("us");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), location: location.trim(), country }),
      });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div>
      <div className="search-container">
        <div className="search-header">
          <h3>SEARCH YOUR NEXT OPPORTUNITY</h3>
        </div>
        
        <div className="search-bar">
          <div className="search-input-group">
            <label className="search-label" htmlFor="search-query">Keywords or Job Title</label>
            <input
              id="search-query"
              className="neo-input"
              type="text"
              placeholder="e.g. Python Developer, Data Engineer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="search-input-group">
            <label className="search-label" htmlFor="search-location">Location</label>
            <input
              id="search-location"
              className="neo-input"
              type="text"
              placeholder="City, state, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="search-input-group">
            <label className="search-label" htmlFor="search-country">Country</label>
            <select
              id="search-country"
              className="neo-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="search-input-group">
            <button className="search-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? <span className="spinner" /> : "SEARCH JOBS"}
            </button>
          </div>
        </div>

        <div className="search-footer">
          <span style={{ fontSize: "0.85rem", fontWeight: "800", textTransform: "uppercase" }}>POPULAR SEARCHES:</span>
          <div className="popular-searches">
            <span className="popular-tag" onClick={() => setQuery("Data Analyst")}>DATA ANALYST</span>
            <span className="popular-tag" onClick={() => setQuery("Software Engineer")}>SOFTWARE ENGINEER</span>
            <span className="popular-tag" onClick={() => setQuery("Product Manager")}>PRODUCT MANAGER</span>
            <span className="popular-tag" onClick={() => setQuery("UI/UX Designer")}>UI/UX DESIGNER</span>
            <span className="popular-tag" onClick={() => setQuery("AI Engineer")}>AI ENGINEER</span>
          </div>
        </div>
      </div>

      {/* Feature Cards below search, as seen in image */}
      {!searched && !loading && (
        <div className="cards-grid">
          <div className="feature-card yellow">
            <div className="feature-icon"><Zap size={32} /></div>
            <h3>AI-POWERED MATCHING</h3>
            <p>Advanced AI finds the perfect jobs for your skills</p>
            <div className="feature-arrow"><ArrowRight size={24} /></div>
          </div>
          <div className="feature-card purple">
            <div className="feature-icon"><Target size={32} /></div>
            <h3>SMART FILTERS</h3>
            <p>Refine results with intelligent filters and preferences</p>
            <div className="feature-arrow"><ArrowRight size={24} /></div>
          </div>
          <div className="feature-card yellow">
            <div className="feature-icon"><TrendingUp size={32} /></div>
            <h3>REAL-TIME UPDATES</h3>
            <p>New opportunities added every hour</p>
            <div className="feature-arrow"><ArrowRight size={24} /></div>
          </div>
          <div className="feature-card white">
            <div className="feature-icon"><ShieldCheck size={32} /></div>
            <h3>VERIFIED COMPANIES</h3>
            <p>All companies verified and trusted</p>
            <div className="feature-arrow"><ArrowRight size={24} /></div>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ marginTop: "2rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="job-card" style={{ height: "120px", opacity: 0.5, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && jobs.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <p style={{ fontWeight: 800, marginBottom: "1rem" }}>
            FOUND <span style={{ color: "var(--brand-purple)", fontSize: "1.2rem" }}>{jobs.length}</span> LISTINGS
          </p>
          {jobs.map((job, idx) => (
            <div key={idx} className="job-card">
              <div className="job-card-header">
                <div>
                  <h4>{job.title}</h4>
                  <div className="company">{job.company}</div>
                </div>
                <div className="location" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={16} /> {job.location}</div>
              </div>
              <p className="desc">
                {job.description.length > 280
                  ? job.description.slice(0, 280) + "…"
                  : job.description}
              </p>
              <div>
                <button
                  className="btn btn-purple"
                  onClick={() => onSelectJob(job)}
                >
                  SELECT &amp; ALIGN CV <ArrowRight size={18} style={{ marginLeft: "0.25rem" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && searched && jobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Search size={48} /></div>
          <h3>NO JOBS FOUND</h3>
          <p>Try different keywords or a different location.</p>
        </div>
      )}
    </div>
  );
}
