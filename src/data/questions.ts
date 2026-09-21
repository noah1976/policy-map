import type { Question } from './model'

// v0.1 仮設問。公開前に中立性レビューとA/Bテストを行う前提。
export const questions: Question[] = [
  { id: 'q01', value: 'redistribution', prompt: '所得や資産の格差を縮めるための、税や給付による再分配をどの程度重視しますか？' },
  { id: 'q02', value: 'market', prompt: '新しい事業や投資を生みやすくするための、市場競争や民間の裁量をどの程度重視しますか？' },
  { id: 'q03', value: 'jobSecurity', prompt: '働く人が現在の雇用を失いにくくする制度や労働者保護をどの程度重視しますか？' },
  { id: 'q04', value: 'mobility', prompt: '年齢や地域に左右されず、転職・再就職しやすい労働市場をどの程度重視しますか？' },
  { id: 'q05', value: 'civilLiberty', prompt: '表現、プライバシー、生き方など個人の自由を国家が広く保障することをどの程度重視しますか？' },
  { id: 'q06', value: 'publicOrder', prompt: '被害の防止や社会の安全・秩序を守るためのルールや規制をどの程度重視しますか？' },
  { id: 'q07', value: 'deterrence', prompt: '日本の安全を守るための防衛力・抑止力をどの程度重視しますか？' },
  { id: 'q08', value: 'diplomacy', prompt: '国際的な緊張を抑えるための外交・対話・国際協調をどの程度重視しますか？' },
  { id: 'q09', value: 'pluralism', prompt: '多様な生き方に合わせて、社会制度を柔軟に変えていくことをどの程度重視しますか？' },
  { id: 'q10', value: 'tradition', prompt: '社会制度や文化を変える際に、既存の慣習や伝統との継続性をどの程度重視しますか？' },
  { id: 'q11', value: 'openness', prompt: '経済や社会における国際的な交流・協力・開放性をどの程度重視しますか？' },
  { id: 'q12', value: 'sovereignty', prompt: '重要な産業や制度について、国外への依存を抑え国内の自立性を保つことをどの程度重視しますか？' },
]
