"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getConversations, type Conversation } from "@/lib/platform";

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const current = await getConversations();
      setConversations(current.toSorted((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Platform API is unavailable.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return (
    <main className="page-shell">
      <p className="eyebrow">History</p>
      <h1>Conversations</h1>
      <p className="page-intro">Review persisted transcripts and runtime lifecycle events.</p>
      {error && <p role="alert">Could not refresh conversations: {error}</p>}
      {!loaded ? <p>Loading conversations…</p> : conversations.length === 0 && error ? null : conversations.length === 0 ? (
        <p>No conversations yet. Start one from an agent’s Voice Playground.</p>
      ) : (
        <ul className="list-stack">
          {conversations.map((conversation) => (
            <li className="list-row" key={conversation.id}>
              <Link href={`/conversations/${conversation.id}`}>Conversation {conversation.id.slice(0, 8)}</Link>
              {" · "}{conversation.status}{" · Agent "}{conversation.agent_id.slice(0, 8)}
              {" · Started "}{new Date(conversation.started_at).toLocaleString()}
              {conversation.ended_at && ` · Ended ${new Date(conversation.ended_at).toLocaleString()}`}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => void refresh()}>Refresh now</button>
    </main>
  );
}
