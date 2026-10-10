import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import AttachmentUpload from '@/components/ui/AttachmentUpload.vue'
import { FileType, type AttachmentResponse } from '@/types'

const { pushMock, attachmentsStoreMock, projectsStoreMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  attachmentsStoreMock: {
    loading: false,
    uploadDocument: vi.fn(),
    replaceDocument: vi.fn(),
    downloadDocument: vi.fn(),
    getDocument: vi.fn(),
    clearError: vi.fn(),
  },
  projectsStoreMock: {
    currentProject: null,
    currentProjectId: null,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/stores/attachments', () => ({
  useAttachmentsStore: () => attachmentsStoreMock,
}))

vi.mock('@/stores/projects', () => ({
  useProjectsStore: () => projectsStoreMock,
}))

const baseProps = { entityType: 'project' as const, entityId: 1 }

function pdfAttachment(overrides: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 7,
    file_name: 'informe.pdf',
    file_type: FileType.PDF,
    file_size: 2048,
    file_path: 'uploads/informe.pdf',
    project_id: 1,
    phase_id: null,
    task_id: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    ...overrides,
  }
}

function pdfFile(name = 'informe.pdf'): File {
  return new File(['dummy-content'], name, { type: 'application/pdf' })
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function docxAttachment(overrides: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 7,
    file_name: 'informe.docx',
    file_type: FileType.DOCX,
    file_size: 2048,
    file_path: 'uploads/informe.docx',
    project_id: 1,
    phase_id: null,
    task_id: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    ...overrides,
  }
}

function docxFile(name = 'informe.docx'): File {
  return new File(['dummy-content'], name, { type: DOCX_MIME })
}

async function mountUpload(props: Record<string, unknown> = {}) {
  const wrapper = mount(AttachmentUpload, { props: { ...baseProps, ...props } })
  await flushPromises()
  return wrapper
}

function setInputFiles(inputWrapper: { element: unknown }, files: File[]) {
  Object.defineProperty(inputWrapper.element, 'files', {
    value: files,
    configurable: true,
  })
}

function replaceFileInputOf(wrapper: ReturnType<typeof mount>) {
  // The replace input is always rendered; the upload input only exists when
  // there is no current attachment, so the replace input is the last one.
  const inputs = wrapper.findAll('input[type="file"]')
  return inputs.at(inputs.length - 1)
}

function modalButton(text: string): HTMLButtonElement {
  // The confirmation modal renders inside <Teleport to="body">, outside the
  // wrapper's DOM subtree, so its buttons are queried from document.body.
  const button = Array.from(document.body.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === text,
  )
  if (!button) throw new Error(`Modal button "${text}" not found`)
  return button as HTMLButtonElement
}

