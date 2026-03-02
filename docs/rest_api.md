# REST API Overview

The Handoff Platform exposes a REST API used by the Handoff CLI for authentication, project listing, and file sync (push/pull). The CLI commands `platform:login`, `platform:init`, `platform:pull`, and `platform:push` call these endpoints.

## OpenAPI specification

Full request/response schemas, parameters, and examples are in the OpenAPI 3 specification:

- **[rest.yml](./rest.yml)** — OpenAPI 3.0 spec for all CLI API endpoints.

You can use this file with tools like Swagger UI or Redoc to browse and test the API.

## Base URL

The API base URL is configurable:

- **Config**: `platformUrl` in `handoff.config.js` or `handoff.config.json`
- **Environment**: `HANDOFF_PLATFORM_URL`
- **Default**: `http://localhost:3000` (for local platform development)

All endpoints are under the path prefix `/api/cli`.

## Authentication

The API uses a **device-code flow**:

1. **Create device code** — `POST /api/cli/auth/device` (no auth). Returns `deviceCode`, `userCode`, `verificationUrl`, `expiresIn`, and `interval`.
2. **User authorizes** — The user opens the verification URL and enters the user code (or approves in the browser).
3. **Poll for token** — The client repeatedly calls `POST /api/cli/auth/token` with body `{ "deviceCode": "..." }` at the given `interval` until the response has `status: "approved"` and includes `token` and `user`.
4. **Use token** — Send the token on subsequent requests as `Authorization: Bearer <token>`.

To log out, call `DELETE /api/cli/auth/token` with the Bearer token to revoke it.

## Endpoints summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/cli/auth/device` | Create device code (start login) |
| POST | `/api/cli/auth/token` | Poll for token (body: `{ deviceCode }`) |
| DELETE | `/api/cli/auth/token` | Revoke token (Bearer) |
| GET | `/api/cli/projects` | List projects (Bearer) |
| GET | `/api/cli/projects/{projectId}/sync/manifest` | Get file manifest (Bearer) |
| GET | `/api/cli/projects/{projectId}/sync/file?path=...` | Download one file (Bearer) |
| POST | `/api/cli/projects/{projectId}/sync/push` | Push changes, multipart (Bearer) |
| POST | `/api/cli/projects/create-push` | Create project and push files, multipart (Bearer) |

See **rest.yml** for request/response bodies, query parameters, and error shapes.

## Sync flow

- **Pull**: Get manifest with `GET .../sync/manifest`, then for each file (or only missing/changed) call `GET .../sync/file?path=<relativePath>`.
- **Push**: Send `baseVersion` (from current manifest or last push), optional `deleted` (JSON array of paths), and file parts (keyed by relative path) to `POST .../sync/push`. On success, the response gives the new `version` and `files` manifest.
- **Conflict**: If the server responds with **409**, the project version has changed (e.g. another push). Pull to get the latest manifest and files, then push again with the new `baseVersion`.
- **Create and push**: For a new project, use `POST /api/cli/projects/create-push` with `orgId`, optional `name` and `figmaProjectId`, and file parts. Returns the new project and sync version.

## Error handling

| Status | Meaning |
|--------|--------|
| 401 | Unauthorized — token missing or invalid |
| 404 | Not found — invalid device code, or project/file not found |
| 408 | Authentication timed out — user did not approve in time |
| 410 | Device code expired — start login again with POST /api/cli/auth/device |
| 409 | Version conflict on push — pull and retry with updated baseVersion |

Error responses typically include a JSON body with `error` and/or `message` fields.
