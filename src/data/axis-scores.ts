import type { AnswerValue, ValueKey } from './model'

export type AxisScore = {
  id: 'economy' | 'social' | 'security'
  title: string
  leftLabel: string
  rightLabel: string
  left: number | null
  right: number | null
  note: string
}

type AxisDefinition = Omit<AxisScore, 'left' | 'right'> & { leftKeys: ValueKey[]; rightKeys: ValueKey[] }

const definitions: AxisDefinition[] = [
  { id: 'economy', title: '経済', leftLabel: '再分配・雇用保護', rightLabel: '市場活力・労働移動', leftKeys: ['redistribution', 'jobSecurity'], rightKeys: ['market', 'mobility'], note: '再分配・雇用保護 ／ 市場活力・労働移動' },
  { id: 'social', title: '社会', leftLabel: '多様性・制度変更', rightLabel: '伝統・継続性', leftKeys: ['pluralism'], rightKeys: ['tradition'], note: '多様性・制度変更 ／ 伝統・継続性' },
  { id: 'security', title: '安保', leftLabel: '外交・協調', rightLabel: '防衛・抑止', leftKeys: ['diplomacy'], rightKeys: ['deterrence'], note: '外交・協調 ／ 防衛・抑止' },
]

function score(answer: AnswerValue | undefined) {
  return typeof answer === 'number' ? (answer - 1) * 25 : null
}

function average(keys: ValueKey[], answers: Partial<Record<ValueKey, AnswerValue>>) {
  const scores = keys.map(key => score(answers[key])).filter((value): value is number => value !== null)
  return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null
}

export function getAxisScores(answers: Partial<Record<ValueKey, AnswerValue>>): AxisScore[] {
  return definitions.map(({ leftKeys, rightKeys, ...definition }) => ({
    ...definition,
    left: average(leftKeys, answers),
    right: average(rightKeys, answers),
  }))
}
