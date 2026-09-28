import { tool } from "ai"
import { z } from "zod"

const exaResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  publishedDate: z.string().optional(),
})

export const exaSearchOutputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({ results: z.array(exaResultSchema) }),
])

export type ExaSearchOutput = z.infer<typeof exaSearchOutputSchema>

// Custom fetch-based web search for `chat` (/chat/completions) models,
// which have no provider-native search tool. Native search stays for
// `responses` / `messages` protocols (see ./web_search.ts).
export const exaSearch = tool({
  description:
    "Search the web for current or factual information. Use for recent events, releases, docs, or anything beyond training data.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("The search query, e.g. 'latest Next.js release notes'"),
  }),
  outputSchema: exaSearchOutputSchema,
  execute: async ({ query }, { abortSignal }) => {
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      return { error: "Web search is not configured." }
    }

    const timeout = AbortSignal.timeout(15000)
    const signal = abortSignal
      ? AbortSignal.any([abortSignal, timeout])
      : timeout

    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          query,
          type: "auto",
          numResults: 5,
          contents: { highlights: true },
        }),
      })
      if (!res.ok) {
        return { error: "Web search failed. Please try again." }
      }
      const data = (await res.json()) as {
        results?: Array<{
          title?: unknown
          url?: unknown
          highlights?: unknown
          publishedDate?: unknown
        }>
      }
      const results = (data.results ?? []).slice(0, 5).map((r) => ({
        title: typeof r.title === "string" ? r.title : "Untitled",
        url: typeof r.url === "string" ? r.url : "",
        snippet:
          Array.isArray(r.highlights) && typeof r.highlights[0] === "string"
            ? (r.highlights[0] as string)
            : "",
        publishedDate:
          typeof r.publishedDate === "string" ? r.publishedDate : undefined,
      }))
      return { results }
    } catch {
      return { error: "Web search failed. Please try again." }
    }
  },
})
