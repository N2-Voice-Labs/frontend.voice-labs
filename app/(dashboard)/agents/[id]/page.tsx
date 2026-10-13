import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/platform";

export default async function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const agent = await getAgent(id);
    return <main className="page-shell narrow-page">
      <p className="eyebrow">Agent</p><h1>{agent.name}</h1><p className="page-intro">{agent.description || "No description provided."}</p>
      <section className="panel"><p><strong>Status:</strong> {agent.status}</p><p><strong>Languages:</strong> {agent.enabled_languages.join(", ") || "None"}</p><p><strong>STT:</strong> {agent.stt_provider_id ?? "Runtime default"} · <strong>LLM:</strong> {agent.llm_provider_id ?? "Runtime default"} · <strong>TTS:</strong> {agent.tts_provider_id ?? "Runtime default"}</p></section>
      <div className="page-actions"><Link className="button-link" href={`/agents/${id}/test`}>Open Voice Playground</Link><Link href={`/agents/${id}/edit`}>Edit agent</Link></div>
    </main>;
  } catch {
    notFound();
  }
}
