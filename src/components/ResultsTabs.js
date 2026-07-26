"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ResultsTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="tabs">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`tab-btn ${i === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content neo-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {tabs[activeTab]?.content || ""}
        </ReactMarkdown>
      </div>
    </div>
  );
}

