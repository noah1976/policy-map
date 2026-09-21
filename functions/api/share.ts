import { makeToken, validPayload } from '../_shared'

type Context = { request: Request; env: { SHARE_TOKEN_SECRET?: string } }

export const onRequestPost = async ({ request, env }: Context) => {
  if (!env.SHARE_TOKEN_SECRET) return Response.json({ error: 'Share links are not configured.' }, { status: 503 })
  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  const length = Number(request.headers.get('Content-Length') ?? '0')
  if (length > 2048) return Response.json({ error: 'Payload too large.' }, { status: 413 })
  try {
    const payload = await request.json()
    if (!validPayload(payload)) return Response.json({ error: 'Invalid payload.' }, { status: 400 })
    const token = await makeToken(payload, env.SHARE_TOKEN_SECRET)
    return Response.json({ token }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }) }
}
