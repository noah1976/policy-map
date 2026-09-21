export type SharePayload = { v: 1; a: string; c: string; s: 'left' | 'center' | 'right' | 'unknown' }
import { getResultLabels, mainLabels } from '../src/data/result-labels'

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

export function labelsForPayload(payload: SharePayload) {
  const values = {
    redistribution: payload.a[0] === 'c' || payload.a[0] === 'u' ? null : Number(payload.a[0]),
    market: payload.a[1] === 'c' || payload.a[1] === 'u' ? null : Number(payload.a[1]),
    jobSecurity: payload.a[2] === 'c' || payload.a[2] === 'u' ? null : Number(payload.a[2]),
    mobility: payload.a[3] === 'c' || payload.a[3] === 'u' ? null : Number(payload.a[3]),
    civilLiberty: payload.a[4] === 'c' || payload.a[4] === 'u' ? null : Number(payload.a[4]),
    publicOrder: payload.a[5] === 'c' || payload.a[5] === 'u' ? null : Number(payload.a[5]),
    deterrence: payload.a[6] === 'c' || payload.a[6] === 'u' ? null : Number(payload.a[6]),
    diplomacy: payload.a[7] === 'c' || payload.a[7] === 'u' ? null : Number(payload.a[7]),
    pluralism: payload.a[8] === 'c' || payload.a[8] === 'u' ? null : Number(payload.a[8]),
    tradition: payload.a[9] === 'c' || payload.a[9] === 'u' ? null : Number(payload.a[9]),
    openness: payload.a[10] === 'c' || payload.a[10] === 'u' ? null : Number(payload.a[10]),
    sovereignty: payload.a[11] === 'c' || payload.a[11] === 'u' ? null : Number(payload.a[11]),
  }
  return mainLabels(getResultLabels(values)).map(label => label.title)
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
