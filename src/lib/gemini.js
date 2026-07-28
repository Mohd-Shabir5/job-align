/**
 * gemini.js — Shared Google Gemini GenAI Client
 * ──────────────────────────────────────────────
 * Provides a reusable function to call Gemini with a system prompt
 * and a user message. Used by all API routes.
 */

// Import the Google GenAI library so we can talk to Gemini
import { GoogleGenAI } from "@google/genai";

// We're using the fast and cheap flash model for this project!
const MODEL = "gemini-2.5-flash";

// Keep track of our client so we don't keep recreating it
let _client = null;

// Helper function to set up our connection to Google
function getClient() {
  if (!_client) {
    // Grab our secret key from the environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    // Crash the app if the key is missing (so we know to fix it!)
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    
    // Create the actual client
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * Run a single "agent" call — sends a system instruction + user message
 * to Gemini and returns the text response.
 *
 * @param {string} systemPrompt — The agent's system instruction
 * @param {string} userMessage  — The user's input message
 * @returns {Promise<string>}   — The model's text response
 */
// A small trick to pause execution for a bit (useful for waiting)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAgent(systemPrompt, userMessage, retries = 3) {
  // Get our configured client
  const client = getClient();
  
  // Try calling the AI up to a certain number of times
  for (let i = 0; i < retries; i++) {
    try {
      // Send the prompt and user message to Gemini
      const response = await client.models.generateContent({
        model: MODEL,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
        },
      });
      // Give back just the text part of the answer
      return response.text;
    } catch (error) {
      // Fail immediately if it's a daily quota issue
      if (error?.message?.includes("GenerateRequestsPerDay") || error?.message?.includes("generativelanguage.googleapis.com/generate_content_free_tier_requests")) {
        throw new Error("Gemini API daily quota exceeded. Please check your plan or use a different API key.");
      }

      // If we hit a 429 Rate Limit and we have retries left, wait and try again
      if (
        (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) 
        && i < retries - 1
      ) {
        console.warn(`Hit Gemini rate limit. Retrying in 5 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(5000); // Wait 5 seconds
      } else {
        throw error; // If it's not a rate limit, or we are out of retries, throw it
      }
    }
  }
}
