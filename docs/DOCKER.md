# Debian server operations

Live app: **https://lilimio.jhnbrd.com**. Docker serves Nginx at `127.0.0.1:8063`; the existing host tunnel supplies public HTTPS. Keep the tunnel origin at `http://127.0.0.1:8063`. A tunnel running in another container needs a separate host connection.

## First setup

Install Docker Engine, the Compose plugin, and Git. Host Node.js is unnecessary.

```sh
cd /mnt/projects/Projects
git clone https://github.com/jhnbrd/lilimio.git lilimio
cd lilimio
docker compose config --quiet && docker compose up -d --build
```

Clone into a new directory. If `lilimio` already contains copied files, preserve it as a backup first; pulling into an untracked folder can fail with “would be overwritten by merge.”

## Update

```sh
cd /mnt/projects/Projects/lilimio &&
git pull --ff-only origin main &&
docker compose up -d --build
```

The `&&` prevents rebuilding old source after a failed pull. Docker installs dependencies from the lockfile, runs tests and compilation, then replaces the service when its image changes. No runtime environment file, database, or persistent volume is required.

## Verify

```sh
git log -1 --oneline
docker compose ps
curl -fsS http://127.0.0.1:8063/healthz
curl -fsS https://lilimio.jhnbrd.com/healthz
```

Check the expected commit, healthy container, and public app in a private browser window. The health endpoint checks Nginx, not external weather or map services. Existing PWA clients may need to reload and select **Update now**.

After verifying the running commit, record it in GitHub using [the manual deployment workflow](RELEASING.md). A GitHub release does not update this server.

## Troubleshooting

```sh
docker compose logs --tail=100 app
```

- **Pull fails:** resolve Git/authentication or local-file conflicts before rebuilding. Preserve local changes; do not blindly reset or clean the folder.
- **Old app:** confirm the commit, then run `docker compose up -d --build --force-recreate`. Check a private window and tunnel/CDN caching if localhost and public results differ.
- **Deep-link refresh fails:** use the supplied Nginx configuration; routes fall back to `index.html`, missing assets return 404.
- **Cannot reach port from LAN:** intentional; port 8063 binds only to the host loopback interface.

## Roll back or stop

Choose a previously verified tag or commit and rebuild:

```sh
git switch --detach <known-good-tag-or-commit> &&
docker compose up -d --build
```

To resume main: `git switch main`, then run the update commands. Record a verified rollback through the manual deployment workflow as well.

`docker compose down` stops the app. Saved plans and settings live in the browser and are specific to its origin.

## Runtime behavior

Nginx runs unprivileged with a read-only root, temporary `/tmp`, health checks, and bounded logs. Hashed assets receive long-lived caching; HTML, the manifest, and service worker use update-friendly headers. The image excludes local archives, dependency folders, secrets, and design references. Public provider requests still originate in the browser.
