import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ChatSources from '@/components/ui/ChatSources.vue'
import type { DocumentSource } from '@/types'

const sources: DocumentSource[] = [
  { attachment_id: 1, file_name: 'tesis.docx', chunk_index: 0, snippet: 'Primer fragmento', similarity: 0.82 },
  { attachment_id: 2, file_name: 'marco.docx', chunk_index: 3, snippet: 'Segundo fragmento', similarity: 0.5 }
]

describe('ChatSources', () => {
  it('muestra el contador y oculta el detalle por defecto', () => {
    const wrapper = mount(ChatSources, { props: { sources } })
    expect(wrapper.text()).toContain('Fuentes consultadas (2)')
    expect(wrapper.text()).not.toContain('tesis.docx')
  })

  it('expande y muestra documento, snippet y similitud', async () => {
    const wrapper = mount(ChatSources, { props: { sources } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('tesis.docx')
    expect(wrapper.text()).toContain('Primer fragmento')
    expect(wrapper.text()).toContain('82%')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('muestra numeración discreta 1-based en cada fuente al expandir', async () => {
    const wrapper = mount(ChatSources, { props: { sources } })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li')
    expect(items[0].text()).toContain('1')
    expect(items[1].text()).toContain('2')
  })

  it('se abre automáticamente y resalta el fragmento correspondiente cuando cambia highlightedIndex', async () => {
    const scrollIntoViewMock = vi.fn()
    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoViewMock

    try {
      const wrapper = mount(ChatSources, {
        props: { sources, highlightedIndex: null, highlightTrigger: 0 }
      })
      expect(wrapper.findAll('li')).toHaveLength(0)

      await wrapper.setProps({ highlightedIndex: 1, highlightTrigger: 1 })
      await nextTick()

      const items = wrapper.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0].attributes('data-highlighted')).toBeUndefined()
      expect(items[1].attributes('data-highlighted')).toBe('true')
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' })
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  it('vuelve a abrir el panel al reactivar la misma fuente mediante highlightTrigger y emite clear-highlight al colapsar', async () => {
    const wrapper = mount(ChatSources, {
      props: { sources, highlightedIndex: 0, highlightTrigger: 1 }
    })
    await nextTick()
    expect(wrapper.findAll('li')).toHaveLength(2)

    // El usuario colapsa manualmente
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.emitted('clear-highlight')).toHaveLength(1)

    // Re-clic sobre la misma cita incrementa highlightTrigger y reabre el panel
    await wrapper.setProps({ highlightedIndex: 0, highlightTrigger: 2 })
    await nextTick()
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.findAll('li')[0].attributes('data-highlighted')).toBe('true')
  })
})
