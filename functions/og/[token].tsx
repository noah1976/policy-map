import React from 'react'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'
import { labelsForPayload, readToken } from '../_shared'

type Context = { params: { token: string }; env: { SHARE_TOKEN_SECRET?: string } }

export const onRequestGet = async ({ params, env }: Context) => {
  if (!env.SHARE_TOKEN_SECRET) return new Response('Not configured', { status: 503 })
  const payload = await readToken(params.token, env.SHARE_TOKEN_SECRET)
  if (!payload) return new Response('Not found', { status: 404 })
  const labels = labelsForPayload(payload)
  return new ImageResponse(
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f7f4ed', color: '#302f2b', padding: '74px 82px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', fontSize: 27, color: '#81796d', letterSpacing: 2 }}>右か左だけじゃない</div>
      <div style={{ display: 'flex', marginTop: 18, fontSize: 74, fontWeight: 800, letterSpacing: -5 }}>どっち寄り？</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40, gap: 5 }}>
        {(labels.length ? labels : ['あなたの政治観、のぞいてみる？']).map(label => <div key={label} style={{ display: 'flex', fontSize: 46, fontWeight: 700, letterSpacing: -2 }}>○　{label}</div>)}
      </div>
      <div style={{ display: 'flex', marginTop: 'auto', fontSize: 28, color: '#625d55' }}>あなたの政治観、のぞいてみる？</div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
  )
}
