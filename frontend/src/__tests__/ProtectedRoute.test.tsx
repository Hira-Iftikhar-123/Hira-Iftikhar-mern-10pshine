import '@testing-library/jest-dom'
import { describe, it, expect, jest } from '@jest/globals'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthProvider } from '../state/AuthContext'
import { render } from '@testing-library/react'

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), defaults: { headers: { common: {} } } }))

function AppNoToken() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Home</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {
  it('redirects when no token', () => {
    const axios = require('axios') as any
    axios.defaults = axios.defaults || { headers: { common: {} } }
    const { getByText } = render(<AppNoToken />)
    expect(getByText('Login')).toBeTruthy()
  })
})


