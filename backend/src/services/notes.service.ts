import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const notesService = {
    async listUserNotes(userId: string) {
        return prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    },
    async createNote(userId: string, data: { title: string; content?: string }) {
        return prisma.note.create({ data: { title: data.title, content: data.content || '', userId } });
    },
    async updateNote(userId: string, id: string, data: { title?: string; content?: string }) {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
        return prisma.note.update({ where: { id }, data });
    },
    async deleteNote(userId: string, id: string) {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
        await prisma.note.delete({ where: { id } });
    }
};


