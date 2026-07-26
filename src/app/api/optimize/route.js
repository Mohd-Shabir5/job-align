/**
 * /api/optimize — 3-Agent CV Optimization Pipeline
 * ─────────────────────────────────────────────────
 * POST { cv, jobDescription }
 * Runs the sequential pipeline:
 *   1. Job Extract Agent → Parses JD into competencies
 *   2. ATS Critic Agent  → Scores CV fit and finds gaps
 *   3. CV Architect Agent → Rewrites CV sections
 */

import { runAgent } from "@/lib/gemini";
import {
  JOB_EXTRACT_PROMPT,
  ATS_CRITIC_PROMPT,
  CV_ARCHITECT_PROMPT,
} from "@/lib/agentPrompts";

export const runtime = "edge";
export const maxDuration = 60; // Allow up to 60s for the 3-step pipeline

export async function POST(request) {
  try {
    const body = await request.json();
    const { cv, jobDescription } = body;

    if (!cv || !cv.trim()) {
      return Response.json({ error: "CV text is required." }, { status: 400 });
    }
    if (!jobDescription || !jobDescription.trim()) {
      return Response.json({ error: "Job description is required." }, { status: 400 });
    }

    // ── Step 1: Extract Job Competencies ──────────────────────────────────
    const extractionPrompt = `Analyze the following job description and extract all competencies:\n\n---\n${jobDescription}\n---`;
    const extraction = await runAgent(JOB_EXTRACT_PROMPT, extractionPrompt);

    // ── Step 2: ATS Critique ──────────────────────────────────────────────
    const critiquePrompt =
      `Here are the extracted job competencies:\n\n${extraction}\n\n---\n\n` +
      `And here is the candidate's CV:\n\n${cv}\n\n---\n\n` +
      `Perform a full ATS compatibility analysis.`;
    const critique = await runAgent(ATS_CRITIC_PROMPT, critiquePrompt);

    // ── Step 3: CV Architect ──────────────────────────────────────────────
    const architectPrompt =
      `Here is the candidate's original CV:\n\n${cv}\n\n---\n\n` +
      `Here are the extracted job competencies:\n\n${extraction}\n\n---\n\n` +
      `Here is the gap analysis:\n\n${critique}\n\n---\n\n` +
      `Rewrite the CV sections to maximise ATS compatibility. Do NOT fabricate any experience.`;
    const optimizedCv = await runAgent(CV_ARCHITECT_PROMPT, architectPrompt);

    return Response.json({
      success: true,
      extraction,
      critique,
      optimizedCv,
    });
  } catch (err) {
    console.error("Optimization pipeline error:", err);
    return Response.json(
      { success: false, error: err.message || "Pipeline failed." },
      { status: 500 }
    );
  }
}
