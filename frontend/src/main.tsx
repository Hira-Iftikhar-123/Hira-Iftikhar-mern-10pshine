import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { AuthProvider } from './state/AuthContext'
import { ThemeProvider } from './state/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute' 
import { NotesDashboard } from './pages/NotesDashboard'
import { NoteEditor } from './pages/NoteEditor'
import { Profile } from './pages/Profile'
import { ForgotPassword } from './components/ForgotPassword'
import { VerifyOTP } from './components/VerifyOTP'
import { ResetPassword } from './components/ResetPassword'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/verify-otp', element: <VerifyOTP /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/notes', element: <ProtectedRoute><NotesDashboard /></ProtectedRoute> },
  { path: '/editor/:id', element: <ProtectedRoute><NoteEditor /></ProtectedRoute> },
  { path: '/profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)