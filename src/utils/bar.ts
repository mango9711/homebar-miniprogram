import type {
  GenerateResult,
  Ingredient,
  Recipe,
  Scored
} from '@/types'
import { RECIPES } from '@/data/recipes'
import { isCustomId } from '@/data/categories'
import { QUIZ_QUESTIONS } from '@/data/quiz'
import type { QuizOption } from '@/data/quiz'

type Inv = Record<string, boolean>
type Custom = Record<string, Array<[string, string]>>
type NameMap = Record<string, string>

// ---------------------------------------------------------------------------
// 匹配打分
// ---------------------------------------------------------------------------

export function scoreRecipes(inv: Inv): Scored[] {
  return RECIPES.map((recipe) => {
    const missing = recipe.ingredients
      .filter((ing) => !ing.optional && !inv[ing.item])
      .map((ing) => ing.item)
    return { recipe, missing, score: missing.length }
  })
}

/** 记录用稳定键：经典配方用 id，创意配方用材料签名 */
export function recipeKey(r: Recipe): string {
  if (!r.creative) return r.id
  const sig = r.ingredients
    .map((i) => i.item)
    .sort()
    .join('-')
  return `cre_${sig}`
}

// ---------------------------------------------------------------------------
// 创意调酒生成器
// ---------------------------------------------------------------------------

const SPIRITS = [
  'vodka', 'gin', 'white_rum', 'dark_rum', 'tequila',
  'whiskey', 'brandy', 'baijiu', 'wine'
]
const LIQ_BUILTIN = [
  'cointreau', 'campari', 'aperol', 'sweet_vermouth', 'dry_vermouth',
  'kahlua', 'baileys', 'malibu', 'peach', 'amaretto', 'blue_curacao'
]
const SYRUP_BUILTIN = ['simple', 'grenadine', 'honey', 'elderflower', 'passionfruit']
const JUICE_BUILTIN = ['orange', 'cranberry', 'pineapple', 'grapefruit']
const CITRUS_BUILTIN = ['lime', 'lemon']
const SPARK_BUILTIN = ['tonic', 'soda', 'ginger_ale', 'cola']
const CREAM_BUILTIN = ['coconut', 'cream']
const CREAM_LIQ = ['kahlua', 'baileys', 'malibu']

const BASE_WORD: Record<string, string> = {
  vodka: '伏特加', gin: '金酒', white_rum: '白朗姆', dark_rum: '黑朗姆',
  tequila: '龙舌兰', whiskey: '威士忌', brandy: '白兰地', baijiu: '白酒',
  wine: '葡萄酒', prosecco: '起泡酒'
}
const FLAVOR_ORDER = [
  'mint', 'elderflower', 'passionfruit', 'peach', 'kahlua', 'baileys',
  'coconut', 'malibu', 'cranberry', 'pineapple', 'grapefruit', 'orange',
  'amaretto', 'campari', 'aperol', 'honey', 'grenadine', 'blue_curacao',
  'cointreau', 'ginger_ale', 'cola', 'tonic', 'lime', 'lemon'
]
const FLAVOR_WORD: Record<string, string> = {
  mint: '薄荷', elderflower: '接骨木花', passionfruit: '百香果', peach: '蜜桃',
  malibu: '椰香', coconut: '椰香', kahlua: '咖啡', baileys: '奶油',
  cranberry: '蔓越莓', pineapple: '菠萝', grapefruit: '西柚', orange: '鲜橙',
  amaretto: '杏仁', campari: '苦橙', aperol: '苦橙', honey: '蜂蜜',
  grenadine: '红石榴', blue_curacao: '蓝橙', cointreau: '橙香', lime: '青柠',
  lemon: '柠檬', ginger_ale: '干姜', cola: '可乐', tonic: '汤力', soda: '气泡'
}
const STYLE_WORD: Record<string, string> = {
  highball: '嗨棒', sour: '酸饮', cooler: '微风', creamy: '甜梦', rocks: '冰醇'
}
const STYLE_EN: Record<string, string> = {
  highball: 'House Highball',
  sour: 'House Sour',
  cooler: 'Pantry Cooler',
  creamy: 'Velvet Dream',
  rocks: 'Spirit on the Rocks',
  mocktail: 'Zero-Proof Punch',
  spritz: 'Spritz Fizz',
  solo: 'Chilled Prosecco'
}

