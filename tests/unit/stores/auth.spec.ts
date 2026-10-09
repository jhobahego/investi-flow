import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { TokenResponse, User, UserCreate } from '@/types'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const { pushMock, apiMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, default: apiMock }
})

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)

const ACCESS_TOKEN = 'access-token-123'
const REFRESH_TOKEN = 'refresh-token-456'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    full_name: 'Ada Lovelace',
    phone_number: null,
    university: null,
    research_group: null,
    career: null,
    is_active: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTokens(overrides: Partial<TokenResponse> = {}): TokenResponse {
  return {
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
    token_type: 'bearer',
    ...overrides,
  }
}

/** Creates a fresh store that sees the given tokens in localStorage (the store reads them at creation). */
function useStoreWithTokensInStorage(): ReturnType<typeof useAuthStore> {
  localStorage.setItem('accessToken', ACCESS_TOKEN)
  localStorage.setItem('refreshToken', REFRESH_TOKEN)
  setActivePinia(createPinia())
  return useAuthStore()
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setActivePinia(createPinia())
  })

  it('has the expected initial state when storage is empty', () => {
    // Arrange & Act
    const store = useAuthStore()

    // Assert
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(false)
    expect(store.errorMessage).toBe('')
  })

  it('hydrates the token from localStorage', () => {
    // Arrange
    const store = useStoreWithTokensInStorage()

    // Assert
    expect(store.token).toBe(ACCESS_TOKEN)
    expect(store.refreshToken).toBe(REFRESH_TOKEN)
    expect(store.isAuthenticated).toBe(true)
  })

  it('logs in successfully, persists tokens and navigates to Dashboard', async () => {
    // Arrange
    const user = makeUser()
    mockedPost.mockResolvedValueOnce({ data: makeTokens() })
    mockedGet.mockResolvedValueOnce({ data: user })
    const store = useAuthStore()

    // Act
    await store.login({ email: 'ada@example.com', password: 'secret' })

    // Assert
    expect(mockedPost).toHaveBeenCalledTimes(1)
    expect(mockedPost.mock.calls[0][0]).toBe('/auth/login')
    const sentForm = mockedPost.mock.calls[0][1] as FormData
    expect(sentForm).toBeInstanceOf(FormData)
    expect(sentForm.get('username')).toBe('ada@example.com')
    expect(sentForm.get('password')).toBe('secret')
    expect(mockedGet).toHaveBeenCalledWith('/users/me')
    expect(store.user).toEqual(user)
    expect(store.token).toBe(ACCESS_TOKEN)
    expect(store.refreshToken).toBe(REFRESH_TOKEN)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('accessToken')).toBe(ACCESS_TOKEN)
    expect(localStorage.getItem('refreshToken')).toBe(REFRESH_TOKEN)
    expect(pushMock).toHaveBeenCalledWith({ name: 'Dashboard' })
    expect(store.loading).toBe(false)
    expect(store.errorMessage).toBe('')
  })

  it('sets loading while login is in flight', async () => {
    // Arrange
    let resolveLogin!: (value: { data: TokenResponse }) => void
    mockedPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve
      }),
    )
    mockedGet.mockResolvedValueOnce({ data: makeUser() })
    const store = useAuthStore()
    const credentials = { email: 'ada@example.com', password: 'secret' }

    // Act
    const pending = store.login(credentials)

    // Assert (pending)
    expect(store.loading).toBe(true)

    // Act (resolve)
    resolveLogin({ data: makeTokens() })
    await pending

    // Assert (settled)
    expect(store.loading).toBe(false)
  })

  it('sets the error message and persists nothing when login fails', async () => {
    // Arrange
    mockedPost.mockRejectedValueOnce(new Error('Invalid credentials'))
    const store = useAuthStore()

    // Act
    await expect(store.login({ email: 'ada@example.com', password: 'wrong' })).rejects.toThrow(
      'Invalid credentials',
    )

    // Assert
    expect(store.errorMessage).toBe('Invalid credentials')
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(pushMock).not.toHaveBeenCalled()
    expect(store.loading).toBe(false)
  })

  it('logs out, clears storage and navigates to Login', async () => {
    // Arrange
    mockedPost.mockResolvedValueOnce({ data: makeTokens() })
    mockedGet.mockResolvedValueOnce({ data: makeUser() })
    const store = useAuthStore()
    await store.login({ email: 'ada@example.com', password: 'secret' })
    expect(store.isAuthenticated).toBe(true)
    pushMock.mockClear()

    // Act
    await store.logout()

    // Assert
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(pushMock).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('registers a user without persisting tokens', async () => {
    // Arrange
    const payload: UserCreate = {
      email: 'ada@example.com',
      full_name: 'Ada Lovelace',
      password: 'secret-123',
      phone_number: '555-0100',
    }
    mockedPost.mockResolvedValueOnce({ data: {} })
    const store = useAuthStore()

    // Act
    await store.register(payload)

    // Assert
    expect(mockedPost).toHaveBeenCalledWith('/auth/register', payload)
    expect(store.token).toBeNull()
    expect(store.errorMessage).toBe('')
    expect(store.loading).toBe(false)
  })

  it('sets the error message when registration fails', async () => {
    // Arrange
    mockedPost.mockRejectedValueOnce(new Error('Email already registered'))
    const store = useAuthStore()

    // Act
    await expect(
      store.register({
        email: 'ada@example.com',
        full_name: 'Ada Lovelace',
        password: 'secret-123',
        phone_number: '555-0100',
      }),
    ).rejects.toThrow('Email already registered')

    // Assert
    expect(store.errorMessage).toBe('Email already registered')
    expect(store.loading).toBe(false)
  })

  it('fetches the current user when a token exists', async () => {
    // Arrange
    const user = makeUser()
    const store = useStoreWithTokensInStorage()
    mockedGet.mockResolvedValueOnce({ data: user })

    // Act
    await store.fetchUser()

    // Assert
    expect(mockedGet).toHaveBeenCalledWith('/users/me')
    expect(store.user).toEqual(user)
  })

  it('skips fetching the user when there is no token', async () => {
    // Arrange
    const store = useAuthStore()

    // Act
    await store.fetchUser()

    // Assert
    expect(mockedGet).not.toHaveBeenCalled()
    expect(store.user).toBeNull()
  })

  it('clears auth data when fetching the user fails', async () => {
    // Arrange
    const store = useStoreWithTokensInStorage()
    mockedGet.mockRejectedValueOnce(new Error('Unauthorized'))

    // Act
    await store.fetchUser()

    // Assert
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('checkAuth fetches the user when a token exists', async () => {
    // Arrange
    const store = useStoreWithTokensInStorage()
    mockedGet.mockResolvedValueOnce({ data: makeUser() })

    // Act
    await store.checkAuth()

    // Assert
    expect(mockedGet).toHaveBeenCalledWith('/users/me')
  })

  it('checkAuth does nothing when there is no token', async () => {
    // Arrange
    const store = useAuthStore()

    // Act
    await store.checkAuth()

    // Assert
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('refreshes tokens successfully and returns true', async () => {
    // Arrange
    const store = useStoreWithTokensInStorage()
    const renewed = makeTokens({ access_token: 'new-access', refresh_token: 'new-refresh' })
    mockedPost.mockResolvedValueOnce({ data: renewed })

    // Act
    const result = await store.refreshAccessToken()

    // Assert
    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/refresh',
      {},
      { headers: { Authorization: `Bearer ${REFRESH_TOKEN}` } },
    )
    expect(result).toBe(true)
    expect(store.token).toBe('new-access')
    expect(store.refreshToken).toBe('new-refresh')
    expect(localStorage.getItem('accessToken')).toBe('new-access')
  })

  it('returns false without calling the API when there is no refresh token', async () => {
    // Arrange
    const store = useAuthStore()

    // Act
    const result = await store.refreshAccessToken()

    // Assert
    expect(result).toBe(false)
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('clears auth data and navigates to Login when refresh fails', async () => {
    // Arrange
    const store = useStoreWithTokensInStorage()
    mockedPost.mockRejectedValueOnce(new Error('Refresh expired'))

    // Act
    const result = await store.refreshAccessToken()

    // Assert
    expect(result).toBe(false)
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(pushMock).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('clearError and setError manage the error message', () => {
    // Arrange
    const store = useAuthStore()

    // Act & Assert
    store.setError('boom')
    expect(store.errorMessage).toBe('boom')
    store.clearError()
    expect(store.errorMessage).toBe('')
  })
})
