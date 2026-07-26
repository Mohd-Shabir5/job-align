/**
 * jobSearch.js — Adzuna Job Search Utility
 * ─────────────────────────────────────────
 * Queries the Adzuna public API for live job listings.
 * Falls back to curated mock data if the API is unreachable.
 * Translated from legacy/job_search.py
 */

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}";
const DEFAULT_COUNTRY = "ae";
const DEFAULT_PAGE = 1;
const RESULTS_PER_PAGE = 10;

const SUPPORTED_COUNTRIES = [
  "at", "au", "be", "br", "ca", "ch", "de", "es", "fr", "gb", "in", "it",
  "mx", "nl", "nz", "pl", "sg", "us", "za"
];

/**
 * Fetch live job listings from Adzuna.
 *
 * @param {string} query       — Search keywords
 * @param {string} location    — Location filter
 * @param {string} country     — Two-letter Adzuna country code
 * @param {number} maxResults  — Number of results (max 50)
 * @returns {Promise<Array<{title:string, company:string, location:string, description:string}>>}
 */
export async function fetchLiveJobs(query, location = "Dubai", country = DEFAULT_COUNTRY, maxResults = RESULTS_PER_PAGE) {
  const appId = process.env.ADZUNA_APP_ID || "";
  const appKey = process.env.ADZUNA_APP_KEY || "";

  const countryCode = country.trim().toLowerCase();

  // If credentials are missing or country is unsupported, use mock data
  if (!appId || !appKey || appId.toLowerCase().includes("your-") || !SUPPORTED_COUNTRIES.includes(countryCode)) {
    return getMockJobs(query);
  }

  const url = ADZUNA_BASE_URL
    .replace("{country}", countryCode)
    .replace("{page}", String(DEFAULT_PAGE));

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(Math.min(maxResults, 50)),
    what: query,
    where: location,
    "content-type": "application/json",
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return getMockJobs(query);
    }

    const data = await response.json();
    const jobs = (data.results || []).map((result) => ({
      title: result.title || "Untitled Position",
      company: result.company?.display_name || "Company Not Listed",
      location: result.location?.display_name || location,
      description: result.description || "No description available.",
    }));

    return jobs.length > 0 ? jobs : getMockJobs(query);
  } catch (err) {
    console.warn(`Job API unavailable (${err.name}). Using mock data.`);
    return getMockJobs(query);
  }
}

/**
 * Returns curated mock job listings.
 */
function getMockJobs(query) {
  const keyword = query.trim()
    ? query.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Software";

  return [
    {
      title: `Senior ${keyword} Engineer`,
      company: "TechNova Solutions",
      location: "New York, USA",
      description: `We are looking for an experienced ${keyword} Engineer to join our core platform team. You will design, build, and maintain scalable microservices using Python, FastAPI, and PostgreSQL. Experience with Docker, Kubernetes, and CI/CD pipelines is required. You'll collaborate with cross-functional squads in an agile environment and mentor junior developers. Strong knowledge of cloud platforms (AWS/GCP) and observability tools (Datadog, Grafana) is a plus.`,
    },
    {
      title: `${keyword} Data Analyst`,
      company: "Meridian Analytics",
      location: "London, UK",
      description: `Meridian Analytics seeks a ${keyword} Data Analyst to transform raw business data into actionable insights. Proficiency in SQL, Python (pandas, NumPy), and Tableau/Power BI is essential. You will build automated reporting dashboards, perform A/B test analysis, and present findings to C-level stakeholders. Experience with dbt, Airflow, or Snowflake is highly desirable.`,
    },
    {
      title: `Lead ${keyword} Architect`,
      company: "FutureStack Inc.",
      location: "San Francisco, USA",
      description: `FutureStack is hiring a Lead ${keyword} Architect to define the technical vision for our next-generation platform. You will evaluate technology stacks, design system architecture documents, and lead a team of 8 engineers. Must have 8+ years of experience in distributed systems, event-driven architecture (Kafka), and cloud-native design patterns. Terraform and IaC experience is mandatory.`,
    },
    {
      title: `Junior ${keyword} Developer`,
      company: "CodeBridge Academy",
      location: "Austin, USA",
      description: `Great opportunity for a Junior ${keyword} Developer to kickstart your career! You'll work alongside senior engineers building web applications with React, Node.js, and MongoDB. We provide mentorship, structured code reviews, and quarterly hackathons. Familiarity with Git, REST APIs, and basic testing frameworks (Jest/Pytest) is a plus. Fresh graduates are welcome to apply.`,
    },
    {
      title: `${keyword} DevOps Engineer`,
      company: "CloudPeak Systems",
      location: "Seattle, USA",
      description: `CloudPeak Systems is seeking a ${keyword} DevOps Engineer to automate and optimize our deployment pipelines. You will manage infrastructure on AWS using Terraform, implement GitOps workflows with ArgoCD, and ensure 99.99% uptime for production services. Strong scripting skills (Bash, Python), container orchestration (EKS/ECS), and monitoring (Prometheus, PagerDuty) are required. SRE experience is a bonus.`,
    },
  ];
}