function customInvOf(catId: string, inv: Inv, custom: Custom): string[] {
  return (custom[catId] || [])
    .map((p) => p[0])
    .filter((id) => !!inv[id])
}

function baseWord(id: string, NAME: NameMap): string {
  return BASE_WORD[id] || NAME[id] || ''
}

function creativeTags(ids: string[], sourSweet: string | null, NAME: NameMap): string[] {
  const t: string[] = []
  const add = (x?: string) => {
    if (x && t.indexOf(x) < 0) t.push(x)
  }
  ids.forEach((id) => {
    const nm = NAME[id] || ''
    if (
      ['tonic', 'soda', 'ginger_ale', 'cola', 'prosecco'].indexOf(id) !== -1 ||
      nm.indexOf('气泡') !== -1 ||
      nm.indexOf('汽水') !== -1
    ) {
      add('气泡')
    }
    if (
      ['orange', 'cranberry', 'pineapple', 'grapefruit', 'passionfruit', 'peach', 'cointreau', 'blue_curacao'].indexOf(id) !== -1
    ) {
      add('果香')
    }
    if (id === 'cranberry' || id === 'grenadine' || nm.indexOf('莓') !== -1) add('莓果')
    if (id === 'coconut' || id === 'malibu' || nm.indexOf('椰') !== -1) add('椰香')
    if (id === 'cream' || id === 'baileys' || nm.indexOf('奶') !== -1) add('奶香')
    if (id === 'kahlua' || nm.indexOf('咖啡') !== -1) add('咖啡')
    if (id === 'amaretto' || nm.indexOf('杏仁') !== -1 || nm.indexOf('坚果') !== -1) add('坚果')
    if (id === 'campari' || id === 'aperol' || id === 'sweet_vermouth') add('苦甜')
    if (id === 'dry_vermouth') add('干冽')
    if (id === 'elderflower' || nm.indexOf('花') !== -1) add('花香')
    if (id === 'mint' || nm.indexOf('薄荷') !== -1) add('薄荷')
    if (id === 'honey' || nm.indexOf('蜜') !== -1) add('甜润')
    if (nm.indexOf('姜') !== -1) add('辛香')
    if (id === 'gin') add('草本')
    if (id === 'whiskey' || id === 'brandy' || id === 'dark_rum') add('浓郁')
    if (id === 'tequila') add('辛香')
  })
  if (sourSweet === 'sour') add('微酸')
  if (sourSweet === 'sweetSour') add('酸甜')
  if (t.indexOf('薄荷') !== -1) add('清爽')
  return t.slice(0, 4)
}

function creativeStrength(
  spiritMl: number,
  proseccoMl: number,
  totalMl: number
): 0 | 1 | 2 | 3 {
  if (!spiritMl && !proseccoMl) return 0
  const eff = spiritMl + proseccoMl * 0.25
  const r = eff / totalMl
  if (r >= 0.5) return 3
  if (r >= 0.3) return 2
  return 1
}

function creativeGarnish(style: string, inv: Inv): string {
  const g: string[] = []
  const refreshing = ['highball', 'cooler', 'mocktail', 'spritz', 'sour'].indexOf(style) !== -1
  if (inv.mint && refreshing) g.push('薄荷嫩枝')
  if (inv.lime) g.push('青柠角')
  else if (inv.lemon_fresh) g.push(style === 'rocks' ? '柠檬皮捲' : '柠檬片')
  return g.length ? g.join(' + ') : '无需额外装饰'
}

