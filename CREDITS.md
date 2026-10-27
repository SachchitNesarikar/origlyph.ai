# Credits — the open-source atlas behind Origlyph

Origlyph stands on the work of 102 open-source projects. Every entry says how it relates to this codebase. Only the **In the stack** section is used in the running app; the rest are open collections, standards and tools Origlyph is designed to sit alongside, or that inspired it. Each project keeps its own licence — follow the link for terms.

Run `python scripts/check_credits.py` to confirm every link still resolves and to print current licences and star counts.

## In the stack

Running in Origlyph today: dependencies, fonts and map data the app actually uses.

| Project | How it relates |
|---|---|
| [facebook/react](https://github.com/facebook/react) | Renders every screen of the interface |
| [vitejs/vite](https://github.com/vitejs/vite) | Dev server and production bundler for the frontend |
| [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | Types the API contract shared by UI and backend models |
| [Leaflet/Leaflet](https://github.com/Leaflet/Leaflet) | The interactive guess-map where players drop their pin |
| [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | Icon set used across navigation, hints and reveal cards |
| [vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) | React transform and fast refresh inside Vite |
| [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | Type definitions for React and Leaflet (@types packages) |
| [fastapi/fastapi](https://github.com/fastapi/fastapi) | The backend API: challenges, hints, guesses, provenance |
| [pydantic/pydantic](https://github.com/pydantic/pydantic) | Validates artifact records and every API payload |
| [encode/uvicorn](https://github.com/encode/uvicorn) | ASGI server that runs the backend |
| [encode/starlette](https://github.com/encode/starlette) | Routing, CORS, gzip and static mounting under FastAPI |
| [CartoDB/basemap-styles](https://github.com/CartoDB/basemap-styles) | Voyager basemap styles for the street tiles under the guess map |
| [pytest-dev/pytest](https://github.com/pytest-dev/pytest) | Runs the 31 backend unit and integration tests |
| [encode/httpx](https://github.com/encode/httpx) | HTTP test client for the API tests |
| [undercasetype/Fraunces](https://github.com/undercasetype/Fraunces) | Display typeface for titles, scores and plate captions |
| [tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans) | Body typeface for interface text |
| [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) | Monospace for coordinates, scores and citations |
| [openstreetmap/openstreetmap-website](https://github.com/openstreetmap/openstreetmap-website) | OpenStreetMap data behind the street tiles under the guess map |
| [NDISCOVER/Cinzel](https://github.com/NDISCOVER/Cinzel) | Inscriptional capitals for labels and small headings |

## Open collections & geodata

Open museum datasets, geocoders and map data. The seed records and the ingestion plan in ARCHITECTURE.md draw on this world; nothing here is bundled.

| Project | How it relates |
|---|---|
| [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) | Public-domain Natural Earth geometry that world-atlas is built from |
| [metmuseum/openaccess](https://github.com/metmuseum/openaccess) | Open Access records from The Met, the source of several seed artifacts |
| [MuseumofModernArt/collection](https://github.com/MuseumofModernArt/collection) | MoMA's collection dataset; matches the manifest's modern-art ingestion target |
| [tategallery/collection](https://github.com/tategallery/collection) | Tate's open collection metadata, a candidate ingestion source |
| [cooperhewitt/collection](https://github.com/cooperhewitt/collection) | Cooper Hewitt design collection metadata |
| [nationalgalleryofart/opendata](https://github.com/nationalgalleryofart/opendata) | National Gallery of Art open data with creator and place fields |
| [art-institute-of-chicago/api-data](https://github.com/art-institute-of-chicago/api-data) | Art Institute of Chicago data dumps with place of origin |
| [ClevelandMuseumArt/openaccess](https://github.com/ClevelandMuseumArt/openaccess) | Cleveland Museum of Art open-access records with creation places |
| [Smithsonian/OpenAccess](https://github.com/Smithsonian/OpenAccess) | Smithsonian Open Access metadata and media |
| [harvardartmuseums/api-docs](https://github.com/harvardartmuseums/api-docs) | Harvard Art Museums API with provenance and findspot fields |
| [internetarchive/internetarchive](https://github.com/internetarchive/internetarchive) | Python client for the Internet Archive ingestion pipeline in ARCHITECTURE.md |
| [pelagios/recogito2](https://github.com/pelagios/recogito2) | Place annotation tool; the same place-linking idea as our location basis |
| [osm-search/Nominatim](https://github.com/osm-search/Nominatim) | Open geocoder for turning findspot text into coordinates |
| [pelias/pelias](https://github.com/pelias/pelias) | Open geocoding engine; alternative to Nominatim for historical places |
| [geopy/geopy](https://github.com/geopy/geopy) | Geodesic distance and geocoding; cross-check for our Haversine scoring |
| [linked-art/linked.art](https://github.com/linked-art/linked.art) | Linked Art model for describing cultural objects and their places |
| [schemaorg/schemaorg](https://github.com/schemaorg/schemaorg) | Schema.org vocabulary for exporting artifact pages as structured data |

## Standards, tools & next steps

Projects Origlyph's boundaries are shaped to meet (IIIF, linked data, geo tooling, local models, heritage platforms). Not wired in yet.

| Project | How it relates |
|---|---|
| [topojson/topojson](https://github.com/topojson/topojson) | Decodes world geometry; the route to a fully offline vector basemap |
| [topojson/world-atlas](https://github.com/topojson/world-atlas) | Ready-made country outlines for that offline basemap |
| [fontsource/fontsource](https://github.com/fontsource/fontsource) | Self-hosts the typefaces so the UI renders identically offline |
| [openseadragon/openseadragon](https://github.com/openseadragon/openseadragon) | Deep-zoom viewer; natural upgrade for the Inspect modal |
| [ProjectMirador/mirador](https://github.com/ProjectMirador/mirador) | IIIF viewer for museum-hosted high-resolution images |
| [UniversalViewer/universalviewer](https://github.com/UniversalViewer/universalviewer) | IIIF viewer for multi-image objects |
| [IIIF-Commons/manifesto](https://github.com/IIIF-Commons/manifesto) | Parses IIIF manifests that museums publish for their objects |
| [iiif-prezi/iiif-prezi3](https://github.com/iiif-prezi/iiif-prezi3) | Builds IIIF manifests from artifact records |
| [cantaloupe-project/cantaloupe](https://github.com/cantaloupe-project/cantaloupe) | IIIF image server for self-hosted artifact images |
| [digitalbazaar/jsonld.js](https://github.com/digitalbazaar/jsonld.js) | JSON-LD processing for linked-data export of provenance edges |
| [RDFLib/rdflib](https://github.com/RDFLib/rdflib) | Serialises the provenance graph as RDF |
| [networkx/networkx](https://github.com/networkx/networkx) | Graph analysis for the global provenance network |
| [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js) | Graph library; reference for richer provenance exploration |
| [d3/d3](https://github.com/d3/d3) | Reference for force layouts and scales in the graph view |
| [d3/d3-geo](https://github.com/d3/d3-geo) | Map projections; informs the atlas basemap |
| [d3/d3-force](https://github.com/d3/d3-force) | Force simulation behind our node layout approach |
| [Turfjs/turf](https://github.com/Turfjs/turf) | Geodesic and spatial analysis in the browser |
| [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) | Vector-tile map engine for a future globe view |
| [openlayers/openlayers](https://github.com/openlayers/openlayers) | Alternative web map library with deep projection support |
| [OSGeo/PROJ](https://github.com/OSGeo/PROJ) | Coordinate transformation library behind most geodesy tools |
| [pyproj4/pyproj](https://github.com/pyproj4/pyproj) | Python geodesic calculations to cross-check scoring |
| [shapely/shapely](https://github.com/shapely/shapely) | Geometry tools for regions and region-based scoring |
| [geopandas/geopandas](https://github.com/geopandas/geopandas) | Analysing seed datasets geographically |
| [gboeing/osmnx](https://github.com/gboeing/osmnx) | OpenStreetMap analysis for contextual place hints |
| [protomaps/PMTiles](https://github.com/protomaps/PMTiles) | Single-file offline map tiles for fully offline deployment |
| [felt/tippecanoe](https://github.com/felt/tippecanoe) | Builds vector tiles from artifact location layers |
| [mapbox/supercluster](https://github.com/mapbox/supercluster) | Clusters artifact pins on the catalog map |
| [Leaflet/Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | Marker clustering for dense archives |
| [vasturiano/globe.gl](https://github.com/vasturiano/globe.gl) | 3D globe for a future reveal animation |
| [vasturiano/force-graph](https://github.com/vasturiano/force-graph) | Canvas force graph for large provenance networks |
| [google-deepmind/gemma](https://github.com/google-deepmind/gemma) | Gemma, the model behind the optional grounded-hint adapter |
| [ollama/ollama](https://github.com/ollama/ollama) | Local model runtime for the gemma_ollama provider |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | Local inference engine for offline grounded hints |
| [huggingface/transformers](https://github.com/huggingface/transformers) | Model library for self-hosted hint generation |
| [explosion/spaCy](https://github.com/explosion/spaCy) | Place-name extraction when ingesting free-text records |
| [omeka/omeka-s](https://github.com/omeka/omeka-s) | Heritage publishing platform Origlyph records could be exported to |
| [collectiveaccess/providence](https://github.com/collectiveaccess/providence) | Collections management system with place-of-origin fields |
| [ArchivesSpace/ArchivesSpace](https://github.com/ArchivesSpace/ArchivesSpace) | Archives management; a source of provenance records |
| [artefactual/atom](https://github.com/artefactual/atom) | Access to Memory archival description software |
| [projectblacklight/blacklight](https://github.com/projectblacklight/blacklight) | Discovery interface pattern for large archives |
| [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | Next step for frontend unit tests |
| [microsoft/playwright](https://github.com/microsoft/playwright) | End-to-end tests for the guess and reveal flow |
| [testing-library/react-testing-library](https://github.com/testing-library/react-testing-library) | Component tests for the guess and reveal flow |
| [eslint/eslint](https://github.com/eslint/eslint) | Linting for the frontend |
| [prettier/prettier](https://github.com/prettier/prettier) | Formatting |
| [astral-sh/ruff](https://github.com/astral-sh/ruff) | Linting and formatting for the backend |
| [python-pillow/Pillow](https://github.com/python-pillow/Pillow) | Thumbnail generation during ingestion |
| [mapillary/mapillary-js](https://github.com/mapillary/mapillary-js) | Open street-level imagery; a neighbouring geo-guessing idea |

## Craft & inspiration

Libraries and typefaces that shaped the look and the roadmap for the interface.

| Project | How it relates |
|---|---|
| [rough-stuff/rough](https://github.com/rough-stuff/rough) | Hand-drawn line style, a reference for the engraved look |
| [rough-stuff/rough-notation](https://github.com/rough-stuff/rough-notation) | Hand-drawn annotations for archival notes |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Animation library for choreographed reveals |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 3D engine for object turntables |
| [paperjs/paper.js](https://github.com/paperjs/paper.js) | Vector scripting for engraved ornament |
| [processing/p5.js](https://github.com/processing/p5.js) | Creative-coding toolkit for generative placeholder art |
| [observablehq/plot](https://github.com/observablehq/plot) | Grammar-of-graphics charts for score history |
| [mapbox/delaunator](https://github.com/mapbox/delaunator) | Fast triangulation for generative patterns |
| [mapbox/earcut](https://github.com/mapbox/earcut) | Polygon triangulation for filled map regions |
| [mourner/simplify-js](https://github.com/mourner/simplify-js) | Line simplification for geodesic arcs |
| [mourner/flatbush](https://github.com/mourner/flatbush) | Spatial index for nearby-artifact lookups |
| [rsms/inter](https://github.com/rsms/inter) | Interface typeface considered for dense UI text |
| [CatharsisFonts/Cormorant](https://github.com/CatharsisFonts/Cormorant) | Classical display face, close kin of our title type |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | Accessible dialog primitives for modals |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Utility CSS considered; we kept a hand-written design system |
| [storybookjs/storybook](https://github.com/storybookjs/storybook) | Component workshop for the UI |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | Small state store if round state outgrows App.tsx |
| [TanStack/query](https://github.com/TanStack/query) | Server-state caching for the API client |
