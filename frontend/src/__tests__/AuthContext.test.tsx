import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../state/AuthContext'
import axios from 'axios'
jest.mock('../utils/logger')

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function Consumer() {
  const { login, token } = useAuth()
  return (
    <button onClick={() => login('a@b.com', 'pw')} data-token={token || ''}>login</button>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedAxios.post.mockReset()
    mockedAxios.get.mockReset()
  })

  it('sets token on successful login', async () => {
    mockedAxios.post.mockResolvedValue({ data: { token: 'T123' } } as any)
    mockedAxios.get.mockResolvedValue({ data: { id: 'u1', email: 'a@b.com' } } as any)

    const { getByText, findByText } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await act(async () => { getByText('login').click() })

    // token persisted
    expect(localStorage.getItem('token')).toBe('T123')
    // axios default header set
    expect(axios.defaults.headers?.common?.Authorization).toContain('Bearer')

    // profile fetch attempted
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me')
  })
})


