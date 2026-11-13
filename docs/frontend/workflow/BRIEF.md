# UNAI — Frontend Redesign Brief (Inha Admissions portal)

> **UNAI** (formerly Voice Labs) is a B2B AI communication platform: AI voice agents (primary), real-time translation, AI chatbots and developer APIs. First market: university admissions offices. First MVP: the AI Admissions Assistant for international students at Inha University. Calls run in the browser over WebRTC (LiveKit); telephone/SIP calling is deferred.

This repository is the Inha Admissions portal example (confirmed 2026-11-12); the UNAI marketing site is the `frontend` repository. This brief records legacy design input; it should be reconciled with the current UNAI direction before implementation.

## History (pre-UNAI)

Core principle (pre-UNAI): realtime multilingual voice communication was previously framed as the core product; UNAI’s current primary product is AI voice agents, with real-time translation supporting human handoffs. Example: Person A speaks Korean, Person B English; A hears English translation, B hears Korean; each hears only audio intended for them; realtime transcripts + communication state. Long-term: browser↔browser, browser↔phone, realtime speech translation, AI voice agents, multilingual calls, provider switching, transcripts, voice-preserving translation, AI participants joining calls.

UI priority order: 1 People, 2 Conversation, 3 Audio, 4 Language, 5 Realtime state, 6 Translation, 7 Transcript, 8 Controls. Technical/provider info available but secondary.

Must feel: premium, modern, technical but approachable, realtime, trustworthy, fast, human, distinctive, production-ready. Must NOT look like: generic AI SaaS dashboard, ChatGPT clone, generic Tailwind template, gradient card collection, "AI-generated website", cyberpunk, dev-only monitoring dashboard. Communication product first, AI product second.

Backend stack (do NOT replace): FastAPI, Pipecat, LiveKit, PostgreSQL, Valkey, OTel, Prometheus/Grafana, Docker Compose. Providers: Deepgram STT, OpenAI LLM/translation, Cartesia TTS; future ElevenLabs, Qwen, others.

IA should distinguish: (A) Communication experience — primary: start/join call, participants, languages, realtime translation, audio state, transcript, connection state, call controls. (B) Workspace/Dashboard — calls, agents, languages, providers, settings, usage, evaluation. (C) Developer/Technical — provider, model, latency, connection status, audio diagnostics, realtime metrics; secondary, not exposed by default.

Visual directions to explore (3): A Premium Communication (calm, spacious, typography, hierarchy, subtle animation); B Technical Realtime (live state, audio viz, precision, subtle data viz); C Human + AI (human conversation, language, voice, subtle AI assistance, warm but sophisticated). Compare, recommend one. Don't copy other companies.

Design system: typography (family, heading/body/label/code scales), spacing scale, colors (background, surface, elevated surface, primary, secondary, accent, success, warning, error, muted text, border; no gradient overuse). Components: Button, Input, Select, Dialog, Tooltip, Avatar, Participant, Language selector, Audio state, Connection state, Transcript line, Translation line, Provider selector, Call control, Status indicator, Toast, Empty state, Loading state, Error state.

MOST IMPORTANT SCREEN: realtime communication screen. Must immediately show: who is in the conversation (Korean speaker → English translation; English speaker → Korean translation); what is happening now (listening, speaking, translating, speaking translation, connecting, reconnecting, muted, network degraded); what they said (realtime transcript/translation without overwhelming); controls (mic, speaker, leave, language, translation mode, settings).

Realtime state must be visual, not only text: subtle waveform, speaking indicators, audio activity, participant state animation, connection indicators, translation progress, transcript streaming, interruption/barge-in. Animations must reflect actual system state.

Animation: good = speaking indicator, waveform, participant state transitions, transcript appearing, connection transitions, join/leave, language/provider switching. Avoid floating gradients, constant movement, random particles, huge hero animations. Respect prefers-reduced-motion. Feel fast.

Responsive: desktop, laptop, tablet, mobile — rethink mobile navigation, call controls, transcript, participant layout, settings, provider config; don't just shrink.

Accessibility: keyboard nav, visible focus, screen readers, semantic HTML, contrast, reduced motion, labels, error messages, loading states.

Performance: no huge animation libs unnecessarily, no heavy assets, no big deps, no excessive rerenders, no expensive constant visualizations. Watch audio viz, transcript updates, live participant state, LiveKit events, React rendering.

CRITICAL: Do not break existing functionality (LiveKit, audio tracks, participant state, translation tracks, transcript events, API calls, realtime events, auth, settings). Frontend/UX transformation only. Prefer existing components/deps/APIs/state. Don't rebuild STT/translation/TTS/WebRTC/SIP.

Acceptance: (1) new user understands what Voice Labs does in ~5s; (2) starting/joining conversation obvious; (3) participants+languages immediately understandable; (4) speaking/translation state visually clear; (5) transcript + translated speech easy to follow; (6) call controls obvious; (7) communication product, not AI dashboard; (8) distinctive identity; (9) realtime functionality still works; (10) desktop+mobile intentional; (11) animations aid understanding; (12) maintainable; (13) no unnecessary deps; (14) frontend tests pass.

Deliverables before implementation: docs/frontend/FRONTEND_AUDIT.md, docs/frontend/VOICE_LABS_UX_SPEC.md, docs/frontend/VOICE_LABS_DESIGN_SYSTEM.md (incl. 2–3 visual directions + recommendation). After: redesigned frontend, component docs, tests, before/after screenshots, known limitations, performance notes, accessibility notes. Every major design decision needs a reason. Optimize for clarity + realtime communication + trust + speed + personality.

Repo constraints (AGENTS.md): Next.js App Router frontend (Next 16 — APIs differ from training data; read node_modules/next/dist/docs/ before writing code). Keep client boundary focused on calling Platform and joining LiveKit. Do not add a design system *library*, billing, tenancy, or workflow editor. Run install/typecheck/build when possible. Do NOT commit, push, or add remotes.
