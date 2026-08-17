# ONE AI — Functional status

## Live server functionality
- `/api/chat` — real OpenAI Responses API text generation.
- `/api/generate` with `type=image` — real OpenAI Responses image-generation tool; returns a PNG as base64.
- `/api/health` — deployment health endpoint.
- `/api/projects` — project API contract.
- `/api/usage` — usage API contract.

## Provider-dependent
Video, voice, avatar, dubbing and advanced editing are intentionally not faked. Their job contracts are ready, but they require the real provider API credentials and provider-specific implementation.

## Required Vercel environment variables
- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`
- optional `OPENAI_IMAGE_MODEL`

Keep all secret keys server-side.
