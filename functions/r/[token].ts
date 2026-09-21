import { escapeHtml, labelsForPayload, readToken } from '../_shared'

type Context = { request: Request; params: { token: string }; env: { SHARE_TOKEN_SECRET?: string; ASSETS: Fetcher } }

function isCrawler(request: Request) {
  return /(Twitterbot|facebookexternalhit|Facebot|Slackbot|LinkedInBot|Discordbot|Googlebot)/i.test(request.headers.get('user-agent') ?? '')
}

export const onRequestGet = async (context: Context) => {
  if (!context.env.SHARE_TOKEN_SECRET) return new Response('Share links are not configured.', { status: 503 })
  const payload = await readToken(context.params.token, context.env.SHARE_TOKEN_SECRET)
  if (!payload) return new Response('This shared result link is invalid or has been changed.', { status: 404 })
  const origin = new URL(context.request.url).origin
  const canonical = `${origin}/r/${context.params.token}`
  if (isCrawler(context.request)) {
    const labels = labelsForPayload(payload).map(escapeHtml)
    const description = labels.length ? `${labels.join('・')}。右か左だけじゃない。` : '右か左だけじゃない。'
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="${canonical}"><title>どっち寄り？｜あなたの政治観、のぞいてみる？</title><meta name="description" content="${description}"><meta property="og:type" content="website"><meta property="og:site_name" content="どっち寄り？"><meta property="og:title" content="どっち寄り？｜あなたの政治観、のぞいてみる？"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/og/${context.params.token}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="どっち寄り？"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${origin}/og/${context.params.token}.png"></head><body><main><h1>どっち寄り？</h1><p>${description}</p></main></body></html>`
    return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'public, max-age=3600, s-maxage=86400' } })
  }
  const root = new URL('/', context.request.url)
  const asset = await context.env.ASSETS.fetch(new Request(root, { method: 'GET', headers: context.request.headers }))
  const headers = new Headers(asset.headers)
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers })
}
