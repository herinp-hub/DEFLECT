# DEFLECT — Rift Arena

The playable DEFLECT web build is served from `index.html`. It loads the compressed, tested game build from the numbered text chunks in `game/chunks/`, reassembles the original gzip payload in the browser, and decompresses it with the browser's native `DecompressionStream` API.

## Local preview
Serve this repository with any static HTTP server (for example, `python3 -m http.server 8000`) and open `http://localhost:8000`. The game needs HTTP(S); opening `index.html` directly as a local file will block fetch requests.

## Notes
- The original production website is not changed by commits to this repository.
- The build was previously exercised with mobile/desktop smoke checks and repeated training-target/deflect cycles. The GitHub Pages/Vercel hosting setup still needs to be configured separately.
