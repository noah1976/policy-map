import React from 'react'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'
import { japaneseFont } from '../og-font'

const axes = [
  { title: '経済', sub: '分配と市場', left: 42, right: 72 },
  { title: '社会', sub: '自由と継続', left: 68, right: 44 },
  { title: '安保', sub: '外交と防衛', left: 78, right: 78 },
]

export const onRequestGet = async () => new ImageResponse(
  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f7f4ed', color: '#302f2b', padding: '62px 76px 50px', fontFamily: 'Noto Sans JP' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 22, lineHeight: 1.2, color: '#81796d', letterSpacing: 2 }}>右か左だけじゃない</div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: 70, lineHeight: 1, fontWeight: 700, letterSpacing: -5 }}>どっち寄り？</div>
      </div>
      <div style={{ display: 'flex', width: 190, height: 70, borderRadius: 24, background: '#302f2b', position: 'relative' }}>
        <div style={{ display: 'flex', position: 'absolute', left: 29, top: 31, width: 132, height: 8, borderRadius: 999, background: '#625d55' }} />
        <div style={{ display: 'flex', position: 'absolute', left: 94, top: 20, width: 2, height: 30, background: '#f7f4ed' }} />
        <div style={{ display: 'flex', position: 'absolute', left: 47, top: 31, width: 43, height: 8, borderRadius: 999, background: '#c9a6a1' }} />
        <div style={{ display: 'flex', position: 'absolute', left: 96, top: 31, width: 54, height: 8, borderRadius: 999, background: '#9eabbf' }} />
      </div>
    </div>
    <div style={{ display: 'flex', marginTop: 28, fontSize: 25, lineHeight: 1.4, color: '#625d55' }}>あなたの政治観、のぞいてみる？</div>
    <div style={{ display: 'flex', gap: 17, marginTop: 31, flex: 1 }}>
      {axes.map(axis => <div key={axis.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '23px 24px', border: '1px solid #d9d1c3', borderRadius: 27, background: '#fffdfa' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>{axis.title}</div>
        <div style={{ display: 'flex', marginTop: 4, fontSize: 17, color: '#81796d' }}>{axis.sub}</div>
        <div style={{ display: 'flex', position: 'relative', height: 18, marginTop: 'auto', background: '#e7e1d7', borderRadius: 999 }}>
          <div style={{ display: 'flex', position: 'absolute', right: '50%', top: 0, width: `${axis.left / 2}%`, height: '100%', borderRadius: '999px 0 0 999px', background: '#c9a6a1' }} />
          <div style={{ display: 'flex', position: 'absolute', left: '50%', top: 0, width: `${axis.right / 2}%`, height: '100%', borderRadius: '0 999px 999px 0', background: '#9eabbf' }} />
          <div style={{ display: 'flex', position: 'absolute', left: '50%', top: -6, width: 2, height: 30, background: '#625d55' }} />
        </div>
      </div>)}
    </div>
    <div style={{ display: 'flex', marginTop: 28, paddingTop: 18, borderTop: '1px solid #e1dbd0', fontSize: 19, color: '#81796d' }}>いくつもの価値観を、ひとつずつ見てみよう。</div>
  </div>,
  { width: 1200, height: 630, fonts: [{ name: 'Noto Sans JP', data: await japaneseFont(), weight: 700, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
)
