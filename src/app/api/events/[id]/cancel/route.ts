import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  await prisma.event.update({
    where: { id: params.id },
    data: { isCancelled: true, isActief: false },
  })

  return NextResponse.json({ success: true })
}
