import { describe, it, expect } from 'vitest'
import { resolveCitationSourceIndex, renderMarkdownWithCitations } from '@/lib/chatCitations'
import type { DocumentSource } from '@/types'

const sampleSources: DocumentSource[] = [
  {
    attachment_id: 1,
    file_name: 'Trabajo finalizado.docx',
    chunk_index: 0,
    snippet: 'Introducción al estudio de investigación.',
    similarity: 0.91
  },
  {
    attachment_id: 1,
    file_name: 'Trabajo finalizado.docx',
    chunk_index: 1,
    snippet: 'Metodología cuantitativa aplicada al proyecto.',
    similarity: 0.87
  },
  {
    attachment_id: 2,
    file_name: 'Anexo metodológico.pdf',
    chunk_index: 4,
    snippet: 'Resultados preliminares del muestreo.',
    similarity: 0.78
  }
]

describe('resolveCitationSourceIndex', () => {
  it('devuelve -1 cuando sources falta, está vacío o el número de fragmento es menor a 1', () => {
    expect(resolveCitationSourceIndex(1, 'Trabajo finalizado.docx', undefined)).toBe(-1)
    expect(resolveCitationSourceIndex(1, 'Trabajo finalizado.docx', [])).toBe(-1)
    expect(resolveCitationSourceIndex(0, 'Trabajo finalizado.docx', sampleSources)).toBe(-1)
    expect(resolveCitationSourceIndex(-2, 'Trabajo finalizado.docx', sampleSources)).toBe(-1)
    expect(resolveCitationSourceIndex(1, '   ', sampleSources)).toBe(-1)
  })

  it('prioridad 1: resuelve por posición 1-based cuando el nombre normalizado coincide', () => {
    expect(resolveCitationSourceIndex(2, '  trabajo finalizado.docx  ', sampleSources)).toBe(1)
    expect(resolveCitationSourceIndex(3, 'ANEXO METODOLÓGICO.PDF', sampleSources)).toBe(2)
  })

  it('prioridad 2: resuelve por nombre exacto y chunk_index (0-based primero, luego 1-based)', () => {
    // Fragmento 5 en Anexo metodológico.pdf coincide con chunk_index === 4 (5 - 1)
    expect(resolveCitationSourceIndex(5, 'Anexo metodológico.pdf', sampleSources)).toBe(2)

    // Si chunk_index es igual a fragmentNumber (1-based) cuando no hay 0-based
    expect(resolveCitationSourceIndex(4, 'Anexo metodológico.pdf', sampleSources)).toBe(2)
  })

  it('prioridad 3: resuelve por posición 1-based cuando el nombre está truncado o incluye al otro', () => {
    expect(resolveCitationSourceIndex(1, 'Trabajo finalizado', sampleSources)).toBe(0)
    expect(
      resolveCitationSourceIndex(3, 'Anexo metodológico.pdf (versión final)', sampleSources)
    ).toBe(2)
  })

  it('devuelve -1 cuando no existe coincidencia válida sin adivinar una fuente incorrecta', () => {
    expect(resolveCitationSourceIndex(1, 'Otro documento.pdf', sampleSources)).toBe(-1)
    expect(resolveCitationSourceIndex(9, 'Trabajo finalizado.docx', sampleSources)).toBe(-1)
  })
})

describe('renderMarkdownWithCitations', () => {
  it('transforma citas válidas en botones superíndice con atributos semánticos', () => {
    const html = renderMarkdownWithCitations(
      'Según el análisis [Fragmento 2 | Trabajo finalizado.docx], el modelo converge.',
      sampleSources
    )

    expect(html).toContain('<button')
    expect(html).toContain('type="button"')
    expect(html).toContain('class="chat-citation-chip chat-citation-chip--linked"')
    expect(html).toContain('data-citation-fragment="2"')
    expect(html).toContain('data-citation-file="Trabajo finalizado.docx"')
    expect(html).toContain('data-source-index="1"')
    expect(html).toContain('aria-label="Ver fuente: Fragmento 2 de Trabajo finalizado.docx"')
    expect(html).toContain('>2</button>')
  })

  it('acepta variaciones de mayúsculas y espacios alrededor del separador', () => {
    const html = renderMarkdownWithCitations(
      'Ver detalle [fragmento   1|Trabajo finalizado.docx].',
      sampleSources
    )

    expect(html).toContain('data-citation-fragment="1"')
    expect(html).toContain('data-source-index="0"')
    expect(html).toContain('>1</button>')
  })

  it('soporta citas adyacentes y citas dentro de listas, negritas y tablas', () => {
    const md = [
      '- **Hallazgo**[Fragmento 1 | Trabajo finalizado.docx][Fragmento 2 | Trabajo finalizado.docx]',
      '',
      '| Tema | Referencia |',
      '| --- | --- |',
      '| Muestreo | [Fragmento 5 | Anexo metodológico.pdf] |'
    ].join('\n')

    const html = renderMarkdownWithCitations(md, sampleSources)

    expect(html).toContain('data-citation-fragment="1"')
    expect(html).toContain('data-citation-fragment="2"')
    expect(html).toContain('data-citation-fragment="5"')
    expect(html).toContain('data-source-index="2"')
    expect(html).toContain('<table>')
  })

  it('renderiza citas sin coincidencia como botones no vinculados con aria-label informativo', () => {
    const html = renderMarkdownWithCitations(
      'Referencia externa [Fragmento 8 | Desconocido.pdf].',
      sampleSources
    )

    expect(html).toContain('class="chat-citation-chip"')
    expect(html).not.toContain('chat-citation-chip--linked')
    expect(html).toContain('data-source-index="-1"')
    expect(html).toContain('aria-label="Cita: Fragmento 8 de Desconocido.pdf"')
    expect(html).toContain('>8</button>')
  })

  it('no transforma citas dentro de código inline ni bloques de código cercados', () => {
    const md = [
      'Formato literal: `[Fragmento 1 | Trabajo finalizado.docx]`',
      '',
      '```txt',
      '[Fragmento 2 | Trabajo finalizado.docx]',
      '```'
    ].join('\n')

    const html = renderMarkdownWithCitations(md, sampleSources)

    expect(html).not.toContain('chat-citation-chip')
    expect(html).toContain('<code>[Fragmento 1 | Trabajo finalizado.docx]</code>')
    expect(html).toContain('[Fragmento 2 | Trabajo finalizado.docx]')
  })

  it('mantiene intactos los enlaces Markdown estándar aunque tengan formato parecido', () => {
    const md =
      'Visita [Fragmento 1 | Trabajo finalizado.docx](https://example.com) y [Enlace](https://investiflow.test).'
    const html = renderMarkdownWithCitations(md, sampleSources)

    expect(html).not.toContain('chat-citation-chip')
    expect(html).toContain('<a href="https://example.com">Fragmento 1 | Trabajo finalizado.docx</a>')
    expect(html).toContain('<a href="https://investiflow.test">Enlace</a>')
  })

  it('escapa caracteres HTML peligrosos en el nombre del documento', () => {
    const html = renderMarkdownWithCitations(
      'Dato [Fragmento 1 | "><img src=x onerror=alert(1)>].',
      sampleSources
    )

    expect(html).toContain('chat-citation-chip')
    expect(html).not.toContain('<img')
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')
  })
})
