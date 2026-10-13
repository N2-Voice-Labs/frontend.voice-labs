"use client";

import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/agent-form";

export default function NewAgent() {
  const router = useRouter();
  return <main className="page-shell narrow-page">
    <p className="eyebrow">Agents / New</p>
    <h1>Create an agent</h1>
    <p className="page-intro">Set the conversation instructions, supported languages, and runtime provider overrides.</p>
    <AgentForm onSaved={(agent) => router.push(`/agents/${agent.id}`)} />
  </main>;
}
