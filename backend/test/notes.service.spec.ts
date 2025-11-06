import { expect } from 'chai'
import sinon from 'sinon'
import { Pool } from 'pg'
import { notesService } from '../src/services/notes.service'

type FakeQueryCall = { text: string, values?: any[] }

describe('notesService', () => {
  let connectStub: sinon.SinonStub
  let fakeClient: any
  let queries: FakeQueryCall[]

  beforeEach(() => {
    queries = []
    fakeClient = {
      query: async (text: string, values?: any[]) => {
        queries.push({ text, values })
        // Return a basic successful shape by default
        if (/SELECT id, title, content, tags, created_at, updated_at FROM notes/.test(text)) {
          return { rows: [] }
        }
        if (/SELECT id, title, content, created_at, updated_at FROM notes WHERE id =/.test(text)) {
          return { rows: [{ id: 'n1', title: 'Untitled', content: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] }
        }
        if (/SELECT user_id FROM notes WHERE id =/.test(text)) {
          return { rows: [{ user_id: 'u1' }] }
        }
        return { rows: [] }
      },
      release: () => {}
    }
    connectStub = sinon.stub(Pool.prototype, 'connect').resolves(fakeClient)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('listUserNotes: builds basic query and returns rows', async () => {
    const rows = await notesService.listUserNotes('u1')
    expect(rows).to.be.an('array')
    expect(queries[0].text).to.include('WHERE user_id = $1')
    expect(queries[0].values).to.deep.equal(['u1'])
    expect(queries[0].text).to.match(/ORDER BY .*updated_at/i)
    expect(connectStub.called).to.equal(true)
  })

  it('listUserNotes: applies search filter on title', async () => {
    await notesService.listUserNotes('u1', { search: 'note' })
    const q = queries[0]
    expect(q.text.toLowerCase()).to.include('lower(title) like')
    expect(q.values && q.values[1]).to.equal('%note%')
  })

  it('createNote: inserts and returns the created row', async () => {
    // Mock the follow-up SELECT to return the created row
    fakeClient.query = async (text: string, values?: any[]) => {
      queries.push({ text, values })
      if (/INSERT INTO notes/.test(text)) return { rows: [] }
      if (/SELECT id, title, content,(\s*tags,)?\s*created_at, updated_at FROM notes WHERE id =/i.test(text)) {
        return { rows: [{ id: values?.[0] || 'n1', title: 'Untitled', content: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] }
      }
      return { rows: [] }
    }

    const row = await notesService.createNote('u1', { title: 'Untitled', content: '' })
    expect(row).to.have.property('id')
    const insert = queries.find(q => /INSERT INTO notes/i.test(q.text))
    expect(insert, 'INSERT query captured').to.exist
    // id, title, content, tags?, user_id → at least 4 values
    expect((insert as any).values.length).to.be.greaterThanOrEqual(4)
  })
})


