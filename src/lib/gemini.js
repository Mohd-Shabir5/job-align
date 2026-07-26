/**
 * gemini.js — Shared Google Gemini GenAI Client
 * ──────────────────────────────────────────────
 * Provides a reusable function to call Gemini with a system prompt
 * and a user message. Used by all API routes.
 */

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAgent(systemPrompt, userMessage, retries = 3) {
  const client = getClient();
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
        },
      });
      return response.text;
    } catch (error) {
      // If we hit a 429 Rate Limit and we have retries left, wait and try again
      if (
        (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) 
        && i < retries - 1
      ) {
        console.warn(`Hit Gemini rate limit. Retrying in 25 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(25000); // Wait 25 seconds
      } else {
        throw error; // If it's not a rate limit, or we are out of retries, throw it
      }
    }
  }
}
