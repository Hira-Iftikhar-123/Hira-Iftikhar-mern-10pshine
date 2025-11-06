import { describe, it, expect, jest } from '@jest/globals'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotesDashboard } from '../pages/NotesDashboard'
import axios from 'axios'
import { ThemeProvider } from '../state/ThemeContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  )
}

describe('NotesDashboard API', () => {
  it('calls GET /api/notes on mount', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] } as any)
    render(<NotesDashboard />, { wrapper: Wrapper as any })
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled())
    expect(mockedAxios.get.mock.calls[0][0]).toMatch('/api/notes')
  })
})


