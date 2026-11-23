import { Marked, type TokenizerAndRendererExtension, type Tokens } from 'marked'
import type { DocumentSource } from '@/types'

interface CitationToken extends Tokens.Generic {
  type: 'chatCitation'
  raw: string
  fragmentNumber: number
  fileName: string
  sourceIndex: number
}

const CITATION_START_REGEX = /\[fragmento\s+[1-9]\d*\s*\\?\|/i
const CITATION_RULE_REGEX = /^\[fragmento\s+(\d+)\s*\\?\|\s*([^\]]+)\](?!\()/i
const FENCE_REGEX = /^\s*(```|~~~)/

const normalizeFileName = (value: string): string => value.trim().toLowerCase()

const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function escapeCitationPipesInTables(markdown: string): string {
  const lines = markdown.split('\n')
  let inFence = false
  let fenceChar = ''

  return lines
    .map((line) => {
      const fenceMatch = FENCE_REGEX.exec(line)
      if (fenceMatch) {
        const marker = fenceMatch[1][0]
        if (!inFence) {
          inFence = true
          fenceChar = marker
        } else if (marker === fenceChar) {
          inFence = false
          fenceChar = ''
        }
        return line
      }

      if (inFence || !line.trimStart().startsWith('|')) {
        return line
      }

      return line
        .split(/(`[^`]*`)/g)
        .map((segment, index) => {
          if (index % 2 === 1) return segment
          return segment.replace(
            /(\[fragmento\s+[1-9]\d*\s*)\|(\s*[^\]]+\])(?!\()/gi,
            '$1\\|$2'
          )
        })
        .join('')
    })
    .join('\n')
}

export function resolveCitationSourceIndex(
  fragmentNumber: number,
  fileName: string,
  sources?: DocumentSource[]
): number {
  if (!sources || sources.length === 0 || !Number.isInteger(fragmentNumber) || fragmentNumber < 1) {
    return -1
  }

  const normalizedTarget = normalizeFileName(fileName)
  if (!normalizedTarget) {
    return -1
  }

  const positionalIndex = fragmentNumber - 1

  // Prioridad 1: posición 1-based en sources si el nombre normalizado coincide
  if (positionalIndex < sources.length) {
    if (normalizeFileName(sources[positionalIndex].file_name) === normalizedTarget) {
      return positionalIndex
    }
  }

  // Prioridad 2: nombre exacto + chunk_index (0-based primero, luego 1-based)
  const zeroBasedMatch = sources.findIndex(
    (source) =>
      normalizeFileName(source.file_name) === normalizedTarget &&
      source.chunk_index === fragmentNumber - 1
  )
  if (zeroBasedMatch !== -1) {
    return zeroBasedMatch
  }

  const oneBasedMatch = sources.findIndex(
    (source) =>
      normalizeFileName(source.file_name) === normalizedTarget &&
      source.chunk_index === fragmentNumber
  )
  if (oneBasedMatch !== -1) {
    return oneBasedMatch
  }

  // Prioridad 3: posición 1-based con coincidencia parcial de nombre (truncado menor)
  if (positionalIndex < sources.length) {
    const candidateName = normalizeFileName(sources[positionalIndex].file_name)
    if (
      candidateName.length > 0 &&
      (candidateName.includes(normalizedTarget) || normalizedTarget.includes(candidateName))
    ) {
      return positionalIndex
    }
  }

  return -1
}

function createCitationExtension(sources?: DocumentSource[]): TokenizerAndRendererExtension {
  return {
    name: 'chatCitation',
    level: 'inline',
    start(src: string): number {
      return src.search(CITATION_START_REGEX)
    },
    tokenizer(src: string): CitationToken | undefined {
      const match = CITATION_RULE_REGEX.exec(src)
      if (!match) return undefined

      const fragmentNumber = Number.parseInt(match[1], 10)
      const fileName = match[2].trim()

      if (!Number.isInteger(fragmentNumber) || fragmentNumber < 1 || !fileName) {
        return undefined
      }

      const sourceIndex = resolveCitationSourceIndex(fragmentNumber, fileName, sources)

      return {
        type: 'chatCitation',
        raw: match[0],
        fragmentNumber,
        fileName,
        sourceIndex
      }
    },
    renderer(token: Tokens.Generic): string {
      const citation = token as CitationToken
      const safeFileName = escapeHtmlAttr(citation.fileName)
      const isLinked = citation.sourceIndex >= 0
      const className = isLinked
        ? 'chat-citation-chip chat-citation-chip--linked'
        : 'chat-citation-chip'
      const ariaLabel = isLinked
        ? `Ver fuente: Fragmento ${citation.fragmentNumber} de ${safeFileName}`
        : `Cita: Fragmento ${citation.fragmentNumber} de ${safeFileName}`

      return `<button type="button" class="${className}" data-citation-fragment="${citation.fragmentNumber}" data-citation-file="${safeFileName}" data-source-index="${citation.sourceIndex}" aria-label="${ariaLabel}">${citation.fragmentNumber}</button>`
    }
  }
}

export function renderMarkdownWithCitations(content: string, sources?: DocumentSource[]): string {
  const parser = new Marked({
    breaks: true,
    gfm: true
  })

  parser.use({
    extensions: [createCitationExtension(sources)]
  })

  return parser.parse(escapeCitationPipesInTables(content)) as string
}
