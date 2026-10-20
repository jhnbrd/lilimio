# Docker on the Debian home server

The Compose service publishes **http://127.0.0.1:8063** on the Debian host and forwards it to Nginx on container port 8080. `http://localhost:8063` also works when localhost resolves to IPv4. The bind is intentionally limited to loopback; other LAN devices cannot connect directly to port 8063.

Your already-configured tunnel remains responsible for `https://lilimio.jhnbrd.com` and its public HTTPS certificate. Docker does not configure a domain, create a tunnel or issue certificates. Keep the existing tunnel's origin at `http://127.0.0.1:8063`. This assumes the tunnel agent runs on the Debian host: a tunnel inside another container has a different localhost and needs an explicitly configured host connection.

## Build and start later

Docker Engine and the Docker Compose plugin must already be installed on Debian. Open a terminal in the copied `Projects/lilimio` directory using its actual Linux filesystem path; `Z:` is the Windows mapping, not a Linux path. Then, when you are ready:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:8063/healthz
```

The first command validates configuration only. The second builds and starts the app. These build/start commands were **not executed** while preparing the configuration. The image builds Linux dependencies from `package-lock.json`, runs tests and the production build, and serves only `dist/` with Nginx. Node.js and npm are not required on the host. No runtime environment file, database or persistent volume is needed for the current frontend.

## App and PWA behavior

- Nginx supports refresh/deep links such as `/explore`, `/plan` and `/legal/privacy`.
- Missing JavaScript, images and styles return 404 instead of the app shell.
- The HTML shell, service worker and manifest use update-friendly cache headers; hashed Vite assets have long-lived caching.
- The service runs as Nginx's unprivileged user, with a read-only root filesystem and a temporary writable `/tmp`. Its health check does not depend on external weather or map providers.
- Live browser requests still go to the existing public providers; provider errors and usage limits remain applicable.
- Browser-local plans and settings belong to their origin. Saves from a development `localhost:3000` tab do not automatically transfer to `localhost:8063` or the public HTTPS domain.
- Public HTTPS through the tunnel provides the secure context required for PWA features. Plain HTTP on a remote LAN address does not provide the same secure context as localhost.

## Copy and rebuild

The requested project-folder copy includes the local archives, design references, Git metadata and Windows dependency folders. `.dockerignore` excludes them from Docker's context, and the Dockerfile explicitly copies only runtime build inputs. The server build does not reuse Windows `node_modules` or a stale copied `dist` directory. Preserve `public/` assets and the root legal documents: the build imports them.

For later source updates, rebuild from the updated project folder with `docker compose up -d --build`. Clients with an older offline version can reload and choose **Update now** when the app offers it. View server logs using `docker compose logs --tail=100 app`. Stop the service using `docker compose down`; saved browser items are not stored inside the container.

If the public domain shows an old version even after the container update, inspect your tunnel/CDN caching rules. The deployment should honor the origin's service-worker and HTML cache headers. No tunnel/CDN settings were changed here.

## Verification scope

The Compose file can be validated without starting Docker containers. Local application tests, type checking and production compilation are separate checks. Per the request, no Docker image was built or container started during configuration; Nginx startup, container health and the public tunnel must be verified when you run it on Debian.
