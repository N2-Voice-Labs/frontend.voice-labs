const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:8000";

export type VoiceSession = {
  session_id: string;
  conversation_id: string;
  room_name: string;
  connection_status: "configured" | "not_configured";
  runtime_status: string;
  connection: { url: string; token: string };
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  enabled_languages: string[];
  stt_provider_id: string | null;
  llm_provider_id: string | null;
  tts_provider_id: string | null;
  voice_id: string | null;
  /** The shared voice from the Voice library (`/voices`) this agent speaks with. */
  voice_profile_id?: string | null;
  status: string;
};

export type ProviderConfig = {
  id: string;
  kind: "stt" | "llm" | "tts";
  provider: string;
  enabled: boolean;
};

/** A recorded result of a call. The Platform accepts exactly these values (`OUTCOMES`). */
export type ConversationAction = { type?: string; reason?: string | null; target?: string | null; [key: string]: unknown };

export type Conversation = {
  id: string;
  agent_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  // Added by the outcomes work; optional so an older Platform response still type-checks.
  deployment_id?: string | null;
  channel?: string | null;
  outcome?: string | null;
  summary?: string | null;
  intent?: string | null;
  actions?: ConversationAction[];
  outcome_recorded_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type ConversationMessage = {
  id: string;
  role: string;
  content: string;
  primary_language: string | null;
  detected_languages: string[];
  created_at: string;
};

export type ConversationRuntimeEvent = {
  event_id: string;
  event_type: string;
  schema_version: number;
  payload: Record<string, unknown>;
  received_at: string;
};

export type ConversationRuntimeState = {
  session_id: string | null;
  session_status: string | null;
  events: ConversationRuntimeEvent[];
};

/** The one place that talks to the Platform. Every other `lib/*` module builds on it. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${platformUrl}${path}`, { ...init, cache: "no-store" });
  if (!response.ok) {
    let detail = `Platform returned ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
      // FastAPI validation errors arrive as a list of { loc, msg }.
      else if (Array.isArray(body.detail)) detail = body.detail.map((item: { loc?: unknown[]; msg?: string }) => [item.loc?.filter((part) => part !== "body").join("."), item.msg].filter(Boolean).join(": ")).join("; ") || detail;
    } catch {
      // Keep the status message when the server did not return JSON.
    }
    throw Object.assign(new Error(detail), { status: response.status });
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const getAgents = () => request<Agent[]>("/agents");
export const getAgent = (id: string) => request<Agent>(`/agents/${encodeURIComponent(id)}`);
export const getProviders = () => request<ProviderConfig[]>("/providers");
export const saveAgent = (data: Partial<Agent> & Pick<Agent, "name">, id?: string) =>
  request<Agent>(id ? `/agents/${id}` : "/agents", {
    method: id ? "PATCH" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
export const getConversations = () => request<Conversation[]>("/conversations");
export const getConversation = (id: string) => request<Conversation>(`/conversations/${encodeURIComponent(id)}`);
export const getConversationRuntimeState = (id: string) => request<ConversationRuntimeState>(`/conversations/${encodeURIComponent(id)}/runtime-state`);
export const getMessages = (id: string) => request<ConversationMessage[]>(`/conversations/${encodeURIComponent(id)}/messages`);
export const endVoiceSession = (id: string) => request<{ status: string }>(`/voice/sessions/${encodeURIComponent(id)}/end`, { method: "POST" });
export const ensureVoiceSessionRunning = (id: string) => request<{ session_status: string; runtime_status: string }>(
  `/voice/sessions/${encodeURIComponent(id)}/ensure-running`,
  { method: "POST" },
);

export async function createVoiceSession(agentId: string): Promise<VoiceSession> {
  return request<VoiceSession>("/voice/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });
}

/** Records how a call ended. `outcome` must be one of `OUTCOMES` (lib/outcomes.ts). */
export const setConversationOutcome = (id: string, body: { outcome: string; summary?: string | null; intent?: string | null; actions?: ConversationAction[] | null }) =>
  request<Conversation>(`/conversations/${encodeURIComponent(id)}/outcome`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
