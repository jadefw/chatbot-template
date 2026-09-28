import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

import { getModelProtocol } from "@/lib/models"

// Provider-native web search. Only wired for the protocols whose Go
// endpoints support it; `chat` (/chat/completions) models get no web search
// tool and fall back to the base tools. If Go rejects the tool for a given
// model, generation will surface the error and we can disable it per model.
export function getWebSearch(modelId: string) {
  const protocol = getModelProtocol(modelId)
  if (protocol === "responses") {
    return openai.tools.webSearch()
  }
  if (protocol === "messages") {
    return anthropic.tools.webSearch_20260209()
  }
  return undefined
}
