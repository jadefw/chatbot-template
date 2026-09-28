import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import type { LanguageModel } from "ai"

import { getModelProtocol } from "./models"

// Single root for all Go protocols. Each AI SDK package appends its own
// subpath: /chat/completions (openai-compatible), /responses (openai),
// /messages (anthropic). See https://opencode.ai/docs/go/#endpoints.
export const OPENCODE_GO_BASE_URL = "https://opencode.ai/zen/go/v1"

function getApiKey() {
  return process.env.OPENCODE_GO_API_KEY
}

// Go asks clients to identify themselves and send a stable session id per
// conversation for routing and prompt caching.
// See https://opencode.ai/docs/go/#where-can-i-use-it
function goHeaders(sessionId?: string): Record<string, string> {
  return {
    "User-Agent": "chatbot-template/1.0",
    ...(sessionId ? { "x-opencode-session": sessionId } : {}),
  }
}

export function getGoModel(
  modelId: string,
  opts?: { sessionId?: string }
): LanguageModel {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      "Missing OPENCODE_GO_API_KEY. Add it to .env.local (see .env.example)."
    )
  }

  const protocol = getModelProtocol(modelId)
  if (!protocol) {
    throw new Error(`Model ${modelId} is not available.`)
  }

  const headers = goHeaders(opts?.sessionId)

  switch (protocol) {
    case "chat": {
      const provider = createOpenAICompatible({
        baseURL: OPENCODE_GO_BASE_URL,
        apiKey,
        name: "opencode-go",
        headers,
      })
      return provider.chatModel(modelId)
    }
    case "responses": {
      const provider = createOpenAI({
        baseURL: OPENCODE_GO_BASE_URL,
        apiKey,
        name: "opencode-go",
        headers,
      })
      return provider.responses(modelId)
    }
    case "messages": {
      const provider = createAnthropic({
        baseURL: OPENCODE_GO_BASE_URL,
        // Go expects a Bearer token like other Zen endpoints; the Anthropic
        // SDK sends `authToken` as `Authorization: Bearer <token>`.
        authToken: apiKey,
        headers,
      })
      return provider.messages(modelId)
    }
  }
}
