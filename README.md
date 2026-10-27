# Origlyph (オリグリフ)

> *“Decode the places behind culture.”*

Origlyph is an AI-powered cultural heritage discovery platform that turns the investigation of art, archaeology, and historical archives into an interactive cartographic challenge.

Rather than a generic chatbot or a basic geography quiz, Origlyph is built from the ground up as a **serious digital humanities product** inspired by museum archives and contemporary cartography. Players inspect an artifact, analyze its material and historical clues, place a geographic guess on an interactive map, and uncover an evidence-backed provenance graph connecting creators, places, historical periods, and traditions.

---

## 🏛️ Key Features

- **Editorial Cartographic Interface**: Designed with a deep forest-green palette (`#0b1311`), warm off-white typography, and museum archival aesthetics.
- **Interactive Scored Challenge**: Place geographic guesses on an interactive Leaflet map rendered with OpenStreetMap / CartoDB tiles.
- **Mathematical Distance & Exponential Scoring**:
  - Distance computed via the **Haversine formula** ($R = 6,371.0088\text{ km}$).
  - Exponential decay scoring: $\text{score} = \text{round}(5000 \times e^{-\text{distance\_km} / 1500})$.
- **Progressive Evidence Hints**: Three-tier hint engine with transparent score penalties ($-500$, $-1,200$, $-2,200$ PTS) backed strictly by verified archival citations.
- **Fourfold Archival Location Distinction**: Transparently differentiates:
  1. **Creation / Workshop Location**
  2. **Depicted Subject Location**
  3. **Archaeological Discovery Site**
  4. **Holding Museum / Collection**
- **Provenance Graph Explorer**: Interactive connected-node SVG visualizer linking artifacts, master creators, historical places, cultural traditions, and museum collections.
- **Deterministic Baseline & Safe Fallbacks**: Functions 100% offline without requiring external API keys or cloud credentials. Includes procedural SVG artwork fallbacks if museum CDNs are unreachable.
- **Anti-Leakage Safeguards**: Hidden answer coordinates are strictly stripped from client-facing payloads until a guess is submitted. Missing coordinates are never defaulted to `(0, 0)`.

---

## 🏗️ Technical Architecture

```
origlyph/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   ├── artifacts.json          # Curated seed records (The Met, British Museum, MoMA, etc.)
│   │   │   └── source_manifest.json    # Institutional provenance & ingestion strategies
│   │   ├── models/
│   │   │   ├── artifact.py             # Pydantic schemas (VerifiedFact, Relation, Artifact)
│   │   │   └── api.py                  # API contracts (GuessRequest, HintResponse, GraphNode)
│   │   ├── routes/
│   │   │   ├── health.py               # GET /api/health, GET /api/manifest
│   │   │   └── artifacts.py            # Challenge, hint, guess, and provenance endpoints
│   │   ├── services/
│   │   │   ├── geo.py                  # Haversine distance, scoring & accuracy ratings
│   │   │   ├── hint_engine.py          # Grounded hint engine & Gemma AI adapter boundary
│   │   │   ├── artifact_store.py       # In-memory repository & data validation
│   │   │   └── provenance.py           # Directed graph generation & topology
│   │   ├── config.py                   # Environment & CORS configuration
│   │   └── main.py                     # FastAPI application & SPA static distribution mount
│   ├── tests/                          # 31 automated unit & integration tests
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable UI components (Viewer, Map, Hints, Reveal, Graph)
│   │   ├── services/                   # Typed API client
│   │   ├── types/                      # TypeScript schemas
│   │   ├── utils/                      # Geodesic formatters & SVG artwork fallbacks
│   │   ├── App.tsx                     # Main game loop & view router
│   │   ├── index.css                   # Responsive custom CSS (Editorial museum design system)
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example                        # Template for optional future partner keys
└── ARCHITECTURE.md                     # Integration boundary guide for future developers
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: v18+ (tested on Node v20.18.0) and `npm`

### 1. Clone & Environment Setup
```bash
git clone <repository_url> origlyph
cd origlyph

# Copy environment template
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run automated test suite
python -m pytest

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🎮 Gameplay Flow

1. **Artifact Inspection**: Examine high-resolution imagery, era, medium, and the specified **Location Objective** (e.g., guessing where the piece was painted vs. where it was unearthed).
2. **Progressive Hints**: Optionally request Tier 1 (Context), Tier 2 (Topography), or Tier 3 (Archival Record). Each hint incurs a clear score deduction.
3. **Geographic Guess**: Navigate the interactive map, click to place a target pin, and click **Submit Geographic Guess**.
4. **Answer Reveal & Score Breakdown**:
   - Geodesic deviation line plotted between your pin and the authentic site.
   - Base score computed via exponential decay.
   - Transparent hint deduction applied.
   - Qualitative rank awarded (*Pinpoint Master*, *Regional Scholar*, *Continental Navigator*).
   - Fourfold location distinction revealed.
   - Verifiable curatorial facts and institutional citations presented.
