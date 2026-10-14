# 变更记录（Changelog）

本文件记录项目的重要改动，便于后续回溯。**按版本归档，最新在最上。**

## 版本约定

- 版本号采用 `v主.次.补`（当前处于 `0.x` 阶段）：新增功能 / 行为不兼容 → 升**次**版本；小改动 / 修复 → 升**补**版本。
- 每条记录标题统一为：`## vX.Y.Z · YYYY-MM-DD · 一句话摘要`。
- 新增记录时，在「版本一览」表格顶部插入一行，并把记录追加到文件最上方。

## 版本一览

| 版本 | 日期 | 摘要 |
| --- | --- | --- |
| v0.3.0 | 2026-10-14 | 推荐系统：统一量纲（tagFit 归一化）与画像质量提升 |
| v0.2.0 | 2026-10-14 | 推荐系统：本地口味画像与个性化排序（含日志埋点、开发工具与单测） |

> 备注：本文档版本线与 `package.json` 的 `version` 保持一致，当前均为 `0.3.0`。

---

## v0.3.0 · 2026-10-14 · 推荐系统：统一量纲与画像质量提升

**范围**：纯算法改动（不改 UI / 存储），修掉 v0.2.0 遗留的"分项量纲不一致"问题 —— 它是"金汤力 vs 法国75 仅差 0.024"脆弱性的根因。

### 变更

1. **标签契合归一化**：`tagFit` 由「标签权重累加」改为「**命中标签的平均权重**」（∈ −1~1），各分项量纲统一，不再"标签多的酒天然占优"。
2. **重新配平权重**（量纲统一后不再需要极端值）：

   | 常量 | v0.2.0 | v0.3.0 |
   | --- | --- | --- |
   | `LIKED_BONUS` | 1.7 | **1.1** |
   | `DISLIKED_PENALTY` | −1.5 | **−1.0** |

   其余（`K_TAG` / `K_STRENGTH` / `K_BASE` / `PENALTY_MADE` / `BONUS_NOVEL`）不变。等效排序保持：好评过(+0.8) > 没喝过(+0.4) > 做过未评(−0.3) > 差评过(−1.3)。
3. **rating 语义细分**：`TasteProfile` 新增 `averageKeys`，把"打过一般"与"只做过没评"分开；理由文案新增 `你上次觉得一般`。
4. **稳定性验证**：金汤力 vs 法国75 的分差由 **0.024 → 0.08**，排序不再轻易翻转。

### 文件

- `src/utils/taste.ts`：`tagFit` 归一化、`LIKED_BONUS` / `DISLIKED_PENALTY` 配平、`averageKeys`、理由文案。
- `src/types/index.ts`：`TasteProfile` 新增 `averageKeys`。
- 测试：新增 3 个用例（标签契合 ∈ [−1,1]、一般/未评分作文案、金汤力−法国75 分差 > 0.05），共 **45 个用例**全通过。
- 文档：README §6 公式与权重、§10 用例数更新。
- `package.json`：版本 → `0.3.0`。

### 行为影响

回归锁（金汤力 ≤ #5、莫吉托 ≤ #3）**保持不变**：用例③ 现为 汤姆柯林斯#1 / 莫吉托#2 / 百香果菲士#3 / 金汤力#4。整体排序与 v0.2.0 大体一致，但"心头好"不再依赖 `1.7` 的极端权重。

### 已知取舍 / 后续

- 基酒契合权重 `K_BASE=0.4` 在归一化后占比相对上升（tagFit 量级下降），后续可结合真实数据再校准。
- 仍未做：材料级偏好、探索策略升级（MAB）、协同过滤（见 v0.2.0 待办）。

---

## v0.2.0 · 2026-10-14 · 推荐系统：本地口味画像与个性化排序

**范围**：在「一键生成 / 口味问答」之上，新增一套**本地、离线、越用越聪明**的推荐逻辑（L1 方案：口味画像 + 个性化排序），并配套开发工具与单元测试。不依赖任何后端 / 云开发。

**目标**：更懂口味 > 发现新品不重复 > 提升记录留存（前期确权的优先级）。

### 一、新增文件