function creativeName(style: string, baseId: string | null, usedIds: string[], NAME: NameMap): string {
  let flavor: string | null = null
  // 嗨棒按所用气泡水区分命名，避免多款同名
  if (style === 'highball') {
    const spark = ['tonic', 'ginger_ale', 'cola', 'soda'].find(
      (id) => usedIds.indexOf(id) !== -1
    )
    if (spark) flavor = FLAVOR_WORD[spark] || null
  }
  if (flavor === null) {
    for (let i = 0; i < FLAVOR_ORDER.length; i += 1) {
      if (usedIds.indexOf(FLAVOR_ORDER[i]) !== -1) {
        flavor = FLAVOR_WORD[FLAVOR_ORDER[i]]
        break
      }
    }
  }
  if (!flavor) {
    const cu = usedIds.find(isCustomId)
    if (cu) flavor = (NAME[cu] || '').slice(0, 4)
  }
  if (style === 'mocktail') return `${flavor || '果园'}无酒精宾治`
  if (style === 'solo') return '冰镇起泡酒'
  if (style === 'spritz') return `${flavor || '鲜果'}气泡特饮`
  return `${flavor || ''}${baseId ? baseWord(baseId, NAME) : ''}${STYLE_WORD[style]}`
}

export function buildCreativeRecipes(inv: Inv, custom: Custom, NAME: NameMap): Recipe[] {
  const spirits = SPIRITS.filter((id) => !!inv[id]).concat(customInvOf('base', inv, custom))
  const liqs = LIQ_BUILTIN.filter((id) => !!inv[id]).concat(customInvOf('liqueur', inv, custom))
  const syrups = SYRUP_BUILTIN.filter((id) => !!inv[id]).concat(customInvOf('syrup', inv, custom))
  const juices = JUICE_BUILTIN.filter((id) => !!inv[id])
  const citrus = CITRUS_BUILTIN.filter((id) => !!inv[id])
  const sparklers = SPARK_BUILTIN.filter((id) => !!inv[id])
  const creams = CREAM_BUILTIN.filter((id) => !!inv[id])
  const mixerCustom = customInvOf('mixer', inv, custom)
  const hasProsecco = !!inv.prosecco
  const spirit = spirits[0] || null

  const out: Recipe[] = []
  const seen: Record<string, boolean> = {}

  const push = (r: Recipe) => {
    const sig = r.ingredients
      .map((i) => i.item)
      .sort()
      .join('|')
    if (seen[sig]) return
    seen[sig] = true
    r.creative = true
    r.pop = 0
    out.push(r)
  }

  const mk = (
    style: string,
    baseId: string | null,
    glass: string,
    method: string,
    strength: 0 | 1 | 2 | 3,
    tags: string[],
    desc: string,
    ings: Ingredient[],
    steps: string[],
    garnish?: string,
    idSuffix?: string
  ): Recipe => {
    const usedIds = ings.map((i) => i.item)
    return {
      id: `creative_${style}_${baseId || 'na'}${idSuffix ? `_${idSuffix}` : ''}`,
      name: creativeName(style, baseId, usedIds, NAME),
      en: STYLE_EN[style],
      glass,
      method,
      strength,
      tags,
      desc,
      ingredients: ings,
      garnish: garnish || creativeGarnish(style, inv),
      steps
    }
  }

  // ① 起泡酒斯普里兹（无基酒时）
  if (hasProsecco && sparklers.length) {
    const mixer = sparklers[0]
    const ings: Ingredient[] = [
      { item: 'prosecco', amount: '90ml' },
      { item: mixer, amount: '补满（约90ml）' }
    ]
    const ids = ings.map((i) => i.item)
    const desc = `起泡酒打底，${NAME[mixer]}在杯中呲呲冒泡，冰爽顺口，看球聊天都适合慢慢喝。`
    const steps = [
      '高球杯中加满冰块',
      '倒入起泡酒，用吧勺轻拌两下',
      `注满${NAME[mixer]}，轻轻提拉混合，点缀装饰后插吸管即可`
    ]
    push(
      mk(
        'spritz',
        null,
        '高球杯',
        '兑和 · 搅拌',
        creativeStrength(0, 90, 180),
        creativeTags(ids, null, NAME),
        desc,
        ings,
        steps
      )
    )
  }

  // ②–⑤ 为酒柜里的每种基酒分别生成（最多取 3 种基酒）
  spirits.slice(0, 3).forEach((sp) => {
    // 嗨棒：每种气泡水一款
    if (sparklers.length) {
      sparklers.slice(0, 3).forEach((mixer) => {
        let accent: { id: string; amt: string } | null = null
        if (liqs[0]) accent = { id: liqs[0], amt: '15ml' }
        else if (syrups[0]) accent = { id: syrups[0], amt: '10ml' }
        else if (citrus[0]) accent = { id: citrus[0], amt: '10ml' }

        const ings: Ingredient[] = [{ item: sp, amount: '45ml' }]
        if (accent) ings.push({ item: accent.id, amount: accent.amt })
        ings.push({ item: mixer, amount: '补满（约90ml）' })
        const ids = ings.map((i) => i.item)
        const ss =
          accent && CITRUS_BUILTIN.indexOf(accent.id) !== -1
            ? syrups.length || liqs.length
              ? 'sweetSour'
              : 'sour'
            : null
        const total = 45 + (accent ? 12 : 0) + 90
        const desc = `${baseWord(sp, NAME)}打底，${NAME[mixer]}在杯中呲呲冒泡，${
          accent ? `再加一点${NAME[accent.id]}提味，` : ''
        }冰爽顺口，看球聊天都适合慢慢喝。`
        const hbSteps = [
          '高球杯中加满冰块',
          `倒入${baseWord(sp, NAME)}${accent ? `与${NAME[accent.id]}` : ''}，用吧勺轻拌两下`,
          `注满${NAME[mixer]}，轻轻提拉混合，点缀装饰后插吸管即可`
        ]
        push(
          mk(
            'highball',
            sp,
            '高球杯',
            '兑和 · 搅拌',
            creativeStrength(45, 0, total),
            creativeTags(ids, ss, NAME),
            desc,
            ings,
            hbSteps,
            undefined,
            mixer
          )
        )
      })
    }

    // 酸饮
    if (citrus.length && (syrups.length || liqs.length)) {
      const cit = citrus.indexOf('lime') !== -1 ? 'lime' : citrus[0]
      const sweet = syrups[0]
        ? { id: syrups[0], amt: '15ml' }
        : { id: liqs[0], amt: '20ml' }
      const ings: Ingredient[] = [
        { item: sp, amount: '45ml' },
        { item: cit, amount: '20ml（约半个）' },
        { item: sweet.id, amount: sweet.amt }
      ]
      const ids = ings.map((i) => i.item)
      const srSteps = [
        '雪克壶中加七分满冰块',
        `倒入${baseWord(sp, NAME)}、${NAME[cit]}与${NAME[sweet.id]}，盖紧摇荡至壶身结霜（约12秒）`,
        '滤冰倒入古典杯，配上装饰，趁凉喝'
      ]
      const srDesc = `经典酸甜平衡结构：${NAME[cit]}的鲜酸被${NAME[sweet.id]}稳稳托起，${baseWord(sp, NAME)}的酒感清晰却不冲口，第一口醒神、第二口顺喉。`
      push(
        mk(
          'sour',
          sp,
          '古典杯',
          '摇和',
          creativeStrength(45, 0, 85),
          creativeTags(ids, 'sweetSour', NAME),
          srDesc,
          ings,
          srSteps
        )
      )
    }

    // 果味微风：每种果汁一款
    juices.concat(mixerCustom).slice(0, 3).forEach((juice) => {
      const top = inv.soda ? 'soda' : null
      const syr = syrups[0] || null
      const ings: Ingredient[] = [
        { item: sp, amount: '40ml' },
        { item: juice, amount: '80ml' }
      ]
      if (syr) ings.push({ item: syr, amount: '10ml', optional: true })
      if (top) ings.push({ item: top, amount: '补满气泡（约30ml）', optional: true })
      const ids = ings.map((i) => i.item)
      const clSteps = [
        `杯中加满冰块，倒入${baseWord(sp, NAME)}与${NAME[juice]}`,
        `${syr ? `加入${NAME[syr]}搅匀增甜；` : ''}${
          top ? `最后注入${NAME[top]}补出气泡；` : '用吧勺轻轻提拉混合；'
        }`,
        '加上装饰，一杯果香饱满的长饮就成了'
      ]
      const clDesc = `${NAME[juice]}把${baseWord(sp, NAME)}的棱角包得柔和，果香是主调、酒感藏在后段，入口轻松，适合不太能喝烈酒又想微醺的夜晚。`
      push(
        mk(
          'cooler',
          sp,
          '高球杯',
          '兑和 · 搅拌',
          creativeStrength(40, 0, 40 + 80 + (top ? 30 : 0)),
          creativeTags(ids, syr ? 'sweetSour' : null, NAME),
          clDesc,
          ings,
          clSteps,
          undefined,
          juice
        )
      )
    })

    // 奶香甜梦
    if (creams.length || CREAM_LIQ.some((id) => liqs.indexOf(id) !== -1)) {
      const creamLiq = CREAM_LIQ.filter((id) => liqs.indexOf(id) !== -1)[0] || null
      const cream = creams[0] || null
      const ings: Ingredient[] = [{ item: sp, amount: '40ml' }]
      if (creamLiq) ings.push({ item: creamLiq, amount: '20ml' })
      if (cream) ings.push({ item: cream, amount: '30ml' })
      const ids = ings.map((i) => i.item)
      const crSteps = [
        `雪克壶中加冰，倒入${ings.map((i) => NAME[i.item]).join('、')}`,
        '快速摇荡约15秒，让质地均匀冰滑',
        '滤冰倒入古典杯，入口绵密，像一杯可以喝的甜点，慢品'
      ]
      const crDesc = `奶香把${baseWord(sp, NAME)}的棱角磨得圆润，入口丝滑、甜而不腻，饭后不想点甜品时，来这一杯正好。`
      push(
        mk(
          'creamy',
          sp,
          '古典杯',
          '摇和',
          creativeStrength(40, 0, 40 + (creamLiq ? 20 : 0) + (cream ? 30 : 0)),
          creativeTags(ids, null, NAME).concat(['浓郁']).slice(0, 4),
          crDesc,
          ings,
          crSteps
        )
      )
    }

    // 纯饮加冰
    {
      const ings: Ingredient[] = [{ item: sp, amount: '45ml' }]
      const g5 = inv.lemon_fresh ? '柠檬皮捲' : '无需额外装饰'
      const rkSteps = [
        '古典杯中放一块大方冰（没有就加满冰块）',
        `倒入${baseWord(sp, NAME)}，轻轻搅拌约10秒给酒降温`,
        `${g5 === '柠檬皮捲' ? '拧一片柠檬皮捲在杯口抹过、投入杯中提香，' : ''}纯饮慢品，感受它本来的香气`
      ]
      const rkDesc = `不加任何修饰，冰镇后的${baseWord(sp, NAME)}酒精刺激感降低、香气更聚拢，适合想安安静静喝一杯的时候。`
      push(mk('rocks', sp, '古典杯', '纯饮 · 加冰', 3, creativeTags([sp], null, NAME), rkDesc, ings, rkSteps, g5))
    }
  })

  // ⑥ 无酒精宾治
  if (!spirit && !hasProsecco) {
    const mj = juices[0] || mixerCustom[0] || null
    const need = mj || citrus.length || inv.mint
    const top6 = sparklers[0] || null
    if (need && (mj || top6)) {
      const ings: Ingredient[] = []
      if (mj) ings.push({ item: mj, amount: '60ml' })
      if (citrus[0]) ings.push({ item: citrus[0], amount: '15ml' })
      if (syrups[0]) ings.push({ item: syrups[0], amount: '10ml' })
      if (inv.mint) ings.push({ item: 'mint', amount: '6–8 片' })
      if (top6) ings.push({ item: top6, amount: '补满（约90ml）' })
      if (ings.length >= 2) {
        const ids = ings.map((i) => i.item)
        const pour6 = ings
          .filter((i) => i.item !== top6 && i.item !== 'mint')
          .map((i) => NAME[i.item])
        const steps = [
          `高球杯加满冰块${pour6.length ? `，倒入${pour6.join('、')}` : ''}`,
          `${inv.mint ? '薄荷叶轻拍放入杯中；' : ''}${
            top6 ? `注满${NAME[top6]}补出气泡；` : '充分搅拌均匀；'
          }`,
          '加上装饰，开车或不想喝酒时也能尽兴'
        ]
        const desc = '用果汁与气泡搭出一杯无酒精特饮，酸甜清爽、仪式感不减，全家都能喝。'
        push(
          mk(
            'mocktail',
            null,
            '高球杯',
            '兑和 · 搅拌',
            0,
            creativeTags(ids, citrus.length && syrups.length ? 'sweetSour' : citrus.length ? 'sour' : null, NAME),
            desc,
            ings,
            steps
          )
        )
      }
    }
  }

  // ⑦ 冰镇起泡酒纯饮
  if (!spirit && hasProsecco) {
    const ings: Ingredient[] = [{ item: 'prosecco', amount: '120ml' }]
    const steps = [
      '起泡酒提前冰至 6–8℃',
      '倒入香槟杯或高脚杯，趁气泡细密时饮用',
      '本身就是一杯开胃酒，酸度清爽、不用调'
    ]
    push(
      mk(
        'solo',
        null,
        '香槟杯',
        '直接冰镇',
        creativeStrength(0, 120, 120),
        creativeTags(['prosecco'], null, NAME),
        '气泡细腻、酸度干净，餐前一杯开胃醒神。',
        ings,
        steps,
        '无需额外装饰'
      )
    )
  }

  return out
}

