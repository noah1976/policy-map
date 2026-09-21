export type SharePayload = { v: 1; a: string; c: string; s: 'left' | 'center' | 'right' | 'unknown' }

const encoder = new TextEncoder()

function fromBase64url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  return atob(padded)
}

function toBase64url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function validPayload(value: unknown): value is SharePayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<SharePayload>
  return payload.v === 1 && typeof payload.a === 'string' && /^[1-5cu]{12}$/.test(payload.a)
    && typeof payload.c === 'string' && /^[aAbBcmu]*$/.test(payload.c)
    && (payload.s === 'left' || payload.s === 'center' || payload.s === 'right' || payload.s === 'unknown')
}

export function decodePayload(encoded: string): SharePayload | null {
  try {
    const payload = JSON.parse(fromBase64url(encoded))
    return validPayload(payload) ? payload : null
  } catch { return null }
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return toBase64url(String.fromCharCode(...new Uint8Array(signed)))
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return result === 0
}

export async function makeToken(payload: SharePayload, secret: string) {
  const body = toBase64url(JSON.stringify(payload))
  return `${body}.${await signature(body, secret)}`
}

export async function readToken(token: string, secret: string) {
  const [body, signed, ...rest] = token.split('.')
  if (!body || !signed || rest.length > 0 || token.length > 500 || !same(signed, await signature(body, secret))) return null
  return decodePayload(body)
}

function score(answer: string) { return /^[1-5]$/.test(answer) ? Number(answer) : 0 }

export function labelsForPayload(payload: SharePayload) {
  const scores = payload.a.split('').map(score)
  const labels: { title: string; strength: number }[] = []
  const add = (position: number, strong: string, gentle: string) => {
    if (scores[position] >= 5) labels.push({ title: strong, strength: 2 })
    else if (scores[position] >= 4) labels.push({ title: gentle, strength: 1 })
  }
  add(0, '経済左派', '再分配重視')
  add(1, '市場派', '市場重視')
  add(2, '雇用保護派', '雇用保護重視')
  add(3, '労働移動派', '労働移動重視')
  add(4, '自由主義寄り', '個人の自由重視')
  add(5, '秩序重視', '安全・秩序重視')
  add(6, '防衛重視', '防衛重視')
  add(7, '外交協調派', '外交協調派')
  add(8, '社会リベラル', '多様性重視')
  add(9, '文化保守', '伝統重視')
  add(10, '国際開放派', '国際交流重視')
  add(11, '主権重視派', '国内自立重視')
  if (scores[6] >= 4 && scores[7] >= 4) {
    const first = labels.findIndex(label => label.title === '防衛重視')
    if (first >= 0) labels.splice(first, 1)
    const second = labels.findIndex(label => label.title === '外交協調派')
    if (second >= 0) labels.splice(second, 1)
    labels.splice(6, 0, { title: '安保両翼', strength: scores[6] === 5 && scores[7] === 5 ? 2 : 1 })
  } else {
    if (scores[6] >= 5) labels[labels.findIndex(label => label.title === '防衛重視')] = { title: '安保右派', strength: 2 }
    if (scores[7] >= 5) labels[labels.findIndex(label => label.title === '外交協調派')] = { title: '安保左派', strength: 2 }
  }
  return labels.sort((a, b) => b.strength - a.strength).slice(0, 5).map(label => label.title)
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
