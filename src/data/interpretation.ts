import type { AnswerValue, ValueKey } from './model'

export type ValueAnswers = Partial<Record<ValueKey, AnswerValue>>
export type ProfileAxis = {
  key: 'economy' | 'society' | 'security'
  name: string
  label: string
  shortLabel: string
  description: string
  confidence: 'provisional' | 'insufficient'
}
type Lens = { group: string; keys: [ValueKey, ValueKey]; names: [string, string]; classifications: [string, string]; note: string }
const lenses: Lens[] = [
  { group: '経済', keys: ['redistribution', 'market'], names: ['再分配', '市場活力'], classifications: ['経済左派と重なる要素', '経済右派と重なる要素'], note: '再分配重視は経済左派、市場重視は経済右派の議論と重なります。ただし、市場を評価する左派も再分配を支持する右派もいるため、これだけで所属や立場は決まりません。' },
  { group: '社会文化', keys: ['pluralism', 'tradition'], names: ['制度の変更', '伝統の継続'], classifications: ['進歩・リベラルと重なる要素', '保守と重なる要素'], note: '制度の変更と伝統の継続は、進歩・保守を考える手がかりです。個別の権利や制度への賛否はまだ聞いていないため、左右の確定判定には使いません。' },
  { group: '市民的自由', keys: ['civilLiberty', 'publicOrder'], names: ['個人の自由', '安全・秩序'], classifications: ['自由への介入を抑えたい傾向', '安全・秩序を重視する傾向'], note: '個人の自由を重視する考えは左右の双方にあります。文化的な進歩・保守とは分けて読みます。' },
  { group: '安全保障', keys: ['deterrence', 'diplomacy'], names: ['防衛・抑止', '外交・協調'], classifications: ['防衛・抑止を重視する傾向', '外交・協調を重視する傾向'], note: '防衛の重視だけで右派、外交の重視だけで左派とは判定できません。防衛の増減、武力行使の条件などは、この基本質問では聞いていません。' },
  { group: '雇用', keys: ['jobSecurity', 'mobility'], names: ['雇用保護', '労働移動'], classifications: ['雇用を守る制度を重視する傾向', '職場を移る機会を重視する傾向'], note: '労働移動の支援には市場の自由化も公的保障も含まれ得ます。雇用保護との二択や、左右の対立として固定しません。' },
  { group: '国際関係', keys: ['openness', 'sovereignty'], names: ['国際交流', '国内自立'], classifications: ['国際的な開放を重視する傾向', '国内の自立を重視する傾向'], note: '国際的な開放・国内自立は、経済の左右と別の観点です。交流を維持しながら重要物資の国内調達を増やす組み合わせも表現できます。' },
]

export function interpret(values: ValueAnswers) {
  return lenses.map(lens => {
    const a = values[lens.keys[0]], b = values[lens.keys[1]]
    const highA = typeof a === 'number' && a >= 4
    const highB = typeof b === 'number' && b >= 4
    const complete = typeof a === 'number' && typeof b === 'number'
    const elements = [highA ? lens.classifications[0] : null, highB ? lens.classifications[1] : null].filter((value): value is string => value !== null)
    const title = highA && highB ? `${lens.names[0]}と${lens.names[1]}の両方を重視`
      : highA ? `${lens.names[0]}を強く重視${complete ? '' : '・もう一方は保留'}`
      : highB ? `${lens.names[1]}を強く重視${complete ? '' : '・もう一方は保留'}`
      : complete ? '強い方向づけは読み取れません' : '条件や判断材料を確認したい分野'
    const detail = highA && highB ? '二つの重視度を相殺して「中道」とは扱いません。両方をどう実現するかが、次に考えるポイントです。'
      : highA || highB ? '強く重視した価値を示しています。もう一方への反対や、特定の政策への賛成を意味しません。'
      : complete ? '強い重視がないことと、政治的な中道であることは別です。今の回答から左右を推定しません。'
      : '条件による・判断できない・未回答を、中間の立場に置き換えずに残しています。'
    return { ...lens, title, detail, elements }
  })
}

