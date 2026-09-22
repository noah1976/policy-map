import { useEffect, useRef, useState } from 'react'
import { questions } from './data/questions'
import { tradeoffs, tradeoffChoices } from './data/tradeoffs'
import type { AnswerValue, SelfLabel, TradeoffAnswer } from './data/model'
import { featuredLabelsForAnswers, ResultReading } from './ResultReading'
import { createSharePayload, createShareToken, stateFromPayload, tokenFromPath, tokenPayload } from './lib/share'

type Phase = 'home' | 'values' | 'tradeoffs' | 'result'
type SavedSession = {
  v: 1
  selfLabel: SelfLabel | null
  phase: Phase
  current: number
  answers: Record<string, AnswerValue>
  contextAnswers: Record<string, TradeoffAnswer>
  reviewing: boolean
  sharedToken: string | null
  sharedFingerprint: string | null
}

const sessionKey = 'docchi-yori-session-v1'

function readSession(): SavedSession | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as SavedSession | null
    return saved?.v === 1 ? saved : null
  } catch { return null }
}

function routeFromHash() {
  const match = location.hash.match(/^#\/(values|tradeoffs)\/(\d+)$/)
  if (!match) return null
  const phase = match[1] as 'values' | 'tradeoffs'
  const total = phase === 'values' ? questions.length : tradeoffs.length
  const current = Number(match[2]) - 1
  return current >= 0 && current < total ? { phase, current } : null
}

function initialState() {
  const saved = readSession()
  const token = tokenFromPath(location.pathname)
  const payload = token ? tokenPayload(token) : null
  if (token && payload) {
    const shared = stateFromPayload(payload)
    const ownResult = saved?.sharedToken === token
    return {
      selfLabel: shared.selfLabel as SelfLabel | null,
      phase: 'result' as Phase,
      current: saved?.current ?? 0,
      answers: ownResult ? saved.answers : shared.answers,
      contextAnswers: ownResult ? saved.contextAnswers : shared.contextAnswers,
      reviewing: false,
      sharedToken: token,
      sharedFingerprint: JSON.stringify(payload),
      sharedView: !ownResult,
    }
  }
  const route = routeFromHash()
  return {
    selfLabel: saved?.selfLabel ?? null,
    phase: route?.phase ?? saved?.phase ?? 'home' as Phase,
    current: route?.current ?? saved?.current ?? 0,
    answers: saved?.answers ?? {},
    contextAnswers: saved?.contextAnswers ?? {},
    reviewing: saved?.reviewing ?? false,
    sharedToken: saved?.sharedToken ?? null,
    sharedFingerprint: saved?.sharedFingerprint ?? null,
    sharedView: false,
  }
}

const answerChoices: { value: AnswerValue; label: string }[] = [
  { value: 1, label: 'あまり重視しない' }, { value: 2, label: '少し重視する' },
  { value: 3, label: 'ある程度重視する' }, { value: 4, label: 'かなり重視する' },
  { value: 5, label: 'とても重視する' }, { value: 'conditional', label: '条件による' }, { value: null, label: '判断できない' },
]
const selfLabels: { value: SelfLabel; label: string }[] = [
  { value: 'left', label: '左寄り' }, { value: 'center', label: '中道' }, { value: 'right', label: '右寄り' }, { value: 'unknown', label: 'わからない' },
]

export default function App() {
  const [initial] = useState(initialState)
  const [selfLabel, setSelfLabel] = useState<SelfLabel | null>(initial.selfLabel)
  const [phase, setPhase] = useState<Phase>(initial.phase)
  const [current, setCurrent] = useState(initial.current)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initial.answers)
  const [contextAnswers, setContextAnswers] = useState<Record<string, TradeoffAnswer>>(initial.contextAnswers)
  const [reviewing, setReviewing] = useState(initial.reviewing)
  const [shareStatus, setShareStatus] = useState('')
  const [sharedToken, setSharedToken] = useState<string | null>(initial.sharedToken)
  const [sharedFingerprint, setSharedFingerprint] = useState<string | null>(initial.sharedFingerprint)
  const [sharedView, setSharedView] = useState(initial.sharedView)
  const heading = useRef<HTMLHeadingElement>(null)
  const shareRequest = useRef<{ fingerprint: string; promise: Promise<string> } | null>(null)

  useEffect(() => {
    if (sharedView) return
    const saved: SavedSession = { v: 1, selfLabel, phase, current, answers, contextAnswers, reviewing, sharedToken, sharedFingerprint }
    try { sessionStorage.setItem(sessionKey, JSON.stringify(saved)) } catch { /* session storage may be unavailable */ }
  }, [answers, contextAnswers, current, phase, reviewing, selfLabel, sharedFingerprint, sharedToken, sharedView])

  useEffect(() => {
    function restoreRoute() {
      const token = tokenFromPath(location.pathname)
      const payload = token ? tokenPayload(token) : null
      if (token && payload) {
        if (token !== sharedToken) {
          const state = stateFromPayload(payload)
          setSelfLabel(state.selfLabel); setAnswers(state.answers); setContextAnswers(state.contextAnswers)
          setSharedToken(token); setSharedFingerprint(JSON.stringify(payload)); setSharedView(true)
        }
        setReviewing(false); setPhase('result')
        return
      }
      const route = routeFromHash()
      setSharedView(false)
      if (route) { setCurrent(route.current); setPhase(route.phase) }
      else { setCurrent(0); setPhase('home') }
    }
    addEventListener('popstate', restoreRoute)
    return () => removeEventListener('popstate', restoreRoute)
  }, [sharedToken])
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [phase, current])

  function restart() {
    try { sessionStorage.removeItem(sessionKey) } catch { /* session storage may be unavailable */ }
    history.replaceState(null, '', '/')
    shareRequest.current = null
    setSelfLabel(null); setPhase('home'); setCurrent(0); setAnswers({}); setContextAnswers({}); setReviewing(false); setShareStatus(''); setSharedToken(null); setSharedFingerprint(null); setSharedView(false)
  }
  function goToQuestion(nextPhase: 'values' | 'tradeoffs', index: number) {
    setCurrent(index); setPhase(nextPhase)
    history.pushState(null, '', `/#/${nextPhase}/${index + 1}`)
  }
  function begin() { if (selfLabel) goToQuestion('values', 0) }
  function startTradeoffs() { setReviewing(false); goToQuestion('tradeoffs', 0) }

  function currentSharePayload() {
    if (!selfLabel) throw new Error('self label missing')
    return createSharePayload(answers, contextAnswers, selfLabel)
  }

  async function ensureShareToken() {
    const payload = currentSharePayload()
    const fingerprint = JSON.stringify(payload)
    if (sharedToken && sharedFingerprint === fingerprint) return sharedToken
    if (sharedView && sharedToken) return sharedToken
    if (shareRequest.current?.fingerprint !== fingerprint) {
      shareRequest.current = { fingerprint, promise: createShareToken(payload) }
    }
    try {
      const token = await shareRequest.current.promise
      setSharedToken(token); setSharedFingerprint(fingerprint); setShareStatus('')
      return token
    } catch (error) {
      if (shareRequest.current?.fingerprint === fingerprint) shareRequest.current = null
      throw error
    }
  }

  function showResultUrl(token: string) {
    const path = `/r/${token}`
    if (location.pathname !== path) history.pushState(null, '', path)
  }

  const shareFingerprint = selfLabel ? JSON.stringify(createSharePayload(answers, contextAnswers, selfLabel)) : ''
  const featured = featuredLabelsForAnswers(answers)
  const shareText = featured.length > 0
    ? `あなたは${featured.map(label => label.title).join('、')}です。 #どっち寄り`
    : '「どっち寄り？」で政治観をのぞいてみた。右か左だけじゃない。 #どっち寄り'
  useEffect(() => {
    if (phase !== 'result' || !selfLabel || sharedView) return
    if (sharedToken && sharedFingerprint === shareFingerprint) {
      showResultUrl(sharedToken)
      return
    }
    let active = true
    void ensureShareToken().then(token => { if (active) showResultUrl(token) }).catch(() => {
      if (active) setShareStatus('共有リンクを作れませんでした。シェアボタンからもう一度試せます。')
    })
    return () => { active = false }
  }, [phase, selfLabel, sharedFingerprint, sharedToken, sharedView, shareFingerprint])

  async function shareUrl() {
    const token = await ensureShareToken()
    showResultUrl(token)
    return `${location.origin}/r/${token}`
  }
  async function copyLink() {
    try { const url = await shareUrl(); await navigator.clipboard.writeText(url); setShareStatus('リンクをコピーしたよ。') }
    catch { setShareStatus('共有リンクを作れませんでした。公開環境の設定を確認してね。') }
  }
  async function shareX() {
    try {
      const url = await shareUrl()
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    } catch { setShareStatus('共有リンクを作れませんでした。公開環境の設定を確認してね。') }
  }
  async function shareThreads() {
    try {
      const url = await shareUrl()
      window.open(`https://www.threads.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
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
    <header className="site-header"><a href="/" onClick={event => { event.preventDefault(); restart() }}>どっち寄り？</a><button onClick={restart}>{sharedView ? '自分もやってみる' : '最初から'}</button></header>
    <ResultReading answers={answers} selfLabel={selfLabel} featured={featured} sharedView={sharedView} onStartNew={restart} onReview={index => { setReviewing(true); goToQuestion('values', index) }} onCopy={copyLink} onShareX={shareX} onShareThreads={shareThreads} shareStatus={shareStatus} />
    {tradeoffs.some(question => contextAnswers[question.id] === undefined) && <section className="optional-card"><p className="overline">OPTIONAL</p><h2>条件があるとき、どう選ぶ？</h2><p>具体的な場面での選択も、少しだけ見てみる？ この回答はスコアを上下させません。</p><button className="button button-secondary" onClick={startTradeoffs}>追加4問に進む</button></section>}
    <InfoSection compact />
  </main>

  const isTradeoff = phase === 'tradeoffs'
  const question = questions[current]
  const tradeoff = tradeoffs[current]
  const total = isTradeoff ? tradeoffs.length : questions.length
  const selected = isTradeoff ? contextAnswers[tradeoff.id] : answers[question.id]
  const progress = Math.round((current / total) * 100)
  function next() {
    if (reviewing) { setReviewing(false); setPhase('result') }
    else if (current + 1 < total) goToQuestion(isTradeoff ? 'tradeoffs' : 'values', current + 1)
    else setPhase('result')
  }

  function previousQuestion() {
    if (current > 0) goToQuestion(isTradeoff ? 'tradeoffs' : 'values', current - 1)
    else if (isTradeoff) setPhase('result')
    else { setPhase('home'); history.pushState(null, '', '/') }
  }

  return <main className="app-shell question-shell">
    <header className="site-header"><button onClick={previousQuestion}>← 戻る</button><span>{current + 1} / {total}</span></header>
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
      <div className="question-navigation"><button className="button button-primary" disabled={selected === undefined} onClick={next}>{reviewing ? '結果に反映する' : current + 1 === total ? '結果を見る' : '次へ'}</button>{current > 0 && <button className="button button-quiet" onClick={previousQuestion}>前の質問</button>}</div>
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
