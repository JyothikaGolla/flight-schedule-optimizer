from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd, io, os, datetime, json

app = FastAPI(title="Flight Scheduler Web Prototype")

# Allow CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "..", "sample_flight_data.csv")

def load_data():
    df = pd.read_csv(DATA_PATH, parse_dates=["Scheduled_Departure","Actual_Departure","Scheduled_Arrival","Actual_Arrival"])
    return df

@app.get("/health")
def health():
    return {"status":"ok"}

@app.get("/busiest_slots")
def busiest_slots(hour_bucket: int = 1, top: int = 12):
    df = load_data()
    df['hour'] = df['Scheduled_Departure'].dt.floor(f'{hour_bucket}H')
    agg = (
        df.groupby('hour')
        .size()
        .reset_index(name='count')
        .sort_values('count', ascending=False)
        .head(top)
    )
    agg['hour'] = agg['hour'].astype(str)

    return {
        "labels": agg['hour'].tolist(),
        "data": agg['count'].tolist()
    }

@app.get("/delay_stats")
def delay_stats():
    df = load_data()
    total = len(df)
    delayed = int((df['Delay_Minutes']>5).sum())
    avg_delay = float(df['Delay_Minutes'].mean())
    med_delay = float(df['Delay_Minutes'].median())
    by_airline = df.groupby('Airline')['Delay_Minutes'].mean().reset_index().to_dict(orient='records')
    return {"total_flights":int(total),"delayed_flights":delayed,"avg_delay_min":avg_delay,"median_delay_min":med_delay,"by_airline":by_airline}

@app.get("/top_cascade_flights")
def top_cascade_flights(window_min:int=120, top:int=10):
    df = load_data().sort_values("Scheduled_Departure").reset_index(drop=True)
    scores = []
    for i, row in df.iterrows():
        ws = row['Scheduled_Departure']
        we = ws + datetime.timedelta(minutes=window_min)
        mask = (df['Scheduled_Departure']>ws) & (df['Scheduled_Departure']<=we) & (df['Aircraft']==row['Aircraft'])
        downstream = int(mask.sum())
        score = int(row['Delay_Minutes'] or 0) * downstream
        scores.append(score)
    df['cascade_score'] = scores
    out = df.sort_values('cascade_score', ascending=False).head(top)[['Flight_ID','Airline','Scheduled_Departure','Delay_Minutes','cascade_score']]
    out['Scheduled_Departure'] = out['Scheduled_Departure'].astype(str)
    return JSONResponse(content=json.loads(out.to_json(orient='records')))

@app.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
        save_path = os.path.join(BASE_DIR, "..", "uploaded.csv")
        df.to_csv(save_path, index=False)
        return {"status":"saved", "path": save_path}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error":str(e)})

@app.get("/search_flights")
def search_flights(q: str = "", limit: int = 50):
    df = load_data()
    if q:
        q = q.lower()
        mask = df['Flight_ID'].str.lower().str.contains(q) | df['Airline'].str.lower().str.contains(q) | df['Destination'].str.lower().str.contains(q)
        out = df[mask].head(limit)
    else:
        out = df.head(limit)
    out['Scheduled_Departure'] = out['Scheduled_Departure'].astype(str)
    return JSONResponse(content=json.loads(out.to_json(orient='records')))

# A simple heuristic optimizer: try shifting candidate flights by +/- minutes to reduce cascade score
@app.post("/optimize_schedule")
def optimize_schedule(max_shift:int=30, step:int=5):
    df = load_data().sort_values("Scheduled_Departure").reset_index(drop=True)
    # find top cascade flight
    window_min = 120
    scores = []
    for i, row in df.iterrows():
        ws = row['Scheduled_Departure']
        we = ws + datetime.timedelta(minutes=window_min)
        mask = (df['Scheduled_Departure']>ws) & (df['Scheduled_Departure']<=we) & (df['Aircraft']==row['Aircraft'])
        downstream = int(mask.sum())
        scores.append(int(row['Delay_Minutes'] or 0) * downstream)
    df['cascade_score'] = scores
    candidate = df.sort_values('cascade_score', ascending=False).iloc[0]
    orig_time = candidate['Scheduled_Departure']
    best = {"flight": candidate['Flight_ID'], "orig_time": str(orig_time), "orig_score": int(candidate['cascade_score']), "suggested_shift":0, "new_score": int(candidate['cascade_score'])}
    # try shifts -max_shift..+max_shift
    for shift in range(-max_shift, max_shift+1, step):
        new_time = orig_time + datetime.timedelta(minutes=shift)
        # recompute downstream count heuristic for this flight
        ws = new_time
        we = ws + datetime.timedelta(minutes=window_min)
        mask = (df['Scheduled_Departure']>ws) & (df['Scheduled_Departure']<=we) & (df['Aircraft']==candidate['Aircraft'])
        downstream = int(mask.sum())
        new_score = int(candidate['Delay_Minutes'] or 0) * downstream
        if new_score < best['new_score']:
            best.update({"suggested_shift": shift, "new_score": int(new_score), "suggested_time": str(new_time)})
    return JSONResponse(content=best)

# Serve static frontend
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "..")), name="static")

@app.get("/", response_class=HTMLResponse)
def root():
    index_path = os.path.join(BASE_DIR, "..", "frontend", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), status_code=200)
