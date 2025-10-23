import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../state/ThemeContext'
type Note = { id: string; title: string; content: string; created_at: string; updated_at: string }

export function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const { theme } = useTheme()
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get<Note[]>('/api/notes')
      setNotes(data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createNewNote() {
    try {
      const { data } = await axios.post<Note>('/api/notes', { title: 'Untitled', content: '' })
      nav(`/editor/${data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create note')
    }
  }

  return (
    <div className="page-bg">
      <div className="container-narrow notes-wrap">
        <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 24
        }}>
          <div 
            onClick={() => nav('/')}
            style={{ 
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 16,
              color: '#6366f1', 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 0 
            }}>
            <span style={{ fontSize: 14 }}>←</span>
            <span>Home</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1
            style={{
              margin: 0,
              fontSize: 28,
              color: theme === 'light' ? '#000000' : '#ffffff',
              fontWeight: 650,
              letterSpacing: '-0.025em',
              transition: 'color 0.3s ease', 
            }}
          >
            All Notes
          </h1>
           <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
             <ThemeToggle />
             <button className="btn btn-secondary" style={{ color: '#6366f1', width: 'auto', padding: '10px 14px' }} onClick={load}>Refresh</button>
             <button className="btn btn-secondary" style={{color: '#e39ffb', width: 'auto', padding: '10px 14px' }} onClick={createNewNote}>New Note</button>
           </div>
        </div>
        </div>
        <div className="surface" style={{ padding: 24 }}>
          {loading && <div>Loading…</div>}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              color: '#b91c1c',
              fontSize: 14,
              marginBottom: 12
            }}>{error}</div>
          )}
          
          <div className="note-list">
            {notes.map(n => (
              <button key={n.id} className="note-card" onClick={() => nav(`/editor/${n.id}`)} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || 'Untitled'}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>Updated {new Date(n.updated_at).toLocaleString()}</div>
              </button>
            ))}
            {!loading && notes.length === 0 && (
              <div className="subtle" style={{ textAlign: 'center', padding: 24, gridColumn: '1 / -1' }}>No notes yet. Create your first note.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}