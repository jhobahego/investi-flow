import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props: { isOpen: true, message: '¿Eliminar el registro?', ...props },
  })
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    // Arrange & Act
    const wrapper = mountDialog({ isOpen: false })

    // Assert
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false)
  })

  it('renders the title, message and default confirm label', () => {
    // Arrange & Act
    const wrapper = mountDialog()

    // Assert
    expect(wrapper.text()).toContain('¿Estás seguro?')
    expect(wrapper.text()).toContain('¿Eliminar el registro?')
    expect(wrapper.text()).toContain('Confirmar')
    expect(wrapper.text()).toContain('Cancelar')
  })

  it('renders custom title and confirm button text', () => {
    // Arrange & Act
    const wrapper = mountDialog({ title: 'Eliminar proyecto', confirmButtonText: 'Sí, eliminar' })

    // Assert
    expect(wrapper.text()).toContain('Eliminar proyecto')
    expect(wrapper.text()).toContain('Sí, eliminar')
  })

  it('emits confirm when the confirm button is clicked', async () => {
    // Arrange
    const wrapper = mountDialog()
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Confirmar'))!

    // Act
    await confirmButton.trigger('click')

    // Assert
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('emits cancel when the cancel button is clicked', async () => {
    // Arrange
    const wrapper = mountDialog()
    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!

    // Act
    await cancelButton.trigger('click')

    // Assert
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('emits cancel when the modal is closed via X or backdrop', async () => {
    // Arrange
    const wrapper = mountDialog()

    // Act
    await wrapper.find('button[title="Cerrar"]').trigger('click')

    // Assert
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('keeps the confirm button disabled until the exact confirmText is typed', async () => {
    // Arrange
    const wrapper = mountDialog({ confirmText: 'ELIMINAR' })
    const input = wrapper.find('input')
    const confirmButton = () => wrapper.findAll('button').find((b) => b.text().includes('Confirmar'))!

    // Assert: disabled initially
    expect((confirmButton().element as HTMLButtonElement).disabled).toBe(true)

    // Act: partial text
    await input.setValue('ELIMI')

    // Assert: still disabled
    expect((confirmButton().element as HTMLButtonElement).disabled).toBe(true)

    // Act: exact text
    await input.setValue('ELIMINAR')

    // Assert: enabled and clickable
    expect((confirmButton().element as HTMLButtonElement).disabled).toBe(false)
    await confirmButton().trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('disables the confirm button and shows a spinner while loading', async () => {
    // Arrange & Act
    const wrapper = mountDialog({ loading: true })
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Confirmar'))!

    // Assert
    expect((confirmButton.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true)

    // Act
    await confirmButton.trigger('click')

    // Assert
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('clears the typed confirmation when the dialog is cancelled and reopened', async () => {
    // Arrange
    const wrapper = mountDialog({ confirmText: 'ELIMINAR' })
    await wrapper.find('input').setValue('ELIMINAR')
    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!

    // Act
    await cancelButton.trigger('click')
    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    // Assert
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })
})
