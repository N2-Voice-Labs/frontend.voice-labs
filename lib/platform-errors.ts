/** Plain-language messages for the Platform's machine-readable error codes (the `detail` field). */
const messages: Record<string, string> = {
  voice_consent_required: "Consent is required to clone a voice. Confirm it before saving.",
  invalid_sample_reference: "The sample must be a link such as https://… or s3://… (no spaces).",
  invalid_tts_provider_id: "That voice provider is not available. Choose another or leave it on the default.",
  invalid_voice_profile_id: "That voice is not available. Choose another from the library.",
  voice_not_found: "That voice no longer exists.",
  invalid_voice_status_transition: "The voice cannot move to that status from where it is.",
  provider_voice_id_required: "A provider voice id is required before a voice can be ready.",
  phone_number_required: "A phone (SIP) deployment needs a phone number.",
  phone_number_only_for_sip: "Only phone (SIP) deployments take a phone number.",
  invalid_agent_id: "That agent is not available.",
  deployment_not_found: "That deployment no longer exists.",
  deployment_archived: "That deployment is archived and can no longer change.",
  deployment_not_active: "The campaign's deployment must be active.",
  deployment_agent_mismatch: "That deployment belongs to a different agent.",
  invalid_deployment_id: "That deployment is not available.",
  campaign_requires_sip_deployment: "Campaigns need a phone (SIP) deployment. Add one to the agent first.",
  campaign_has_no_targets: "Add at least one phone number before scheduling or starting.",
  campaign_not_editable: "This campaign can no longer be edited in its current status.",
  campaign_not_found: "That campaign no longer exists.",
  invalid_campaign_status_transition: "The campaign cannot move to that status from where it is.",
  invalid_timezone: "That timezone is not recognised. Use a name such as Europe/Berlin.",
  invalid_schedule: "The end must be after the start.",
  target_conflict: "Those numbers changed while saving. Try again.",
  tool_name_conflict: "A tool with that name already exists.",
  tool_not_found: "That tool no longer exists.",
  invalid_tool_id: "One of the selected tools is missing or disabled.",
  knowledge_document_not_found: "That document no longer exists.",
  invalid_knowledge_document_id: "One of the selected documents is missing or disabled.",
  invalid_outcome: "That is not a valid outcome.",
  conversation_not_found: "That conversation no longer exists.",
  agent_not_found: "That agent no longer exists.",
  agent_template_not_found: "That template is not available.",
  agent_not_enabled: "The agent must be enabled before it can take calls.",
};

export function describeError(cause: unknown, fallback = "Something went wrong. Try again."): string {
  if (!(cause instanceof Error)) return fallback;
  if (cause.message.startsWith("Failed to fetch") || cause.message === "fetch failed") return "Can’t reach the Platform. Check that it is running, then try again.";
  return messages[cause.message] ?? (cause.message || fallback);
}
