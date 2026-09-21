import React from 'react'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'
import { labelsForPayload, readToken } from '../_shared'
import { japaneseFont } from '../og-font'

type Context = { params: { token: string }; env: { SHARE_TOKEN_SECRET?: string } }

export const onRequestGet = async ({ params, env }: Context) => {
  if (!env.SHARE_TOKEN_SECRET) return new Response('Not configured', { status: 503 })
  const payload = await readToken(params.token, env.SHARE_TOKEN_SECRET)
  if (!payload) return new Response('Not found', { status: 404 })
  const labels = labelsForPayload(payload)
  return new ImageResponse(
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f7f4ed', color: '#302f2b', padding: '74px 82px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', fontSize: 27, lineHeight: 1.2, color: '#81796d', letterSpacing: 2 }}>右か左だけじゃない</div>
      <div style={{ display: 'flex', marginTop: 18, fontSize: 70, lineHeight: 1.1, fontWeight: 800, letterSpacing: -5 }}>どっち寄り？</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 75, gap: 12 }}>
        {(labels.length ? labels : ['あなたの政治観、のぞいてみる？']).map(label => <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: 46, lineHeight: 1.2, fontWeight: 700, letterSpacing: -2 }}><span style={{ display: 'flex', width: 25, height: 25, marginRight: 18, border: '5px solid #81796d', borderRadius: 999 }} />{label}</div>)}
      </div>
      <div style={{ display: 'flex', marginTop: 'auto', fontSize: 28, lineHeight: 1.2, color: '#625d55' }}>あなたの政治観、のぞいてみる？</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Noto Sans JP', data: await japaneseFont(), weight: 700, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
  )
}
