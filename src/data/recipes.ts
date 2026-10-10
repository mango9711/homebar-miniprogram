import type { Recipe } from '@/types'

export const RECIPES: Recipe[] = [
  {
    id: 'mojito', name: '莫吉托', en: 'Mojito', pop: 10,
    glass: '高球杯', method: '捣压 · 兑和', strength: 1,
    tags: ['清爽', '薄荷', '酸甜'],
    desc: '青柠与薄荷捣出清香，苏打水带来满口清凉，夏夜露台的标配。',
    ingredients: [
      { item: 'white_rum', amount: '45ml' },
      { item: 'lime', amount: '20ml（约半个）' },
      { item: 'simple', amount: '15ml' },
      { item: 'mint', amount: '8–10 片' },
      { item: 'soda', amount: '补满（约60ml）' }
    ],
    garnish: '薄荷嫩枝 + 青柠角',
    steps: [
      '薄荷叶、青柠汁与单糖浆放入杯底，轻轻捣压出香（别捣烂薄荷茎，会发苦）',
      '杯中加满碎冰，倒入白朗姆酒，用吧勺轻轻提拉',
      '补满苏打水，点缀薄荷嫩枝与青柠角，插吸管即可'
    ]
  },
  {
    id: 'margarita', name: '玛格丽特', en: 'Margarita', pop: 9,
    glass: '玛格丽特杯', method: '摇和', strength: 2,
    tags: ['酸甜', '清爽', '果香'],
    desc: '龙舌兰的野性配青柠的酸与橙酒的香，盐边让整杯风味更立体。',
    ingredients: [
      { item: 'tequila', amount: '40ml' },
      { item: 'cointreau', amount: '20ml' },
      { item: 'lime', amount: '20ml' },
      { item: 'simple', amount: '5ml', optional: true }
    ],
    garnish: '盐边 + 青柠轮',
    steps: [
      '杯口用青柠抹湿，蘸一圈细盐做盐边',
      '摇酒壶加冰，倒入龙舌兰、橙味利口酒与青柠汁，摇至冰透',
      '滤入玛格丽特杯（可加冰），饰青柠轮'
    ]
  },
  {
    id: 'gin_tonic', name: '金汤力', en: 'Gin Tonic', pop: 9,
    glass: '高球杯', method: '兑和', strength: 2,
    tags: ['草本', '气泡', '苦甜'],
    desc: '金酒的杜松草本香遇上汤力水的微苦气泡，越简单越考验酒。',
    ingredients: [
      { item: 'gin', amount: '45ml' },
      { item: 'tonic', amount: '120ml' }
    ],
    garnish: '青柠角',
    steps: [
      '高球杯加满冰块，稍微搅拌冰杯',
      '倒入金酒，再注满冰镇汤力水',
      '用吧勺轻轻提拉即可（有青柠可挤一角增香）'
    ]
  },
  {
    id: 'long_island', name: '长岛冰茶', en: 'Long Island Iced Tea', pop: 9,
    glass: '高球杯', method: '摇和 · 兑和', strength: 3,
    tags: ['浓郁', '甜润', '气泡'],
    desc: '五种基酒伪装成冰茶，入口柔顺清甜，后劲十足，务必慢饮。',
    ingredients: [
      { item: 'vodka', amount: '15ml' },
      { item: 'gin', amount: '15ml' },
      { item: 'white_rum', amount: '15ml' },
      { item: 'tequila', amount: '15ml' },
      { item: 'cointreau', amount: '15ml' },
      { item: 'lemon', amount: '30ml' },
      { item: 'simple', amount: '10ml' },
      { item: 'cola', amount: '30ml（浮色）' }
    ],
    garnish: '柠檬片',
    steps: [
      '除可乐外所有材料加冰摇匀，倒入加满冰的高球杯',
      '顶部缓缓淋入可乐，形成红茶般的色泽',
      '轻轻搅一下即可'
    ]
  },
  {
    id: 'cuba_libre', name: '自由古巴', en: 'Cuba Libre', pop: 8,
    glass: '高球杯', method: '兑和', strength: 1,
    tags: ['甜润', '气泡', '微酸'],
    desc: '黑朗姆的焦糖香撞上可乐气泡，青柠点睛，零失败的入门款。',
    ingredients: [
      { item: 'dark_rum', amount: '50ml' },
      { item: 'cola', amount: '120ml' },
      { item: 'lime', amount: '15ml' }
    ],
    garnish: '青柠角',
    steps: [
      '高球杯加满冰块',
      '倒入黑朗姆与青柠汁',
      '注满可乐，轻轻提拉，饰青柠角'
    ]
  },
  {
    id: 'tequila_sunrise', name: '龙舌兰日出', en: 'Tequila Sunrise', pop: 8,
    glass: '高球杯', method: '兑和', strength: 1,
    tags: ['果香', '甜润'],
    desc: '橙汁的甜润托住龙舌兰，红石榴糖浆沉入杯底，晕出日出渐变。',
    ingredients: [
      { item: 'tequila', amount: '45ml' },
      { item: 'orange', amount: '90ml' },
      { item: 'grenadine', amount: '15ml' }
    ],
    garnish: '橙片 + 樱桃',
    steps: [
      '高球杯加冰，倒入龙舌兰与橙汁，轻轻搅匀',
      '沿杯壁或吧勺背缓缓倒入红石榴糖浆，使其沉入杯底',
      '不要搅拌，保持渐变层次即可'
    ]
  },
  {
    id: 'whiskey_sour', name: '威士忌酸', en: 'Whiskey Sour', pop: 8,
    glass: '古典杯', method: '摇和', strength: 2,
    tags: ['酸甜', '浓郁'],
    desc: '威士忌的橡木香裹着柠檬的明亮酸甜，酸酒家族的经典。',
    ingredients: [
      { item: 'whiskey', amount: '45ml' },
      { item: 'lemon', amount: '30ml' },
      { item: 'simple', amount: '15ml' }
    ],
    garnish: '橙片 + 樱桃',
    steps: [
      '摇酒壶加冰，倒入威士忌、柠檬汁与单糖浆',
      '用力摇 12 秒至壶身结霜',
      '滤入加冰古典杯即可'
    ]
  },
  {
    id: 'old_fashioned', name: '古典', en: 'Old Fashioned', pop: 8,
    glass: '古典杯', method: '搅拌', strength: 3,
    tags: ['浓郁', '苦甜'],
    desc: '糖与苦精（可选）引出威士忌最深的橡木与焦糖香，老成持重。',
    ingredients: [
      { item: 'whiskey', amount: '45ml' },
      { item: 'simple', amount: '10ml' }
    ],
    garnish: '橙皮拧香',
    steps: [
      '杯中加入单糖浆（有安哥斯图拉苦精可加 2 滴）和少许水，搅化',
      '加入威士忌与一块大方冰，搅拌约 30 秒至冰透',
      '有橙皮可拧入精油抹杯口增香，没有也完全不影响'
    ]
  },
  {
    id: 'pina_colada', name: '椰林飘香', en: 'Piña Colada', pop: 8,
    glass: '飓风杯', method: '摇和', strength: 1,
    tags: ['椰香', '果香', '甜润'],
    desc: '椰奶与菠萝的热带漩涡裹着朗姆酒，像把假期喝进嘴里。',
    ingredients: [
      { item: 'white_rum', amount: '50ml' },
      { item: 'coconut', amount: '60ml' },
      { item: 'pineapple', amount: '90ml' },
      { item: 'malibu', amount: '20ml', optional: true }
    ],
    garnish: '菠萝角 + 樱桃',
    steps: [
      '所有材料加冰摇匀（家用搅拌机打 15 秒更绵密）',
      '倒入冰镇飓风杯，可补少许碎冰',
      '插入长勺或吸管即可'
    ]
  },
  {
    id: 'aperol_spritz', name: '阿佩罗橙光', en: 'Aperol Spritz', pop: 8,
    glass: '葡萄酒杯', method: '兑和', strength: 1,
    tags: ['苦甜', '气泡', '果香'],
    desc: '阿佩罗的橙香微苦配上起泡酒的欢腾气泡，午后开胃的第一眼橙光。',
    ingredients: [
      { item: 'aperol', amount: '45ml' },
      { item: 'prosecco', amount: '60ml' },
      { item: 'soda', amount: '30ml' }
    ],
    garnish: '橙片',
    steps: [
      '大葡萄酒杯加满冰块',
      '依次倒入阿佩罗、起泡葡萄酒',
      '补少许苏打水，轻轻搅一圈即可'
    ]
  },
  {
    id: 'cosmo', name: '大都会', en: 'Cosmopolitan', pop: 7,
    glass: '马天尼杯', method: '摇和', strength: 2,
    tags: ['酸甜', '莓果', '果香'],
    desc: '蔓越莓的粉红酸甜配橙酒清香，都市感十足的一杯。',
    ingredients: [
      { item: 'vodka', amount: '40ml' },
      { item: 'cointreau', amount: '15ml' },
      { item: 'cranberry', amount: '30ml' },
      { item: 'lime', amount: '10ml' }
    ],
    garnish: '柠檬皮 / 橙皮',
    steps: [
      '所有材料加冰，摇匀至壶身结霜',
      '双重过滤滤入冰镇马天尼杯即可'
    ]
  },
  {
    id: 'screwdriver', name: '螺丝起子', en: 'Screwdriver', pop: 7,
    glass: '高球杯', method: '兑和', strength: 1,
    tags: ['果香', '甜润'],
    desc: '伏特加藏身于橙汁之中，顺口到不知不觉，小心微醺。',
    ingredients: [
      { item: 'vodka', amount: '45ml' },
      { item: 'orange', amount: '100ml' }
    ],
    garnish: '橙片',
    steps: [
      '高球杯加满冰块',
      '倒入伏特加，注满鲜橙汁，轻轻搅匀即可'
    ]
  },
  {
    id: 'moscow_mule', name: '莫斯科骡子', en: 'Moscow Mule', pop: 7,
    glass: '铜杯 / 高球杯', method: '兑和', strength: 2,
    tags: ['气泡', '辛香', '清爽'],
    desc: '干姜水的辛甜气泡配伏特加与青柠，铜杯里的冰凉刺激。',
    ingredients: [
      { item: 'vodka', amount: '45ml' },
      { item: 'lime', amount: '15ml' },
      { item: 'ginger_ale', amount: '120ml' }
    ],
    garnish: '青柠角 + 薄荷',
    steps: [
      '铜杯（或高球杯）加满冰块',
      '倒入伏特加与青柠汁',
      '注满干姜水轻搅，饰青柠角'
    ]
  },
  {
    id: 'negroni', name: '内格罗尼', en: 'Negroni', pop: 7,
    glass: '古典杯', method: '搅拌', strength: 3,
    tags: ['苦甜', '草本', '浓郁'],
    desc: '金酒、金巴利、甜苦艾三等分，苦甜草本，属于大人的味道。',
    ingredients: [
      { item: 'gin', amount: '30ml' },
      { item: 'campari', amount: '30ml' },
      { item: 'sweet_vermouth', amount: '30ml' }
    ],
    garnish: '橙皮',
    steps: [
      '调酒杯加冰，倒入三种酒',
      '搅拌约 30 秒至充分冰镇',
      '滤入加冰古典杯即可'
    ]
  },
  {
    id: 'martini', name: '干马提尼', en: 'Dry Martini', pop: 7,
    glass: '马天尼杯', method: '搅拌', strength: 3,
    tags: ['干冽', '草本', '浓郁'],
    desc: '金酒与干苦艾的冷冽结合，被誉为鸡尾酒之王。',
    ingredients: [
      { item: 'gin', amount: '60ml' },
      { item: 'dry_vermouth', amount: '10ml' }
    ],
    garnish: '橄榄 / 柠檬皮',
    steps: [
      '调酒杯加冰，倒入金酒与干苦艾',
      '搅拌 30 秒以上至冰透',
      '滤入冰镇马天尼杯即可'
    ]
  },
  {
    id: 'sex_beach', name: '性感海滩', en: 'Sex on the Beach', pop: 7,
    glass: '高球杯', method: '兑和', strength: 1,
    tags: ['果香', '甜润', '莓果'],
    desc: '蜜桃利口酒与橙汁、蔓越莓汁交织，度假风的热带甜。',
    ingredients: [
      { item: 'vodka', amount: '40ml' },
      { item: 'peach', amount: '20ml' },
      { item: 'orange', amount: '60ml' },
      { item: 'cranberry', amount: '60ml' }
    ],
    garnish: '橙片',
    steps: [
      '高球杯加冰，倒入伏特加与水蜜桃利口酒',
      '加入橙汁与蔓越莓汁',
      '轻轻搅匀即可'
    ]
  },
  {
    id: 'daiquiri', name: '黛克瑞', en: 'Daiquiri', pop: 7,
    glass: '马天尼杯', method: '摇和', strength: 2,
    tags: ['酸甜', '清爽'],
    desc: '白朗姆、青柠、糖——最简公式，海明威的最爱。',
    ingredients: [
      { item: 'white_rum', amount: '45ml' },
      { item: 'lime', amount: '20ml' },
      { item: 'simple', amount: '10ml' }
    ],
    garnish: '青柠轮',
    steps: [
      '摇酒壶加冰，倒入所有材料',
      '用力摇匀至壶身结霜',
      '滤入冰镇马天尼杯，饰青柠轮'
    ]
  },
  {
    id: 'french75', name: '法国 75', en: 'French 75', pop: 6,
    glass: '香槟杯', method: '摇和 · 兑和', strength: 2,
    tags: ['酸甜', '气泡', '清爽'],
    desc: '金酒酸打底，浇上冰凉起泡酒，优雅却有野战炮般的杀伤力。',
    ingredients: [
      { item: 'gin', amount: '30ml' },
      { item: 'lemon', amount: '15ml' },
      { item: 'simple', amount: '10ml' },
      { item: 'prosecco', amount: '60ml' }
    ],
    garnish: '柠檬皮',
    steps: [
      '金酒、柠檬汁、单糖浆加冰摇匀',
      '滤入香槟杯',
      '缓缓注满冰镇起泡酒即可'
    ]
  },
  {
    id: 'blue_lagoon', name: '蓝色潟湖', en: 'Blue Lagoon', pop: 6,
    glass: '高球杯', method: '摇和 · 兑和', strength: 2,
    tags: ['果香', '气泡', '清爽'],
    desc: '蓝橙酒调出透亮的蓝，柠檬与气泡让它像海风一样清爽。',
    ingredients: [
      { item: 'vodka', amount: '40ml' },
      { item: 'blue_curacao', amount: '20ml' },
      { item: 'lemon', amount: '20ml' },
      { item: 'soda', amount: '60ml' }
    ],
    garnish: '柠檬片 + 樱桃',
    steps: [
      '伏特加、蓝橙利口酒、柠檬汁加冰摇匀',
      '滤入加满冰的高球杯',
      '补满苏打水，轻搅均匀即可'
    ]
  },
  {
    id: 'tom_collins', name: '汤姆柯林斯', en: 'Tom Collins', pop: 6,
    glass: '柯林杯', method: '摇和 · 兑和', strength: 2,
    tags: ['气泡', '酸甜', '清爽'],
    desc: '柠檬与糖浆摇出金酒酸，再被苏打水点亮成一大杯清凉。',
    ingredients: [
      { item: 'gin', amount: '45ml' },
      { item: 'lemon', amount: '30ml' },
      { item: 'simple', amount: '15ml' },
      { item: 'soda', amount: '60ml' }
    ],
    garnish: '柠檬片',
    steps: [
      '金酒、柠檬汁、单糖浆加冰摇匀',
      '滤入加满冰的柯林杯',
      '补满苏打水，轻搅均匀即可'
    ]
  },
  {
    id: 'vodka_tonic', name: '伏特加汤力', en: 'Vodka Tonic', pop: 6,
    glass: '高球杯', method: '兑和', strength: 2,
    tags: ['气泡', '干冽'],
    desc: '干净利落的一杯，伏特加的冷峻配汤力的微苦，挤青柠更鲜活。',
    ingredients: [
      { item: 'vodka', amount: '45ml' },
      { item: 'tonic', amount: '120ml' }
    ],
    garnish: '青柠角',
    steps: [
      '高球杯加满冰',
      '倒入伏特加，注满汤力水',
      '轻轻提拉即可（有青柠可挤一角增香）'
    ]
  },
  {
    id: 'black_russian', name: '黑色俄罗斯', en: 'Black Russian', pop: 6,
    glass: '古典杯', method: '兑和', strength: 3,
    tags: ['咖啡', '甜润', '浓郁'],
    desc: '咖啡利口酒让伏特加变得深邃，微甜的一杯晚安酒。',
    ingredients: [
      { item: 'vodka', amount: '50ml' },
      { item: 'kahlua', amount: '20ml' }
    ],
    garnish: '无需装饰',
    steps: [
      '古典杯加冰',
      '倒入伏特加与咖啡利口酒',
      '轻轻搅匀即可'
    ]
  },
  {
    id: 'white_russian', name: '白色俄罗斯', en: 'White Russian', pop: 6,
    glass: '古典杯', method: '兑和', strength: 2,
    tags: ['奶香', '咖啡', '浓郁'],
    desc: '漂浮的奶油让咖啡酒变得丝滑，像一杯会醉的液体甜点。',
    ingredients: [
      { item: 'vodka', amount: '50ml' },
      { item: 'kahlua', amount: '20ml' },
      { item: 'cream', amount: '30ml' }
    ],
    garnish: '无需装饰',
    steps: [
      '古典杯加冰，倒入伏特加与咖啡利口酒搅匀',
      '将淡奶油（或牛奶）缓缓倒在吧勺背上浮于上层',
      '饮用前轻轻搅拌，享受渐层口感'
    ]
  },
  {
    id: 'b52', name: 'B-52 轰炸机', en: 'B-52', pop: 6,
    glass: '子弹杯', method: '分层兑和', strength: 3,
    tags: ['咖啡', '奶香', '甜润'],
    desc: '咖啡、奶油、橙酒三色分层，一口下去甜暖浓烈，派对明星。',
    ingredients: [
      { item: 'kahlua', amount: '20ml' },
      { item: 'baileys', amount: '20ml' },
      { item: 'cointreau', amount: '20ml' }
    ],
    garnish: '无需装饰',
    steps: [
      '子弹杯中先倒入咖啡利口酒',
      '用吧勺背抵住杯壁，缓缓注入百利甜，浮在第二层',
      '同样手法注入橙味利口酒做第三层，一口饮尽'
    ]
  },
  {
    id: 'mai_tai', name: '迈泰', en: 'Mai Tai', pop: 6,
    glass: '古典杯', method: '摇和', strength: 3,
    tags: ['浓郁', '果香', '酸甜'],
    desc: '双朗姆与橙酒、甜香交织的提基经典，一口飞到热带。',
    ingredients: [
      { item: 'white_rum', amount: '30ml' },
      { item: 'dark_rum', amount: '30ml' },
      { item: 'cointreau', amount: '15ml' },
      { item: 'lime', amount: '20ml' },
      { item: 'grenadine', amount: '10ml' }
    ],
    garnish: '薄荷嫩枝 + 青柠角',
    steps: [
      '所有材料加冰摇匀',
      '连酒带冰倒入古典杯',
      '点缀青柠角（有薄荷叶可加嫩枝）'
    ]
  },
  {
    id: 'manhattan', name: '曼哈顿', en: 'Manhattan', pop: 6,
    glass: '马天尼杯', method: '搅拌', strength: 3,
    tags: ['浓郁', '苦甜'],
    desc: '威士忌与甜苦艾的经典联姻，醇厚里带一丝草本甜。',
    ingredients: [
      { item: 'whiskey', amount: '50ml' },
      { item: 'sweet_vermouth', amount: '20ml' }
    ],
    garnish: '马拉斯奇诺樱桃',
    steps: [
      '调酒杯加冰，倒入威士忌与甜苦艾',
      '搅拌约 30 秒至冰透',
      '滤入冰镇马天尼杯即可'
    ]
  },
  {
    id: 'godfather', name: '教父', en: 'Godfather', pop: 5,
    glass: '古典杯', method: '搅拌', strength: 3,
    tags: ['坚果', '甜润', '浓郁'],
    desc: '杏仁利口酒的坚果甜融入威士忌，像电影一样沉稳有力。',
    ingredients: [
      { item: 'whiskey', amount: '45ml' },
      { item: 'amaretto', amount: '15ml' }
    ],
    garnish: '橙皮（可选）',
    steps: [
      '古典杯加冰',
      '倒入威士忌与杏仁利口酒',
      '轻轻搅拌 15 秒即可'
    ]
  },
  {
    id: 'sidecar', name: '侧车', en: 'Sidecar', pop: 5,
    glass: '马天尼杯', method: '摇和', strength: 2,
    tags: ['酸甜', '浓郁', '果香'],
    desc: '白兰地的醇厚果香配橙酒与柠檬，一战时期的复古优雅。',
    ingredients: [
      { item: 'brandy', amount: '40ml' },
      { item: 'cointreau', amount: '20ml' },
      { item: 'lemon', amount: '20ml' }
    ],
    garnish: '糖边 + 橙皮',
    steps: [
      '杯口可蘸糖边',
      '所有材料加冰摇匀',
      '滤入冰镇马天尼杯即可'
    ]
  },
  {
    id: 'sea_breeze', name: '海风', en: 'Sea Breeze', pop: 5,
    glass: '高球杯', method: '兑和', strength: 1,
    tags: ['莓果', '微酸', '清爽'],
    desc: '蔓越莓的酸与西柚的微苦相遇，清爽如海边晚风。',
    ingredients: [
      { item: 'vodka', amount: '40ml' },
      { item: 'cranberry', amount: '90ml' },
      { item: 'grapefruit', amount: '60ml' }
    ],
    garnish: '西柚片',
    steps: [
      '高球杯加冰',
      '倒入伏特加，加入蔓越莓汁与西柚汁',
      '轻轻搅匀，饰西柚片'
    ]
  },
  {
    id: 'mint_julep', name: '薄荷茱莉普', en: 'Mint Julep', pop: 5,
    glass: '古典杯（金属杯更佳）', method: '捣压', strength: 3,
    tags: ['薄荷', '浓郁', '甜润'],
    desc: '薄荷与糖在杯底捣香，波本威士忌冰凉浓烈，肯塔基的夏日。',
    ingredients: [
      { item: 'whiskey', amount: '60ml' },
      { item: 'mint', amount: '8 片' },
      { item: 'simple', amount: '12ml' }
    ],
    garnish: '大束薄荷嫩枝',
    steps: [
      '薄荷叶与单糖浆放入杯底轻捣出香',
      '加碎冰与威士忌，搅拌至杯外壁挂霜',
      '补满碎冰堆成小山，大束插薄荷嫩枝'
    ]
  },
  {
    id: 'bees_knees', name: '蜜蜂的膝盖', en: "Bee's Knees", pop: 4,
    glass: '马天尼杯', method: '摇和', strength: 2,
    tags: ['酸甜', '甜润'],
    desc: '用蜂蜜代替糖浆，让金酒酸多了一层花香与圆润。',
    ingredients: [
      { item: 'gin', amount: '45ml' },
      { item: 'lemon', amount: '20ml' },
      { item: 'honey', amount: '15ml' }
    ],
    garnish: '柠檬皮',
    steps: [
      '蜂蜜先用少量温水调稀成蜂蜜糖浆',
      '与金酒、柠檬汁一起加冰摇匀',
      '滤入冰镇杯中即可'
    ]
  },
  {
    id: 'elderflower_fizz', name: '接骨木花香菲士', en: 'Elderflower Gin Fizz', pop: 6,
    glass: '高球杯', method: '摇和 · 兑和', strength: 2,
    tags: ['花香', '清爽', '气泡', '酸甜'],
    desc: '接骨木花糖浆带着清雅的荔枝般花香，与金酒、柠檬和气泡交织成一杯轻盈花香调。',
    ingredients: [
      { item: 'gin', amount: '40ml' },
      { item: 'elderflower', amount: '20ml' },
      { item: 'lemon', amount: '20ml' },
      { item: 'soda', amount: '60ml' }
    ],
    garnish: '柠檬片 + 薄荷嫩枝',
    steps: [
      '金酒、接骨木花糖浆与柠檬汁加冰摇匀',
      '滤入加满冰的高球杯',
      '补满苏打水，轻搅均匀即可'
    ]
  },
  {
    id: 'hugo_spritz', name: '雨果气泡', en: 'Hugo Spritz', pop: 6,
    glass: '葡萄酒杯', method: '兑和', strength: 1,
    tags: ['花香', '气泡', '薄荷', '清爽'],
    desc: '阿尔卑斯山区的开胃气泡，接骨木花香与薄荷清凉在起泡酒里轻盈绽放。',
    ingredients: [
      { item: 'prosecco', amount: '60ml' },
      { item: 'elderflower', amount: '20ml' },
      { item: 'soda', amount: '30ml' },
      { item: 'mint', amount: '5–6 片' }
    ],
    garnish: '薄荷嫩枝',
    steps: [
      '葡萄酒杯中放入薄荷叶与接骨木花糖浆，轻压出香',
      '加满冰块，倒入起泡葡萄酒',
      '补少许苏打水，轻搅一圈，点缀薄荷嫩枝'
    ]
  },
  {
    id: 'passion_fruit_fizz', name: '百香果菲士', en: 'Passion Fruit Fizz', pop: 6,
    glass: '高球杯', method: '摇和 · 兑和', strength: 2,
    tags: ['果香', '酸甜', '气泡', '清爽'],
    desc: '百香果糖浆的热带酸甜裹着伏特加，再被苏打水点亮，一口入夏。',
    ingredients: [
      { item: 'vodka', amount: '45ml' },
      { item: 'passionfruit', amount: '25ml' },
      { item: 'lime', amount: '15ml' },
      { item: 'soda', amount: '60ml' }
    ],
    garnish: '青柠角',
    steps: [
      '伏特加、百香果糖浆与青柠汁加冰摇匀',
      '滤入加满冰的高球杯',
      '补满苏打水，轻搅均匀，点缀青柠角'
    ]
  },
  {
    id: 'passion_martini', name: '百香果马提尼', en: 'Passion Fruit Martini', pop: 6,
    glass: '马天尼杯', method: '摇和', strength: 2,
    tags: ['果香', '酸甜'],
    desc: '百香果的明亮酸甜把伏特加点亮，摇匀后果香扑鼻，派对感十足。',
    ingredients: [
      { item: 'vodka', amount: '45ml' },
      { item: 'passionfruit', amount: '25ml' },
      { item: 'lime', amount: '15ml' },
      { item: 'prosecco', amount: '20ml', optional: true }
    ],
    garnish: '无需装饰',
    steps: [
      '伏特加、百香果糖浆与青柠汁加冰，用力摇匀至壶身结霜',
      '双重过滤滤入冰镇马天尼杯',
      '备有起泡酒时，可在杯顶浮少量增加气泡感'
    ]
  }
]
