"use client";
import { useState } from "react";
import { Zap, Bot, BrainCircuit } from "lucide-react";
import Header from "@/components/Header";
import ModeNav from "@/components/ModeNav";
import JobSearch from "@/components/JobSearch";
import CVOptimizer from "@/components/CVOptimizer";
import SmartMatch from "@/components/SmartMatch";

export default function Home() {
  const [activeMode, setActiveMode] = useState("search");
  const [selectedJob, setSelectedJob] = useState(null);

  // Called when user selects a job from Job Search to optimize against
  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setActiveMode("optimizer");
  };

  // Called when user clears the imported job in CV Optimizer
  const handleClearJob = () => {
    setSelectedJob(null);
  };

  // Called from Smart Match when user clicks "Optimize CV for this job"
  const handleOptimizeJob = (job) => {
    setSelectedJob(job);
    setActiveMode("optimizer");
  };

  return (
    <div className="app-container">
      <Header />
      <ModeNav activeMode={activeMode} onModeChange={setActiveMode} />

      {activeMode === "search" && (
        <JobSearch onSelectJob={handleSelectJob} />
      )}

      {activeMode === "optimizer" && (
        <CVOptimizer selectedJob={selectedJob} onClearJob={handleClearJob} />
      )}

      {activeMode === "smart" && (
        <SmartMatch onOptimizeJob={handleOptimizeJob} />
      )}

      <footer className="footer">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap", justifyContent: "center" }}>
          Built with <Zap size={14} /> Next.js · <Bot size={14} /> Google Gemini · <BrainCircuit size={14} /> Multi-Agent AI
        </div>
        <br />
        <span>JobAlign AI v3.0</span>
      </footer>
    </div>
  );
}
