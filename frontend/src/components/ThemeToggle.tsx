import { useTheme } from '../state/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'all 0.2s ease',

        // 🌞 Light mode styles
        backgroundColor:
          theme === 'light'
            ? 'rgba(38, 38, 38, 0.05)'
            // 🌙 Dark mode styles
            : '#151E3D',

        color: theme === 'light' ? '#374151' : '#f3f4f6',
        border: `1px solid ${
          theme === 'light'
            ? 'rgba(0, 0, 0, 0.1)'
            : '#1E2A5E' 
        }`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : '#1E2A5E'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : '#151E3D'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
