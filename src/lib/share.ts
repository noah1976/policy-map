import { questions } from '../data/questions'
import type { AnswerValue, SelfLabel, TradeoffAnswer } from '../data/model'

export type SharePayload = { v: 1; a: string; c: string; s: SelfLabel }
export type SharedState = { answers: Record<string, AnswerValue>; contextAnswers: Record<string, TradeoffAnswer>; selfLabel: SelfLabel }

const selfLabels: SelfLabel[] = ['left', 'center', 'right', 'unknown']
const contextCodes: Record<TradeoffAnswer, string> = { a: 'a', 'lean-a': 'A', balanced: 'm', 'lean-b': 'B', b: 'b', conditional: 'c', unknown: 'u' }
const codeContexts: Record<string, TradeoffAnswer> = Object.fromEntries(Object.entries(contextCodes).map(([key, value]) => [value, key])) as Record<string, TradeoffAnswer>

function base64url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  return atob(padded)
}

export function createSharePayload(answers: Record<string, AnswerValue>, contextAnswers: Record<string, TradeoffAnswer>, selfLabel: SelfLabel): SharePayload {
  const a = questions.map(question => {
    const value = answers[question.id]
    return typeof value === 'number' ? String(value) : value === 'conditional' ? 'c' : 'u'
  }).join('')
  const c = Object.values(contextAnswers).map(value => contextCodes[value]).join('')
  return { v: 1, a, c, s: selfLabel }
}

export function decodePayload(encoded: string): SharePayload | null {
  try {
    const payload = JSON.parse(fromBase64url(encoded)) as SharePayload
    if (payload.v !== 1 || !/^[1-5cu]{12}$/.test(payload.a) || !/^[aAbBcmu]*$/.test(payload.c) || !selfLabels.includes(payload.s)) return null
    return payload
  } catch { return null }
}

export function stateFromPayload(payload: SharePayload): SharedState {
  const answers: Record<string, AnswerValue> = {}
  payload.a.split('').forEach((value, index) => { answers[questions[index].id] = /^[1-5]$/.test(value) ? Number(value) as AnswerValue : value === 'c' ? 'conditional' : null })
  const contextAnswers: Record<string, TradeoffAnswer> = {}
  payload.c.split('').forEach((value, index) => { if (codeContexts[value]) contextAnswers[`t0${index + 1}`] = codeContexts[value] })
  return { answers, contextAnswers, selfLabel: payload.s }
}

export function tokenPayload(token: string) {
  return decodePayload(token.split('.')[0])
}

export function tokenFromPath(pathname: string) {
  const match = pathname.match(/^\/r\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)
  return match?.[1] ?? null
}

export async function createShareToken(payload: SharePayload) {
  const response = await fetch('/api/share', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error('share link unavailable')
  const body = await response.json() as { token?: string }
  if (!body.token) throw new Error('share token missing')
  return body.token
}

export function encodePayloadForTest(payload: SharePayload) { return base64url(JSON.stringify(payload)) }