function numeric(values: ValueAnswers, keys: ValueKey[]) {
  const answers: number[] = []
  for (const key of keys) {
    const value = values[key]
    if (typeof value === 'number') answers.push(value)
  }
  return answers.length === keys.length ? answers.reduce((sum, value) => sum + value, 0) / answers.length : null
}

function profileAxis(
  key: ProfileAxis['key'],
  name: string,
  a: number | null,
  b: number | null,
  labels: { a: string; b: string; both: string; middle: string },
  descriptions: { a: string; b: string; both: string; middle: string },
): ProfileAxis {
  if (a === null || b === null) return {
    key, name, label: '判定保留', shortLabel: '判定保留',
    description: '「条件による」「判断できない」を含むため、この分野を短い言葉にまとめていません。',
    confidence: 'insufficient',
  }
  const difference = a - b
  const bothHigh = a >= 4 && b >= 4
  if (bothHigh && Math.abs(difference) < 1) return { key, name, label: labels.both, shortLabel: labels.both, description: descriptions.both, confidence: 'provisional' }
  if (difference >= 1) return { key, name, label: labels.a, shortLabel: labels.a, description: descriptions.a, confidence: 'provisional' }
  if (difference <= -1) return { key, name, label: labels.b, shortLabel: labels.b, description: descriptions.b, confidence: 'provisional' }
  return { key, name, label: labels.middle, shortLabel: labels.middle, description: descriptions.middle, confidence: 'provisional' }
}

export function createPoliticalProfile(values: ValueAnswers) {
  const axes = [
    profileAxis(
      'economy', '経済', numeric(values, ['redistribution']), numeric(values, ['market']),
      { a: '左寄り', b: '右寄り', both: '再分配と市場の両立派', middle: 'バランス型' },
      {
        a: '市場活力より再分配を強く重視したため、経済左派と重なる傾向です。',
        b: '再分配より市場活力を強く重視したため、経済右派と重なる傾向です。',
        both: '再分配と市場活力の両方を強く重視しています。左右を相殺せず、両立志向として示します。',
        middle: '再分配と市場活力の重視度が近いため、この二問では一方に寄せません。',
      },
    ),
    profileAxis(
      'society', '社会', numeric(values, ['civilLiberty', 'pluralism']), numeric(values, ['publicOrder', 'tradition']),
      { a: '自由主義寄り', b: '秩序・伝統寄り', both: '自由と秩序の両立派', middle: 'バランス型' },
      {
        a: '安全・秩序や伝統より、個人の自由と制度変更を強く重視したため、社会自由主義と重なる傾向です。',
        b: '個人の自由や制度変更より、安全・秩序と伝統の継続を強く重視した傾向です。',
        both: '個人の自由・制度変更と、安全・秩序・伝統の双方を強く重視しています。',
        middle: '自由・制度変更と、秩序・伝統の重視度が近いため、この四問では一方に寄せません。',
      },
    ),
    profileAxis(
      'security', '安保', numeric(values, ['deterrence']), numeric(values, ['diplomacy']),
      { a: '右寄り', b: '左寄り', both: '防衛・外交の両輪派', middle: 'バランス型' },
      {
        a: '外交・協調より防衛・抑止を強く重視した回答を、安保右寄りという暫定ラベルで示します。',
        b: '防衛・抑止より外交・協調を強く重視した回答を、安保左寄りという暫定ラベルで示します。',
        both: '防衛・抑止と外交・協調の両方を強く重視しています。中道へ相殺せず、両輪派として示します。',
        middle: '防衛・抑止と外交・協調の重視度が近いため、この二問では一方に寄せません。',
      },
    ),
  ]
  const available = axes.filter(axis => axis.confidence !== 'insufficient')
  const headline = available.length === axes.length
    ? available.map(axis => `${axis.name}：${axis.label}`).join(' × ')
    : available.length > 0
      ? available.map(axis => `${axis.name}：${axis.label}`).join(' × ')
      : 'まだ短い言葉にはまとめません'
  const sentence = axes.map(axis => `${axis.name}は${axis.label}`).join('、') + 'です。'
  return { headline, sentence, axes }
}
