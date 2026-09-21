import React from 'react'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'

export const onRequestGet = () => new ImageResponse(
  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f7f4ed', color: '#302f2b', padding: '74px 82px', fontFamily: 'sans-serif' }}>
    <div style={{ display: 'flex', fontSize: 27, color: '#81796d', letterSpacing: 2 }}>右か左だけじゃない</div>
    <div style={{ display: 'flex', marginTop: 18, fontSize: 74, fontWeight: 800, letterSpacing: -5 }}>どっち寄り？</div>
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 45, gap: 7 }}>
      {['経済', '働き方', '自由', '安保'].map(label => <div key={label} style={{ display: 'flex', fontSize: 47, fontWeight: 700, letterSpacing: -2 }}>○　{label}</div>)}
    </div>
    <div style={{ display: 'flex', marginTop: 'auto', fontSize: 28, color: '#625d55' }}>あなたの政治観、のぞいてみる？</div>
  </div>,
  { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
)