// ---------------------------------------------------------------------------
// 生成分流
// ---------------------------------------------------------------------------

export function planGenerate(inv: Inv, custom: Custom, NAME: NameMap): GenerateResult {
  const scored = scoreRecipes(inv)
  const perfect = scored
    .filter((s) => s.score === 0)
    .sort((a, b) => (b.recipe.pop || 0) - (a.recipe.pop || 0))
  const near = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score || (b.recipe.pop || 0) - (a.recipe.pop || 0))

  if (perfect.length > 0) {
    return {
      mode: 'perfect',
      title: '今晚，这几杯用你酒柜里的材料就能调',
      sub: `共匹配 ${perfect.length} 款配方，全部原料均来自你勾选的库存`,
      cards: perfect,
      near: []
    }
  }

  const creative = buildCreativeRecipes(inv, custom, NAME)
  if (creative.length) {
    return {
      mode: 'creative',
      title: '经典配方凑不齐？先用酒柜里的材料调这几杯',
      sub: '以下创意特调全部由你勾选的材料组合而成，用量可按口味微调',
      cards: creative.map((recipe) => ({ recipe, missing: [], score: 0 })),
      near: near.slice(0, 3)
    }
  }

  return {
    mode: 'empty',
    title: '当前库存还凑不齐一款完整配方',
    sub: '下面几款最接近，补齐标出的材料即可解锁（不会擅自给你加料）',
    cards: [],
    near: near.slice(0, 3)
  }
}

