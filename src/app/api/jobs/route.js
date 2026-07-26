/**
 * /api/jobs — Job Search Endpoint
 * ────────────────────────────────
 * POST { query, location, country }
 * Returns an array of job listings from Adzuna (or mock fallback).
 */

import { fetchLiveJobs } from "@/lib/jobSearch";

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, location = "Dubai", country = "ae" } = body;

    if (!query || !query.trim()) {
      return Response.json(
        { error: "Search query is required." },
        { status: 400 }
      );
    }

    const jobs = await fetchLiveJobs(query.trim(), location.trim(), country);

    return Response.json({ jobs });
  } catch (err) {
    console.error("Job search error:", err);
    return Response.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
