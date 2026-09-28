import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

import { getModelProtocol } from "@/lib/models"

import { exaSearch } from "./exa_search"

// Provider-native web search where the protocol supports it; Exa backfill
// for `chat` (/chat/completions) models which have no native search tool.
// Chat models get no web search tool when EXA_API_KEY is missing and fall
// back to the base tools. If Go rejects the tool for a given model,
// generation will surface the error and we can disable it per model.
export function getWebSearch(modelId: string) {
  const protocol = getModelProtocol(modelId)
  if (protocol === "responses") {
    return openai.tools.webSearch()
  }
  if (protocol === "messages") {
    return anthropic.tools.webSearch_20260209()
  }
  if (protocol === "chat") {
    return process.env.EXA_API_KEY ? exaSearch : undefined
  }
  return undefined
}
