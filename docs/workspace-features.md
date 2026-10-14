# Workspace features and the Platform

Written against `backend.voice-labs/platform` (read only). Every call goes through `request()` in `lib/platform.ts`;
each backend router has a typed module beside it. Base URL: `NEXT_PUBLIC_PLATFORM_URL` (default `http://localhost:8000`).

## What is built, and where

| Area | Page / component | API module | Platform routes |
| --- | --- | --- | --- |
| Voice library | `/voices` | `lib/voices.ts` | `GET /voices`, `POST /voices/{id}/status`, `DELETE /voices/{id}` |
| Clone voice (consent required) | `/voices/clone` | `lib/voices.ts` | `POST /voices/clone` |
| Design voice | `/voices/design` | `lib/voices.ts` | `POST /voices/design` |
| Voice picker on an agent | `components/agent-form.tsx` | `lib/voices.ts` | `GET /voices?status=ready`, `PATCH /agents/{id}` (`voice_profile_id`) |
| Agent templates | `/agents/new` (`TemplatePicker`) | `lib/templates.ts` | `GET /agent-templates`, `POST /agent-templates/{key}/agents` |
| Deployments (web / phone / API) | agent page (`DeploymentsPanel`) | `lib/deployments.ts` | `GET/POST /deployments`, `PATCH`, `DELETE` (archive) |
| Tools list + assignment | `/tools`, agent page | `lib/tools.ts` | `/tools`, `PUT /agents/{id}/tools` |
| Knowledge + assignment | `/knowledge`, agent page | `lib/knowledge.ts` | `/knowledge/documents`, `PUT /agents/{id}/knowledge` |
| Call outcomes, handoff | conversation detail (`OutcomePanel`), list badges | `lib/platform.ts`, `lib/outcomes.ts` | `PUT /conversations/{id}/outcome` |
| Code-switching tags | transcript (`LanguageTags`) | – | `primary_language`, `detected_languages` per message |
| Campaigns | `/campaigns`, `/campaigns/new`, `/campaigns/[id]` | `lib/campaigns.ts` | `/campaigns`, `/targets`, `POST …/status` |
| Analytics | `/analytics` | `lib/analytics.ts` | `GET /analytics/summary` |
| Live latency | playground (`LatencyPanel`), analytics | `lib/latency.ts` | `LatencyMeasured` runtime events |

Rules mirrored from the Platform so the UI never offers a move that will fail: voice status moves
(`voiceActions`), campaign transitions (`TRANSITIONS`, `EDITABLE`, `TARGETS_EDITABLE`), E.164 numbers, SIP-only phone
numbers, the consent requirement, and the outcome list. Error codes become sentences in `lib/platform-errors.ts`.

## "Coming soon" (stored by the Platform, not run yet)

Switches live in `lib/capabilities.ts`. Turn one on without a code change:
`NEXT_PUBLIC_CAPABILITIES=voicePreview,liveLatency`.

| Switch | Today | What turns it on |
| --- | --- | --- |
| `voicePreview` | disabled button with a label | A Runtime preview endpoint. `previewVoice()` in `lib/voices.ts` is a **proposed** contract (`POST /voices/{id}/preview` → audio); change it to match the real one. |
| `liveLatency` | empty panel with a label | Runtime emitting `LatencyMeasured`; both the playground panel and analytics already read it. |
| `providerCloning` | clone/design voices stay Queued | A provider that creates the voice and moves it to ready. |
| `sipDialing`, `apiCalls` | records saved, labelled | A dialer / API call path. Starting a campaign only changes its status. |
| `liveTransfer` | escalation shown, labelled | Runtime triggering handoff and a phone transfer. |
| `toolExecution`, `knowledgeSearch` | assignment works, labelled | Tools running and retrieval during calls. |
| `dubbing` | not built | Deferred. |

## Connecting to the real backend

Nothing else to wire: point `NEXT_PUBLIC_PLATFORM_URL` at it and allow the web origin in `PLATFORM_WEB_ORIGIN`
(the Platform's CORS allows GET/POST/PUT/PATCH/DELETE). Pages poll gently (voices and campaigns every 8–10 s) because
voice status and campaign state change outside the page.

## Checked how

Typecheck, unit tests with mocked fetch (`__tests__/workspace-features.test.tsx`), and a browser click-through of
every flow against a stand-in Platform that follows the same routes, validation and error codes. It was **not** run
against the real backend (its dependencies were not installable here), so do one pass against it before relying on this.

## Not built

Editing tools or documents after creation (only enable/disable), deleting tools or documents, per-campaign target
paging beyond 200, and a voice detail page. Each is a small addition to the existing modules.
