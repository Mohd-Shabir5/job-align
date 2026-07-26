"""
agents.py — Multi-Agent CV Optimization Pipeline
─────────────────────────────────────────────────
Three specialised ADK agents powered by Google Gemini work sequentially:

    1. Job Extract Agent   → Parses a raw JD into structured competencies
    2. ATS Critic Agent    → Scores CV fit and identifies keyword gaps
    3. CV Architect Agent  → Rewrites CV sections with missing keywords

Orchestration uses Google ADK's Runner + InMemorySessionService.
"""

import os
import time
from dotenv import load_dotenv

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# ── Load environment variables (fallback for non-Streamlit contexts) ─────────
load_dotenv()


# ═════════════════════════════════════════════════════════════════════════════
# AGENT 1 — Job Extract Agent
# Extracts structured competencies from a raw job description.
# ═════════════════════════════════════════════════════════════════════════════

job_extract_agent = Agent(
    name="JobExtractAgent",
    model="gemini-2.5-flash",
    instruction="""You are an expert technical recruiter and job description analyst.

Your task is to analyze a raw job description and extract a structured breakdown.

OUTPUT FORMAT (use exactly these headings with markdown):

## Technical Competencies
- List every specific technology, framework, language, and tool mentioned.

## Experience Level
- State the seniority level (Junior / Mid / Senior / Lead / Principal).
- Note years of experience required if mentioned.

## Core Responsibilities
- List the 3–5 main duties in concise bullet points.

## Soft Skills & Culture Signals
- List any mentioned soft skills, team culture, or work-style expectations.

## Must-Have vs Nice-to-Have
- Clearly separate mandatory requirements from preferred/bonus qualifications.

Be thorough. Do NOT add competencies that are not mentioned in the job description.
Do NOT summarise — extract every relevant detail.""",
)


# ═════════════════════════════════════════════════════════════════════════════
# AGENT 2 — ATS Critic Agent
# Compares a CV against the extracted competencies and scores the fit.
# ═════════════════════════════════════════════════════════════════════════════

ats_critic_agent = Agent(
    name="ATSCriticAgent",
    model="gemini-2.5-flash",
    instruction="""You are an ATS (Applicant Tracking System) simulation engine and career coach.

You will receive TWO inputs:
1. A structured list of job competencies (from the Job Extract Agent).
2. The user's raw CV / resume text.

Perform the following analysis:

## ATS Compatibility Score
- Calculate a semantic fit score from 0 to 100.
- Base this on keyword overlap, experience alignment, and skills coverage.
- Display the score prominently: **Score: XX/100**

## Matched Keywords ✅
- List all keywords and skills from the job that ARE present in the CV.

## Missing Keywords ❌
- List all keywords and skills from the job that are ABSENT from the CV.
- Prioritise them: Critical (must-add) vs Nice-to-Have.

## Gap Analysis
- For each critical gap, explain WHY it matters and suggest how the candidate
  could address it (e.g. reframe existing experience, add a project, etc.)

## Structural Feedback
- Comment on CV formatting issues that could hurt ATS parsing (e.g. missing
  sections, inconsistent date formats, graphics-heavy layouts).

Be specific and actionable. Do not use vague praise.""",
)


# ═════════════════════════════════════════════════════════════════════════════
# AGENT 3 — CV Architect Agent
# Rewrites CV sections to improve ATS alignment without fabricating experience.
# ═════════════════════════════════════════════════════════════════════════════

cv_architect_agent = Agent(
    name="CVArchitectAgent",
    model="gemini-2.5-flash",
    instruction="""You are an elite CV/resume writer specialising in ATS-optimised resumes.

You will receive THREE inputs:
1. The user's original CV text.
2. The extracted job competencies.
3. The gap analysis from the ATS Critic.

Your task is to REWRITE specific CV sections to maximise ATS compatibility.

RULES:
- NEVER fabricate or invent experience, projects, or skills the user doesn't have.
- ONLY reframe, reword, and restructure existing content.
- Inject missing keywords ONLY where they genuinely apply to existing experience.
- Use strong, action-oriented verbs (Engineered, Orchestrated, Spearheaded, etc.)

OUTPUT FORMAT:

## Optimised Professional Summary
- Rewrite the professional summary / objective to align with the target role.
- Naturally weave in 3–5 high-priority missing keywords.

## Rewritten Experience Bullets
- For each relevant role in the CV, rewrite 2–3 bullet points.
- Show BEFORE → AFTER for each bullet so the user sees exactly what changed.
- Bold the injected keywords.

## Suggested Skills Section
- Provide a reformatted skills section grouped by category (Languages, Frameworks,
  Tools, Cloud, Soft Skills) that mirrors the job description's terminology.

## Keywords Injected
- List every keyword you added and where it was placed.

Be precise. The user must be able to copy-paste your output directly.""",
)


