# Deploy Origlyph to Render

Origlyph runs as one Docker-based web service: the image builds the React
frontend and serves it with the FastAPI backend. The included `render.yaml`
sets up a free demo service and configures `/api/health` as its health check.

The free plan is for demos, not durable multiplayer rooms. Render may spin the
service down after inactivity, and its filesystem is ephemeral, so local
SQLite room data can be lost when the service restarts, spins down, or deploys.
The free plan can also take about a minute to wake after inactivity.

## Deploy from the Render Dashboard

### Fix the existing service

The failed service was created with the Node runtime, which runs `npm start`
without installing the Python backend dependencies. In the Render Dashboard:

1. Open the Origlyph web service and go to **Settings**.
2. In **Build & Deploy**, change the runtime/language to **Docker**.
3. Set **Dockerfile Path** to `./Dockerfile` and leave the Docker command
   empty so the Dockerfile's `CMD` starts the app.
4. Set the health check path to `/api/health`.
5. Save changes, then use **Manual Deploy → Deploy latest commit**.

The Dockerfile builds the frontend and backend together and binds to Render's
`PORT` environment variable. No separate frontend service or CORS origin is
needed because the built frontend and API share the same origin.

### Create a service from the Blueprint

Alternatively, in the Render Dashboard select **New → Blueprint**, connect the
Origlyph repository, and deploy its `render.yaml`. This creates a new service
named `origlyph-demo` using the free plan. If the repository is nested in a
larger repository, set the Blueprint's **Root Directory** to `origlyph`.

## Verify

After the deploy succeeds, open the service's `onrender.com` URL and check
`/api/health`; it should return JSON with `"status":"ok"`. The frontend is served
at the service root.

To keep rooms and scores across deploys, upgrade to a paid web service and
attach a persistent disk mounted at `/app/backend/data`. The free plan does
not support persistent disks.
