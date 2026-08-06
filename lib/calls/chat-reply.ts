/**
 * The scripted reply for "Chat with note".
 *
 * There is no model behind this screen. Whatever you ask, the assistant writes
 * the follow-up for THIS call — which is the one thing a rep actually wants
 * from it, and the thing worth showing.
 *
 * The text isn't invented here: `customer_follow_up_draft` is already part of
 * every hero call's insights, so the "generated" email genuinely reflects that
 * conversation — Ray's three furnace options, the roof photo report — rather
 * than being generic filler that falls apart the moment someone reads it.
 *
 * Pure, so the fallback chain and the tokenizer are testable without rendering.
 */

import { parseInsights } from "@/lib/calls/detail";
import type { ConversationDetail } from "@/lib/data";

/**
 * What the assistant "writes" for this call.
 *
 * Prefers the authored follow-up draft. Falls back to a note assembled from the
 * summary's next steps, so a call without a full insights pass still produces
 * something that reads like it was written about that specific conversation.
 */
export function followUpReply(detail: ConversationDetail): string {
  const draft = parseInsights(detail.analysis?.result)?.customer_follow_up_draft;
  if (draft?.trim()) return draft.trim();

  const nextSteps = (detail.summary?.next_steps ?? []).filter(Boolean);
  if (nextSteps.length > 0) {
    return [
      "Here's a follow-up you can send:",
      "",
      "Thanks again for your time today. To recap what we agreed:",
      "",
      ...nextSteps.map((s) => `• ${s}`),
      "",
      "Let me know if I've missed anything and I'll get it sorted.",
    ].join("\n");
  }

  return "There isn't a summary on this call yet, so there's nothing for me to base a follow-up on. Once it finishes processing I can draft one.";
}

/**
 * Split text for word-by-word reveal.
 *
 * Whitespace is kept as its own token rather than trimmed, so re-joining the
 * revealed prefix reproduces the original exactly — paragraph breaks and bullet
 * indentation survive, which a naive `split(" ")` would flatten.
 */
export function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}
