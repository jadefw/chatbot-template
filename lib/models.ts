// Curated OpenCode Go models. See https://opencode.ai/docs/go/#endpoints.
//
// `protocol` selects the API + AI SDK package for the model:
// - "chat"      -> /chat/completions -> @ai-sdk/openai-compatible
// - "responses" -> /responses         -> @ai-sdk/openai
// - "messages"  -> /messages          -> @ai-sdk/anthropic
export type GoModelProtocol = "chat" | "responses" | "messages"

export interface GoModel {
  id: string
  name: string
  protocol: GoModelProtocol
}

export const MODELS: GoModel[] = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", protocol: "chat" },
  { id: "glm-5.3", name: "GLM 5.3", protocol: "chat" },
  { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", protocol: "chat" },
  {
    id: "muse-spark-1.3-contributor",
    name: "Muse Spark 1.3",
    protocol: "responses",
  },
  { id: "minimax-m2.7", name: "MiniMax M2.7", protocol: "messages" },
  { id: "qwen3.8-flash", name: "Qwen3.8 Flash", protocol: "messages" },
]

export const DEFAULT_MODEL = MODELS[0].id

export function getModel(id: string) {
  return MODELS.find((model) => model.id === id)
}

export function getModelProtocol(id: string) {
  return getModel(id)?.protocol
}

export function isModelAllowed(id: string) {
  return MODELS.some((model) => model.id === id)
}
