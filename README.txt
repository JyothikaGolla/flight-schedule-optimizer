Project Report — Flight Schedule Optimizer

1. Proposed Solution (Idea / Solution / Prototype)
Project Title: Flight Schedule Optimizer — AI-driven scheduling insights for congested airports (Mumbai / Delhi)

Short Summary:
We built a full-stack prototype that ingests one week of flight data (sample CSV included), cleans and aligns scheduled vs. actual times, and provides:
Analytical dashboards showing busiest slots and cascading-impact flights.
Predictive models estimating delay probability and magnitude per flight.
Optimization & simulation module to suggest alternate schedule windows that minimize cascading delays while respecting runway constraints.
Lightweight interactive web interface (deployed on Render) where users can access index.html, query backend APIs, and test via /docs.

How it addresses the problem:
Detects busiest time windows & runway saturation points.
Predicts flights likely to be delayed + their cascading effects.
Identifies high-impact flights and quantifies downstream disruptions.
Suggests optimized takeoff/landing schedules to reduce congestion.
Provides chat-like NLP queries so non-technical operators can ask:
“Which flights cause the biggest cascade if delayed?”
“What’s the best takeoff window for Flight X?”

Innovation / uniqueness:
Combines ML-based delay prediction with graph-based cascade modeling.
Integrates counterfactual simulation for "what-if" scheduling.
Exposes a natural-language interface for operational usability.
Fully deployed prototype accessible on Render with working frontend + backend.

2. Technical Approach
Data:
Input: One-week schedule dataset (sample_flight_data.csv).
Attributes: flight number, airline, scheduled/actual times, runway usage.
Pipeline:
Data Preprocessing
Parse CSV data, align scheduled vs. actual.
Detect anomalies & normalize timestamps.
Analytics Module
Identify peak congestion slots.
Compute runway utilization metrics.
Rank flights by delay propagation.
Prediction Module
ML model to estimate delay minutes (features: airline, route, congestion level).
Output: delay probability & expected delay.
Optimization & Simulation
Constraint-based solver: adjust slot allocations.
Scenario testing: “If Flight X is moved +10 min, total delay impact ↓ 12%.”
Web Deployment
Backend: FastAPI (Python), endpoints for data ingestion, analytics, predictions, and optimization. Swagger UI available at /docs.
Frontend: HTML + JS (index.html served from root). Interactive page connects to backend APIs.
Hosting: Deployed on Render. Auto-build pipeline from GitHub repo.

3. Feasibility & Viability
Practicality: Airports already record schedule vs. actual data; pipeline is directly integrable.
Scalability: Can extend from Mumbai/Delhi prototype to other airports with minimal config.
Impact: Even small reductions in cascading delays → significant savings in cost, fuel, and passenger time.
Deployment: Running live on Render, proving low-cost cloud hosting feasibility.

Next Steps:
Integrate live data APIs (FlightAware/ADS-B Exchange).
Extend NLP layer with LLM fine-tuning for aviation terms.
Build controller dashboards with charts & interactive visualizations.

4. Research & References
Flight Delay Propagation Studies:
Jetzki, M. (2009). The propagation of air transport delays in Europe.
Pyrgiotis, N., Malone, K.M., Odoni, A.R. (2013). Modeling delay propagation in an airport network.

Tools & Libraries Used:
Python (FastAPI, Pandas, Scikit-learn).
HTML/JS frontend.
Deployment: Render (Docker-based).
Data: Sample CSV (synthetic flight schedules).

Supporting Tech Inspiration:
Graph-based delay propagation models.
Constraint programming for schedule optimization.
NLP-powered analytics dashboards.

✅ This updated version reflects your live deployed project:
index.html is served from root (no missing frontend folder).
Backend fully running on Render.
API docs live at /docs.
