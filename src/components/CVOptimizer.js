"use client";
import { useState } from "react";
import { FileText, Target, ClipboardList, Pencil, Bot, XCircle, Rocket, CheckCircle, BarChart, FlaskConical, Building, Download, X, MapPin } from "lucide-react";
import ProgressSteps from "./ProgressSteps";
import ResultsTabs from "./ResultsTabs";

const PIPELINE_STEPS = [
  { label: "Extracting", desc: "Parsing job competencies" },
  { label: "Evaluating", desc: "Scoring ATS alignment" },
  { label: "Architecting", desc: "Rewriting CV sections" },
];

export default function CVOptimizer({ selectedJob, onClearJob }) {
  const [jdText, setJdText] = useState(selectedJob?.description || "");
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    if (!jdText.trim() || !cvText.trim()) {
      setError("Please fill in both the job description and your CV.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setCurrentStep(1);

    // Simulate step progress since the API does all 3 steps server-side
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 8000);
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 16000);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvText.trim(), jobDescription: jdText.trim() }),
      });

      const data = await res.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (data.success) {
        setCurrentStep(4); // All done
        setResults(data);
      } else {
        setError(data.error || "Pipeline failed. Please try again.");
        setCurrentStep(0);
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setError("Network error. Please check your connection and try again.");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJdText("");
    if (onClearJob) onClearJob();
  };

  const handleDownload = () => {
    if (!results?.optimizedCv) return;
    const blob = new Blob([results.optimizedCv], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized_cv.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="section-badge purple" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><FileText size={18} /> CV Optimizer</div>

      {/* Cross-mode banner */}
      {selectedJob && (
        <div className="alert alert-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Target size={20} /> Job imported from search: <strong>{selectedJob.title}</strong> at <strong>{selectedJob.company}</strong> · <MapPin size={18} /> {selectedJob.location}</div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
              The job description has been pre-filled below. You can edit it or paste a different one.
            </span>
          </div>
          <button className="btn btn-small" onClick={handleClear}>
            <X size={16} /> CLEAR
          </button>
        </div>
      )}

      {/* Two-column inputs */}
      <div className="two-col">
        <div>
          <label className="search-label" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><ClipboardList size={18} /> Job Description</label>
          <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Paste any job description here — from our search or anywhere else.</p>
          <textarea
            className="neo-textarea"
            placeholder={"Paste the full job description here…\n\nExample:\nWe are looking for a Senior Python Engineer…\nRequirements:\n• 5+ years of Python experience\n• FastAPI, PostgreSQL, Docker…"}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        </div>

        <div>
          <label className="search-label" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Pencil size={18} /> Your CV / Resume</label>
          <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Paste your current CV text. The AI will rewrite it to match the job.</p>
          <textarea
            className="neo-textarea"
            placeholder={"Paste your full CV / resume text here…\n\nPROFESSIONAL SUMMARY\nResults-driven software engineer…\n\nEXPERIENCE\nSoftware Engineer · Acme Corp · 2020–Present\n• Developed RESTful APIs…"}
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
          />
        </div>
      </div>

      {/* Execution */}
      <div className="section-badge green" style={{ marginTop: "2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><Bot size={18} /> Agent Execution Engine</div>

      {error && (
        <div className="alert alert-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><XCircle size={18} /> {error}</div>
      )}

      <button
        className="btn btn-primary btn-full"
        onClick={handleRun}
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      >
        {loading ? (
          <>
            <span className="spinner" /> RUNNING PIPELINE…
          </>
        ) : (
          <><Rocket size={20} /> RUN MULTI-AGENT OPTIMIZATION</>
        )}
      </button>

      {/* Progress */}
      {(loading || currentStep > 0) && currentStep <= 3 && (
        <ProgressSteps steps={PIPELINE_STEPS} currentStep={currentStep} />
      )}

      {/* Success */}
      {currentStep === 4 && !loading && (
        <div className="alert alert-success" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={18} /> ALL 3 AGENTS FINISHED SUCCESSFULLY!
        </div>
      )}

      {/* Results */}
      {results && results.success && (
        <>
          <div className="section-badge pink" style={{ marginTop: "2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><BarChart size={18} /> Results — AI Agent Outputs</div>

          <ResultsTabs
            tabs={[
              { icon: <FlaskConical size={16} />, label: "Job Extraction", content: results.extraction },
              { icon: <BarChart size={16} />, label: "ATS Critique", content: results.critique },
              { icon: <Building size={16} />, label: "Optimized CV", content: results.optimizedCv },
            ]}
          />

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
            <button className="btn btn-green" onClick={handleDownload} style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              <Download size={20} style={{ marginRight: "0.5rem" }} /> DOWNLOAD OPTIMIZED CV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
