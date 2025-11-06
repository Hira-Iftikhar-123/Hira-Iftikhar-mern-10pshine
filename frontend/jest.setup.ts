import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'
// Suppress TS constructor typing complaints and set Node polyfills on jsdom global
// @ts-ignore - override for jsdom environment
(global as unknown as { TextEncoder?: any }).TextEncoder = TextEncoder as unknown as any
// @ts-ignore - override for jsdom environment
(global as unknown as { TextDecoder?: any }).TextDecoder = TextDecoder as unknown as any

// Polyfill window.matchMedia for jsdom (used by ThemeContext)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  })
}