# ═════════════════════════════════════════════════════════════════════════════
# ORCHESTRATION — Sequential Pipeline
# ═════════════════════════════════════════════════════════════════════════════

def _run_single_agent(agent: Agent, prompt: str, api_key: str) -> str:
    """
    Execute a single ADK agent and collect its text output.
    Bridges the sync/async boundary since ADK's Runner and SessionService
    are async in the latest version.

    Args:
        agent:   The ADK Agent instance to run.
        prompt:  The user message to send.
        api_key: Gemini API key for the session.

    Returns:
        The concatenated text output from the agent.
    """
    import asyncio

    async def _execute():
        # Set the API key in the environment for the genai client
        os.environ["GOOGLE_API_KEY"] = api_key

        # Create a fresh session service and runner per agent call
        session_service = InMemorySessionService()
        runner = Runner(
            agent=agent,
            app_name="CVOptimizer",
            session_service=session_service,
        )

        # Create a session (async in latest ADK)
        session = await session_service.create_session(
            app_name="CVOptimizer",
            user_id="cv_user",
        )

        # Build the user message
        message = types.Content(
            role="user",
            parts=[types.Part(text=prompt)],
        )

        # Run the agent and collect output (async generator in latest ADK)
        output_parts = []
        async for event in runner.run_async(
            user_id="cv_user",
            session_id=session.id,
            new_message=message,
        ):
            if (
                hasattr(event, "content")
                and event.content
                and event.content.role == "model"
            ):
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        output_parts.append(part.text)

        return "".join(output_parts)

    # Bridge sync → async: use asyncio.run() for a clean event loop
    # If we're already in an event loop (e.g., Streamlit), use nest_asyncio
    try:
        loop = asyncio.get_running_loop()
        # We're inside an existing event loop (Streamlit uses one)
        import nest_asyncio
        nest_asyncio.apply()
        return loop.run_until_complete(_execute())
    except RuntimeError:
        # No running loop — safe to use asyncio.run()
        return asyncio.run(_execute())



def run_cv_optimization_pipeline(
    user_cv: str,
    job_description: str,
    api_key: str,
    progress_callback=None,
) -> dict:
    """
    Execute the full 3-agent CV optimization pipeline.

    Args:
        user_cv:            The user's raw CV/resume text.
        job_description:    The target job description text.
        api_key:            Gemini API key.
        progress_callback:  Optional callable(step: int, label: str) for UI updates.

    Returns:
        A dict with keys:
            - "extraction":   Output from the Job Extract Agent
            - "critique":     Output from the ATS Critic Agent
            - "optimized_cv": Output from the CV Architect Agent
            - "success":      Boolean indicating if the pipeline completed
            - "error":        Error message if something failed (else None)
    """
    results = {
        "extraction":   "",
        "critique":     "",
        "optimized_cv": "",
        "success":      False,
        "error":        None,
    }

    try:
        # ── Step 1: Extract Job Competencies ─────────────────────────────────
        if progress_callback:
            progress_callback(1, "Extracting job competencies…")

        extraction_prompt = (
            f"Analyze the following job description and extract all competencies:\n\n"
            f"---\n{job_description}\n---"
        )
        results["extraction"] = _run_single_agent(
            job_extract_agent, extraction_prompt, api_key
        )

        # ── Step 2: ATS Critique ─────────────────────────────────────────────
        if progress_callback:
            progress_callback(2, "Evaluating CV gaps…")

        critique_prompt = (
            f"Here are the extracted job competencies:\n\n"
            f"{results['extraction']}\n\n"
            f"---\n\n"
            f"And here is the candidate's CV:\n\n"
            f"{user_cv}\n\n"
            f"---\n\n"
            f"Perform a full ATS compatibility analysis."
        )
        results["critique"] = _run_single_agent(
            ats_critic_agent, critique_prompt, api_key
        )

        # ── Step 3: CV Architect ─────────────────────────────────────────────
        if progress_callback:
            progress_callback(3, "Architecting optimized CV…")

        architect_prompt = (
            f"Here is the candidate's original CV:\n\n"
            f"{user_cv}\n\n"
            f"---\n\n"
            f"Here are the extracted job competencies:\n\n"
            f"{results['extraction']}\n\n"
            f"---\n\n"
            f"Here is the gap analysis:\n\n"
            f"{results['critique']}\n\n"
            f"---\n\n"
            f"Rewrite the CV sections to maximise ATS compatibility. "
            f"Do NOT fabricate any experience."
        )
        results["optimized_cv"] = _run_single_agent(
            cv_architect_agent, architect_prompt, api_key
        )

        results["success"] = True

    except Exception as exc:
        results["error"] = str(exc)

    return results
