import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { AuthProvider } from './state/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute' 
import { NotesDashboard } from './pages/NotesDashboard'
import { NoteEditor } from './pages/NoteEditor'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/notes', element: <ProtectedRoute><NotesDashboard /></ProtectedRoute> },
  { path: '/editor/:id', element: <ProtectedRoute><NoteEditor /></ProtectedRoute> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
