/**
 * /api/jobs — Job Search Endpoint
 * ────────────────────────────────
 * POST { query, location, country }
 * Returns an array of job listings from Adzuna (or mock fallback).
 */

import { fetchLiveJobs } from "@/lib/jobSearch";

export async function POST(request) {
  try {
    // Read the incoming request data
    const body = await request.json();
    const { query, location = "Dubai", country = "us" } = body;

    // Make sure the user actually typed something in the search box
    if (!query || !query.trim()) {
      return Response.json(
        { error: "Search query is required." },
        { status: 400 }
      );
    }

    // Call our helper function to go fetch the jobs from the internet
    const jobs = await fetchLiveJobs(query.trim(), location.trim(), country);

    // Send the jobs back to the webpage!
    return Response.json({ jobs });
  } catch (err) {
    // If something blows up, catch the error and send a friendly message
    console.error("Job search error:", err);
    return Response.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
