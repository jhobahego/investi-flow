import { describe, it, expect } from 'vitest'
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
})
