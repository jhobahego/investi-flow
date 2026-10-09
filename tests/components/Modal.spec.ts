import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '@/components/ui/Modal.vue'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    // Arrange & Act
    const wrapper = mount(Modal, { props: { isOpen: false } })

    // Assert
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false)
  })

  it('renders the title and default slot content when open', () => {
    // Arrange & Act
    const wrapper = mount(Modal, {
      props: { isOpen: true, title: 'Mi título' },
      slots: { default: '<p>Contenido del modal</p>' },
    })

    // Assert
    expect(wrapper.find('h3').text()).toBe('Mi título')
    expect(wrapper.text()).toContain('Contenido del modal')
  })

  it('hides the title element when no title is provided', () => {
    // Arrange & Act
    const wrapper = mount(Modal, {
      props: { isOpen: true },
      slots: { default: 'Solo contenido' },
    })

    // Assert
    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.text()).toContain('Solo contenido')
  })

  it.each([
    { size: 'sm' as const, expectedClass: 'sm:max-w-md' },
    { size: 'md' as const, expectedClass: 'sm:max-w-lg' },
    { size: 'lg' as const, expectedClass: 'sm:max-w-2xl' },
    { size: 'xl' as const, expectedClass: 'sm:max-w-4xl' },
  ])('applies the $size panel width class ($expectedClass)', ({ size, expectedClass }) => {
    // Arrange & Act
    const wrapper = mount(Modal, { props: { isOpen: true, size } })

    // Assert
    expect(wrapper.find('.inline-block.align-bottom').classes()).toContain(expectedClass)
  })

  it('emits close when the X button is clicked', async () => {
    // Arrange
    const wrapper = mount(Modal, { props: { isOpen: true, title: 'Título' } })

    // Act
    await wrapper.find('button[title="Cerrar"]').trigger('click')

    // Assert
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the backdrop itself is clicked', async () => {
    // Arrange
    const wrapper = mount(Modal, { props: { isOpen: true } })

    // Act
    await wrapper.find('.fixed.inset-0.z-50').trigger('click')

    // Assert
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close when the dialog content is clicked', async () => {
    // Arrange
    const wrapper = mount(Modal, {
      props: { isOpen: true },
      slots: { default: 'Contenido' },
    })

    // Act
    await wrapper.find('.inline-block.align-bottom').trigger('click')

    // Assert
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('renders the footer slot when provided', () => {
    // Arrange & Act
    const wrapper = mount(Modal, {
      props: { isOpen: true },
      slots: {
        default: 'Cuerpo',
        footer: '<button>Guardar</button>',
      },
    })

    // Assert
    expect(wrapper.text()).toContain('Guardar')
    expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
  })

  it('omits the footer wrapper when no footer slot is provided', () => {
    // Arrange & Act
    const wrapper = mount(Modal, {
      props: { isOpen: true },
      slots: { default: 'Cuerpo' },
    })

    // Assert
    expect(wrapper.find('.bg-gray-50').exists()).toBe(false)
  })
})
