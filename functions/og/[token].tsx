import React from 'react'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'
import { labelsForPayload, readToken, type SharePayload } from '../_shared'
import { japaneseFont } from '../og-font'
import { getAxisScores } from '../../src/data/axis-scores'
import type { AnswerValue, ValueKey } from '../../src/data/model'

type Context = { params: { token: string }; env: { SHARE_TOKEN_SECRET?: string } }

const valueKeys: ValueKey[] = [
  'redistribution', 'market', 'jobSecurity', 'mobility', 'civilLiberty', 'publicOrder',
  'deterrence', 'diplomacy', 'pluralism', 'tradition', 'openness', 'sovereignty',
]

function answersForPayload(payload: SharePayload): Partial<Record<ValueKey, AnswerValue>> {
  return Object.fromEntries(valueKeys.map((key, index) => {
    const value = payload.a[index]
    return [key, value === 'c' || value === 'u' ? null : Number(value) as AnswerValue]
  })) as Partial<Record<ValueKey, AnswerValue>>
}

const axisColors = { left: '#c9a6a1', right: '#9eabbf', track: '#e7e1d7' }

function AxisRows({ payload }: { payload: SharePayload }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
    {getAxisScores(answersForPayload(payload)).map(axis => <div key={axis.id} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ display: 'flex', width: 58, fontSize: 17, color: '#625d55' }}>{axis.title}</div>
      <div style={{ display: 'flex', flex: 1, height: 11, position: 'relative', background: axisColors.track, borderRadius: 999 }}>
        {axis.left !== null && <div style={{ display: 'flex', position: 'absolute', right: '50%', top: 0, width: `${axis.left / 2}%`, height: '100%', background: axisColors.left, borderRadius: '999px 0 0 999px' }} />}
        {axis.right !== null && <div style={{ display: 'flex', position: 'absolute', left: '50%', top: 0, width: `${axis.right / 2}%`, height: '100%', background: axisColors.right, borderRadius: '0 999px 999px 0' }} />}
        <div style={{ display: 'flex', position: 'absolute', left: '50%', top: -4, width: 2, height: 19, background: '#625d55', transform: 'translateX(-1px)' }} />
      </div>
      <div style={{ display: 'flex', width: 135, justifyContent: 'flex-end', fontSize: 14, color: '#81796d' }}>
        {axis.left === null && axis.right === null ? '算出保留' : `左 ${axis.left ?? '—'}% / 右 ${axis.right ?? '—'}%`}
      </div>
    </div>)}
  </div>
}

export const onRequestGet = async ({ params, env }: Context) => {
  if (!env.SHARE_TOKEN_SECRET) return new Response('Not configured', { status: 503 })
  const payload = await readToken(params.token, env.SHARE_TOKEN_SECRET)
  if (!payload) return new Response('Not found', { status: 404 })
  const labels = labelsForPayload(payload)
  return new ImageResponse(
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f7f4ed', color: '#302f2b', padding: '58px 72px 48px', fontFamily: 'Noto Sans JP' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, lineHeight: 1.2, color: '#81796d', letterSpacing: 2 }}>右か左だけじゃない</div>
          <div style={{ display: 'flex', marginTop: 9, fontSize: 64, lineHeight: 1, fontWeight: 700, letterSpacing: -4 }}>どっち寄り？</div>
        </div>
        <div style={{ display: 'flex', width: 184, height: 64, marginTop: 3, border: '1px solid #d9d1c3', borderRadius: 22, background: '#fffdfa', position: 'relative' }}>
          <div style={{ display: 'flex', position: 'absolute', left: 24, top: 21, width: 136, height: 9, borderRadius: 999, background: '#e7e1d7' }} />
          <div style={{ display: 'flex', position: 'absolute', left: 82, top: 14, width: 2, height: 23, background: '#625d55' }} />
          <div style={{ display: 'flex', position: 'absolute', left: 44, top: 21, width: 30, height: 9, borderRadius: 999, background: axisColors.left }} />
          <div style={{ display: 'flex', position: 'absolute', left: 84, top: 21, width: 51, height: 9, borderRadius: 999, background: axisColors.right }} />
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 30, fontSize: 20, color: '#81796d' }}>あなたはこんな感じ</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 1030, marginTop: 12 }}>
        {(labels.length ? labels : ['まだ傾向を見つけている途中']).map(label => <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '11px 21px', border: '1px solid #d9d1c3', borderRadius: 999, background: '#fffdfa', fontSize: 27, lineHeight: 1.1, fontWeight: 700 }}>{label}</div>)}
      </div>
      <AxisRows payload={payload} />
      <div style={{ display: 'flex', marginTop: 'auto', paddingTop: 18, justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e1dbd0', fontSize: 20, color: '#625d55' }}>
        <div style={{ display: 'flex' }}>あなたの政治観、のぞいてみる？</div>
        <div style={{ display: 'flex', color: '#81796d', fontSize: 16 }}>右か左だけじゃない。</div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Noto Sans JP', data: await japaneseFont(), weight: 700, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
  )
}