| 文件 | 作用 |
| --- | --- |
| `src/utils/taste.ts` | **推荐核心**：`buildTasteProfile` 口味画像、`scoreTaste` 个性化打分（返回 `parts` 分数拆解，供日志与测试断言）、`mainBase` 主基酒识别 |
| `src/utils/logger.ts` | 分级日志（debug/info/warn/error），默认开发打 info、生产打 warn，可用 `setLogLevel` 调整 |
| `scripts/rec-demo.ts` | 推荐系统离线调试工具（10 组 mock 用户画像 + 分数拆解 + 目标校验） |
| `scripts/tsconfig.json` | 供 ts-node 解析 `@/` 别名 |
| `tests/fixtures.ts` | 测试公用数据（酒柜、配方、记录构造） |
| `tests/taste.test.ts` | 画像与打分测试 |
| `tests/bar.test.ts` | 排序与调度测试 |
| `tests/logger.test.ts` | 日志级别测试 |
| `tests/personas.test.ts` | 各类用户群体 + 全局不变量测试 |
| `tests/tsconfig.json` | 测试用 ts-node 配置 |

### 二、修改文件

| 文件 | 改动 |
| --- | --- |
| `src/types/index.ts` | `Scored` 增加 `reasons`；新增 `TasteProfile`（tags / strengths / bases / madeKeys / likedKeys / dislikedKeys / samples） |
| `src/utils/bar.ts` | `planGenerate` 接收可选 `profile` 并接入个性化；新增 `personalize` / `arrangeExplore` / `pickPreferred` / `brief`；`near`（待补齐清单）改为个性化排序；修复创意特调自定义基酒重名 |
| `src/store/useBarStore.ts` | 新增持久化 `quizAnswers`(`homebar-quiz-v1`)、`views`(`homebar-views-v1`) 及动作 `saveQuiz` / `bumpView` |
| `src/pages/bar/index.tsx` | 派生口味画像（`useMemo`）、记录签名触发重算、打开详情时 `bumpView`、传入 `profile`；删除无用变量 `makeableCount` |
| `src/subpages/quiz/index.tsx` | 答完问卷调用 `saveQuiz` 落库（作为画像冷启动先验） |
| `src/components/RecipeCard/index.tsx` + `.module.scss` | 渲染个性化理由 chip（`✧ 因为 清爽` 等） |
| `package.json` | 新增脚本 `rec:demo`、`test:unit`；`version` 由 `1.0.0` 改为 `0.2.0`（与本文档对齐） |
| `tsconfig.json` | `baseUrl` 由 `""` 改为 `"."`；`include` 加入 `scripts`、`tests` |
| `README.md` | 新增「推荐系统」「开发工具与测试」两节，修正目录结构与过时描述 |

### 三、权重与参数（`src/utils/taste.ts`）

| 常量 | 初值 | 终值 | 说明 |
| --- | --- | --- | --- |
| `RATING_DELTA.recommend` | +2 | +2 | 好评（最强正向） |
| `RATING_DELTA.average` | +0.5 | +0.5 | 一般 |
| `RATING_DELTA.bad` | −2 | −2 | 差评（最强负向） |
| `RATING_DELTA.made` | +0.5 | +0.5 | 做过但没评分 |
| `RATING_DELTA.open` | +0.2 | +0.2 | 浏览详情（隐式，累计上限 3 次） |
| `DECAY` | 0.95 | 0.95 | 时间衰减，越新权重越大 |
| `SEED` | 1.0 | 1.0 | 问卷先验强度 |
| `K_TAG` | 1.0 | 1.0 | 标签契合权重 |
| `K_STRENGTH` | 0.6 | 0.6 | 度数契合权重 |
| `K_BASE` | 0.4 | 0.4 | 基酒契合权重 |
| `PENALTY_MADE` | −1.2 | **−0.3** | 从"重度降权"调为"温和降权"，避免埋没心头好 |
| `BONUS_NOVEL` | 0.8 | **0.4** | 下调，让好评老歌更靠前 |
| `LIKED_BONUS` | — | **1.7** | 新增；明确好评的配方额外加权（迭代中试过 1.2 → 1.4 → 1.7） |
| `DISLIKED_PENALTY` | — | **−1.5** | 新增；明确差评的配方直接压制，避免重复推荐 |

**行为语义变化**：`baseFit` 由"带符号"改为**只算正向**（`Math.max(0, w)`），避免"白朗姆底的好评款"被其他白朗姆差评连累。
**等效排序**：好评过（+1.4）> 没喝过（+0.4）> 做过未评（−0.3）> 差评过（−1.8）。

### 四、算法与行为变更

1. **画像构建**（`buildTasteProfile`）：按时间排序行为事件，带衰减累加；问卷答卷作为先验注入；标签 / 度数 / 基酒均归一化到 `[-1, 1]`。
2. **前 3 席调度**（`arrangeExplore`，`bar.ts` 的 `TOP_SIZE = 3`），经三轮演进后定为：
   - 第 1 位：总分最高；
   - 回归位：做过且**打过好评**里分最高的（无好评时退化为"做过且合口味"）；
   - 探索位：**没喝过且合口味**（`!made && tagFit > 0`）；
   - 三者**尽量错开主基酒**，候选不足时自然退化；
   - 第 4 位起严格按总分降序。
