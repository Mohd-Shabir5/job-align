"""
app.py — CV Optimizer · Streamlit Frontend
───────────────────────────────────────────
Neo Brutalism themed dual-mode application:

  Mode A — Job Search:    Search live job listings and select one to optimise against.
  Mode B — CV Optimiser:  Paste any job description manually and optimise a CV directly.

Both modes feed into the same 3-agent ADK pipeline and results display.
Users can switch between modes at any time via the top navigation toggle.
"""

import time
import streamlit as st
from job_search import fetch_live_jobs
from agents import run_cv_optimization_pipeline

# ═════════════════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ═════════════════════════════════════════════════════════════════════════════

st.set_page_config(
    page_title="JobAlign AI · Job Search & CV Optimizer",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ═════════════════════════════════════════════════════════════════════════════
# GLOBAL CSS — Neo Brutalism
# ═════════════════════════════════════════════════════════════════════════════

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
        --neo-bg:        #FFFDF7;
        --neo-surface:   #FFFFFF;
        --neo-border:    #1A1A2E;
        --neo-shadow:    #1A1A2E;
        --neo-accent-1:  #FF6B35;
        --neo-accent-2:  #7B2FBE;
        --neo-accent-3:  #00C49A;
        --neo-accent-4:  #FFD23F;
        --neo-accent-5:  #FF3F6C;
        --neo-text:      #1A1A2E;
        --neo-text-sub:  #4A4A6A;
        --neo-radius:    12px;
        --neo-shadow-sm: 3px 3px 0px var(--neo-shadow);
        --neo-shadow-md: 5px 5px 0px var(--neo-shadow);
        --neo-shadow-lg: 8px 8px 0px var(--neo-shadow);
    }

    .stApp {
        background-color: var(--neo-bg) !important;
        font-family: 'Space Grotesk', sans-serif !important;
    }
    .stApp header { background-color: transparent !important; }
    .block-container { max-width: 1100px !important; padding-top: 2rem !important; }

    h1, h2, h3, h4, h5, h6 {
        font-family: 'Space Grotesk', sans-serif !important;
        color: var(--neo-text) !important;
        font-weight: 700 !important;
    }
    p, li, span, label, .stMarkdown {
        font-family: 'Space Grotesk', sans-serif !important;
        color: var(--neo-text) !important;
    }

    /* ── Branding header ────────────────────────────────────────────────── */
    .neo-header {
        background: var(--neo-accent-4);
        border: 3px solid var(--neo-border);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-md);
        padding: 1.25rem 1.5rem;
        margin-bottom: 0.75rem;
    }
    .neo-header h1 { margin: 0 !important; font-size: 2rem !important; letter-spacing: -0.5px; }
    .neo-header p  { margin: 0.25rem 0 0 0 !important; color: var(--neo-text-sub) !important; font-size: 1rem; }

    /* ── Mode toggle nav ────────────────────────────────────────────────── */
    .neo-nav {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.75rem;
        padding: 0.75rem 1rem;
        background: var(--neo-surface);
        border: 3px solid var(--neo-border);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-sm);
        align-items: center;
    }
    .neo-nav-label {
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--neo-text-sub);
        margin-right: 0.5rem;
    }

    /* Active nav tab */
    .neo-tab-active {
        background: var(--neo-border) !important;
        color: white !important;
        border: 3px solid var(--neo-border) !important;
        border-radius: var(--neo-radius) !important;
        padding: 0.45rem 1.1rem !important;
        font-weight: 700 !important;
        font-size: 0.9rem !important;
        cursor: default !important;
        box-shadow: none !important;
    }

    /* ── Section banners ────────────────────────────────────────────────── */
    .neo-section {
        border: 3px solid var(--neo-border);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-sm);
        padding: 0.6rem 1rem;
        display: inline-block;
        margin-bottom: 1rem;
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .neo-section.orange { background: var(--neo-accent-1); color: white; }
    .neo-section.purple { background: var(--neo-accent-2); color: white; }
    .neo-section.green  { background: var(--neo-accent-3); color: var(--neo-text); }
    .neo-section.yellow { background: var(--neo-accent-4); color: var(--neo-text); }
    .neo-section.pink   { background: var(--neo-accent-5); color: white; }

    /* ── Generic cards ──────────────────────────────────────────────────── */
    .neo-card {
        background: var(--neo-surface);
        border: 3px solid var(--neo-border);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-md);
        padding: 1.5rem;
        margin-bottom: 1.25rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .neo-card:hover { transform: translate(-2px, -2px); box-shadow: var(--neo-shadow-lg); }

    /* ── Job listing cards ──────────────────────────────────────────────── */
    .job-card {
        background: var(--neo-surface);
        border: 3px solid var(--neo-border);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-sm);
        padding: 1.25rem;
        margin-bottom: 1rem;
        border-left: 6px solid var(--neo-accent-1);
    }
    .job-card h4    { margin: 0 0 0.3rem 0 !important; font-size: 1.1rem !important; }
    .job-card .company  { color: var(--neo-accent-2) !important; font-weight: 600; font-size: 0.9rem; }
    .job-card .location { color: var(--neo-text-sub) !important; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .job-card .desc     { font-size: 0.88rem; line-height: 1.5; color: var(--neo-text-sub) !important; }

    /* ── Info banner for cross-mode navigation ──────────────────────────── */
    .neo-banner {
        background: #EEF2FF;
        border: 3px solid var(--neo-accent-2);
        border-radius: var(--neo-radius);
        box-shadow: var(--neo-shadow-sm);
        padding: 1rem 1.25rem;
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .neo-banner .banner-icon { font-size: 1.5rem; }
    .neo-banner .banner-text { font-size: 0.9rem; line-height: 1.4; }
    .neo-banner strong { color: var(--neo-accent-2); }

    /* ── Buttons ────────────────────────────────────────────────────────── */
    .stButton > button {
        font-family: 'Space Grotesk', sans-serif !important;
        font-weight: 700 !important;
        border: 3px solid var(--neo-border) !important;
        border-radius: var(--neo-radius) !important;
        box-shadow: var(--neo-shadow-sm) !important;
        transition: all 0.12s ease !important;
        padding: 0.5rem 1.25rem !important;
        font-size: 0.9rem !important;
    }
    .stButton > button:hover  { transform: translate(-2px, -2px) !important; box-shadow: var(--neo-shadow-md) !important; }
    .stButton > button:active { transform: translate(2px, 2px) !important; box-shadow: 1px 1px 0px var(--neo-shadow) !important; }
    .stButton > button[kind="primary"],
    .stButton > button[data-testid="stBaseButton-primary"] { background: var(--neo-accent-1) !important; color: white !important; }
    .stButton > button[kind="secondary"],
    .stButton > button[data-testid="stBaseButton-secondary"] { background: var(--neo-surface) !important; color: var(--neo-text) !important; }

    /* ── Inputs ─────────────────────────────────────────────────────────── */
    .stTextInput > div > div > input,
    .stTextArea  > div > div > textarea {
        font-family: 'JetBrains Mono', monospace !important;
        border: 3px solid var(--neo-border) !important;
        border-radius: var(--neo-radius) !important;
        box-shadow: var(--neo-shadow-sm) !important;
        font-size: 0.9rem !important;
        background: var(--neo-surface) !important;
    }
    .stTextInput > div > div > input:focus,
    .stTextArea  > div > div > textarea:focus {
        border-color: var(--neo-accent-2) !important;
        box-shadow: var(--neo-shadow-md) !important;
    }

    /* ── Status, expanders, alerts ──────────────────────────────────────── */
    .stStatus { border: 3px solid var(--neo-border) !important; border-radius: var(--neo-radius) !important; box-shadow: var(--neo-shadow-sm) !important; }
    .streamlit-expanderHeader { font-family: 'Space Grotesk', sans-serif !important; font-weight: 600 !important; border: 3px solid var(--neo-border) !important; border-radius: var(--neo-radius) !important; background: var(--neo-accent-4) !important; }
    .stAlert { border: 3px solid var(--neo-border) !important; border-radius: var(--neo-radius) !important; box-shadow: var(--neo-shadow-sm) !important; font-family: 'Space Grotesk', sans-serif !important; }

    hr { border: none !important; border-top: 3px dashed var(--neo-border) !important; margin: 2rem 0 !important; }

    [data-testid="stMetric"] { background: var(--neo-surface); border: 3px solid var(--neo-border); border-radius: var(--neo-radius); box-shadow: var(--neo-shadow-sm); padding: 1rem; }
    [data-testid="stMetricValue"] { font-family: 'Space Grotesk', sans-serif !important; font-weight: 700 !important; color: var(--neo-accent-2) !important; }

    #MainMenu { visibility: hidden; }
    footer     { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════════
# SESSION STATE
# ═════════════════════════════════════════════════════════════════════════════

def _init_state():
    """Initialise all session state keys with safe defaults."""
    defaults = {
        # Navigation
        "active_mode":       "search",    # "search" | "optimizer"

        # Job Search mode state
        "job_results":       [],
        "search_performed":  False,
        "selected_job":      None,        # Job dict chosen from search results

        # CV Optimizer mode state (shared by both modes)
        "jd_text":           "",          # Job description text (from search OR manual paste)
        "jd_source":         None,        # "search" | "manual" — tracks how JD was loaded
        "pipeline_results":  None,        # Dict from run_cv_optimization_pipeline

        # Rate limiter
        "last_run_time":     0.0,
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val

_init_state()

RATE_LIMIT_SECONDS = 30


# ═════════════════════════════════════════════════════════════════════════════
# BRANDING HEADER
# ═════════════════════════════════════════════════════════════════════════════

st.markdown("""
<div class="neo-header">
    <h1>⚡ JobAlign AI</h1>
    <p>Job Search &amp; Multi-Agent CV Optimizer · Powered by Google Gemini &amp; ADK</p>
</div>
""", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════════
# MODE TOGGLE NAVIGATION
# ═════════════════════════════════════════════════════════════════════════════

nav_col1, nav_col2, nav_spacer = st.columns([2, 2, 6])

with nav_col1:
    if st.button(
        "🔍 Job Search",
        key="nav_search",
        type="primary" if st.session_state.active_mode == "search" else "secondary",
        use_container_width=True,
    ):
        st.session_state.active_mode = "search"
        st.rerun()

with nav_col2:
    if st.button(
        "📄 CV Optimiser",
        key="nav_optimizer",
        type="primary" if st.session_state.active_mode == "optimizer" else "secondary",
        use_container_width=True,
    ):
        st.session_state.active_mode = "optimizer"
        st.rerun()

st.markdown("<hr style='margin: 0.75rem 0 1.5rem 0 !important;'>", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════════
# MODE A — JOB SEARCH
# ═════════════════════════════════════════════════════════════════════════════

if st.session_state.active_mode == "search":

    st.markdown('<div class="neo-section orange">🔍 Job Search Engine</div>', unsafe_allow_html=True)

    # ── Search parameters ────────────────────────────────────────────────────
    col_q, col_loc, col_cnt, col_btn = st.columns([3, 1.5, 1.5, 1])
    
    with col_q:
        search_query = st.text_input(
            "Search jobs",
            placeholder="e.g. Python Developer, Data Engineer, Product Manager…",
            label_visibility="collapsed",
            key="search_query_input",
        )
    
    with col_loc:
        search_location = st.text_input(
            "Location",
            value="Dubai",
            placeholder="City (e.g. London, Dubai)",
            label_visibility="collapsed",
            key="search_location_input",
        )
        
    with col_cnt:
        country_options = {
            "ae": "🇦🇪 UAE (Mock)",
            "us": "🇺🇸 United States",
            "gb": "🇬🇧 United Kingdom",
            "in": "🇮🇳 India",
            "sg": "🇸🇬 Singapore",
            "ca": "🇨🇦 Canada",
            "au": "🇦🇺 Australia",
        }
        selected_country_code = st.selectbox(
            "Country",
            options=list(country_options.keys()),
            format_func=lambda x: country_options[x],
            label_visibility="collapsed",
            key="search_country_select",
        )
        
    with col_btn:
        search_clicked = st.button("🔎 Search", type="primary", use_container_width=True)

    if search_clicked and search_query.strip():
        with st.spinner("Fetching live job listings…"):
            st.session_state.job_results = fetch_live_jobs(
                query=search_query.strip(),
                location=search_location.strip(),
                country=selected_country_code,
            )
            st.session_state.search_performed = True
            st.session_state.selected_job    = None
            st.session_state.pipeline_results = None
    elif search_clicked:
        st.warning("⚠️ Please enter a search keyword first.")

    # ── Results ──────────────────────────────────────────────────────────────
    if st.session_state.search_performed and st.session_state.job_results:
        st.markdown(f"**Found {len(st.session_state.job_results)} listings** — select one to align your CV.")

        for idx, job in enumerate(st.session_state.job_results):
            st.markdown(f"""
            <div class="job-card">
                <h4>{job['title']}</h4>
                <div class="company">{job['company']}</div>
                <div class="location">📍 {job['location']}</div>
                <div class="desc">{job['description'][:280]}{'…' if len(job['description']) > 280 else ''}</div>
            </div>
            """, unsafe_allow_html=True)

            if st.button("Select & Align CV ➜", key=f"select_job_{idx}", use_container_width=True):
                # Store the job and pre-fill the JD text for the optimizer
                st.session_state.selected_job    = job
                st.session_state.jd_text         = job["description"]
                st.session_state.jd_source       = "search"
                st.session_state.pipeline_results = None
                # Switch to optimizer mode automatically
                st.session_state.active_mode     = "optimizer"
                st.rerun()

    elif st.session_state.search_performed:
        st.info("No jobs matched your search. Try different keywords.")


# ═════════════════════════════════════════════════════════════════════════════
# MODE B — CV OPTIMISER
# ═════════════════════════════════════════════════════════════════════════════

elif st.session_state.active_mode == "optimizer":

    st.markdown('<div class="neo-section purple">📄 CV Optimiser</div>', unsafe_allow_html=True)

    # ── Cross-mode banner: show if a job was carried over from search ────────
    if st.session_state.jd_source == "search" and st.session_state.selected_job:
        job = st.session_state.selected_job
        st.markdown(f"""
        <div class="neo-banner">
            <div class="banner-icon">🎯</div>
            <div class="banner-text">
                Job imported from search: <strong>{job['title']}</strong> at <strong>{job['company']}</strong> · 📍 {job['location']}<br>
                <span style="font-size:0.82rem; opacity:0.8;">The job description has been pre-filled below. You can edit it or paste a different one.</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        col_keep, col_clear = st.columns([3, 1])
        with col_clear:
            if st.button("✕ Clear & Start Fresh", key="clear_jd", use_container_width=True):
                st.session_state.selected_job    = None
                st.session_state.jd_text         = ""
                st.session_state.jd_source       = "manual"
                st.session_state.pipeline_results = None
                st.rerun()

    # ── Two input columns ────────────────────────────────────────────────────
    col_jd, col_cv = st.columns(2, gap="large")

    with col_jd:
        st.markdown("##### 📋 Job Description")
        st.markdown(
            "<p style='font-size:0.85rem; color:var(--neo-text-sub); margin-top:-0.5rem;'>"
            "Paste any job description here — from our search or anywhere else.</p>",
            unsafe_allow_html=True,
        )
        jd_input = st.text_area(
            "Job description",
            value=st.session_state.jd_text,
            height=320,
            placeholder=(
                "Paste the full job description here…\n\n"
                "Example:\n"
                "We are looking for a Senior Python Engineer to join our platform team.\n"
                "Requirements:\n"
                "• 5+ years of Python experience\n"
                "• FastAPI, PostgreSQL, Docker, Kubernetes\n"
                "• AWS or GCP cloud experience…"
            ),
            label_visibility="collapsed",
            key="jd_textarea",
        )
        # Keep session state in sync if user edits the field
        st.session_state.jd_text = jd_input

    with col_cv:
        st.markdown("##### ✏️ Your CV / Resume")
        st.markdown(
            "<p style='font-size:0.85rem; color:var(--neo-text-sub); margin-top:-0.5rem;'>"
            "Paste your current CV text. The AI will rewrite it to match the job.</p>",
            unsafe_allow_html=True,
        )
        user_cv = st.text_area(
            "CV text",
            height=320,
            placeholder=(
                "Paste your full CV / resume text here…\n\n"
                "PROFESSIONAL SUMMARY\n"
                "Results-driven software engineer with 5 years of experience…\n\n"
                "EXPERIENCE\n"
                "Software Engineer · Acme Corp · 2020–Present\n"
                "• Developed RESTful APIs serving 10M+ daily requests…\n\n"
                "SKILLS\n"
                "Python, Flask, MySQL, AWS EC2, Git, Linux"
            ),
            label_visibility="collapsed",
        )

    # ── Agent Execution Engine ───────────────────────────────────────────────
    st.markdown("---")
    st.markdown('<div class="neo-section green">🤖 Agent Execution Engine</div>', unsafe_allow_html=True)

    seconds_since_last = time.time() - st.session_state.last_run_time
    can_run = seconds_since_last >= RATE_LIMIT_SECONDS

    if not can_run:
        remaining = int(RATE_LIMIT_SECONDS - seconds_since_last)
        st.info(f"⏳ Rate limiter active. Please wait **{remaining}s** before running again.")

    run_clicked = st.button(
        "🚀 Run Multi-Agent Optimization",
        type="primary",
        use_container_width=True,
        disabled=(not can_run),
    )

    if run_clicked:
        if not jd_input.strip():
            st.error("❌ Please paste a job description before running the optimizer.")
        elif not user_cv.strip():
            st.error("❌ Please paste your CV text before running the optimizer.")
        else:
            gemini_key = st.secrets.get("GEMINI_API_KEY", "")
            if not gemini_key or "your-" in gemini_key.lower():
                st.error(
                    "❌ **Gemini API key not configured.** "
                    "Add your key to `.streamlit/secrets.toml`."
                )
            else:
                st.session_state.last_run_time = time.time()

                status_labels = {
                    1: ("🔬 Step 1/3 — Extracting Job Competencies",  "Parsing the job description with the Job Extract Agent…"),
                    2: ("📊 Step 2/3 — Evaluating ATS Gaps",           "The ATS Critic Agent is scoring your CV alignment…"),
                    3: ("🏗️ Step 3/3 — Architecting Optimized CV",     "The CV Architect Agent is rewriting your resume sections…"),
                }

                with st.status("🤖 Multi-Agent Pipeline Running…", expanded=True) as status:
                    progress_ph = st.empty()

                    def _progress_cb(step: int, label: str):
                        title, detail = status_labels.get(step, (label, ""))
                        status.update(label=title, state="running")
                        progress_ph.markdown(f"**{title}**\n\n{detail}")

                    results = run_cv_optimization_pipeline(
                        user_cv=user_cv.strip(),
                        job_description=jd_input.strip(),
                        api_key=gemini_key,
                        progress_callback=_progress_cb,
                    )

                    if results["success"]:
                        status.update(label="✅ Pipeline Complete!", state="complete")
                        progress_ph.markdown("**All 3 agents finished successfully.**")
                    else:
                        status.update(label="❌ Pipeline Failed", state="error")
                        progress_ph.markdown(f"**Error:** {results.get('error', 'Unknown error')}")

                st.session_state.pipeline_results = results

    # ── Output Display ───────────────────────────────────────────────────────
    if st.session_state.pipeline_results:
        results = st.session_state.pipeline_results
        st.markdown("---")

        if results["success"]:
            st.markdown('<div class="neo-section pink">📊 Results — AI Agent Outputs</div>', unsafe_allow_html=True)

            tab_extract, tab_critic, tab_architect = st.tabs([
                "🔬 Job Extraction",
                "📊 ATS Critique",
                "🏗️ Optimized CV",
            ])

            with tab_extract:
                st.markdown('<div class="neo-card" style="border-left:6px solid var(--neo-accent-1);">', unsafe_allow_html=True)
                st.markdown(results["extraction"])
                st.markdown("</div>", unsafe_allow_html=True)

            with tab_critic:
                st.markdown('<div class="neo-card" style="border-left:6px solid var(--neo-accent-2);">', unsafe_allow_html=True)
                st.markdown(results["critique"])
                st.markdown("</div>", unsafe_allow_html=True)

            with tab_architect:
                st.markdown('<div class="neo-card" style="border-left:6px solid var(--neo-accent-3);">', unsafe_allow_html=True)
                st.markdown(results["optimized_cv"])
                st.markdown("</div>", unsafe_allow_html=True)

                st.download_button(
                    label="📥 Download Optimized CV as Markdown",
                    data=results["optimized_cv"],
                    file_name="optimized_cv.md",
                    mime="text/markdown",
                    use_container_width=True,
                )

        else:
            error_msg = results.get("error", "An unknown error occurred.")
            if "rate" in error_msg.lower() or "quota" in error_msg.lower() or "429" in error_msg:
                st.warning("⚠️ **Rate Limit Reached.** The Gemini API has throttled requests. Please wait a few minutes and try again.")
            elif "safety" in error_msg.lower() or "blocked" in error_msg.lower():
                st.warning("⚠️ **Content Safety Filter Triggered.** Try rephrasing your CV or job description.")
            else:
                st.error(f"❌ **Pipeline Error:** {error_msg}")


# ═════════════════════════════════════════════════════════════════════════════
# FOOTER
# ═════════════════════════════════════════════════════════════════════════════

st.markdown("---")
st.markdown("""
<div style="text-align:center; padding:1rem 0; color:var(--neo-text-sub); font-size:0.8rem;">
    Built with ⚡ Streamlit · 🤖 Google ADK · 🧠 Gemini 2.5 Flash<br>
    <span style="opacity:0.6;">JobAlign AI v2.0 · Rate limited to prevent abuse</span>
</div>
""", unsafe_allow_html=True)
