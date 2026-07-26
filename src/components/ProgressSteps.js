"use client";
import { Check } from "lucide-react";

export default function ProgressSteps({ steps, currentStep }) {
  return (
    <div className="progress-steps">
      {steps.map((step, i) => {
        let state = "";
        if (i + 1 < currentStep) state = "completed";
        else if (i + 1 === currentStep) state = "active";

        return (
          <div key={i} className={`progress-step ${state}`}>
            <div className="step-num">
              {state === "completed" ? <Check size={20} strokeWidth={4} /> : i + 1}
            </div>
            <div className="step-info">
              <span className="step-label">{step.label}</span>
              <span className="step-desc">{step.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
