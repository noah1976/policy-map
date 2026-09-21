import { escapeHtml, labelsForPayload, readToken } from '../_shared'

type Context = { request: Request; params: { token: string }; env: { SHARE_TOKEN_SECRET?: string; ASSETS: Fetcher } }

function replaceMeta(html: string, token: string, origin: string, labels: string[]) {
  const description = labels.length ? `${labels.join('・')}。右か左だけじゃない。` : '右か左だけじゃない。'
  const canonical = `${origin}/r/${token}`
  const image = `${origin}/og/${token}`
  const meta = `<title>どっち寄り？｜${labels.length ? `${labels.join('・')}｜` : ''}あなたの政治観、のぞいてみる？</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="どっち寄り？"><meta property="og:title" content="どっち寄り？｜あなたの政治観、のぞいてみる？"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="どっち寄り？｜あなたの政治観、のぞいてみる？"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${image}">`
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
    .replace('</head>', `${meta}</head>`)
}

export const onRequestGet = async (context: Context) => {
  if (!context.env.SHARE_TOKEN_SECRET) return new Response('Share links are not configured.', { status: 503 })
  const payload = await readToken(context.params.token, context.env.SHARE_TOKEN_SECRET)
  if (!payload) return new Response('This shared result link is invalid or has been changed.', { status: 404 })
  const origin = new URL(context.request.url).origin
  const asset = await context.env.ASSETS.fetch(new Request(new URL('/', context.request.url), { method: 'GET', headers: context.request.headers }))
  const html = replaceMeta(await asset.text(), context.params.token, origin, labelsForPayload(payload).map(escapeHtml))
  const headers = new Headers(asset.headers)
  headers.set('content-type', 'text/html; charset=UTF-8')
  headers.set('cache-control', 'public, max-age=300, s-maxage=3600')
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(html, { status: asset.status, headers })
}
