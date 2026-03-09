# wa-bridge JWT Auth

## Problem

wa-bridge is publicly reachable on Railway, protected only by a static shared secret passed as a query parameter. This is insecure:

- Static secret never rotates
- Secret travels in URLs (logged by proxies, visible in logs)
- No validation that the caller owns the session they're connecting to

## Solution

Replace the static token with short-lived signed JWT tokens for the server-to-server connection between the Nitro WS proxy and wa-bridge.

## Auth Flow

```
Browser ──cookie──> Nitro WS proxy ──JWT──> wa-bridge
          (Better Auth session)      (signed, 5min TTL)
```

The browser never talks to wa-bridge directly. JWT is purely server-to-server.

## JWT Claims

```json
{
  "sub": "<userId>",
  "coupleId": "<coupleId>",
  "sessionId": "<bridgeSessionId>",
  "iat": 1709971200,
  "exp": 1709971500
}
```

## Changes

### wa-bridge (`apps/wa-bridge/src/index.ts`)

- On WS upgrade: extract `Authorization: Bearer <jwt>` from headers
- Verify JWT signature using `jose` library
- Validate: signature, expiry, and that `sessionId` claim matches the requested session
- Reject with `4003` if invalid
- Backward compat: during migration, also accept old `token` query param

### Web WS proxy (`apps/web/server/routes/ws/chat.ts`)

- Before opening upstream WS, sign a JWT with `{ sub: userId, coupleId, sessionId }`
- Pass via `protocols` array (WS doesn't support custom headers from Node `ws` easily — use subprotocol or first-message auth)
- Actually: Node `ws` DOES support custom headers. Pass as `headers: { Authorization: 'Bearer <jwt>' }` in the WS constructor options.

### Library

`jose` — already a transitive dependency (Better Auth uses it). Zero new deps.

### Env Vars

| Var | Service | Purpose |
|---|---|---|
| `WA_BRIDGE_JWT_SECRET` | web + wa-bridge | Shared 256-bit signing secret |
| `WA_BRIDGE_URL` | web only | Bridge URL (public for local dev, could be private networking in future) |

Old `WA_BRIDGE_SECRET` removed after migration.

## Deploy Order

1. Deploy wa-bridge — accepts both old token AND new JWT
2. Deploy web — starts sending JWT instead of static token
3. Follow-up: remove old token support from bridge

## Security Properties

- Tokens expire in 5 minutes — intercepted tokens are short-lived
- Claims are scoped — token only valid for one user/session combo
- Secret never appears in URLs or logs
- Bridge validates both signature and claims
