import { createPoliticalProfile, interpret } from './data/interpretation'
import { questions } from './data/questions'
import { values } from './data/values'
import type { AnswerValue, SelfLabel } from './data/model'
import type { ValueAnswers } from './data/interpretation'

export function ResultReading({ answers, selfLabel, onReview }: { answers: Record<string, AnswerValue>; selfLabel: SelfLabel | null; onReview: (index: number) => void }) {
  const valueAnswers: ValueAnswers = {}
  for (const q of questions) if (Object.hasOwn(answers, q.id)) valueAnswers[q.value] = answers[q.id]
  const readings = interpret(valueAnswers)
  const profile = createPoliticalProfile(valueAnswers)
  const comparison = selfLabel === 'right' && typeof valueAnswers.redistribution === 'number' && valueAnswers.redistribution >= 4
    ? '自己認識は「右寄り」ですが、再分配の回答には経済左派と重なる要素があります。右という自己認識と、この要素は共存できます。'
    : selfLabel === 'left' && typeof valueAnswers.market === 'number' && valueAnswers.market >= 4
    ? '自己認識は「左寄り」ですが、市場活力の回答には経済右派と重なる要素があります。左という自己認識と、この要素は共存できます。'
    : selfLabel === 'center' ? '「中道」という自己認識が、すべての分野で中間を選ぶことを意味するとは限りません。分野ごとの組み合わせと照らしてみてください。'
    : selfLabel === 'unknown' ? '今は左右の名前を決めなくてもかまいません。まず、分野ごとの説明のどこに自分らしさを感じるかを見てみてください。'
    : '自己認識と、分野ごとの回答を並べています。今回の回答だけから、自己認識が正しいか間違っているかは判定しません。'
  return <section className="reading">
    <div className="profile-hero">
      <p className="eyebrow">3分野の政策プロフィール</p>
      <h2>{profile.headline}</h2>
      <p className="profile-sentence">{profile.sentence}</p>
      <div className="profile-axis-grid">{profile.axes.map(axis => <article key={axis.key}>
        <span>{axis.name}</span><strong>{axis.label}</strong><p>{axis.description}</p>
      </article>)}</div>
      <p className="profile-caveat">これは回答を振り返るための暫定ラベルです。政党支持や人格を判定するものではなく、現在は各価値1問のため精密な尺度ではありません。</p>
    </div>
    <h2>分野ごとに見る、あなたの政治観</h2>
    <p className="helper">回答から読み取れる要素と、政治的な分類との関係を説明します。あなた自身を「右派・左派」と確定するものではありません。</p>
    <div className="reflection"><h3>自己認識と照らすと</h3><p>{comparison}</p></div>
    <div className="reading-grid">{readings.map(reading => <article className="reading-card" key={reading.group}>
      <p className="eyebrow">{reading.group}</p><h3>{reading.title}</h3>
      {reading.elements.map(element => <span className="element-tag" key={element}>{element}</span>)}
      <p>{reading.detail}</p>
      <details><summary>分類との関係・回答の根拠</summary>
        <p>{reading.note}</p>
        {reading.keys.map(key => {
          const index = questions.findIndex(q => q.value === key)
          const answer = valueAnswers[key]
          const label = answer === undefined ? '未回答' : answer === null ? '判断できない' : answer === 'conditional' ? '条件による' : ['重視しない', 'あまり重視しない', 'ある程度重視する', 'かなり重視する', '非常に重視する'][answer - 1]
          return <div className="evidence" key={key}><p>{values.find(value => value.key === key)?.label}：<b>{label}</b></p><button className="text-button" onClick={() => onReview(index)}>この回答を見直す</button></div>
        })}
      </details>
    </article>)}</div>
    <details className="method"><summary>説明のルールと参考資料</summary>
      <p>「かなり」「非常に」を強い重視として説明する、この試作版独自の暫定ルールです。二つの価値が高ければ両方を残し、低い回答から反対の思想を推定しません。</p>
      <p>分野と一般的な左右自己認識を分ける考え方は、<a href="https://www.nira.or.jp/paper/research-report/2026/082606.html" target="_blank" rel="noreferrer">NIRAの2026年調査（1.9 政策位置）</a>を参考にしています。このサイトの設問や判定基準が同調査で検証されたという意味ではありません。</p>
    </details>
  </section>
}
