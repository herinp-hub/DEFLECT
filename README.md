# DEFLECT — Rift Arena

The playable web build is served from `index.html`. It loads the compressed game source from `game/chunks/`, reconstructs the gzip payload in the browser, and applies the gameplay and feature patches in the loader.

## Local preview

Run a static server (for example, `python3 -m http.server 8000`) and open `http://localhost:8000`. Do not open `index.html` directly as a file; the game loads its chunks over HTTP.

## Gameplay and training

- Training target positioning uses the visible core's world-space position.
- The training hit radius is adjusted to match the visible target.
- A training miss exits practice mode and returns the player to the lobby, including clearing a temporary shield.
- Browser smoke tests exercise training start/stop, mobile and desktop gameplay, player name tags, and the feature vault.

## Online multiplayer preview

The Supabase Realtime Presence prototype supports room codes, player movement, player name tags, host-supplied orb snapshots, guest deflect requests, host-side directional/range hit checks, elimination broadcasts, and host failover. The integration test uses two real browser clients.

**Important limitation:** this is peer-hosted prototype multiplayer, not a trusted authoritative game server. A room host still runs the simulation, clients can tamper with their own browser, and host disconnects can interrupt a match. Production competitive play would need server-authoritative simulation and validation.

Player callsigns are editable in the multiplayer panel and appear above local and remote fighters. Guest players can join rooms without signing in; secure staff moderation requires authenticated player accounts.

## Secure admin controls

The admin console uses Supabase Auth and database-enforced permissions. It supports:
- Roles: Owner, Head Admin, Admin, Moderator, and Player.
- Owner-only role assignment and revocation.
- Scoped kick/ban permissions and an unban list.
- Owner/Head Admin announcements and timed arena events (Giant Orb, Double Coins, Orb Rush, Low Gravity, and Rainbow Arena).
- A protected moderation audit log.

### One-time Supabase setup

1. In the Supabase project for DEFLECT, open **SQL Editor** and run the complete file `supabase/migrations/001_admin_roles.sql`.
2. Open DEFLECT, expand **Online Multiplayer**, enter your email under Admin Sign In, and use the magic link sent to that inbox.
3. In Supabase **Authentication → Users**, copy the UUID for the account you just signed into DEFLECT.
4. Run this one-time owner bootstrap statement in SQL Editor, replacing the placeholder with that UUID:

```sql
insert into public.deflect_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'owner');
```

Only do this for the account that should own the game. The owner cannot be safely auto-assigned from browser code; doing that would let any visitor claim ownership. If Supabase rejects the magic-link redirect, add the DEFLECT site's origin under **Authentication → URL Configuration → Redirect URLs**.

The SQL migration keeps role changes and moderation actions behind security-definer database functions and Row Level Security. Never put a Supabase `service_role` key in browser code or this repository. The browser uses only the publishable key in `supabase-config.js`.

## Tests

- `npm run test:game-contract` — packed game and database/security contracts.
- `npm run test:smoke` — mobile/desktop browser checks and two-client multiplayer integration tests.

The original production website is not changed by commits to this repository. No deployment or merge is performed automatically.
