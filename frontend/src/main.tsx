import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { AuthProvider } from './state/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute' 
import { Notes } from './pages/Notes'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/notes', element: <ProtectedRoute><Notes /></ProtectedRoute> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
