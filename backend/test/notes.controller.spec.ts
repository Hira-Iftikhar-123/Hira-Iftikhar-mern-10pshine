import { expect } from 'chai'
import sinon from 'sinon'
import * as notesController from '../src/controllers/notes.controller'
import { notesService } from '../src/services/notes.service'

function createRes() {
  const res: any = {}
  res.statusCode = 200
  res.status = (code: number) => { res.statusCode = code; return res }
  res.jsonPayload = undefined
  res.json = (payload: any) => { res.jsonPayload = payload; return res }
  res.send = () => res
  return res
}

describe('notes.controller getNotes', () => {
  afterEach(() => sinon.restore())

  it('returns notes list with filters', async () => {
    const fakeNotes = [
      { id: '1', title: 'Test', content: '', created_at: '', updated_at: '' }
    ]

    const stub = sinon.stub(notesService, 'listUserNotes').resolves(fakeNotes as any)

    const req: any = { userId: 'user-1', query: { search: 'te', sortBy: 'updated_at', sortOrder: 'desc' }, ip: '::1', get: ()=>'test-agent' }
    const res: any = createRes()

    await notesController.getNotes(req, res)

    expect(stub.calledOnceWith('user-1', sinon.match.object)).to.equal(true)
    expect(res.jsonPayload).to.deep.equal(fakeNotes)
  })
})

describe('notes.controller createNote validation', () => {
  afterEach(() => sinon.restore())
  it('400 on invalid input', async () => {
    const req: any = { userId: 'u1', body: { title: '' }, ip: '::1', get: ()=>'agent' }
    const res: any = { status: sinon.stub().returnsThis(), json: sinon.stub() }
    let threw = false
    try {
      await notesController.createNote(req, res)
    } catch (e) { threw = true }
    expect(res.status.calledWith(400)).to.equal(true)
  })
})


