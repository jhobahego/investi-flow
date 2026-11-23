import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import ChatMessageContent from '@/components/ui/ChatMessageContent.vue'
import type { DocumentSource } from '@/types'

const sources: DocumentSource[] = [
  {
    attachment_id: 1,
    file_name: 'Trabajo finalizado.docx',
    chunk_index: 0,
    snippet: 'El diseño metodológico combina entrevistas y encuestas.',
    similarity: 0.92
  },
  {
    attachment_id: 2,
    file_name: 'Anexo estadístico.pdf',
    chunk_index: 4,
    snippet: 'La muestra final incluyó 120 participantes válidos.',
    similarity: 0.84
  }
]

const mountComponent = (props: {
  content: string
  sources?: DocumentSource[]
  activeSourceIndex?: number | null
}) =>
  mount(ChatMessageContent, {
    props,
    global: {
      plugins: [VueDOMPurifyHTML]
    }
  })

describe('ChatMessageContent', () => {
  it('preserva botones de cita con atributos data y aria tras sanitización real con VueDOMPurifyHTML', () => {
    const wrapper = mountComponent({
      content: 'Hallazgo clave [Fragmento 1 | Trabajo finalizado.docx].',
      sources
    })

    const chip = wrapper.find('button.chat-citation-chip')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toBe('1')
    expect(chip.attributes('type')).toBe('button')
    expect(chip.attributes('data-citation-fragment')).toBe('1')
    expect(chip.attributes('data-citation-file')).toBe('Trabajo finalizado.docx')
    expect(chip.attributes('data-source-index')).toBe('0')
    expect(chip.attributes('aria-label')).toBe(
      'Ver fuente: Fragmento 1 de Trabajo finalizado.docx'
    )
  })

  it('sanitiza payloads XSS en el markdown y en nombres de archivo de citas', async () => {
    const wrapper = mountComponent({
      content:
        'Texto <script>window.__xss=1</script><img src=x onerror="alert(1)"> [Fragmento 1 | "><img src=x onerror=alert(2)>]',
      sources
    })

    expect(wrapper.find('script').exists()).toBe(false)
    const images = wrapper.findAll('img')
    expect(images).toHaveLength(1)
    expect(images[0].attributes('onerror')).toBeUndefined()

    const chip = wrapper.find('button.chat-citation-chip')
    expect(chip.exists()).toBe(true)
    expect(chip.attributes('onerror')).toBeUndefined()

    // Al enfocar, el tooltip renderiza el nombre malicioso como texto plano, nunca como HTML ejecutable
    await chip.trigger('focusin')
    const tooltip = wrapper.find('[role="tooltip"]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.find('img').exists()).toBe(false)
    expect(tooltip.find('script').exists()).toBe(false)
  })

  it('emite select-source al hacer clic en una cita vinculada y no emite si no está vinculada', async () => {
    const wrapper = mountComponent({
      content:
        'Primera [Fragmento 1 | Trabajo finalizado.docx] y externa [Fragmento 9 | Inexistente.pdf].',
      sources
    })

    const chips = wrapper.findAll('button.chat-citation-chip')
    expect(chips).toHaveLength(2)

    await chips[0].trigger('click')
    expect(wrapper.emitted('select-source')).toEqual([[0]])

    await chips[1].trigger('click')
    expect(wrapper.emitted('select-source')).toEqual([[0]])
  })

  it('muestra vista previa ligera en hover y focus, y la cierra en mouseout, focusout o Escape', async () => {
    const wrapper = mountComponent({
      content: 'Detalle [Fragmento 1 | Trabajo finalizado.docx].',
      sources
    })

    const chip = wrapper.find('button.chat-citation-chip')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    // Hover muestra el tooltip con datos de la fuente
    await chip.trigger('mouseover')
    const tooltip = wrapper.find('[role="tooltip"]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Fragmento 1')
    expect(tooltip.text()).toContain('Trabajo finalizado.docx')
    expect(tooltip.text()).toContain('92%')
    expect(tooltip.text()).toContain('El diseño metodológico combina entrevistas y encuestas.')
    expect(tooltip.text()).toContain('Clic para resaltar en fuentes')

    // Mouseout oculta el tooltip
    await chip.trigger('mouseout')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    // Focusin muestra el tooltip y Escape lo cierra
    await chip.trigger('focusin')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)

    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('muestra vista previa sobria sin extracto ni aviso de clic para citas sin coincidencia', async () => {
    const wrapper = mountComponent({
      content: 'Referencia [Fragmento 7 | Documento externo.pdf].',
      sources
    })

    const chip = wrapper.find('button.chat-citation-chip')
    await chip.trigger('focusin')

    const tooltip = wrapper.find('[role="tooltip"]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Fragmento 7')
    expect(tooltip.text()).toContain('Documento externo.pdf')
    expect(tooltip.text()).not.toContain('Clic para resaltar en fuentes')

    await chip.trigger('focusout')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('sincroniza estado activo y aria-pressed en el chip correspondiente a activeSourceIndex', async () => {
    const wrapper = mountComponent({
      content:
        'A [Fragmento 1 | Trabajo finalizado.docx] y B [Fragmento 5 | Anexo estadístico.pdf].',
      sources,
      activeSourceIndex: null
    })

    const initialFirstChip = wrapper.findAll('button.chat-citation-chip')[0].element
    expect(wrapper.findAll('button.chat-citation-chip')[0].classes()).not.toContain(
      'chat-citation-chip--active'
    )

    await wrapper.setProps({ activeSourceIndex: 0 })

    const updatedChips = wrapper.findAll('button.chat-citation-chip')
    expect(updatedChips[0].element).toBe(initialFirstChip)
    expect(updatedChips[0].classes()).toContain('chat-citation-chip--active')
    expect(updatedChips[0].attributes('aria-pressed')).toBe('true')
    expect(updatedChips[1].classes()).not.toContain('chat-citation-chip--active')
  })
})