5. **Provenance Graph Exploration**: Traverse directed relationships to discover connected creators, companion artifacts, and cultural traditions.

---

## 📋 Data Schema

Each artifact conforms to the documented JSON schema in `backend/app/models/artifact.py`:

```json
{
  "id": "artifact-001",
  "title": "Under the Wave off Kanagawa (The Great Wave)",
  "description": "Source-supported description...",
  "media_url": "https://images.metmuseum.org/...",
  "thumbnail_url": "https://images.metmuseum.org/...",
  "source_name": "The Metropolitan Museum of Art",
  "source_url": "https://www.metmuseum.org/art/collection/search/45434",
  "creator": "Katsushika Hokusai (Japanese, 1760–1849)",
  "date_created": "ca. 1830–1832 (Edo period)",
  "creation_location": "Edo (modern-day Tokyo), Japan",
  "depicted_location": "Off the coast of Kanagawa Prefecture...",
  "discovery_location": null,
  "current_collection": "Metropolitan Museum of Art, New York, NY",
  "latitude": 35.6895,
  "longitude": 139.6917,
  "location_basis": "creation",
  "location_confidence": "verified",
  "rights_statement": "CC0 1.0 Universal (Public Domain)",
  "attribution": "Katsushika Hokusai / The Metropolitan Museum of Art (Open Access)",
  "verified_facts": [
    {
      "id": "f001-1",
      "category": "production",
      "fact_text": "Engraved and printed in the commercial workshops of Edo using polychrome woodblock print...",
      "source_citation": "Metropolitan Museum Department of Asian Art, Accession No. JP1847"
    }
  ],
  "relations": [
    {
      "target_id": "creator-hokusai",
      "relation_type": "created by",
      "target_name": "Katsushika Hokusai",
      "target_type": "Creator",
      "evidence_source_id": "f001-1",
      "notes": "Master ukiyo-e painter and printmaker active during the late Edo period."
    }
  ]
}
```

---

## 🔌 API Contract

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status, version, playable/total counts |
| `GET` | `/api/manifest` | Institutional manifest & ingestion guidelines |
| `GET` | `/api/artifacts` | List artifacts with coordinates hidden |
| `GET` | `/api/artifacts/{id}` | Challenge view (`reveal=false`) or full record (`reveal=true`) |
| `POST` | `/api/artifacts/{id}/hint` | Request progressive evidence-backed hint |
| `POST` | `/api/artifacts/{id}/guess` | Submit coordinate guess & receive score breakdown |
| `GET` | `/api/artifacts/{id}/relations`| Fetch provenance graph nodes and edges |
| `GET` | `/api/provenance/global` | Fetch interconnected multi-artifact network |

---

## 🧪 Automated Test Suite

Run all tests from the `backend/` directory:
```bash
cd backend
python -m pytest
```

### Verified Test Cases (31 tests):
1. **Haversine Distance**: Known city distances (London to Paris $\sim 343\text{ km}$), identical points ($0\text{ km}$), antipodal points ($\sim 20,015\text{ km}$), and coordinate bounds validation $[-90, 90], [-180, 180]$.
2. **Exponential Scoring**: Maximum 5,000 score at $0\text{ km}$, monotonic decay with distance, boundary check at decay distance ($1500\text{ km} \to \sim 1,839$), non-negative score clamping.
3. **Hint Deductions**: Verification of $-500$, $-1,200$, $-2,200$ penalty values.
4. **Answer Leakage Prevention**: Strict verification that hint payloads never contain the hidden numerical target coordinates.
5. **Error & Fixture Handling**: HTTP 404 on unknown IDs, HTTP 422 on invalid latitude/longitude, and HTTP 400 Bad Request when attempting to score unverified fixtures.
6. **Provenance Topology**: Verification of node types (`Artifact`, `Creator`, `Place`, `Cultural Tradition`, `Collection`) and directed edge integrity.

---

## 🔮 Prioritized Five Best Next Improvements

1. **Gemma 2 Grounded RAG Adapter**: Connect the documented `GemmaHintAdapter` to an active Vertex AI endpoint or local Ollama instance to dynamically generate comparative curatorial commentary grounded in `verified_facts`.
2. **Internet Archive Batch Ingestion Script**: Implement the scheduled worker described in `ARCHITECTURE.md` to automatically harvest and geocode public-domain cultural artifacts from the Internet Archive API.
3. **MongoDB Atlas Persistence & Multi-Hop Traversal**: Transition the in-memory store to MongoDB Atlas with geospatial `2dsphere` indexes and `$graphLookup` aggregation for continuous 6-degrees-of-culture exploration.
4. **ElevenLabs Audio Narration**: Integrate streaming voice narration for the post-round curatorial reveal using ElevenLabs' text-to-speech API.
5. **Time-Period Filter & Thematic Expeditions**: Allow players to curate challenges by historical era (e.g., Bronze Age, Edo Period, 19th Century Impressionism) or geographic trade corridor (Silk Road, Mediterranean Maritime).
