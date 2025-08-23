
Flight Scheduler Interactive Website Prototype
=============================================

How to run:
1. Open terminal
2. Create & activate a virtualenv (recommended):
   python -m venv venv
   .\venv\Scripts\Activate   (PowerShell) OR venv\Scripts\activate.bat (cmd)
3. Install dependencies:
   pip install -r backend/requirements.txt
4. Run the backend (it also serves the frontend):
   uvicorn backend.main:app --reload
5. Open in browser:
   http://127.0.0.1:8000/

Features:
- Interactive dashboard (served at /): busiest slots chart, delay summary, search flights, top cascade flights.
- Simple optimizer endpoint to suggest small shifts for high-impact flights.
- Upload CSV endpoint to replace dataset (POST /upload_csv).

Notes:
- This is a prototype. Optimization uses a simple heuristic and synthetic data.
- If you want a React frontend or additional ML model, ask and I will extend it.
