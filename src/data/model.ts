export type SelfLabel = 'left' | 'center' | 'right' | 'unknown'
export type ValueKey = 'redistribution' | 'market' | 'jobSecurity' | 'mobility' | 'civilLiberty' | 'publicOrder' | 'deterrence' | 'diplomacy' | 'pluralism' | 'tradition' | 'openness' | 'sovereignty'
export type AnswerValue = 1 | 2 | 3 | 4 | 5 | 'conditional' | null
export type TradeoffAnswer = 'a' | 'lean-a' | 'balanced' | 'lean-b' | 'b' | 'conditional' | 'unknown'
export interface ValueDefinition {
  key: ValueKey
  label: string
  shortLabel: string
  description: string
  group: string
}
export interface Question {
  id: string
  prompt: string
  value: ValueKey
}
export interface TradeoffQuestion {
  id: string
  title: string
  condition: string
  optionA: string
  optionB: string
}
