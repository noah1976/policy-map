import { useEffect, useRef, useState } from 'react'
import { questions } from './data/questions'
import { values } from './data/values'
import { tradeoffs, tradeoffChoices } from './data/tradeoffs'
import type { AnswerValue, SelfLabel, TradeoffAnswer } from './data/model'
import { ResultReading } from './ResultReading'

const answerChoices: { value: AnswerValue; label: string }[] = [
  { value: 1, label: '重視しない' },
  { value: 2, label: 'あまり重視しない' },
  { value: 3, label: 'ある程度重視する' },
  { value: 4, label: 'かなり重視する' },
  { value: 5, label: '非常に重視する' },
  { value: 'conditional', label: '条件による' },
  { value: null, label: '判断できない' },
]
const selfLabels: { value: SelfLabel; label: string }[] = [
  { value: 'left', label: '左寄り' }, { value: 'center', label: '中道' },
  { value: 'right', label: '右寄り' }, { value: 'unknown', label: 'わからない・考えたことがない' },
]

export default function App() {
  const [selfLabel, setSelfLabel] = useState<SelfLabel | null>(null)
  const [phase, setPhase] = useState<'intro' | 'values' | 'tradeoffs' | 'result'>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [contextAnswers, setContextAnswers] = useState<Record<string, TradeoffAnswer>>({})
  const [copied, setCopied] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0) }, [phase, current])

  function restart() {
    setSelfLabel(null); setPhase('intro'); setCurrent(0)
    setAnswers({}); setContextAnswers({}); setCopied(''); setReviewing(false)
  }
  function startTradeoffs() { setCurrent(0); setPhase('tradeoffs') }
  async function copyUrl() {
    try { await navigator.clipboard.writeText(location.href); setCopied('サイトのURLをコピーしました。回答結果は含まれません。') }
    catch { setCopied('コピーできませんでした。ブラウザーのURLをコピーしてください。') }
  }

  if (phase === 'intro') return (
    <main className="shell"><section className="hero card">
      <p className="eyebrow">12問でわかる政策プロフィール</p>
      <h1 ref={heading} tabIndex={-1}>右派左派チェッカー</h1>
      <p className="lead brand-lead">経済・社会・安保。<br />あなたは、どこで右寄り？ どこで左寄り？</p>
      <p className="helper">まず{questions.length}問で価値観の組み合わせを診断します。その後、希望すれば追加{tradeoffs.length}問で具体的な場面での選択も見られます。</p>
      <div className="notice">いくつもの価値を同時に重視してかまいません。正解や投票先を示す診断ではなく、自分の考えを整理するための試作版です。</div>
      <h2>まず、今の自己認識は？</h2>
      <p className="helper">この回答は採点に使いません。</p>
      <div className="self-grid">{selfLabels.map(item => (
        <button key={item.value} aria-pressed={selfLabel === item.value} className={selfLabel === item.value ? 'choice selected' : 'choice'} onClick={() => setSelfLabel(item.value)}>{item.label}</button>
      ))}</div>
      <button className="primary" disabled={!selfLabel} onClick={() => setPhase('values')}>{questions.length}問をはじめる</button>
    </section></main>
  )

  if (phase === 'result') {
    const grouped = values.reduce<Record<string, typeof values>>((acc, item) => { (acc[item.group] ??= []).push(item); return acc }, {})
    const answeredContexts = tradeoffs.filter(q => contextAnswers[q.id] !== undefined)
    return (
      <main className="shell"><section className="card result-card">
        <p className="eyebrow">右派左派チェッカー</p>
        <h1 ref={heading} tabIndex={-1}>あなたの診断結果</h1>
        <p className="lead">自己認識：<strong>{selfLabels.find(item => item.value === selfLabel)?.label}</strong></p>
        <ResultReading answers={answers} selfLabel={selfLabel} onReview={index => { setCurrent(index); setReviewing(true); setPhase('values') }} />
        <div className="notice">すべて高くても、矛盾や間違いではありません。ここでは価値ごとの重視度を独立して表示しています。具体的な場面での選択は、追加質問で別に振り返れます。</div>
        {answeredContexts.length < tradeoffs.length && <div className="next-section">
          <h2>条件があるとき、どう選ぶ？</h2>
          <p>両案の目的と負担を比べる追加{tradeoffs.length}問です。価値の点数には加算・減算しません。</p>
          <button className="primary" onClick={startTradeoffs}>追加{tradeoffs.length}問に進む</button>
        </div>}
        {Object.entries(grouped).map(([group, items]) => <section className="group" key={group}>
          <h2>{group}</h2>
          {items.map(item => {
            const q = questions.find(q => q.value === item.key)
            const answer = q ? answers[q.id] : undefined
            const score = typeof answer === 'number' ? (answer - 1) * 25 : null
            const label = answer === undefined ? '未回答' : answerChoices.find(choice => choice.value === answer)?.label
            return <div className="metric" key={item.key}>
              <div className="metric-head"><span>{item.label}</span><strong>{score === null ? label : `${score} / 100`}</strong></div>
              {score !== null && <><div className="bar"><span style={{ width: `${score}%` }} /></div><p>{label}</p></>}
              <p>{item.description}</p>
            </div>
          })}
        </section>)}
        {answeredContexts.length > 0 && <section className="group">
          <h2>条件のある場面での選択</h2>
          <p className="helper">この回答は、提示した条件に対する選択です。一般的な左右の立場や価値の強さには換算しません。</p>
          {answeredContexts.map(q => <article className="context-result" key={q.id}>
            <h3>{q.title}</h3>
            <p>{q.condition}</p>
            <p><b>A：</b>{q.optionA}</p><p><b>B：</b>{q.optionB}</p>
            <p className="response">あなたの回答：{tradeoffChoices.find(choice => choice.value === contextAnswers[q.id])?.label}</p>
          </article>)}
          <button className="secondary" onClick={startTradeoffs}>追加質問を見直す</button>
        </section>}
        <details className="method"><summary>この結果の読み方と採点方法</summary>
          <p>各価値は仮設問1問への回答です。重視度の5段階を0・25・50・75・100に置き換えています。精密な測定値や他の人との比較ではありません。</p>
          <p>「条件による」「判断できない」は数値にせず、そのまま表示します。追加質問の「AとBの中間に近い」とも区別します。</p>
          <p>自己認識と追加質問は価値の点数に影響しません。設問の表現・条件は検証中で、中立性が実証された尺度ではありません。</p>
        </details>
        <div className="actions"><button className="secondary" onClick={restart}>最初からやり直す</button><button className="secondary" onClick={copyUrl}>サイトのURLをコピー</button></div>
        <p role="status" className="helper">{copied}</p>
      </section></main>
    )
  }

  const isContext = phase === 'tradeoffs'
  const question = questions[current]
  const context = tradeoffs[current]
  const total = isContext ? tradeoffs.length : questions.length
  const progress = Math.round((current / total) * 100)
  const hasAnswer = isContext ? contextAnswers[context.id] !== undefined : Object.hasOwn(answers, question.id)
  function next() { if (reviewing) { setReviewing(false); setPhase('result') } else if (current + 1 < total) setCurrent(current + 1); else setPhase('result') }
  return (
    <main className="shell"><section className="card question-card">
      <div className="progress-row"><span>{isContext ? '追加質問' : '価値の重視度'} {current + 1} / {total}</span><span>{progress}%</span></div>
      <div className="progress" role="progressbar" aria-label="回答の進捗" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${progress}%` }} /></div>
      <p className="eyebrow">{isContext ? 'この条件なら、どちらに近いですか？' : 'どのくらい重視しますか？'}</p>
      <h1 className="question-title" ref={heading} tabIndex={-1}>{isContext ? context.title : question.prompt}</h1>
      {isContext ? <>
        <p className="scenario">{context.condition}</p>
        <div className="option-pair"><div><h2>A</h2><p>{context.optionA}</p></div><div><h2>B</h2><p>{context.optionB}</p></div></div>
        <p className="helper">両案はこの場面を考えるための選択肢です。中間・条件による・判断できないも選べます。</p>
        <div className="answer-grid" role="group" aria-label="条件のある場面での選択">{tradeoffChoices.map(choice => <button key={choice.value} aria-pressed={contextAnswers[context.id] === choice.value} className={contextAnswers[context.id] === choice.value ? 'choice selected' : 'choice'} onClick={() => setContextAnswers(prev => ({ ...prev, [context.id]: choice.value }))}>{choice.label}</button>)}</div>
      </> : <>
        <p className="helper">ほかの価値も同時に重視してかまいません。実現手段や条件によって変わる場合は「条件による」を選べます。</p>
        <div className="answer-grid" role="group" aria-label="価値の重視度">{answerChoices.map(choice => <button key={String(choice.value)} aria-pressed={hasAnswer && answers[question.id] === choice.value} className={hasAnswer && answers[question.id] === choice.value ? 'choice selected' : 'choice'} onClick={() => setAnswers(prev => ({ ...prev, [question.id]: choice.value }))}>{choice.label}</button>)}</div>
      </>}
      <div className="question-actions">
        <button className="primary" disabled={!hasAnswer} onClick={next}>{reviewing ? '結果に反映する' : current + 1 === total ? '結果を見る' : '次へ'}</button>
        {current > 0 && <button className="back" onClick={() => setCurrent(current - 1)}>← 前の質問へ</button>}
        {isContext && <button className="back" onClick={() => setPhase('result')}>結果に戻る</button>}
      </div>
    </section></main>
  )
}
