/**
 * /api/smart-match — Smart Match Endpoint
 * ────────────────────────────────────────
 * POST { cv, location, country }
 * 1. Analyzes the CV to extract skills + target role
 * 2. Searches for matching jobs using Adzuna
 * 3. Scores each job against the CV
 * Returns ranked jobs with ATS scores
 */

import { runAgent } from "@/lib/gemini";
import { fetchLiveJobs } from "@/lib/jobSearch";
import { CV_ANALYZER_PROMPT, QUICK_ATS_PROMPT } from "@/lib/agentPrompts";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { cv, location = "Dubai", country = "ae" } = body;

    if (!cv || !cv.trim()) {
      return Response.json({ error: "CV text is required." }, { status: 400 });
    }

    // ── Step 1: Analyze CV ──────────────────────────────────────────────
    const analyzerResponse = await runAgent(
      CV_ANALYZER_PROMPT,
      `Analyze the following CV and extract the required information:\n\n---\n${cv}\n---`
    );

    let cvAnalysis;
    try {
      // Strip potential markdown code fences
      const cleaned = analyzerResponse.replace(/```json\n?|```\n?/g, "").trim();
      cvAnalysis = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: "Failed to analyze CV. Please try again." },
        { status: 500 }
      );
    }

    // ── Step 2: Search for matching jobs ─────────────────────────────────
    const searchQuery = cvAnalysis.searchQuery || "Software Developer";
    const jobs = await fetchLiveJobs(searchQuery, location.trim(), country, 5);

    // ── Step 3: Score each job against CV ────────────────────────────────
    const scoredJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          const atsResponse = await runAgent(
            QUICK_ATS_PROMPT,
            `CV:\n${cv}\n\n---\n\nJob Description:\n${job.description}`
          );

          let atsResult;
          try {
            const cleaned = atsResponse.replace(/```json\n?|```\n?/g, "").trim();
            atsResult = JSON.parse(cleaned);
          } catch {
            atsResult = {
              score: 50,
              matchedKeywords: [],
              missingKeywords: [],
              summary: "Could not parse ATS score.",
            };
          }

          return {
            ...job,
            atsScore: atsResult.score,
            matchedKeywords: atsResult.matchedKeywords || [],
            missingKeywords: atsResult.missingKeywords || [],
            atsSummary: atsResult.summary || "",
          };
        } catch {
          return {
            ...job,
            atsScore: 0,
            matchedKeywords: [],
            missingKeywords: [],
            atsSummary: "Scoring failed.",
          };
        }
      })
    );

    // Sort by ATS score descending
    scoredJobs.sort((a, b) => b.atsScore - a.atsScore);

    return Response.json({
      success: true,
      cvAnalysis,
      jobs: scoredJobs,
    });
  } catch (err) {
    console.error("Smart match error:", err);
    return Response.json(
      { success: false, error: err.message || "Smart match failed." },
      { status: 500 }
    );
  }
}
