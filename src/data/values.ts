import type { ValueDefinition } from './model'

export const values: ValueDefinition[] = [
  { key: 'redistribution', label: '再分配・公的保障', shortLabel: '再分配', group: '経済', description: '税や給付などを通じた格差是正や公的保障をどの程度重視するか。' },
  { key: 'market', label: '市場競争・民間活力', shortLabel: '市場活力', group: '経済', description: '競争、起業、企業や個人の経済活動の自由をどの程度重視するか。' },
  { key: 'jobSecurity', label: '雇用・労働者保護', shortLabel: '雇用保護', group: '雇用', description: '雇用の安定や労働者保護をどの程度重視するか。' },
  { key: 'mobility', label: '転職・労働移動', shortLabel: '労働移動', group: '雇用', description: '転職、再就職、職業移動のしやすさをどの程度重視するか。' },
  { key: 'civilLiberty', label: '個人の自由', shortLabel: '個人の自由', group: '自由', description: '表現、プライバシー、自己決定への国家介入を抑えることをどの程度重視するか。' },
  { key: 'publicOrder', label: '安全・秩序', shortLabel: '安全・秩序', group: '自由', description: '被害防止や社会秩序のための一定の規制をどの程度重視するか。' },
  { key: 'deterrence', label: '防衛・抑止', shortLabel: '防衛・抑止', group: '安保', description: '防衛力と抑止力の確保をどの程度重視するか。' },
  { key: 'diplomacy', label: '外交・協調', shortLabel: '外交・協調', group: '安保', description: '外交、対話、国際協調による安定をどの程度重視するか。' },
  { key: 'pluralism', label: '多様性・制度変更', shortLabel: '多様性', group: '社会文化', description: '多様な生き方を制度上認め、必要に応じて制度を変えることをどの程度重視するか。' },
  { key: 'tradition', label: '伝統・継続性', shortLabel: '伝統', group: '社会文化', description: '既存の慣習や社会制度の継続性をどの程度重視するか。' },
  { key: 'openness', label: '国際的な開放・交流', shortLabel: '開放・交流', group: '国際関係', description: '人、モノ、情報、国際協力の開放性をどの程度重視するか。' },
  { key: 'sovereignty', label: '主権・国内自立', shortLabel: '主権・自立', group: '国際関係', description: '国内の自立性、経済安全保障、主権をどの程度重視するか。' },
]
