import { NextResponse } from 'next/server'
import { coverLetterService } from '@/modules/cover-letter/cover-letter.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const letter = await coverLetterService.get(id, userId)
    const response = jsonResponse(letter)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const letter = await coverLetterService.update(id, userId, body)
    const response = jsonResponse(letter)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    await coverLetterService.remove(id, userId)
    const response = new NextResponse(null, { status: 204 })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
