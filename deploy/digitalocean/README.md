# Deploy Origlyph to a DigitalOcean Droplet

This deployment runs the React frontend and FastAPI backend in one container,
places Caddy in front for automatic HTTPS, and keeps room state in a Docker
volume. It does not copy the development `.env` file or enable ElevenLabs.

## 1. Create a Droplet

Create an Ubuntu 24.04 Droplet in `blr1` (Bangalore) if available, with at
least 2 GiB of RAM. Add your SSH key and allow inbound TCP ports 22, 80, and
443 in a DigitalOcean Cloud Firewall. Restrict SSH to your own IP when possible.
DigitalOcean charges for the Droplet and any optional backups or networking
resources; check the current price in the control panel before creating it.

## 2. Configure DNS

Create an `A` record for a domain you control that points to the Droplet's
public IPv4 address. Wait for the record to resolve before starting Caddy;
Caddy obtains and renews the HTTPS certificate automatically.

## 3. Install Docker and check out the app

SSH to the Droplet, install Docker Engine with the Compose plugin using
DigitalOcean's current Ubuntu installation instructions, then run:

```bash
sudo mkdir -p /opt/origlyph
sudo chown "$USER":"$USER" /opt/origlyph
git clone --branch main https://github.com/SachchitNesarikar/origlyph.ai.git /opt/origlyph
cd /opt/origlyph
```

If the repository is private, configure a deploy key or another read-only Git
credential on the Droplet; do not put a personal access token in the clone URL.

## 4. Add deployment-only configuration

Create `/opt/origlyph/.env` with the hostname and an origin matching the DNS
record:

```dotenv
APP_DOMAIN=play.example.com
```

Create the app's runtime environment file:

```bash
cp .env.production.example .env.production
```

Edit `CORS_ORIGINS` in `.env.production` to `https://play.example.com`.
Only add credentials for integrations that you intentionally want to enable.
The checked-in container excludes `.env`, `.env.*`, SQLite files, and local
dependencies from its build context.

## 5. Start and verify

```bash
docker compose up --build -d
docker compose ps
curl --fail https://play.example.com/api/health
```

The room database is stored in the `room_data` Docker volume and survives
container replacements and restarts. Back it up before destructive Droplet or
volume operations. To follow logs, run `docker compose logs -f app caddy`.

The default image runs one application process so SQLite remains a suitable
single-Droplet room store. For multiple app replicas, migrate room storage to a
shared database before scaling out.
