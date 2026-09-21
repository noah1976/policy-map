import type { AnswerValue, ValueKey } from './model'

export type ValueAnswers = Partial<Record<ValueKey, AnswerValue>>

export type ResultLabel = {
  id: string
  title: string
  description: string
  group: 'economy' | 'work' | 'freedom' | 'culture' | 'security' | 'world'
  strength: 1 | 2
}

function numeric(value: AnswerValue | undefined) {
  return typeof value === 'number' ? value : 0
}

function labelForScore(score: number, strong: string, gentle: string, description: string, group: ResultLabel['group'], id: string): ResultLabel | null {
  if (score >= 5) return { id, title: strong, description, group, strength: 2 }
  if (score >= 4) return { id, title: gentle, description, group, strength: 1 }
  return null
}

export function getResultLabels(values: ValueAnswers): ResultLabel[] {
  const labels: ResultLabel[] = []
  const add = (label: ResultLabel | null) => { if (label) labels.push(label) }

  add(labelForScore(numeric(values.redistribution), '経済左派', '再分配重視', '再分配を重視しています。', 'economy', 'redistribution'))
  add(labelForScore(numeric(values.market), '市場派', '市場重視', '市場や民間の活力も重視しています。', 'economy', 'market'))
  add(labelForScore(numeric(values.jobSecurity), '雇用保護派', '雇用保護重視', '働く人の雇用を守ることを重視しています。', 'work', 'job-security'))
  add(labelForScore(numeric(values.mobility), '労働移動派', '労働移動重視', '転職や再就職のしやすさを重視しています。', 'work', 'mobility'))
  add(labelForScore(numeric(values.civilLiberty), '自由主義寄り', '個人の自由重視', '表現や個人の選択への規制には慎重です。', 'freedom', 'liberty'))
  add(labelForScore(numeric(values.publicOrder), '秩序重視', '安全・秩序重視', '安全や社会の秩序を守ることを重視しています。', 'freedom', 'order'))
  add(labelForScore(numeric(values.pluralism), '社会リベラル', '多様性重視', '多様な生き方に合わせて制度を変えることを重視しています。', 'culture', 'pluralism'))
  add(labelForScore(numeric(values.tradition), '文化保守', '伝統重視', '伝統や制度の継続性を重視しています。', 'culture', 'tradition'))

  const deterrence = numeric(values.deterrence)
  const diplomacy = numeric(values.diplomacy)
  if (deterrence >= 4 && diplomacy >= 4) {
    labels.push({ id: 'security-both', title: '安保両翼', description: '防衛・抑止と外交・協調の両方を強く重視しています。', group: 'security', strength: deterrence === 5 && diplomacy === 5 ? 2 : 1 })
  } else {
    add(labelForScore(deterrence, '安保右派', '防衛重視', '防衛・抑止を重視しています。', 'security', 'deterrence'))
    add(labelForScore(diplomacy, '安保左派', '外交協調派', '外交・対話・国際協調を重視しています。', 'security', 'diplomacy'))
  }
  add(labelForScore(numeric(values.openness), '国際開放派', '国際交流重視', '国際的な交流や開放性を重視しています。', 'world', 'openness'))
  add(labelForScore(numeric(values.sovereignty), '主権重視派', '国内自立重視', '国内の自立性や経済安全保障を重視しています。', 'world', 'sovereignty'))

  return labels
}

export function mainLabels(labels: ResultLabel[], count = 5) {
  return [...labels].sort((a, b) => b.strength - a.strength).slice(0, count)
}