// ---------------------------------------------------------------------------
// 份量换算
// ---------------------------------------------------------------------------

export function scaleAmount(text: string, n: number): string {
  if (n === 1) return text
  return text.replace(/\d+(?:\.\d+)?/g, (d) => {
    const v = Math.round(parseFloat(d) * n * 10) / 10
    return String(v)
  })
}

export function amountMl(text: string): number {
  const m = /(\d+(?:\.\d+)?)\s*ml/i.exec(text)
  return m ? parseFloat(m[1]) : 0
}

export function ingsMlPerCup(ings: Ingredient[]): number {
  return Math.round(ings.reduce((sum, ing) => sum + amountMl(ing.amount), 0))
}

export function ingredientTitle(n: number, perCup: number): string {
  if (!perCup) return `配方用量（${n} 杯）`
  if (n === 1) return `配方用量（1 杯 · 约 ${perCup}ml）`
  return `配方用量（${n} 杯 · 共约 ${Math.round(perCup * n)}ml）`
}

/** 按当前库存动态过滤装饰（樱桃/橄榄等无法常备的直接省略） */
export function garnishFor(r: Recipe, inv: Inv): string {
  const raw = r.garnish || ''
  if (raw.indexOf('无需') === 0) return raw
  const pieces = raw.split(/\s*[+/、]\s*/).filter(Boolean)
  const kept = pieces
    .map((p) => {
      let need: string | null = null
      if (p.indexOf('薄荷') >= 0) need = 'mint'
      else if (p.indexOf('青柠') >= 0) need = 'lime'
      else if (p.indexOf('西柚') >= 0) need = 'grapefruit'
      else if (p.indexOf('菠萝') >= 0) need = 'pineapple'
      else if (p.indexOf('橙') >= 0) need = 'orange'
      else if (p.indexOf('柠檬') >= 0) need = 'lemon_fresh'
      else if (p.indexOf('樱桃') >= 0 || p.indexOf('橄榄') >= 0) need = '__none__'
      return { text: p.replace(/（可选）/g, ''), need }
    })
    .filter((p) => {
      if (p.need === '__none__') return false
      if (!p.need) return true
      return !!inv[p.need]
    })
    .map((p) => p.text)
  return kept.length ? kept.join(' + ') : '无需额外装饰'
}

