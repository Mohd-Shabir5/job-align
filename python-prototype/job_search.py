"""
job_search.py — Live Job Search Module
───────────────────────────────────────
Queries the Adzuna public job board API to fetch real job listings.
Falls back to a curated mock dataset if the API is unreachable, keys are
missing, or rate limits are hit — ensuring the UI never crashes.
"""

import requests
import streamlit as st
from typing import Optional


# ─── Adzuna API Configuration ──────────────────────────────────────────────────
# Country codes: gb=UK, us=USA, ae=UAE, au=Australia, de=Germany, etc.
ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
DEFAULT_COUNTRY = "ae"       # UAE — covers Dubai
DEFAULT_PAGE    = 1
RESULTS_PER_PAGE = 10


SUPPORTED_COUNTRIES = [
    "at", "au", "be", "br", "ca", "ch", "de", "es", "fr", "gb", "in", "it",
    "mx", "nl", "nz", "pl", "sg", "us", "za"
]

def fetch_live_jobs(
    query: str,
    location: str = "Dubai",
    country: str = DEFAULT_COUNTRY,
    max_results: int = RESULTS_PER_PAGE,
) -> list[dict]:
    """
    Fetch live job listings from Adzuna.

    Args:
        query:       Search keywords (e.g. "Python Developer").
        location:    Location filter (e.g. "Dubai").
        country:     Two-letter Adzuna country code.
        max_results: Number of results to return (max 50).

    Returns:
        A list of dicts, each with keys: title, company, location, description.
        Returns mock data on any failure or if the country is unsupported.
    """
    # ── Pull API credentials from Streamlit secrets ──────────────────────────
    app_id  = st.secrets.get("ADZUNA_APP_ID",  "")
    app_key = st.secrets.get("ADZUNA_APP_KEY", "")

    # Clean country code input
    country_code = country.strip().lower()

    # If credentials are missing, or country is not supported, skip API call
    if not app_id or not app_key or "your-" in app_id.lower() or country_code not in SUPPORTED_COUNTRIES:
        return _get_mock_jobs(query)


    # ── Build the request ────────────────────────────────────────────────────
    url = ADZUNA_BASE_URL.format(country=country, page=DEFAULT_PAGE)
    params = {
        "app_id":           app_id,
        "app_key":          app_key,
        "results_per_page": min(max_results, 50),
        "what":             query,
        "where":            location,
        "content-type":     "application/json",
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        jobs = []
        for result in data.get("results", []):
            jobs.append({
                "title":       result.get("title", "Untitled Position"),
                "company":     result.get("company", {}).get("display_name", "Company Not Listed"),
                "location":    result.get("location", {}).get("display_name", location),
                "description": result.get("description", "No description available."),
            })

        # If API returned zero results, fall back to mock
        return jobs if jobs else _get_mock_jobs(query)

    except requests.exceptions.RequestException as exc:
        # Network error, timeout, 4xx/5xx — return mock data gracefully
        st.toast(f"⚠️ Job API unavailable ({type(exc).__name__}). Showing sample listings.", icon="⚠️")
        return _get_mock_jobs(query)


# ─── Mock Fallback Data ────────────────────────────────────────────────────────

def _get_mock_jobs(query: str) -> list[dict]:
    """
    Returns a curated set of realistic mock job listings.
    The query keyword is woven into the titles so the UI feels relevant.
    """
    keyword = query.strip().title() if query.strip() else "Software"

    return [
        {
            "title":       f"Senior {keyword} Engineer",
            "company":     "TechNova Solutions",
            "location":    "Dubai, UAE",
            "description": (
                f"We are looking for an experienced {keyword} Engineer to join our core platform team. "
                "You will design, build, and maintain scalable microservices using Python, FastAPI, and "
                "PostgreSQL. Experience with Docker, Kubernetes, and CI/CD pipelines is required. "
                "You'll collaborate with cross-functional squads in an agile environment and mentor "
                "junior developers. Strong knowledge of cloud platforms (AWS/GCP) and observability "
                "tools (Datadog, Grafana) is a plus."
            ),
        },
        {
            "title":       f"{keyword} Data Analyst",
            "company":     "Meridian Analytics",
            "location":    "Abu Dhabi, UAE",
            "description": (
                f"Meridian Analytics seeks a {keyword} Data Analyst to transform raw business data into "
                "actionable insights. Proficiency in SQL, Python (pandas, NumPy), and Tableau/Power BI "
                "is essential. You will build automated reporting dashboards, perform A/B test analysis, "
                "and present findings to C-level stakeholders. Experience with dbt, Airflow, or "
                "Snowflake is highly desirable."
            ),
        },
        {
            "title":       f"Lead {keyword} Architect",
            "company":     "FutureStack Inc.",
            "location":    "Dubai Internet City, UAE",
            "description": (
                f"FutureStack is hiring a Lead {keyword} Architect to define the technical vision for "
                "our next-generation platform. You will evaluate technology stacks, design system "
                "architecture documents, and lead a team of 8 engineers. Must have 8+ years of "
                "experience in distributed systems, event-driven architecture (Kafka), and cloud-native "
                "design patterns. Terraform and IaC experience is mandatory."
            ),
        },
        {
            "title":       f"Junior {keyword} Developer",
            "company":     "CodeBridge Academy",
            "location":    "Sharjah, UAE",
            "description": (
                f"Great opportunity for a Junior {keyword} Developer to kickstart your career! "
                "You'll work alongside senior engineers building web applications with React, Node.js, "
                "and MongoDB. We provide mentorship, structured code reviews, and quarterly hackathons. "
                "Familiarity with Git, REST APIs, and basic testing frameworks (Jest/Pytest) is a plus. "
                "Fresh graduates are welcome to apply."
            ),
        },
        {
            "title":       f"{keyword} DevOps Engineer",
            "company":     "CloudPeak Systems",
            "location":    "DIFC, Dubai, UAE",
            "description": (
                f"CloudPeak Systems is seeking a {keyword} DevOps Engineer to automate and optimize our "
                "deployment pipelines. You will manage infrastructure on AWS using Terraform, implement "
                "GitOps workflows with ArgoCD, and ensure 99.99% uptime for production services. "
                "Strong scripting skills (Bash, Python), container orchestration (EKS/ECS), and "
                "monitoring (Prometheus, PagerDuty) are required. SRE experience is a bonus."
            ),
        },
    ]
