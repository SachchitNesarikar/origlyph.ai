# Origlyph — Integration Boundaries & Architecture Guide

This document specifies the exact technical contracts, environment variables, data flows, and architectural boundaries for developers extending Origlyph beyond the baseline.

---

## 1. Grounded AI Integration (Google Gemma 2)

### Architectural Boundary
The hint engine is decoupled inside `backend/app/services/hint_engine.py`:
- `BaseHintAdapter`: Abstract interface defining `generate_hint(artifact, verified_facts, hint_level)`.
- `DeterministicHintAdapter`: Operational default backed by validated seed records.
- `GemmaHintAdapter`: Adapter class designed for Vertex AI or local Ollama endpoints.

### Expected Environment Variables
```env
GEMMA_PROVIDER=gemma_vertex        # Options: "deterministic" | "gemma_vertex" | "gemma_ollama"
GEMMA_ENDPOINT=https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT/locations/$LOCATION/publishers/google/models/gemma-2-9b-it:predict
GEMMA_MODEL_NAME=gemma-2-9b-it
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
```

### Fact-Grounding Rules & Prompt Template
The AI must **never** hallucinate or invent coordinates, dates, creators, or provenance edges.
The prompt sent to Gemma must pass **only** the `verified_facts` array:

```jinja2
System: You are an archival cultural heritage specialist for Origlyph.
Your goal is to provide a progressive hint (Tier {{ hint_level }}) for a cultural artifact.
STRICT CONSTRAINT: You must ONLY use the verified facts provided below.
DO NOT disclose latitude, longitude, or modern city coordinates.
If facts are insufficient to address the tier, state curatorial uncertainty.

Verified Facts:
{% for fact in verified_facts %}
- [{{ fact.id }}] {{ fact.category }}: {{ fact.fact_text }} (Citation: {{ fact.source_citation }})
{% endfor %}

Output JSON format:
{
  "hint_text": "...",
  "supporting_fact_ids": ["f001-1"],
  "caveat_or_uncertainty": null
}
```

### Fallback Guarantee
If the network fails, rate limits occur, or `GEMMA_PROVIDER=deterministic`, the adapter automatically calls `DeterministicHintAdapter` without player disruption.

---

## 2. Internet Archive Ingestion Pipeline

### Data Acquisition Boundary
Data acquisition is **strictly decoupled from gameplay requests**. Ingestion occurs via an asynchronous background script (`scripts/ingest_internet_archive.py`), saving to the store.

### API Ingestion Flow
1. **Search Candidate Records**:
   Query the official Internet Archive Advanced Search API:
   ```
   GET https://archive.org/advancedsearch.php?q=mediatype:image+AND+subject:(cultural+heritage+OR+archaeology)+AND+format:JPEG&fl[]=identifier,title,creator,date,description,coverage,licenseurl&rows=50&output=json
   ```

2. **Retrieve File Metadata & Direct Image URLs**:
   ```
   GET https://archive.org/metadata/{identifier}
   ```
   Direct image URL: `https://archive.org/download/{identifier}/{files[name]}`

3. **Schema Normalization**:
   - `identifier` $\to$ `id: "ia-" + identifier`
   - `coverage` (or Dublin Core spatial tag) $\to$ extract coordinates and geocode to decimal degrees.
   - `creator` $\to$ `creator`
   - `licenseurl` $\to$ `rights_statement`
   - `https://archive.org/details/{identifier}` $\to$ `source_url`
   - Set `location_confidence: "approximate"` unless explicit GPS survey tags exist.

---

## 3. MongoDB Atlas Persistence

### Schema Design & Indexes
In baseline mode, data is held in memory and loaded from `data/artifacts.json`. When switching to MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/origlyph?retryWrites=true&w=majority
MONGODB_DB_NAME=origlyph
```

### Collections & Geospatial Indexing
1. **`artifacts` collection**:
   ```javascript
   db.artifacts.createIndex({ "coordinates": "2dsphere" });
   db.artifacts.createIndex({ "id": 1 }, { unique: true });
   ```
   GeoJSON structure:
   ```json
   {
     "id": "artifact-001",
     "title": "Under the Wave off Kanagawa",
     "location": {
       "type": "Point",
       "coordinates": [139.6917, 35.6895] // [longitude, latitude]
     }
   }
   ```

2. **`provenance_edges` collection**:
   Enables multi-hop provenance graph traversals via `$graphLookup`:
   ```javascript
   db.artifacts.aggregate([
     { $match: { id: "artifact-001" } },
     {
       $graphLookup: {
         from: "provenance_edges",
         startWith: "$id",
         connectFromField: "target_id",
         connectToField: "source_id",
         as: "provenance_network",
         maxDepth: 3
       }
     }
   ]);
   ```

---

## 4. Production Deployment on Render

### Deployment Option: Unified Single Web Service (Recommended)
FastAPI serves the built React/Vite distribution from `frontend/dist` when present.

1. **Create Web Service** on Render connected to this repository.
2. **Environment**: Python 3
3. **Build Command**:
   ```bash
   cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables on Render**:
   - `PORT`: Set automatically by Render.
   - `ORIGLYPH_ENV`: `production`

---

## 5. ElevenLabs Audio Narration Adapter (Optional)

### Audio Delivery Flow
Only after the round is scored and revealed:
1. Client requests `POST /api/artifacts/{id}/narrate`
2. Backend queries ElevenLabs Text-to-Speech API (`https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`) passing the curatorial summary.
3. Streams back MP3 audio or caches the audio file in an object store.
4. Requires `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Baseline operates with text reveal when key is absent.

---

## 6. DevRelay Developer Workflow

DevRelay is a developer operations and automated pull request review workflow. It is kept external to application code and runtime logic, used exclusively in CI/CD pipelines to validate that changes do not introduce score regressions, coordinate leaks, or schema breaking changes.
