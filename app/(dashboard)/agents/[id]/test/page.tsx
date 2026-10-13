"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { useParams } from "next/navigation";
import {
  createVoiceSession,
  endVoiceSession,
  ensureVoiceSessionRunning,
  getConversation,
  getConversationRuntimeState,
  getMessages,
  type ConversationMessage,
} from "@/lib/platform";

type Phase = "idle" | "starting" | "connected" | "reconnecting" | "ending" | "ended" | "disconnected" | "error";

const CONVERSATION_ACTIVITY_LABELS: Record<string, string> = {
  SpeechStarted: "Listening to you",
  SpeechStopped: "Thinking",
  AgentSpeechStarted: "Agent speaking",
  UserInterrupted: "Interrupted; listening for your next turn",
  AgentSpeechCancelled: "Interrupted; listening for your next turn",
  TurnCompleted: "Listening for your next turn",
  SessionEnded: "Session ended",
  SessionFailed: "Session failed",
  RuntimeFailed: "Session failed",
};

export default function VoicePlayground() {
  const params = useParams<{ id: string }>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [runtimeStatus, setRuntimeStatus] = useState("");
  const [conversationActivity, setConversationActivity] = useState("Waiting for your speech");
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState("");
  const [conversationStatus, setConversationStatus] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [transcriptError, setTranscriptError] = useState("");
  const roomRef = useRef<Room | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const runtimeRetryAtRef = useRef(0);
  const mountedRef = useRef(true);
  const intentionalDisconnect = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      intentionalDisconnect.current = true;
      const activeSessionId = activeSessionIdRef.current;
      activeSessionIdRef.current = null;
      const activeRoom = roomRef.current;
      roomRef.current = null;
      if (activeRoom) void activeRoom.disconnect().catch(() => undefined);
      if (activeSessionId) void endVoiceSession(activeSessionId).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    let timer: number | undefined;

    const refresh = async () => {
      const [conversationResult, runtimeResult, messagesResult] = await Promise.allSettled([
        getConversation(conversationId),
        getConversationRuntimeState(conversationId),
        getMessages(conversationId),
      ]);
      if (!active) return;
      if (runtimeResult.status === "fulfilled" && runtimeResult.value.session_status) {
        setRuntimeStatus(runtimeResult.value.session_status);
      }
      if (runtimeResult.status === "fulfilled") {
        const latestActivity = [...runtimeResult.value.events].reverse().find(
          (event) => event.event_type in CONVERSATION_ACTIVITY_LABELS,
        );
        if (latestActivity) {
          setConversationActivity(CONVERSATION_ACTIVITY_LABELS[latestActivity.event_type]);
        }
      }
      if (
        runtimeResult.status === "fulfilled"
        && ["created", "running"].includes(runtimeResult.value.session_status ?? "")
        && runtimeResult.value.session_id
        && Date.now() >= runtimeRetryAtRef.current
        && phase !== "ending"
        && conversationResult.status === "fulfilled"
        && ["created", "active"].includes(conversationResult.value.status)
      ) {
        const healthCheckInterval = runtimeResult.value.session_status === "running" ? 15_000 : 3000;
        runtimeRetryAtRef.current = Date.now() + healthCheckInterval;
        try {
          const ensured = await ensureVoiceSessionRunning(runtimeResult.value.session_id);
          if (["not_configured", "manual_start_required"].includes(ensured.runtime_status)) {
            runtimeRetryAtRef.current = Date.now() + 10_000;
          } else if (active && runtimeResult.value.session_status === "running") {
            runtimeRetryAtRef.current = Date.now() + 15_000;
          }
          if (active) setRuntimeStatus(ensured.runtime_status);
        } catch {
          runtimeRetryAtRef.current = Date.now() + 10_000;
          if (active) setRuntimeStatus("unavailable");
        }
      }
      if (conversationResult.status === "fulfilled") {
        const status = conversationResult.value.status;
        setConversationStatus(status);
        if (status === "ended" || status === "failed") {
          setSessionId("");
          activeSessionIdRef.current = null;
          setPhase(status === "ended" ? "ended" : "error");
          const currentRoom = roomRef.current;
          if (currentRoom) {
            intentionalDisconnect.current = true;
            void currentRoom.disconnect().finally(() => {
              roomRef.current = null;
              intentionalDisconnect.current = false;
            });
          }
        }
      }
      if (messagesResult.status === "fulfilled") {
        setMessages(messagesResult.value);
        setTranscriptError("");
      } else {
        setTranscriptError("Transcript is temporarily unavailable; retrying.");
      }
      if (active && conversationResult.status === "fulfilled" && ["created", "active"].includes(conversationResult.value.status)) {
        timer = window.setTimeout(refresh, 1500);
      } else if (active && conversationResult.status === "rejected" && (phase === "connected" || phase === "reconnecting")) {
        timer = window.setTimeout(refresh, 3000);
      }
    };

    void refresh();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [conversationId, conversationStatus, phase]);

  const finishSession = useCallback(async (id: string, livekitRoom: Room | null) => {
    if (mountedRef.current) setPhase("ending");
    intentionalDisconnect.current = true;
    activeSessionIdRef.current = null;
    if (roomRef.current === livekitRoom) roomRef.current = null;
    try {
      await livekitRoom?.disconnect();
    } catch {
      if (mountedRef.current) {
        setStatusMessage("LiveKit disconnect failed; ending the Platform session anyway.");
      }
    }
    if (roomRef.current === livekitRoom) roomRef.current = null;

    try {
      await endVoiceSession(id);
      if (!mountedRef.current) return;
      setSessionId("");
      setConversationStatus("ended");
      setPhase("ended");
      setStatusMessage("Session ended and saved.");
    } catch (error) {
      if (!mountedRef.current) return;
      activeSessionIdRef.current = id;
      setPhase("disconnected");
      setStatusMessage(error instanceof Error ? `${error.message}. Retry ending the session.` : "Could not save session end. Retry.");
    } finally {
      if (mountedRef.current) intentionalDisconnect.current = false;
    }
  }, []);

  async function start() {
    setPhase("starting");
    runtimeRetryAtRef.current = 0;
    setStatusMessage("Requesting microphone permission…");
    setRuntimeStatus("");
    setConversationActivity("Waiting for your speech");
    setMicrophoneActive(false);
    setAgentSpeaking(false);
    setAudioPlaybackError("");
    setConversationStatus("");
    setMessages([]);
    setTranscriptError("");
    let createdSessionId = "";
    let livekitRoom: Room | null = null;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is unavailable. Open Voice Labs over HTTPS or localhost and check browser support.");
      }

      let microphoneStream: MediaStream;
      try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          throw new Error("Microphone permission was denied. Allow microphone access in your browser and try again.");
        }
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          throw new Error("No microphone was found. Connect a microphone and try again.");
        }
        throw error;
      }
      microphoneStream.getTracks().forEach((track) => track.stop());
      if (!mountedRef.current) return;

      setStatusMessage("Microphone permission granted · creating a Platform session…");
      const session = await createVoiceSession(params.id);
      createdSessionId = session.session_id;
      activeSessionIdRef.current = session.session_id;
      if (!mountedRef.current) {
        activeSessionIdRef.current = null;
        await endVoiceSession(session.session_id).catch(() => undefined);
        return;
      }
      setSessionId(session.session_id);
      setConversationId(session.conversation_id);
      setRuntimeStatus(session.runtime_status);
      if (["not_configured", "manual_start_required"].includes(session.runtime_status)) {
        runtimeRetryAtRef.current = Date.now() + 10_000;
      }
      setStatusMessage(`Platform session created · runtime ${session.runtime_status}`);

      if (!session.connection.url || !session.connection.token) {
        throw new Error("LiveKit is not configured; the Platform session was not connected.");
      }

      livekitRoom = new Room();
      roomRef.current = livekitRoom;
      livekitRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (!mountedRef.current) {
          track.detach().forEach((element) => element.remove());
          return;
        }
        if (track.kind === Track.Kind.Audio) {
          const audio = track.attach();
          audio.autoplay = true;
          audio.setAttribute("playsinline", "true");
          audio.dataset.voiceLabsAudio = "true";
          document.body.appendChild(audio);
          try {
            void audio.play().then(() => {
              if (mountedRef.current) setAudioPlaybackError("");
            }).catch(() => {
              if (mountedRef.current && audio.isConnected) {
                setAudioPlaybackError("The agent is speaking, but this browser blocked audio playback. Check site audio permissions and try again.");
              }
            });
          } catch {
            if (mountedRef.current && audio.isConnected) {
              setAudioPlaybackError("The agent is speaking, but this browser blocked audio playback. Check site audio permissions and try again.");
            }
          }
        }
      });
      livekitRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });
      livekitRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!mountedRef.current) return;
        const localSpeaking = speakers.some((speaker) => speaker.isLocal);
        const remoteSpeaking = speakers.some((speaker) => !speaker.isLocal);
        setMicrophoneActive(localSpeaking);
        setAgentSpeaking(remoteSpeaking);
      });
      livekitRoom.on(RoomEvent.Reconnecting, () => {
        if (!mountedRef.current) return;
        setPhase("reconnecting");
        setStatusMessage("LiveKit is reconnecting…");
      });
      livekitRoom.on(RoomEvent.Reconnected, () => {
        if (!mountedRef.current) return;
        setPhase("connected");
        setStatusMessage("LiveKit reconnected.");
      });
      livekitRoom.on(RoomEvent.Disconnected, () => {
        roomRef.current = null;
        document.querySelectorAll("[data-voice-labs-audio]").forEach((element) => element.remove());
        if (!mountedRef.current) return;
        setMicrophoneActive(false);
        setAgentSpeaking(false);
        if (intentionalDisconnect.current) return;
        setPhase("disconnected");
        setStatusMessage("LiveKit disconnected. The Platform session may still need to be ended.");
        const disconnectedSessionId = activeSessionIdRef.current ?? createdSessionId;
        if (disconnectedSessionId) {
          activeSessionIdRef.current = null;
          void endVoiceSession(disconnectedSessionId).then(() => {
            if (!mountedRef.current) return;
            setSessionId("");
            setConversationStatus("ended");
          setPhase("ended");
          setStatusMessage("LiveKit disconnected; session ended.");
          }).catch(() => {
            if (!mountedRef.current) return;
            activeSessionIdRef.current = disconnectedSessionId;
            setStatusMessage("LiveKit disconnected; Platform could not confirm session end. Retry below.");
          });
        }
      });

      await livekitRoom.connect(session.connection.url, session.connection.token);
      if (!mountedRef.current) {
        if (roomRef.current === livekitRoom) {
          roomRef.current = null;
          await livekitRoom.disconnect().catch(() => undefined);
        }
        return;
      }
      await livekitRoom.localParticipant.setMicrophoneEnabled(true);
      if (!mountedRef.current) return;
      setPhase("connected");
      setStatusMessage("Connected to LiveKit; microphone is on.");
    } catch (error) {
      intentionalDisconnect.current = true;
      if (livekitRoom && roomRef.current === livekitRoom) {
        roomRef.current = null;
        await livekitRoom.disconnect().catch(() => undefined);
      }
      if (!mountedRef.current) {
        if (createdSessionId && activeSessionIdRef.current === createdSessionId) {
          activeSessionIdRef.current = null;
          await endVoiceSession(createdSessionId).catch(() => undefined);
        }
        return;
      }
      setPhase("error");
      setStatusMessage(error instanceof Error ? error.message : "Could not start the voice session.");
      if (createdSessionId) {
        activeSessionIdRef.current = null;
        try {
          await endVoiceSession(createdSessionId);
          if (!mountedRef.current) return;
          setSessionId("");
          setConversationStatus("ended");
          setStatusMessage(`${error instanceof Error ? error.message : "Could not start"} The partial session was ended.`);
        } catch {
          if (!mountedRef.current) return;
          activeSessionIdRef.current = createdSessionId;
          setSessionId(createdSessionId);
          setStatusMessage("Could not connect and could not end the Platform session. Use Retry end to clean it up.");
        }
      }
      intentionalDisconnect.current = false;
    }
  }

  async function end() {
    if (!sessionId) return;
    await finishSession(sessionId, roomRef.current);
  }

  const busy = phase === "starting" || phase === "ending";
  const canStart = !busy && !sessionId && phase !== "connected" && phase !== "reconnecting";

  return (
    <main>
      <p><a href={`/agents/${params.id}`}>← Agent</a></p>
      <h1>Voice Playground</h1>
      <p role="status">Connection: {phase}{statusMessage ? ` · ${statusMessage}` : ""}</p>
      <p>Runtime handoff: {runtimeStatus || "not started"}</p>
      <p aria-live="polite">Conversation activity: {conversationActivity}</p>
      <p aria-live="polite">Microphone activity: {microphoneActive ? "Speech detected" : "No speech detected"}</p>
      <p aria-live="polite">AI speaking: {agentSpeaking ? "Yes" : "No"}</p>
      {audioPlaybackError && <p role="alert">{audioPlaybackError}</p>}
      <p>Persisted conversation: {conversationStatus || "not started"}</p>
      {canStart ? <button type="button" onClick={start} disabled={busy}>Start conversation</button> : (
        <button type="button" onClick={end} disabled={busy || !sessionId}>
          {phase === "disconnected" || phase === "error" ? "Retry end session" : "End conversation"}
        </button>
      )}
      {conversationId && <p><a href={`/conversations/${conversationId}`}>Open conversation history</a></p>}
      <h2>Live transcript</h2>
      {transcriptError && <p role="status">{transcriptError}</p>}
      {messages.length === 0 ? <p>Transcript will appear here when the Platform receives finalized speech events.</p> : (
        <ol aria-live="polite">
          {messages.map((message) => (
            <li key={message.id}>
              <strong>{message.role}</strong>
              {message.primary_language && ` · ${message.primary_language}`}: {message.content}
              {message.detected_languages.length > 0 && <small> · Detected: {message.detected_languages.join(", ")}</small>}
              <small> · {new Date(message.created_at).toLocaleTimeString()}</small>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
