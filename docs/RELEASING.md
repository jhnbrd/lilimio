# Versions, releases, and deployment records

## Version numbering

Use semantic versions: `MAJOR.MINOR.PATCH`, with matching `package.json`, lockfile, changelog, and Git tag `vMAJOR.MINOR.PATCH`.

- **Patch** (`0.2.1`): fixes and small compatible improvements.
- **Minor** (`0.3.0`): new features; during `0.x`, document any breaking changes here.
- **Major** (`1.0.0`): an explicitly reviewed stable baseline; thereafter increment for incompatible changes.
- Use suffixes such as `0.3.0-beta.1` for preview builds and mark those GitHub releases as prereleases.

Documentation-only changes do not require a version bump. Never move a published tag. The first release is `v0.2.0`, matching the existing app version at commit `84e6cf4`.

## Publish a release

1. Run `npm version patch --no-git-tag-version` (or `minor`/`major`) and write a concise `CHANGELOG.md` entry.
2. Run `npm test && npm run typecheck && npm run build`.
3. Commit and push the version, lockfile, and notes. Tag that exact commit and push the tag.
4. Create the GitHub release with a notes file:

```sh
gh release create vX.Y.Z --verify-tag --title "lilimio. vX.Y.Z" --notes-file /path/to/release-notes.md
```

A release is a source snapshot, not a deployment. Describe included behavior and limitations; do not claim that publishing it updated the server. GitHub provides source archives automatically.

## Record an already completed manual deployment

First update and verify the Debian server using [DOCKER.md](DOCKER.md). Copy its exact revision with `git rev-parse HEAD`.

Open **Actions → Record manual deployment → Run workflow**, choose `main` for the workflow, and enter that deployed SHA in `deployed_ref`. Or use:

```sh
gh workflow run record-manual-deployment.yml -f deployed_ref=<verified-server-commit-sha>
```

The workflow resolves the selected revision, creates a production deployment record, and marks it successful with **https://lilimio.jhnbrd.com** as its environment URL. The description and payload identify it as an owner-reported manual deployment. The success state records the operator's attestation, not independent verification of the server's revision or availability.

It runs only on manual dispatch: no push, tag, or release automatically claims a deployment. It uses `GITHUB_TOKEN` with contents-read and deployments-write permissions; no server credentials are needed. It performs no SSH, Docker, file upload, or hosting operation. The custom deployment task is `record-manual-deployment` so the record is distinguishable from deployment requests.
