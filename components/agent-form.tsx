"use client";

import { FormEvent, useEffect, useState } from "react";
import { getProviders, saveAgent, type Agent, type ProviderConfig } from "@/lib/platform";

type AgentFormProps = {
  initialAgent?: Agent;
  onSaved: (agent: Agent) => void;
};

const languageOptions = [
  { id: "en", label: "English" },
  { id: "ru", label: "Russian" },
];

const runtimeProviders: Record<ProviderConfig["kind"], string[]> = {
  stt: ["deepgram"],
  llm: ["openai", "openai-compatible"],
  tts: ["cartesia"],
};

export function AgentForm({ initialAgent, onSaved }: AgentFormProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providerError, setProviderError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState(initialAgent?.enabled_languages ?? ["en", "ru"]);
  const [providerIds, setProviderIds] = useState({
    stt: initialAgent?.stt_provider_id ?? "",
    llm: initialAgent?.llm_provider_id ?? "",
    tts: initialAgent?.tts_provider_id ?? "",
  });

  useEffect(() => {
    let active = true;
    getProviders().then((items) => {
      if (active) setProviders(items);
    }).catch((cause: unknown) => {
      if (active) setProviderError(cause instanceof Error ? cause.message : "Could not load providers");
    });
    return () => { active = false; };
  }, []);

  function toggleLanguage(language: string) {
    setLanguages((current) => current.includes(language)
      ? current.filter((item) => item !== language)
      : [...current, language]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (languages.length === 0) {
      setError("Choose at least one supported language.");
      return;
    }
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const data: Partial<Agent> & Pick<Agent, "name"> = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? ""),
      system_prompt: String(form.get("system_prompt") ?? ""),
      enabled_languages: languages,
      voice_id: String(form.get("voice_id") ?? "").trim() || null,
    };
    for (const kind of ["stt", "llm", "tts"] as const) {
      const field = `${kind}_provider_id` as const;
      const selected = providerIds[kind] || null;
      if (!initialAgent || selected !== initialAgent[field]) data[field] = selected;
    }
    try {
      const saved = await saveAgent(data, initialAgent?.id);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save agent");
    } finally {
      setSaving(false);
    }
  }

  function providerSelect(kind: ProviderConfig["kind"], label: string) {
    const value = providerIds[kind];
    const options = providers.filter((provider) => provider.kind === kind);
    const current = providers.find((provider) => provider.id === value);
    const currentIsSupported = current && runtimeProviders[kind].includes(current.provider);
    return <label>{label}
      <select aria-label={label} name={kind} value={value} onChange={(event) => setProviderIds((ids) => ({ ...ids, [kind]: event.target.value }))}>
        <option value="">Use runtime default</option>
        {current && (!current.enabled || !currentIsSupported) && <option value={current.id} disabled>{current.provider} ({current.enabled ? "not supported by Runtime" : "disabled"})</option>}
        {options.filter((provider) => provider.enabled && runtimeProviders[kind].includes(provider.provider)).map((provider) => <option key={provider.id} value={provider.id}>{provider.provider}</option>)}
        {options.filter((provider) => provider.enabled && !runtimeProviders[kind].includes(provider.provider) && provider.id !== current?.id).map((provider) => <option key={provider.id} value={provider.id} disabled>{provider.provider} (not supported by Runtime)</option>)}
      </select>
    </label>;
  }

  return <form className="form-stack" onSubmit={submit}>
    <label>Agent name<input aria-label="Agent name" name="name" required defaultValue={initialAgent?.name ?? ""} /></label>
    <label>Description<textarea name="description" rows={2} defaultValue={initialAgent?.description ?? ""} /></label>
    <label>System prompt<textarea name="system_prompt" rows={6} defaultValue={initialAgent?.system_prompt ?? ""} /></label>
    <fieldset><legend>Supported languages</legend>
      {languageOptions.map(({ id, label }) => <label className="check-option" key={id}><input type="checkbox" checked={languages.includes(id)} onChange={() => toggleLanguage(id)} />{label}</label>)}
    </fieldset>
    <label>Voice ID<input name="voice_id" defaultValue={initialAgent?.voice_id ?? ""} /></label>
    <fieldset><legend>Runtime providers</legend>
      <p className="field-hint">Leave a provider on its runtime default unless you want to override it for this agent.</p>
      {providerSelect("stt", "Speech-to-text provider")}
      {providerSelect("llm", "Language model provider")}
      {providerSelect("tts", "Text-to-speech provider")}
      {providerError && <p className="field-hint" role="status">Provider choices unavailable: {providerError}. Other agent settings can still be saved.</p>}
      {!providerError && providers.length === 0 && <p className="field-hint">No providers configured yet; runtime defaults will be used.</p>}
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? "Saving…" : initialAgent ? "Save changes" : "Create agent"}</button>
  </form>;
}
