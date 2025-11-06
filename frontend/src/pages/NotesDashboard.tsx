import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../state/ThemeContext'
type Note = { id: string; title: string; content: string; tags?: string; created_at: string; updated_at: string }

export function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const nav = useNavigate()
  const { theme } = useTheme()
  
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim())
      if (sortBy) params.append('sortBy', sortBy)
      if (sortOrder) params.append('sortOrder', sortOrder)
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter)
      
      const queryString = params.toString()
      const url = `/api/notes${queryString ? `?${queryString}` : ''}`
      const { data } = await axios.get<Note[]>(url)
      setNotes(data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, sortBy, sortOrder, dateFilter])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => { load() }, [load])

  async function createNewNote() {
    try {
      const { data } = await axios.post<Note>('/api/notes', { title: 'Untitled', content: '' })
      nav(`/editor/${data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create note')
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  // Color palette for tags (theme-aware)
  const tagColors = theme === 'light' 
    ? ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']
    : ['#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171']

  function getTagColor(tag: string) {
    return tagColors[tag.toLowerCase().charCodeAt(0) % tagColors.length]
  }

  function renderTags(tagsString?: string) {
    if (!tagsString || !tagsString.trim()) return null
    
    const tagList = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)
    if (tagList.length === 0) return null

    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 6, 
        marginTop: 8,
        justifyContent: 'center'
      }}>
        {tagList.slice(0, 5).map((tag, index) => (
          <span
            key={index}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: getTagColor(tag) + (theme === 'light' ? '20' : '25'),
              color: getTagColor(tag),
              border: `1px solid ${getTagColor(tag)}40`,
              textTransform: 'lowercase',
              letterSpacing: '0.3px'
            }}
          >
            {tag}
          </span>
        ))}
        {tagList.length > 5 && (
          <span style={{ 
            color: theme === 'light' ? '#6b7280' : '#94a3b8', 
            fontSize: 11,
            padding: '4px 0'
          }}>
            +{tagList.length - 5}
          </span>
        )}
      </div>
    )
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
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

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          marginBottom: 24,
          padding: '20px',
          backgroundColor: theme === 'light' ? '#f9fafb' : '#1e293b',
          borderRadius: '12px',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#334155'}`
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search notes by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  fontSize: 14,
                  borderRadius: '10px',
                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#475569'}`,
                  background: theme === 'light' ? '#ffffff' : '#0f172a',
                  color: theme === 'light' ? '#111827' : '#f1f5f9',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1'
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme === 'light' ? '#d1d5db' : '#475569'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: theme === 'light' ? '#6b7280' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: 18,
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'light' ? '#f3f4f6' : '#334155'
                    e.currentTarget.style.color = theme === 'light' ? '#111827' : '#f1f5f9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#94a3b8'
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
              style={{
                padding: '12px 16px',
                fontSize: 14,
                borderRadius: '10px',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#475569'}`,
                background: theme === 'light' ? '#ffffff' : '#0f172a',
                color: theme === 'light' ? '#111827' : '#f1f5f9',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme === 'light' ? '#d1d5db' : '#475569'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created_at' | 'updated_at' | 'title')}
              style={{
                padding: '12px 16px',
                fontSize: 14,
                borderRadius: '10px',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#475569'}`,
                background: theme === 'light' ? '#ffffff' : '#0f172a',
                color: theme === 'light' ? '#111827' : '#f1f5f9',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme === 'light' ? '#d1d5db' : '#475569'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="updated_at">Sort by Updated</option>
              <option value="created_at">Sort by Created</option>
              <option value="title">Sort by Title</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '12px 16px',
                fontSize: 14,
                borderRadius: '10px',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#475569'}`,
                background: theme === 'light' ? '#ffffff' : '#0f172a',
                color: theme === 'light' ? '#111827' : '#f1f5f9',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1'
                e.currentTarget.style.background = theme === 'light' ? '#f9fafb' : '#1e293b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#475569'
                e.currentTarget.style.background = theme === 'light' ? '#ffffff' : '#0f172a'
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
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
              <button key={n.id} className="note-card" onClick={() => nav(`/editor/${n.id}`)} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || 'Untitled'}</div>
                {renderTags(n.tags)}
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>Updated {new Date(n.updated_at).toLocaleString()}</div>
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