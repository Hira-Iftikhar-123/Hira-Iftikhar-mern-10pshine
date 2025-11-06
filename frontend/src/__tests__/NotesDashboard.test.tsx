import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotesDashboard } from '../pages/NotesDashboard'
import { ThemeProvider } from '../state/ThemeContext'

jest.mock('axios', () => ({ get: jest.fn().mockResolvedValue({ data: [] }) }))

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  )
}

describe('NotesDashboard', () => {
  it('renders title', async () => {
    const { findByText } = render(<NotesDashboard />, { wrapper: Wrapper as any })
    expect(await findByText(/All Notes/i)).toBeInTheDocument()
  })
})


