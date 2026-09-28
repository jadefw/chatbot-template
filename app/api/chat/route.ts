import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from "ai"

import { DEFAULT_MODEL, isModelAllowed } from "@/lib/models"
import { getGoModel } from "@/lib/opencode-go"
import { getTools, type ChatUIMessage } from "@/tools"

export const maxDuration = 30

const MAX_OUTPUT_TOKENS = 8192

// This endpoint is public and spends your OpenCode Go usage on every request.
// Before exposing it to real traffic, add a rate limit (e.g. Vercel Firewall /
// WAF or @upstash/ratelimit) and authentication, and watch usage in the
// OpenCode console.
export async function POST(req: Request) {
  if (!process.env.OPENCODE_GO_API_KEY) {
    return Response.json(
      { error: "Missing OPENCODE_GO_API_KEY. Add it to .env.local." },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const model = (body as { model?: unknown })?.model
  const modelId = typeof model === "string" ? model : DEFAULT_MODEL

  if (!isModelAllowed(modelId)) {
    return Response.json(
      { error: `Model ${modelId} is not available.` },
      { status: 400 }
    )
  }

  // Stable per-conversation id for Go's routing/prompt-caching
  // (x-opencode-session). useChat sends its chat `id` in the body.
  const rawSession =
    (body as { id?: unknown })?.id ?? req.headers.get("x-opencode-session")
  const sessionId =
    typeof rawSession === "string" && rawSession.length > 0
      ? rawSession
      : crypto.randomUUID()

  let languageModel
  try {
    languageModel = getGoModel(modelId, { sessionId })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid model." },
      { status: 400 }
    )
  }

  const tools = getTools(modelId)

  // Validate the shape of every message and tool part before trusting it.
  let messages: ChatUIMessage[]
  try {
    const validated = await validateUIMessages<ChatUIMessage>({
      messages: (body as { messages?: unknown })?.messages,
      tools: tools as Parameters<typeof validateUIMessages>[0]["tools"],
    })
    messages = validated
  } catch {
    return Response.json({ error: "Invalid messages." }, { status: 400 })
  }

  const result = streamText({
    model: languageModel,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(5),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendSources: true,
      onError: () => "Something went wrong. Please try again.",
    }),
  })
}
