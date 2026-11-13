# DEFLECT — Rift Arena

The playable DEFLECT web build is served from `index.html`. It loads the compressed, tested game build from the numbered text chunks in `game/chunks/`, reassembles the original gzip payload in the browser, and decompresses it with the browser's native `DecompressionStream` API.

## Local preview
Serve this repository with any static HTTP server (for example, `python3 -m http.server 8000`) and open `http://localhost:8000`. The game needs HTTP(S); opening `index.html` directly as a local file will block fetch requests.

## Notes
- The original production website is not changed by commits to this repository.
- The build was previously exercised with mobile/desktop smoke checks and repeated training-target/deflect cycles. The GitHub Pages/Vercel hosting setup still needs to be configured separately.

## Online multiplayer preview
The multiplayer panel currently provides ephemeral room creation/joining with Supabase Realtime Presence. Players in the same room see the live room roster; room codes are shareable. This is the lobby/presence foundation only: synchronized in-match movement, authoritative hit validation, matchmaking, and persistent accounts are not implemented yet. Client-broadcast gameplay is not cheat-resistant.

### Supabase setup
The browser uses only the project's publishable key in `supabase-config.js`. This key is public by design; never add a secret/service_role key to this repository. Realtime room presence uses channels and does not require database tables or disabling RLS.
