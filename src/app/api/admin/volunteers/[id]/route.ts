import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { getHighestQual } from '@/lib/ranks'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const v = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: {
      qualifications: { orderBy: { type: 'asc' } },
      functions: { orderBy: { startdatum: 'desc' } },
      attendances: {
        include: { event: { select: { naam: true, datum: true } } },
        orderBy: { event: { datum: 'desc' } },
        take: 20,
      },
    },
  })

  if (!v) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  // Stuur passwordHash nooit terug
  const { passwordHash, ...safe } = v
  return NextResponse.json({ ...safe, hasPassword: !!passwordHash })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()

  // ── Admin privileges mogen alleen gegeven worden als wachtwoord ingesteld ──
  if (body.isAdmin === true) {
    const target = await prisma.volunteer.findUnique({
      where: { id: params.id },
      select: { passwordHash: true },
    })
    if (!target?.passwordHash) {
      return NextResponse.json(
        { error: 'Admin-rechten kunnen pas gegeven worden nadat de gebruiker een wachtwoord heeft ingesteld.' },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.volunteer.update({
    where: { id: params.id },
    data: {
      voornaam:      body.voornaam,
      naam:          body.naam,
      volledigeNaam: body.volledigeNaam,
      displayName:   body.displayName || null,
      pfpUrl:        body.pfpUrl || null,
      hoofdentiteit: body.hoofdentiteit,
      emailWerk:     body.emailWerk || null,
      gsm:           body.gsm || null,
      ranks:         Array.isArray(body.ranks) && body.ranks.length > 0 ? body.ranks : ['BASISVRIJWILLIGER'],
      isAdmin:       body.isAdmin,
      isExternal:    body.isExternal, // Toegevoegd zodat externe status opslaat
      isBlocked:     body.isBlocked,
      // rankLocked is definitief verwijderd
    },
  })

  // Qualifications aanpassen
  if (body.qualifications) {
    for (const q of body.qualifications) {
      if (q.id && !q._new) {
        await prisma.qualification.update({
          where: { id: q.id },
          data: { naam: q.naam, type: q.type, geldigTot: q.geldigTot || null, manualLock: q.manualLock ?? true },
        })
      } else if (!q.id || q._new) {
        await prisma.qualification.create({
          data: { volunteerId: params.id, type: q.type, naam: q.naam, geldigTot: q.geldigTot || null, manualLock: true },
        })
      }
    }
  }

  if (body.deleteQualifications?.length) {
    await prisma.qualification.deleteMany({
      where: { id: { in: body.deleteQualifications }, volunteerId: params.id },
    })
  }

  const { passwordHash, ...safe } = updated
  return NextResponse.json({ ...safe, hasPassword: !!passwordHash })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  // Verwijder de zelfverwijzende relatie zodat de FK geen fout geeft
  await prisma.volunteer.updateMany({
    where: { addedById: params.id },
    data: { addedById: null },
  })

  await prisma.volunteer.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
