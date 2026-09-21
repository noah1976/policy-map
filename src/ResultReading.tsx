import { mainLabels, getResultLabels } from './data/result-labels'
import { questions } from './data/questions'
import { values } from './data/values'
import type { AnswerValue, SelfLabel } from './data/model'
import type { ValueAnswers } from './data/result-labels'

type Props = {
  answers: Record<string, AnswerValue>
  selfLabel: SelfLabel | null
  onReview: (index: number) => void
  onCopy: () => void
  onShareX: () => void
  onShareThreads: () => void
  shareStatus: string
}

export function ResultReading({ answers, selfLabel, onReview, onCopy, onShareX, onShareThreads, shareStatus }: Props) {
  const valueAnswers: ValueAnswers = {}
  for (const question of questions) if (Object.hasOwn(answers, question.id)) valueAnswers[question.value] = answers[question.id]
  const labels = getResultLabels(valueAnswers)
  const featured = mainLabels(labels)
  const selfText = selfLabel === 'unknown' ? 'わからない' : selfLabel === 'center' ? '中道' : selfLabel === 'left' ? '左寄り' : '右寄り'

  return <section className="results" aria-labelledby="result-heading">
    <header className="result-intro">
      <p className="overline">どっち寄り？</p>
      <h1 id="result-heading">あなたはこんな感じ</h1>
      {featured.length > 0 ? <div className="result-labels" aria-label="主な傾向">
        {featured.map(label => <p key={label.id}>{label.title}</p>)}
      </div> : <p className="result-empty">今回は、ひとつの言葉に寄せずに見てみよう。</p>}
      <p className="result-subline">自己認識は「{selfText}」。回答から見える傾向は、こんな組み合わせでした。</p>
      <div className="share-actions">
        <button className="button button-primary" onClick={onCopy}>リンクをコピー</button>
        <button className="button button-secondary" onClick={onShareX}>Xでシェア</button>
        <button className="button button-secondary" onClick={onShareThreads}>Threadsでシェア</button>
      </div>
      <p role="status" className="share-status">{shareStatus}</p>
    </header>

    {featured.length > 0 && <section className="result-explainer" aria-labelledby="explain-heading">
      <h2 id="explain-heading">ひとこと解説</h2>
      <div className="explanation-list">{featured.map(label => <article key={label.id}>
        <h3>{label.title}</h3><p>{label.description}</p>
      </article>)}</div>
    </section>}

    <section className="result-detail" aria-labelledby="detail-heading">
      <div className="section-heading"><p className="overline">DETAIL</p><h2 id="detail-heading">もう少し細かく見る</h2></div>
      <p>数値は優劣ではなく、その価値をどのくらい重視したかの目安です。複数が高くても、ぜんぜんOK。</p>
      <div className="score-groups">{['経済', '雇用', '自由', '社会文化', '安保', '国際関係'].map(group => {
        const items = values.filter(value => value.group === group)
        return <section className="score-group" key={group}><h3>{group}</h3>{items.map(item => {
          const question = questions.find(candidate => candidate.value === item.key)
          const answer = question ? answers[question.id] : undefined
          const score = typeof answer === 'number' ? (answer - 1) * 25 : null
          const answerText = answer === 'conditional' ? '条件による' : answer === null ? '判断できない' : score === null ? '未回答' : `${score}`
          return <article className="score-row" key={item.key}>
            <div><h4>{item.label}</h4><p>{item.description}</p></div>
            <div className="score-value"><strong>{answerText}</strong>{score !== null && <span aria-hidden="true"><i style={{ width: `${score}%` }} /></span>}</div>
            {question && <button className="text-link" onClick={() => onReview(questions.indexOf(question))}>見直す</button>}
          </article>
        })}</section>
      })}</div>
    </section>

    <details className="about-result">
      <summary>この結果の読み方</summary>
      <p>このサービスは、右か左かを一本線で決めるものではありません。経済、雇用、自由、社会文化、安全保障、国際関係を別々に見ています。</p>
      <p>ラベルは回答を振り返りやすくするための目安です。特定政党や候補者をすすめるものではありません。</p>
    </details>
  </section>
}