3. **待补齐清单个性化**：`near` 由"缺料数 → 热度"改为"缺料数 → 口味分 → 热度"。
4. **可解释理由**：卡片展示 `因为 X` / `没喝过，试个新鲜` / `你上次给了好评` / `你上次不太喜欢`。
5. **冷启动退化**：无任何信号时画像全 0，排序退回按热度 `pop`，行为与改造前一致（零回归）。

### 五、日志埋点（排查排序用）

| scope | 级别 | 内容 |
| --- | --- | --- |
| `taste:profile` | info | 画像摘要（样本数、好评/差评数、tags/strengths/bases） |
| `taste:mainBase` | debug | 主基酒识别 |
| `taste:baseFit` | debug | 每个正向基酒贡献 |
| `taste:novelty` | debug | 做过 / 没喝过的新鲜度判定 |
| `taste:liked` / `taste:disliked` | debug | 好评加权 / 差评压制命中 |
| `taste:score` | debug | 单卡完整分数拆解 |
| `rec:arrange` / `rec:diversity` | info | 槽位选择、基酒错开决策 |
| `rec:plan` | info | 最终前 5 名及分数拆解 |

查看方式：`npm run rec:demo -- 3 --log=info`（或 `--log=debug`）。

### 六、测试与工具

- **命令**：`npm run test:unit`（Node 内置 `node:test`，零新增依赖）、`npm run rec:demo`。
- **规模**：**42 个用例**，4 个测试文件 + 公用 fixture（`tests/fixtures.ts`）。

| 测试文件 | 用例数 | 覆盖 |
| --- | --- | --- |
| `tests/taste.test.ts` | 12 | 冷启动全 0、好评/差评正负向、`likedKeys`、归一化到 ±1、问卷先验、时间衰减、**基酒只算正向**、做过降权与理由文案、**好评加权**、**差评压制**、分数=分项之和、`mainBase` |
| `tests/bar.test.ts` | 9 | 缺料计数、满库存可调、空库存 empty、冷启动按 pop 且无理由、前三席含回归款+探索款且基酒互不相同、全做过优雅退化、**待补齐清单排序**、**回归锁（用例③）**、`recipeKey` |
| `tests/logger.test.ts` | 1 | info 级别过滤 debug、debug 级别放行 |
| `tests/personas.test.ts` | 20 | 6 个标签群体（甜食/果味/苦味/清爽/草本/气泡）+ 低度党、高度党、老好人（全 average）、苛刻用户、**差评款即使合口味也不进前 5**、只浏览不下单、单条记录、重度用户保留探索位、同基酒偏好、问卷全「都行」、备料党、自定义材料命名 + 2 条全局不变量（无重复且全可调、第 4 位起分数严格降序） |

- **回归锁**：用例③固化结论 —— 金汤力 ≤ #5、莫吉托 ≤ #3（`tests/bar.test.ts`、`scripts/rec-demo.ts` 的 `expect`）。
- **demo 用例**（10 组，定义于 `scripts/rec-demo.ts`）：冷启动 / 仅答卷 / 清爽派 / 甜润派 / 踩雷多 / 重度用户 / 空酒柜 / 自定义材料 / 问卷全「都行」/ 只爱低度。

### 七、修复与清理

- 修复创意特调**自定义基酒重名**（如 `梅斯卡尔梅斯卡尔冰醇`），`creativeName` 的自定义风味兜底排除基酒本身。
- 删除 `bar` 页未使用的 `makeableCount` 及其 `scoreRecipes` 导入。
- 修正 `tsconfig.json` 的 `baseUrl`（`""` → `"."`），消除编辑器对 `@/` 的解析报错。

### 八、验证方式

```bash
npm run test:unit     # 42 passed
npm run build:weapp   # Compiled successfully
npm run rec:demo      # 10 组用例排序与分数拆解
```

### 九、已知取舍 / 后续待办

- **脆弱点**：用例③中金汤力 vs 法国75 仅领先 ~0.024 分，属"险胜"；靠回归测试锁住，暂不调权重，留待真实数据校准。
- **信号量是瓶颈**：目前隐式信号只有 `views`（详情页打开），下一步性价比更高的是扩充隐式行为（换一换跳过、曝光时长、收藏），而非继续调权重。
- **`LIKED_BONUS=1.7` 偏重复购**：若要加大新品曝光，回调至 ~1.4 即可（回归测试会提示金汤力掉出前 5）。
- 后续可选：排序快照测试、跨端文案一致性、性能护栏测试。

---
