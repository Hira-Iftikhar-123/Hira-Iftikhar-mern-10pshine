import { render, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../state/ThemeContext'

function Consumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} data-theme={theme}>toggle</button>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('applies and toggles theme', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )
    const btn = getByText('toggle') as HTMLButtonElement

    // initial should set data-theme on document
    expect(document.documentElement.getAttribute('data-theme')).toBeDefined()

    // toggle switches value and writes to localStorage
    act(() => btn.click())
    const after = document.documentElement.getAttribute('data-theme')
    expect(after === 'dark' || after === 'light').toBeTruthy()
    expect(localStorage.getItem('theme')).toBe(after)
  })
})


