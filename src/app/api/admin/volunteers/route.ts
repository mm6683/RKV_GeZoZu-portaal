import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const volunteers = await prisma.volunteer.findMany({
    orderBy: [{ naam: 'asc' }, { voornaam: 'asc' }],
    include: { qualifications: true, functions: true },
  })

  return NextResponse.json(volunteers.map(({ passwordHash, ...v }) => ({
    ...v, hasPassword: !!passwordHash,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()
  const { voornaam, naam, emailWerk, gsm, hoofdentiteit, rank, isExternal, rkvId } = body

  if (!voornaam?.trim() || !naam?.trim()) {
    return NextResponse.json({ error: 'Voor- en achternaam zijn verplicht.' }, { status: 400 })
  }
  if (!emailWerk?.trim()) {
    return NextResponse.json({ error: 'E-mailadres is verplicht.' }, { status: 400 })
  }

  // Check of email al bestaat
  const existingEmail = await prisma.volunteer.findFirst({
    where: { emailWerk: emailWerk.trim().toLowerCase() },
  })
  if (existingEmail) {
    return NextResponse.json({ error: 'Een account met dit e-mailadres bestaat al.' }, { status: 409 })
  }

  // Genereer uniek rkvId als niet opgegeven
  const finalRkvId = rkvId?.trim() || `LOCAL-${Date.now()}`

  const volunteer = await prisma.volunteer.create({
    data: {
      rkvId:         finalRkvId,
      voornaam:      voornaam.trim(),
      naam:          naam.trim(),
      volledigeNaam: `${naam.trim()} ${voornaam.trim()}`,
      emailWerk:     emailWerk.trim().toLowerCase(),
      gsm:           gsm?.trim() || null,
      hoofdentiteit: hoofdentiteit?.trim() || 'GENK-ZONHOVEN-ZUTENDAAL',
      rank:          rank || 'BASISVRIJWILLIGER',
      isExternal:    isExternal === true,   // expliciet boolean check
      addedById:     session.volunteerId,
    },
  })

  const { passwordHash, ...safe } = volunteer
  return NextResponse.json({ volunteer: { ...safe, hasPassword: false }, existed: false }, { status: 201 })
}
