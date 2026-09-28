import { GlobeIcon } from "lucide-react"

import { type WebSearchToolPart } from "@/tools"
import { safeHttpUrl } from "@/lib/utils"

interface ExaResult {
  title: string
  url: string
  snippet?: string
}

function getExaResults(output: unknown): ExaResult[] | undefined {
  if (typeof output !== "object" || output === null) return undefined
  if (!("results" in output)) return undefined
  const results = (output as { results: unknown }).results
  if (!Array.isArray(results)) return undefined
  return results.filter(
    (r): r is ExaResult =>
      typeof r === "object" &&
      r !== null &&
      typeof (r as ExaResult).title === "string" &&
      typeof (r as ExaResult).url === "string"
  )
}

function getExaError(output: unknown): string | undefined {
  if (typeof output !== "object" || output === null) return undefined
  if (!("error" in output)) return undefined
  const error = (output as { error: unknown }).error
  return typeof error === "string" ? error : undefined
}

export function WebSearchPart({ part }: { part: WebSearchToolPart }) {
  const query = part.input?.query ? ` for “${part.input.query}”` : ""

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return (
        <div className="flex items-center gap-2 px-1.5 text-sm text-muted-foreground">
          <GlobeIcon className="size-4" />
          Searching the web{query}…
        </div>
      )
    case "output-available": {
      const error = getExaError(part.output)
      if (error) {
        return <div className="px-1.5 text-sm text-muted-foreground">{error}</div>
      }
      const results = getExaResults(part.output)
      return (
        <div className="flex flex-col gap-1.5 px-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GlobeIcon className="size-4" />
            Searched the web{query}
          </div>
          {results?.map(
            (result) =>
              safeHttpUrl(result.url) && (
                <a
                  key={result.url}
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {result.title}
                </a>
              )
          )}
        </div>
      )
    }
    case "output-error":
      return (
        <div className="px-1.5 text-sm text-destructive">
          Web search failed: {part.errorText}
        </div>
      )
    default:
      return null
  }
}
