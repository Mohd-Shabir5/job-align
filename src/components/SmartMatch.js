"use client";
import { useState } from "react";
import { Target, Sparkles, FileText, MapPin, Globe, XCircle, BrainCircuit, BarChart, Check, X } from "lucide-react";
import ProgressSteps from "./ProgressSteps";

const COUNTRY_OPTIONS = [
  { code: "us", label: "🇺🇸 United States" },
  { code: "gb", label: "🇬🇧 United Kingdom" },
  { code: "in", label: "🇮🇳 India" },
  { code: "sg", label: "🇸🇬 Singapore" },
  { code: "ca", label: "🇨🇦 Canada" },
  { code: "au", label: "🇦🇺 Australia" },
];

const MATCH_STEPS = [
  { label: "Analyzing CV", desc: "Extracting skills & role" },
  { label: "Searching Jobs", desc: "Finding matching listings" },
  { label: "Scoring Matches", desc: "ATS scoring each job" },
];

export default function SmartMatch({ onOptimizeJob }) {
  const [cvText, setCvText] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("ae");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleMatch = async () => {
    if (!cvText.trim()) {
      setError("Please paste your CV text first.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setCurrentStep(1);

    const t1 = setTimeout(() => setCurrentStep(2), 5000);
    const t2 = setTimeout(() => setCurrentStep(3), 10000);

    try {
      const res = await fetch("/api/smart-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvText.trim(), location: location.trim(), country }),
      });

      const data = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);

      if (data.success) {
        setCurrentStep(4);
        setResults(data);
      } else {
        setError(data.error || "Smart match failed. Please try again.");
        setCurrentStep(0);
      }
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setError("Network error. Please check your connection.");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  return (
    <div>
      <div className="section-badge blue" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><Target size={18} /> Smart Match</div>

      <div className="neo-card">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Sparkles size={40} />
          <div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>HOW SMART MATCH WORKS</h3>
            <p style={{ fontSize: "0.95rem", margin: 0 }}>
              Upload your CV → AI extracts your skills → Finds matching jobs → Scores each one → Shows your best matches ranked by fit
            </p>
          </div>
        </div>
      </div>

      {/* CV Input */}
      <div className="two-col">
        <div>
          <label className="search-label" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FileText size={18} /> Your CV / Resume</label>
          <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Paste your full CV text. We&apos;ll find jobs that match your skills.</p>
          <textarea
            className="neo-textarea"
            placeholder={"Paste your full CV / resume text here…\n\nPROFESSIONAL SUMMARY\nResults-driven software engineer with 5 years…\n\nEXPERIENCE\nSoftware Engineer · Acme Corp · 2020–Present\n• Developed RESTful APIs serving 10M+ daily requests…\n\nSKILLS\nPython, Flask, MySQL, AWS EC2, Git, Linux"}
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
          />
        </div>

        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="search-label" style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><MapPin size={18} /> Preferred Location</label>
            <input
              className="neo-input"
              type="text"
              placeholder="e.g. Dubai, London, New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="search-label" style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Globe size={18} /> Country</label>
            <select
              className="neo-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <button
              className="btn btn-pink btn-full"
              onClick={handleMatch}
              disabled={loading || !cvText.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" /> MATCHING…
                </>
              ) : (
                <><Target size={20} /> FIND MY BEST MATCHES</>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><XCircle size={18} /> {error}</div>
      )}

      {/* Progress */}
      {(loading || (currentStep > 0 && currentStep <= 3)) && (
        <ProgressSteps steps={MATCH_STEPS} currentStep={currentStep} />
      )}

      {/* Results */}
      {results && results.success && (
        <div style={{ marginTop: "2rem" }}>
          {/* CV Analysis Summary */}
          {results.cvAnalysis && (
            <div className="neo-card" style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><BrainCircuit size={24} /> AI CV ANALYSIS</h3>
              <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 800 }}>Detected Role</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-purple)" }}>{results.cvAnalysis.searchQuery || "N/A"}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 800 }}>Experience Level</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{results.cvAnalysis.experienceLevel || "N/A"}</div>
                </div>
              </div>
              {results.cvAnalysis.skills && results.cvAnalysis.skills.length > 0 && (
                <div className="keywords-row">
                  {results.cvAnalysis.skills.map((skill, i) => (
                    <span key={i} className="keyword-chip matched">{skill}</span>
                  ))}
                </div>
              )}
              {results.cvAnalysis.summary && (
                <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
                  {results.cvAnalysis.summary}
                </p>
              )}
            </div>
          )}

          {/* Matched Jobs */}
          <div className="section-badge green" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><BarChart size={18} /> MATCHED JOBS</div>
          <p style={{ fontWeight: 800, marginBottom: "1.5rem" }}>
            FOUND <span style={{ color: "var(--brand-purple)", fontSize: "1.2rem" }}>{results.jobs?.length || 0}</span> MATCHING JOBS, RANKED BY ATS FIT
          </p>

          {(results.jobs || []).map((job, idx) => (
            <div key={idx} className="match-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div className="match-rank">#{idx + 1} MATCH</div>
                  <h4 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{job.title}</h4>
                  <div style={{ fontWeight: 800, color: "var(--brand-purple)", fontSize: "1rem" }}>{job.company}</div>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={16} /> {job.location}</div>
                </div>
                <div className={`ats-score-badge ${getScoreClass(job.atsScore)}`}>
                  {job.atsScore}
                  <small>ATS</small>
                </div>
              </div>

              {job.atsSummary && (
                <div className="alert alert-info" style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
                  {job.atsSummary}
                </div>
              )}

              {/* Keywords */}
              <div className="keywords-row" style={{ marginBottom: "1.5rem" }}>
                {(job.matchedKeywords || []).slice(0, 5).map((kw, i) => (
                  <span key={`m-${i}`} className="keyword-chip matched" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><Check size={14} /> {kw}</span>
                ))}
                {(job.missingKeywords || []).slice(0, 5).map((kw, i) => (
                  <span key={`x-${i}`} className="keyword-chip missing" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><X size={14} /> {kw}</span>
                ))}
              </div>

              <div>
                <button
                  className="btn btn-purple"
                  onClick={() => onOptimizeJob(job)}
                >
                  ✨ OPTIMIZE CV FOR THIS JOB
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state before search */}
      {!loading && !results && currentStep === 0 && !error && (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-icon"><Target size={48} /></div>
          <h3>AI-POWERED JOB MATCHING</h3>
          <p>Paste your CV above and let AI find the best-fitting jobs for your skills.</p>
        </div>
      )}
    </div>
  );
}
