import { useEffect, useRef, useState } from 'react'
import { questions } from './data/questions'
import { tradeoffs, tradeoffChoices } from './data/tradeoffs'
import type { AnswerValue, SelfLabel, TradeoffAnswer } from './data/model'
import { ResultReading } from './ResultReading'
import { createSharePayload, createShareToken, stateFromPayload, tokenFromPath, tokenPayload } from './lib/share'

const answerChoices: { value: AnswerValue; label: string }[] = [
  { value: 1, label: 'あまり重視しない' }, { value: 2, label: '少し重視する' },
  { value: 3, label: 'ある程度重視する' }, { value: 4, label: 'かなり重視する' },
  { value: 5, label: 'とても重視する' }, { value: 'conditional', label: '条件による' }, { value: null, label: '判断できない' },
]
const selfLabels: { value: SelfLabel; label: string }[] = [
  { value: 'left', label: '左寄り' }, { value: 'center', label: '中道' }, { value: 'right', label: '右寄り' }, { value: 'unknown', label: 'わからない' },
]

export default function App() {
  const [selfLabel, setSelfLabel] = useState<SelfLabel | null>(null)
  const [phase, setPhase] = useState<'home' | 'values' | 'tradeoffs' | 'result'>('home')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [contextAnswers, setContextAnswers] = useState<Record<string, TradeoffAnswer>>({})
  const [reviewing, setReviewing] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [sharedToken, setSharedToken] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const token = tokenFromPath(location.pathname)
    const payload = token ? tokenPayload(token) : null
    if (!payload) return
    const state = stateFromPayload(payload)
    setSelfLabel(state.selfLabel); setAnswers(state.answers); setContextAnswers(state.contextAnswers); setSharedToken(token); setPhase('result')
  }, [])
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [phase, current])

  function restart() {
    history.replaceState(null, '', '/')
    setSelfLabel(null); setPhase('home'); setCurrent(0); setAnswers({}); setContextAnswers({}); setReviewing(false); setShareStatus(''); setSharedToken(null)
  }
  function begin() { if (selfLabel) setPhase('values') }
  function startTradeoffs() { setCurrent(0); setReviewing(false); setPhase('tradeoffs') }
  async function shareUrl() {
    if (!selfLabel) throw new Error('self label missing')
    if (sharedToken) return `${location.origin}/r/${sharedToken}`
    const token = await createShareToken(createSharePayload(answers, contextAnswers, selfLabel))
    setSharedToken(token)
    return `${location.origin}/r/${token}`
  }
  async function copyLink() {
    try { const url = await shareUrl(); await navigator.clipboard.writeText(url); setShareStatus('リンクをコピーしたよ。') }
    catch { setShareStatus('共有リンクを作れませんでした。公開環境の設定を確認してね。') }
  }
  async function shareX() {
    try {
      const url = await shareUrl()
      const text = '「どっち寄り？」で政治観をのぞいてみた。右か左だけじゃない。 #どっち寄り'
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    } catch { setShareStatus('共有リンクを作れませんでした。公開環境の設定を確認してね。') }
  }
  async function shareThreads() {
    try {
      const url = await shareUrl()
      const text = '「どっち寄り？」で政治観をのぞいてみた。右か左だけじゃない。 #どっち寄り'
      window.open(`https://www.threads.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    } catch { setShareStatus('共有リンクを作れませんでした。公開環境の設定を確認してね。') }
  }

  if (phase === 'home') return <main className="app-shell home-shell">
    <header className="site-header"><a href="/" onClick={event => { event.preventDefault(); restart() }}>どっち寄り？</a><span>右か左だけじゃない</span></header>
    <section className="home-hero" aria-labelledby="home-title">
      <p className="overline">POLITICAL PROFILE, JUST FOR YOU</p>
      <h1 id="home-title">どっち寄り？<br /><span>あなたの政治観、のぞいてみる？</span></h1>
      <p className="home-lead">経済、働き方、自由、安保。<br />ひとつの「右・左」じゃなく、あなたの中にあるいろんな考えを見てみよう。</p>
      <div className="abstract-orbit" aria-hidden="true"><i /><i /><i /></div>
    </section>
    <section className="start-card" aria-labelledby="self-title">
      <div><p className="overline">STEP 1</p><h2 id="self-title">いまの自分は、どっち寄りだと思う？</h2><p>あとで結果と見比べるためのメモ。スコアには使いません。</p></div>
      <div className="self-grid">{selfLabels.map(item => <button key={item.value} aria-pressed={selfLabel === item.value} className={selfLabel === item.value ? 'choice selected' : 'choice'} onClick={() => setSelfLabel(item.value)}>{item.label}</button>)}</div>
      <button className="button button-primary start-button" disabled={!selfLabel} onClick={begin}>12問、はじめる</button>
    </section>
    <InfoSection />
  </main>

  if (phase === 'result') return <main className="app-shell result-shell">
    <header className="site-header"><a href="/" onClick={event => { event.preventDefault(); restart() }}>どっち寄り？</a><button onClick={restart}>最初から</button></header>
    <ResultReading answers={answers} selfLabel={selfLabel} onReview={index => { setCurrent(index); setReviewing(true); setPhase('values') }} onCopy={copyLink} onShareX={shareX} onShareThreads={shareThreads} shareStatus={shareStatus} />
    {tradeoffs.some(question => contextAnswers[question.id] === undefined) && <section className="optional-card"><p className="overline">OPTIONAL</p><h2>条件があるとき、どう選ぶ？</h2><p>具体的な場面での選択も、少しだけ見てみる？ この回答はスコアを上下させません。</p><button className="button button-secondary" onClick={startTradeoffs}>追加4問に進む</button></section>}
    <InfoSection compact />
  </main>

  const isTradeoff = phase === 'tradeoffs'
  const question = questions[current]
  const tradeoff = tradeoffs[current]
  const total = isTradeoff ? tradeoffs.length : questions.length
  const selected = isTradeoff ? contextAnswers[tradeoff.id] : answers[question.id]
  const progress = Math.round((current / total) * 100)
  function next() { if (reviewing) { setReviewing(false); setPhase('result') } else if (current + 1 < total) setCurrent(current + 1); else setPhase('result') }

  return <main className="app-shell question-shell">
    <header className="site-header"><button onClick={() => phase === 'values' ? setPhase('home') : setPhase('result')}>← 戻る</button><span>{current + 1} / {total}</span></header>
    <section className="question-card" aria-labelledby="question-title">
      <div className="progress-track" aria-label="進捗"><span style={{ width: `${progress}%` }} /></div>
      <p className="overline">{isTradeoff ? 'こんな条件なら、どっちに近い？' : 'これ、どのくらい大事？'}</p>
      <h1 id="question-title" ref={heading} tabIndex={-1}>{isTradeoff ? tradeoff.title : question.prompt}</h1>
      {isTradeoff ? <>
        <p className="scenario">{tradeoff.condition}</p>
        <div className="option-pair"><article><p>A</p><h2>{tradeoff.optionA}</h2></article><article><p>B</p><h2>{tradeoff.optionB}</h2></article></div>
        <div className="answer-grid">{tradeoffChoices.map(choice => <button key={choice.value} aria-pressed={selected === choice.value} className={selected === choice.value ? 'choice selected' : 'choice'} onClick={() => setContextAnswers(previous => ({ ...previous, [tradeoff.id]: choice.value }))}>{choice.label}</button>)}</div>
      </> : <>
        <p className="question-helper">ほかの価値も同時に大事でOK。手段や状況で変わるなら「条件による」を選んでね。</p>
        <div className="answer-grid">{answerChoices.map(choice => <button key={String(choice.value)} aria-pressed={selected === choice.value} className={selected === choice.value ? 'choice selected' : 'choice'} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: choice.value }))}>{choice.label}</button>)}</div>
      </>}
      <div className="question-navigation"><button className="button button-primary" disabled={selected === undefined} onClick={next}>{reviewing ? '結果に反映する' : current + 1 === total ? '結果を見る' : '次へ'}</button>{current > 0 && <button className="button button-quiet" onClick={() => setCurrent(current - 1)}>前の質問</button>}</div>
    </section>
  </main>
}

function InfoSection({ compact = false }: { compact?: boolean }) {
  return <section className={`info-section ${compact ? 'compact' : ''}`} aria-labelledby="about-title">
    <div><p className="overline">ABOUT</p><h2 id="about-title">右か左だけじゃない。</h2><p>「再分配も市場も大事」「防衛も外交も大事」みたいな組み合わせを、そのまま残します。</p></div>
    {!compact && <div className="faq-list">
      <details><summary>右派・左派を判定するサイト？</summary><p>一本の軸で決めるサイトではありません。分野ごとの傾向を、別々に見ます。</p></details>
      <details><summary>回答や結果は保存される？</summary><p>通常の回答はサーバーに保存しません。共有リンクを作るときだけ、結果を復元できる署名付きトークンを作ります。</p></details>
      <details><summary>どうやって結果を出している？</summary><p>設問への回答を公開予定のルールで整理し、価値ごとの重視度と言葉のラベルを表示します。</p></details>
      <details><summary>設問に偏りはない？</summary><p>偏りが入らないと断言はしません。設問とロジックを公開し、継続して検証する方針です。</p></details>
      <details><summary>特定の政党をすすめる？</summary><p>おすすめしません。政党や候補者との一致度も出しません。</p></details>
    </div>}
  </section>
}