describe('AttachmentUpload', () => {
  beforeEach(() => {
    pushMock.mockClear()
    attachmentsStoreMock.loading = false
    attachmentsStoreMock.uploadDocument.mockReset()
    attachmentsStoreMock.replaceDocument.mockReset()
    attachmentsStoreMock.downloadDocument.mockReset()
    attachmentsStoreMock.clearError.mockReset()
    attachmentsStoreMock.getDocument.mockReset().mockResolvedValue(null)
  })

  afterEach(() => {
    // Drop any teleported modal remnants so tests stay isolated.
    document.body.innerHTML = ''
  })

  it('shows a loading skeleton while resolving the existing document, then the drop zone', async () => {
    // Arrange: getDocument stays pending until we release it
    let release!: (value: unknown) => void
    attachmentsStoreMock.getDocument.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve
      }),
    )

    // Act: mount without waiting for the pending lookup
    const wrapper = mount(AttachmentUpload, { props: { ...baseProps } })
    await nextTick()

    // Assert: skeleton state is visible first
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)

    // Act: resolve the lookup
    release(null)
    await flushPromises()

    // Assert: empty state with the drop-zone hint
    expect(wrapper.text()).toContain('Arrastra tu documento aquí')
  })

  it('does not fetch the existing document when one is already provided', async () => {
    // Arrange & Act
    await mountUpload({ currentAttachment: pdfAttachment() })

    // Assert
    expect(attachmentsStoreMock.getDocument).not.toHaveBeenCalled()
  })

  it('renders the current attachment card with name, type badge and size', async () => {
    // Arrange & Act
    const wrapper = await mountUpload({ currentAttachment: pdfAttachment() })

    // Assert
    expect(wrapper.text()).toContain('informe.pdf')
    expect(wrapper.text()).toContain('PDF')
    expect(wrapper.text()).toContain('2 KB')
    expect(wrapper.text()).not.toContain('Arrastra tu documento aquí')
  })

  it('restricts both file inputs to .docx only', async () => {
    // Arrange & Act
    const wrapper = await mountUpload()

    // Assert: upload input + replace input (always rendered) are docx-only
    const inputs = wrapper.findAll('input[type="file"]')
    expect(inputs).toHaveLength(2)
    for (const input of inputs) {
      expect(input.attributes('accept')).toBe('.docx')
    }
  })

  it('tells the user that only .docx files up to 10MB are supported', async () => {
    // Arrange & Act
    const wrapper = await mountUpload()

    // Assert
    expect(wrapper.text()).toContain('Formatos admitidos: .docx')
    expect(wrapper.text()).toContain('10MB')
  })

  it('uploads a valid file selected via the file input and emits attachment-uploaded', async () => {
    // Arrange
    const uploaded = docxAttachment()
    attachmentsStoreMock.uploadDocument.mockResolvedValueOnce(uploaded)
    const wrapper = await mountUpload()
    const input = wrapper.find('input[type="file"]')
    setInputFiles(input, [docxFile()])

    // Act
    await input.trigger('change')
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.uploadDocument).toHaveBeenCalledTimes(1)
    const [entityType, entityId, file] = attachmentsStoreMock.uploadDocument.mock.calls[0]
    expect(entityType).toBe('project')
    expect(entityId).toBe(1)
    expect((file as File).name).toBe('informe.docx')
    expect(wrapper.emitted('attachment-uploaded')).toHaveLength(1)
    expect(wrapper.emitted('attachment-uploaded')![0]).toEqual([uploaded])
  })

  it('uploads a valid file dropped onto the drop zone', async () => {
    // Arrange
    attachmentsStoreMock.uploadDocument.mockResolvedValueOnce(docxAttachment())
    const wrapper = await mountUpload()
    const dropZone = wrapper.find('.border-dashed')

    // Act
    await dropZone.trigger('drop', { dataTransfer: { files: [docxFile('tesis.docx')] } })
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.uploadDocument).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('attachment-uploaded')).toHaveLength(1)
  })

  it('rejects a PDF selected via the file input with a visible error and no upload', async () => {
    // Arrange: backend is docx-only, so PDFs are rejected early
    const wrapper = await mountUpload()
    const input = wrapper.find('input[type="file"]')
    setInputFiles(input, [pdfFile()])

    // Act
    await input.trigger('change')
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.uploadDocument).not.toHaveBeenCalled()
    expect(wrapper.emitted('attachment-uploaded')).toBeUndefined()
    expect(wrapper.find('div.mt-2.text-red-600').text()).toContain('Solo se admiten archivos .docx')
  })

  it('shows a visible validation error and skips upload for a disallowed file type', async () => {
    // Arrange: real validateFile rejects .txt via MIME check
    const wrapper = await mountUpload()
    const input = wrapper.find('input[type="file"]')
    setInputFiles(input, [new File(['x'], 'notas.txt', { type: 'text/plain' })])

    // Act
    await input.trigger('change')
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.uploadDocument).not.toHaveBeenCalled()
    expect(wrapper.emitted('attachment-uploaded')).toBeUndefined()
    expect(wrapper.find('.text-red-600').text()).toContain('Tipo de archivo no permitido')
  })

  it('shows a visible validation error for an oversized file', async () => {
    // Arrange: real validateFile rejects files over 10 MB
    const wrapper = await mountUpload()
    const input = wrapper.find('input[type="file"]')
    const big = new File([new ArrayBuffer(11 * 1024 * 1024)], 'grande.docx', {
      type: DOCX_MIME,
    })
    setInputFiles(input, [big])

    // Act
    await input.trigger('change')
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.uploadDocument).not.toHaveBeenCalled()
    expect(wrapper.find('.text-red-600').text()).toContain('demasiado grande')
  })

  it('shows the store error message when the upload fails', async () => {
    // Arrange
    attachmentsStoreMock.uploadDocument.mockRejectedValueOnce(new Error('Error al subir el documento'))
    const wrapper = await mountUpload()
    const input = wrapper.find('input[type="file"]')
    setInputFiles(input, [docxFile()])

    // Act
    await input.trigger('change')
    await flushPromises()

    // Assert
    expect(wrapper.emitted('attachment-uploaded')).toBeUndefined()
    expect(wrapper.find('.text-red-600').text()).toContain('Error al subir el documento')
  })

  it('shows a skeleton while the store reports loading', async () => {
    // Arrange
    attachmentsStoreMock.loading = true

    // Act
    const wrapper = mount(AttachmentUpload, { props: { ...baseProps } })
    await flushPromises()

    // Assert
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Arrastra tu documento aquí')
  })

  it('navigates to the document editor when the attachment is a .docx file', async () => {
    // Arrange
    const wrapper = await mountUpload({ currentAttachment: docxAttachment() })
    const viewButton = wrapper.find('button[title="Editar documento con IA"]')

    // Act
    await viewButton.trigger('click')

    // Assert
    expect(pushMock).toHaveBeenCalledWith({
      name: 'DocumentEditor',
      params: { id: 1 },
      query: { entityType: 'project', entityId: '1' },
    })
  })

  it('blocks navigation with a visible error when the attachment is not a .docx file', async () => {
    // Arrange: legacy PDF attachment already uploaded, editor is docx-only
    const wrapper = await mountUpload({ currentAttachment: pdfAttachment() })
    const viewButton = wrapper.find('button[title="Editar documento con IA"]')

    // Act
    await viewButton.trigger('click')

    // Assert
    expect(pushMock).not.toHaveBeenCalled()
    expect(wrapper.find('div.mt-2.text-red-600').text()).toContain('Solo se admiten archivos .docx')
  })

  it('shows the store error message when the download fails', async () => {
    // Arrange
    attachmentsStoreMock.downloadDocument.mockRejectedValueOnce(new Error('Error al descargar'))
    const wrapper = await mountUpload({ currentAttachment: pdfAttachment() })

    // Act
    await wrapper.find('button[title="Descargar documento"]').trigger('click')
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.downloadDocument).toHaveBeenCalledTimes(1)
    expect(wrapper.find('div.mt-2.text-red-600').text()).toContain('Error al descargar')
  })

  it('asks for confirmation and replaces the document on confirm', async () => {
    // Arrange
    const updated = docxAttachment({ id: 8, file_name: 'nuevo.docx' })
    attachmentsStoreMock.replaceDocument.mockResolvedValueOnce(updated)
    const wrapper = await mountUpload({ currentAttachment: docxAttachment() })
    const replaceInput = replaceFileInputOf(wrapper)
    setInputFiles(replaceInput, [docxFile('nuevo.docx')])

    // Act: pick a replacement file
    await replaceInput.trigger('change')
    await flushPromises()

    // Assert: confirmation modal is visible, store not called yet
    expect(attachmentsStoreMock.replaceDocument).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('¿Reemplazar documento existente?')

    // Act: confirm the replacement
    modalButton('Reemplazar').click()
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.replaceDocument).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('attachment-updated')).toHaveLength(1)
    expect(wrapper.emitted('attachment-updated')![0]).toEqual([updated])
    expect(document.body.textContent).not.toContain('¿Reemplazar documento existente?')
  })

  it('rejects an invalid replacement file without opening the confirmation modal', async () => {
    // Arrange
    const wrapper = await mountUpload({ currentAttachment: pdfAttachment() })
    const replaceInput = replaceFileInputOf(wrapper)
    setInputFiles(replaceInput, [new File(['x'], 'notas.txt', { type: 'text/plain' })])

    // Act
    await replaceInput.trigger('change')
    await flushPromises()

    // Assert
    expect(wrapper.find('div.mt-2.text-red-600').text()).toContain('Tipo de archivo no permitido')
    expect(document.body.textContent).not.toContain('¿Reemplazar documento existente?')
    expect(attachmentsStoreMock.replaceDocument).not.toHaveBeenCalled()
  })

  it('rejects a PDF replacement file without opening the confirmation modal', async () => {
    // Arrange
    const wrapper = await mountUpload({ currentAttachment: docxAttachment() })
    const replaceInput = replaceFileInputOf(wrapper)
    setInputFiles(replaceInput, [pdfFile('nuevo.pdf')])

    // Act
    await replaceInput.trigger('change')
    await flushPromises()

    // Assert
    expect(wrapper.find('div.mt-2.text-red-600').text()).toContain('Solo se admiten archivos .docx')
    expect(document.body.textContent).not.toContain('¿Reemplazar documento existente?')
    expect(attachmentsStoreMock.replaceDocument).not.toHaveBeenCalled()
  })

  it('closes the replacement modal without calling the store on cancel', async () => {
    // Arrange
    const wrapper = await mountUpload({ currentAttachment: docxAttachment() })
    const replaceInput = replaceFileInputOf(wrapper)
    setInputFiles(replaceInput, [docxFile('nuevo.docx')])
    await replaceInput.trigger('change')
    await flushPromises()
    expect(document.body.textContent).toContain('¿Reemplazar documento existente?')

    // Act
    modalButton('Cancelar').click()
    await flushPromises()

    // Assert
    expect(attachmentsStoreMock.replaceDocument).not.toHaveBeenCalled()
    expect(wrapper.emitted('attachment-updated')).toBeUndefined()
    expect(document.body.textContent).not.toContain('¿Reemplazar documento existente?')
  })
})
