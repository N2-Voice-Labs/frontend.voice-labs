"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/agent-form";

export default function NewAgent() {
  const router = useRouter();
  return <main className="page-shell dash-main">
    <Link className="dash-back" href="/agents">← All agents</Link>
    <p className="eyebrow">Agents / New</p>
    <h1>Create an agent</h1>
    <p className="page-intro">Set the conversation instructions, supported languages, and runtime provider overrides.</p>
    <AgentForm onSaved={(agent) => router.push(`/agents/${agent.id}`)} />
  </main>;
}
