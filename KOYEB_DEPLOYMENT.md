Deploying PayTracker to Koyeb

This repository contains a combined Express server and Vite React client. The provided Dockerfile builds the client and runs the TypeScript server using tsx so you can deploy the image to Koyeb.

Notes
- The server listens on the PORT environment variable (defaults to 5000). Koyeb should be configured to route to the same port.
- Vite build outputs to dist/public (configured in vite.config.ts) and the server serves static files from that directory in production.

Build and push an image (example using Docker Hub)

1. Build the image from the repository root:

   docker build -t <your-docker-username>/paytracker:latest .

2. Push the image to your registry:

   docker push <your-docker-username>/paytracker:latest

Koyeb options
- Use an existing Docker image: point Koyeb to the image you pushed.
- Or connect your GitHub repo and let Koyeb build it from this repository (it will use the Dockerfile).

Recommended service settings on Koyeb
- Port: 5000
- Health check: TCP on port 5000 (or HTTP path /)
- Environment variables: set PORT (5000) and any secrets required (database URL, session secret, etc.)

Optimization notes
- The current Dockerfile runs a production Vite build then starts the server using npx tsx. That requires devDependencies to be installed in the image. For a slimmer image you can change to a two-stage build: compile TypeScript (tsc) in a build stage, copy compiled JS into a smaller node:20-alpine runtime, and run node dist/index.js as the CMD.

Troubleshooting
- If the server cannot find the built client, ensure the build step created dist/public. The server expects the build in dist/public.
- If the image is too large, switch to a two-stage build and avoid installing devDependencies in the final image.

If you'd like, I can convert the current single-stage Dockerfile into a two-stage multi-stage Dockerfile that compiles the server to JS and uses a smaller runtime image for production.