/** 固化配方快照（剥离运行时字段，写入稳定 key） */
export function buildSnapshot(r: Recipe): Recipe {
  return {
    id: r.id,
    name: r.name,
    en: r.en,
    glass: r.glass,
    method: r.method,
    strength: r.strength,
    tags: [...r.tags],
    desc: r.desc,
    ingredients: r.ingredients.map((i) => ({ ...i })),
    garnish: r.garnish,
    steps: [...r.steps],
    creative: r.creative,
    key: recipeKey(r)
  }
}

// ---------------------------------------------------------------------------
// 口味问卷匹配
// ---------------------------------------------------------------------------

export interface QuizMatch extends Scored {
  /** 与问卷选择的契合度，越高越合口味 */
  fit: number
}

/** 命中一个偏好标签的加分 */
const FIT_TAG_HIT = 3
/** 命中一个「不想要」标签的减分 */
const FIT_TAG_MISS = -3
/** 酒精度落在期望档位的加分 / 落空的减分 */
const FIT_STRENGTH_HIT = 3
const FIT_STRENGTH_MISS = -2

/**
 * 根据问卷答卷给每款配方算契合度，并结合库存排序。
 * 「都行」的题不参与加减分。
 */
export function matchByQuiz(
  answers: Record<string, string>,
  inv: Inv
): QuizMatch[] {
  const picked: QuizOption[] = []
  QUIZ_QUESTIONS.forEach((q) => {
    const opt = q.options.find((o) => o.id === answers[q.id])
    if (opt && opt.id !== 'any') picked.push(opt)
  })

  return scoreRecipes(inv)
    .map((s) => {
      let fit = 0
      picked.forEach((opt) => {
        if (opt.tags && opt.tags.some((t) => s.recipe.tags.indexOf(t) !== -1)) {
          fit += FIT_TAG_HIT
        }
        if (
          opt.excludeTags &&
          opt.excludeTags.some((t) => s.recipe.tags.indexOf(t) !== -1)
        ) {
          fit += FIT_TAG_MISS
        }
        if (opt.strengths) {
          fit +=
            opt.strengths.indexOf(s.recipe.strength) !== -1
              ? FIT_STRENGTH_HIT
              : FIT_STRENGTH_MISS
        }
      })
      return { ...s, fit }
    })
    .sort(
      (a, b) =>
        b.fit - a.fit ||
        a.score - b.score ||
        (b.recipe.pop || 0) - (a.recipe.pop || 0)
    )
}
