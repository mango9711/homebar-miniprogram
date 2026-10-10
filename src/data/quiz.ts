/**
 * 口味问卷：按顺序回答，答案组合成一条「决策路径」，
 * 再交给 matchByQuiz 去和配方库做匹配。
 *
 * 每个选项通过 tags / excludeTags / strengths 描述它对配方的偏好，
 * 例如「酸爽开胃」偏好带 `酸甜`、`微酸` 标签的酒，
 * 「不要气泡」则排斥带 `气泡` 标签的酒。
 */
export interface QuizOption {
  id: string
  label: string
  sub: string
  /** 命中其中任意风味标签即加分 */
  tags?: string[]
  /** 命中其中任意风味标签即减分（明确不想要） */
  excludeTags?: string[]
  /** 期望的酒精度档位：命中加分，不命中减分 */
  strengths?: Array<0 | 1 | 2 | 3>
}

export interface QuizQuestion {
  id: string
  title: string
  hint: string
  options: QuizOption[]
}

/** 「都行」选项：不参与加减分，相当于放弃这一维度的偏好 */
const ANY: QuizOption = {
  id: 'any',
  label: '都行',
  sub: '没有特别偏好，交给运气'
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'tone',
    title: '今天想喝什么基调？',
    hint: '第一口的感觉，决定这杯酒的性格',
    options: [
      {
        id: 'sour',
        label: '酸爽开胃',
        sub: '柠檬、青柠的酸感打头',
        tags: ['酸甜', '微酸']
      },
      {
        id: 'sweet',
        label: '甜蜜顺口',
        sub: '蜂蜜、糖浆主导的甜',
        tags: ['甜润', '椰香', '坚果']
      },
      {
        id: 'clean',
        label: '清爽干净',
        sub: '轻盈不腻，能一路喝完',
        tags: ['清爽', '干冽']
      },
      {
        id: 'bitter',
        label: '微苦回甘',
        sub: '苦甜交织，越喝越有味道',
        tags: ['苦甜']
      },
      ANY
    ]
  },
  {
    id: 'strength',
    title: '今晚想喝到什么程度？',
    hint: '酒精度高低，决定这杯的节奏',
    options: [
      {
        id: 'light',
        label: '几乎没度数',
        sub: '无酒精或很轻，慢慢喝不上头',
        strengths: [0, 1]
      },
      {
        id: 'medium',
        label: '微醺正好',
        sub: '中度酒感，一杯刚好放松',
        strengths: [2]
      },
      {
        id: 'strong',
        label: '想喝烈一点',
        sub: '高度，酒感清晰有存在感',
        strengths: [3]
      },
      ANY
    ]
  },
  {
    id: 'sparkle',
    title: '杯里要冒泡吗？',
    hint: '气泡决定入口的轻盈感',
    options: [
      {
        id: 'yes',
        label: '要气泡',
        sub: '呲呲冒泡，爽快解腻',
        tags: ['气泡']
      },
      {
        id: 'no',
        label: '不要气泡',
        sub: '口感安静顺滑，适合慢慢抿',
        excludeTags: ['气泡']
      },
      ANY
    ]
  },
  {
    id: 'flavor',
    title: '想要什么风味走向？',
    hint: '最后一题，定下这杯的主香',
    options: [
      {
        id: 'fruity',
        label: '果味奔放',
        sub: '柑橘、莓果、热带水果',
        tags: ['果香', '莓果']
      },
      {
        id: 'herbal',
        label: '草本花香',
        sub: '薄荷、接骨木花、植物气息',
        tags: ['草本', '花香', '薄荷']
      },
      {
        id: 'coffee',
        label: '咖啡奶香',
        sub: '像一杯可以喝的甜点',
        tags: ['咖啡', '奶香']
      },
      {
        id: 'classic',
        label: '经典简约',
        sub: '烈酒的醇厚与香料',
        tags: ['浓郁', '辛香', '干冽']
      },
      ANY
    ]
  }
]

/** 把答卷翻译成一句可读的路径，例如「酸爽开胃 · 微醺正好 · 要气泡」 */
export function describeAnswers(answers: Record<string, string>): string[] {
  return QUIZ_QUESTIONS.map((q) => {
    const opt = q.options.find((o) => o.id === answers[q.id])
    return opt && opt.id !== 'any' ? opt.label : ''
  }).filter(Boolean)
}