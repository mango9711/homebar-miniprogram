# HomeBar 家庭调酒台

一个帮你「用家里现有的酒和饮料，调出今晚能喝的一杯」的微信小程序。

整个 App 只有两个动作：**先去「Wine Cabinet（酒柜）」勾选家里有什么**（伏特加？金酒？柠檬？可乐？），**再到「Bar（调酒）」点一下按钮**。然后它就会：

- 根据你酒柜里的库存，优先找出**材料齐全的经典鸡尾酒**（比如莫吉托、金汤力）；
- 如果经典款凑不齐，就用你有的材料**现场即兴生成创意特调**；
- 告诉你还差哪几样材料就能解锁某款经典配方；
- 把每次调过的酒、评分、心得和照片记录下来，还能看调酒日历。

你勾选的酒柜库存会**自动保存在本机**，下次打开不用重新设置。

> 这份文档是写给**零基础开发者**的。跟着一步步做，你就能把这个项目在电脑上跑起来。

---

## 目录

1. [先认识几个名词](#1-先认识几个名词)
2. [准备环境](#2-准备环境)
3. [把项目跑起来](#3-把项目跑起来)
4. [项目结构地图](#4-项目结构地图)
5. [它是怎么工作的](#5-它是怎么工作的)
6. [常见修改：加一款配方](#6-常见修改加一款配方)
7. [数据存在哪里](#7-数据存在哪里)
8. [常见问题排查](#8-常见问题排查)

---

## 1. 先认识几个名词

如果你是纯新手，先花 1 分钟认识这几个词，后面就不会懵：

| 名词 | 用大白话解释 |
| --- | --- |
| **小程序** | 不用下载安装、在微信里点开就能用的应用。 |
| **微信开发者工具** | 微信官方提供的一个软件，用来预览和调试小程序。必须装。 |
| **Node.js / npm** | 让电脑能运行 JavaScript 代码、安装别人写好的代码包的工具。npm 会随 Node.js 一起装好。 |
| **Taro** | 一套「写一次，能编译成微信小程序 / 网页 / 其他小程序」的框架。本项目用的就是它。 |
| **React** | 用来描述界面长什么样的工具。界面的每一块都写成一个「组件」。 |
| **TypeScript** | 加了类型检查的 JavaScript。能帮你在写错时提前报错。 |
| **SCSS** | 一种更好写的 CSS（负责颜色的、布局的样式语言）。 |
| **终端 / 命令行** | 一个可以用打字的方式给电脑下命令的窗口。macOS 里叫「终端（Terminal）」。 |

不用现在就完全搞懂，知道它们大致是什么就行。

---

## 2. 准备环境

你需要装两样东西：

### ① Node.js

去 [nodejs.org](https://nodejs.org/) 下载 **LTS（长期支持）版本**，一路点「下一步」安装即可。建议 Node 18 或 20。

装完后打开终端，输入下面的命令验证（能打印出版本号就成功了）：

```bash
node -v
npm -v
```

### ② 微信开发者工具

去微信官方文档下载稳定版并安装：

- 官网：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

安装后先打开一次并**扫码登录**（用你自己的微信即可）。

---

## 3. 把项目跑起来

这一节是**手把手步骤**，从头到尾照着做即可。全程只需要复制粘贴命令、在指定位置点按钮。

### 第 0 步：打开终端（命令行窗口）

- **macOS**：按 `Command + 空格` 打开聚焦搜索，输入 `终端` 或 `Terminal`，回车。
- 或者：打开「访达 → 应用程序 → 实用工具 → 终端」。

打开后会看到一个可以打字的窗口，这就是终端。下面所有命令都粘贴到这里，按回车执行。

### 第 1 步：检查环境是否装好

先确认 Node.js 和 npm 可用：

```bash
node -v
npm -v
```

**预期结果**：两行版本号，例如：

```text
v20.11.1
10.2.4
```

- 只要 `v18` 或更高即可（推荐 18 / 20）。
- 如果提示 `command not found`，说明 Node.js 没装好，回到[第 2 节](#2-准备环境)重新安装，并**重开一次终端**。

### 第 2 步：进入项目文件夹

在终端里进入项目所在目录（`cd` 就是 change directory「切换目录」）：

```bash
cd /Users/yaohui/yaohui-workspace/homebar-miniprogram
```

**验证是否成功**：执行下面的命令，能列出 `package.json`、`src` 等文件就对了。

```bash
ls
```

### 第 3 步：安装依赖（只需做一次）

```bash
npm install
```

**这一步在做什么**：把项目需要的所有第三方代码包（React、Taro 等）下载到本地的 `node_modules` 文件夹。

**预期结果**：终端刷过一阵下载信息，最后没有红色 `ERR!` 报错，并出现类似 `added 1200 packages in 60s` 的提示。

**验证是否成功**：

```bash
ls node_modules
```

能看到一堆文件夹就说明安装完成。

> 卡住不动或报网络错误？换成国内镜像后重试：
>
> ```bash
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

---

### 第 4 步：选择一种方式启动

项目支持两种运行形态。**新手强烈建议先跑网页版（H5）**，不需要微信开发者工具，最快看到效果。跑通之后再试小程序版。

---

#### 方式 A：网页版（H5）——新手推荐

**A-1. 启动开发服务器**

```bash
npm run dev:h5
```

**A-2. 等待编译完成**

首次启动需要编译，等终端出现类似下面的提示：

```text
Compiled successfully
监听文件变化中...
```

> 只要终端停在「监听」状态、没有退出，就说明服务在正常运行。**这个终端窗口要一直开着**，关掉它服务就停了。

**A-3. 在浏览器打开**

打开浏览器，访问终端里提示的地址，Taro 默认是：

```text
http://localhost:10086
```

**预期结果**：看到「今晚喝什么」页面，标题是墨绿色、背景是暖米色，底部有 `Bar` / `Wine Cabinet` / `Me` 三个 Tab。

**A-4. 动手试试（确认功能正常）**

1. 点底部 `Wine Cabinet` 页签，进入「我的酒柜」；
2. 点「一键填入常见酒柜」按钮（或者手动勾选你家里有的材料）；
3. 切回 `Bar` 页签，顶部数字「N 款经典配方现在就能调」应该随之变化；
4. 点底部「生成调酒清单」按钮；
5. 应该会滚到下方，出现若干张配方卡片。

**A-5. 改代码会怎样**

保持 `npm run dev:h5` 运行，随便改一下 `src` 里的文字并保存，浏览器会**自动刷新**，不用重启命令。

**A-6. 停止运行**

回到运行命令的终端，按 `Ctrl + C`（macOS 上是 `Control + C`）。下次要用再执行一次 `npm run dev:h5` 即可。

---

#### 方式 B：微信小程序版

小程序版需要**两个东西同时运行**：一个负责把代码编译出来（终端命令），一个负责显示（微信开发者工具）。

**B-1. 启动编译（终端）**

```bash
npm run dev:weapp
```

这条命令会把代码编译到 `dist/` 文件夹，然后**保持监听**，你改代码它会自动重新编译。

**B-2. 等待首次编译完成**

终端出现完成提示、且不再滚动即可。

**B-3. 验证产物已生成**

```bash
ls dist
```

能看到 `app.js`、`app.json` 等文件（这就是微信小程序真正运行的代码）就说明编译成功。

> 一定要**先做完 B-1 和 B-2**，再打开开发者工具。否则 `dist/` 不存在，开发者工具会报错。

**B-4. 导入项目到微信开发者工具**

1. 打开**微信开发者工具**，用微信扫码登录；
2. 左侧选择「小程序」→ 点击「**+**」或「导入项目」；
3. **项目目录**：填项目根目录 `/Users/yaohui/yaohui-workspace/homebar-miniprogram`
   （**不是** `dist` 文件夹！工具会自动读根目录的 `project.config.json`，里面已指定代码在 `dist/` 下）；
4. **AppID**：填 `wx4b88b5cc00ead95a`；没有的话选「测试号」也能跑；
5. 点击「导入」。

**B-5. 看效果**

导入后，开发者工具左侧的**模拟器**里就会出现小程序界面。第一次加载可能要点一下工具栏的「编译」。

**B-6. 改代码会怎样**

保持 `npm run dev:weapp` 运行，改完 `src` 里的代码保存，终端会自动重新编译，开发者工具里点一下「编译」（或等它自动刷新）就能看到变化。

**B-7. 在真机上预览（可选）**

点开发者工具右上角的「**预览**」，会生成一个二维码，用微信扫码就能在自己手机上体验。

**B-8. 停止运行**

- 终端里的 `npm run dev:weapp`：按 `Ctrl + C` 停止；
- 微信开发者工具：直接关闭窗口即可。

---

### 一次成功的启动应该长这样

按方式 A（H5）为例，从头到尾的完整命令：

```bash
# 1. 进入项目目录
cd /Users/yaohui/yaohui-workspace/homebar-miniprogram

# 2. 安装依赖（只需第一次）
npm install

# 3. 启动网页版开发服务器
npm run dev:h5

# 4. 浏览器打开 http://localhost:10086
#    看到「今晚喝什么」页面 = 成功

# 5. 结束：在终端按 Ctrl + C
```

按方式 B（小程序）为例：

```bash
# 1. 进入项目目录
cd /Users/yaohui/yaohui-workspace/homebar-miniprogram

# 2. 安装依赖（只需第一次）
npm install

# 3. 编译并监听 → 产物输出到 dist/
npm run dev:weapp

# 4. 另开微信开发者工具，导入项目根目录
#    AppID: wx4b88b5cc00ead95a

# 5. 结束：终端按 Ctrl + C，关闭开发者工具
```

### 常用命令速查

| 命令 | 作用 | 什么时候用 |
| --- | --- | --- |
| `npm install` | 安装依赖 | 第一次拉取项目后，只做一次 |
| `npm run dev:h5` | 启动网页版开发模式（热更新） | 日常开发、快速验证界面 |
| `npm run dev:weapp` | 启动小程序开发模式（编译到 `dist/` 并监听） | 开发微信小程序 |
| `npm run build:h5` | 打包网页版（压缩优化） | 部署上线前 |
| `npm run build:weapp` | 打包微信小程序（压缩优化） | 上传发布前 |

> `dev:*` 是**开发模式**（不压缩、改代码自动重编译，会一直运行直到你 `Ctrl + C`）；`build:*` 是**打包模式**（压缩优化、跑完就退出），别搞混。

> 项目还配置了字节跳动（`tt`）、支付宝（`alipay`）等平台，但本项目的界面和逻辑主要是针对微信小程序 + H5 调好的。

---

## 4. 项目结构地图

先看整体，再逐个解释。带 ⭐ 的是你最需要关心的文件。

```text
homebar-miniprogram/
├── config/                 # Taro 编译配置（一般不用改）
│   ├── index.ts            #   主配置：设计稿宽度、CSS Modules、路径别名等
│   ├── dev.ts              #   开发环境配置
│   └── prod.ts             #   生产环境配置
│
├── src/                    # ⭐ 所有源代码都在这
│   ├── app.tsx             # 应用入口（类似「总开关」）
│   ├── app.config.ts       # ⭐ 全局配置：有哪些页面、底部 Tab、导航栏颜色
│   ├── app.scss            # 全局样式
│   │
│   ├── pages/              # ⭐ 页面（一个文件夹 = 一个页面）
│   │   ├── bar/            #   调酒：生成酒单（Tab 第 1 个，也是默认首页）
│   │   ├── cabinet/        #   酒柜：维护原料库存（Tab 第 2 个）
│   │   ├── me/             #   我的：个人信息 + 调酒记录（Tab 第 3 个）
│   │   ├── recipe/         #   配方详情：用量、步骤、记录心得
│   │   └── calendar/       #   调酒日历
│   │
│   ├── components/         # 可复用的界面组件
│   │   └── RecipeCard/     #   酒单里一张一张的配方卡片
│   │
│   ├── data/               # ⭐ 静态数据
│   │   ├── recipes.ts      #   内置的经典鸡尾酒配方（想加配方改这里）
│   │   ├── categories.ts   #   原料分类与清单（基酒、利口酒、糖浆、果汁…）
│   │   └── tagColors.ts    #   风味标签的颜色、评分样式
│   │
│   ├── store/              # 全局状态（数据仓库）
│   │   └── useBarStore.ts  # ⭐ 酒柜勾选、自定义原料、记录、资料都存这儿
│   │
│   ├── utils/              # 工具函数（纯逻辑，不含界面）
│   │   ├── bar.ts          # ⭐ 核心算法：匹配打分 + 创意调酒生成器
│   │   └── image.ts        #   选择并压缩照片
│   │
│   ├── services/
│   │   └── cloud.ts        # 云函数调用封装（当前项目本地即可运行，见第 7 节）
│   │
│   ├── styles/             # 主题色、公共样式变量
│   │   ├── theme.scss      # ⭐ 全站配色定义（墨绿 / 香槟金 / 暖米纸）
│   │   └── variables.scss  #   尺寸、字体等变量
│   │
│   ├── types/
│   │   └── index.ts        # ⭐ 所有数据结构的「类型定义」（配方长什么样…）
│   │
│   └── assets/             # 图片资源（底部 Tab 图标等）
│
├── types/global.d.ts       # 全局类型声明
├── package.json            # 项目说明 + 依赖清单 + 可用命令
├── project.config.json     # ⭐ 微信开发者工具的配置（AppID、代码目录等）
└── tsconfig.json           # TypeScript 配置（含 @ 路径别名）
```

### 路径别名 `@`

项目里你会经常看到这样的写法：

```ts
import useBarStore from '@/store/useBarStore'
```

`@` 代表 `src/` 目录。这是 `tsconfig.json` 里配的，好处是无论文件在多深的地方，都能用 `@/...` 直接引用，不用写一堆 `../../..`。

---

## 5. 它是怎么工作的

### 两个 Tab 的分工

界面把「备料」和「调酒」拆成了两件事，各占一个 Tab：

| Tab | 管什么 | 关键点 |
| --- | --- | --- |
| **Wine Cabinet（酒柜）** | 只负责**维护原料库存**：搜索、勾选、新增自定义原料、清空 | 每次改动都会立刻存到本机 |
| **Bar（调酒）** | 只负责**调酒这个动作**：生成酒单、换一换、看配方详情 | 能调哪些酒完全由酒柜库存决定，这里**不**改库存 |

这样拆开之后，你在 Bar 页不用再关心「我家里有什么材料」，它只回答「现在能调什么」。

### 页面关系

```text
底部 Tab
├── Wine Cabinet（酒柜）── 勾选、维护家里的原料库存
│            │
│            └─ 库存自动存到本机 ──▶ Bar 页读取后决定「能调哪些酒」
│
├── Bar（调酒）── 生成酒单 → 点卡片
│                     ↓
│             Recipe（配方详情）── 记录评分/心得/照片
│
└── Me（我）── 查看所有调酒记录
              └── 调酒日历（Calendar）
```

### 一次「生成」发生了什么

核心逻辑都在 [src/utils/bar.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/utils/bar.ts) 的 `planGenerate` 函数里，流程如下：

```text
1. 读取「酒柜」里勾选的材料（inv）
        │
        ▼
2. 给每一款经典配方打分 = 缺几样材料（scoreRecipes）
        │
        ▼
3. 有没有「一样都不缺」的经典配方？
        │
   ┌────┴─────┐
   有          没有
   │            │
   ▼            ▼
 展示经典配方   用你现有的材料即兴生成创意特调（buildCreativeRecipes）
               │
               ▼
             还是凑不出来？就展示「最接近的几款 + 还差什么」
```

- **经典配方**写在 [src/data/recipes.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/data/recipes.ts)。
- **创意特调**由 `buildCreativeRecipes` 按「嗨棒 / 酸饮 / 果味微风 / 奶香甜梦 / 纯饮」等固定结构，组合你酒柜里已有的材料实时拼出来，连名字和步骤都是自动生成的。

### 界面是怎么写的

每个页面由一个 `.tsx` 文件和一个 `.module.scss` 文件组成，例如首页：

```text
src/pages/bar/
├── index.tsx          # 界面结构 + 交互逻辑（React 组件）
├── index.module.scss  # 这个页面专属的样式
└── index.config.ts    # 这个页面的标题等配置
```

`.module.scss` 是「模块化样式」：里面写的类名只会作用于当前页面，不会污染别的页面。

### 数据是怎么共享的

所有页面共享的数据（勾选了哪些酒、有哪些自定义原料、调过哪些酒、昵称头像）统一放在 [src/store/useBarStore.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/store/useBarStore.ts) 里，用的是 `zustand` 这个库。

在任何页面里这样拿到数据：

```ts
const { inv, toggle } = useBarStore()
// inv：当前勾选的材料，形如 { gin: true, lime: true }
// toggle：切换某个材料的勾选状态
```

好处：你在 Wine Cabinet 页勾选的材料，切到 Bar 页会**立刻生效**（顶部「能调几款」的数字随之变化），Me 页和 Recipe 页读的也是同一份数据。

---

## 6. 常见修改：加一款配方

假设你想加一款「威士忌可乐（Whiskey Coke）」，只需要改一个文件：[src/data/recipes.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/data/recipes.ts)。

在数组 `RECIPES` 里加一条（照着已有的格式抄）：

```ts
{
  id: 'whiskey_coke',            // 唯一标识，不能和别人的重复
  name: '威士忌可乐',             // 中文名
  en: 'Whiskey Coke',            // 英文名（可省略）
  pop: 7,                        // 热度，用于排序，越大越靠前
  glass: '高球杯',                // 用什么杯子
  method: '兑和',                 // 调制手法（摇和 / 兑和 / 捣压…）
  strength: 2,                   // 酒精度：0 无酒精 / 1 低度 / 2 中度 / 3 高度
  tags: ['甜润', '气泡'],          // 风味标签（颜色会自动匹配）
  desc: '一句话介绍这杯酒的口感。',
  ingredients: [                 // 需要的材料
    { item: 'whiskey', amount: '45ml' },
    { item: 'cola', amount: '120ml' },
    { item: 'lemon', amount: '10ml', optional: true } // optional 表示可选
  ],
  garnish: '柠檬角',              // 装饰
  steps: [                       // 调制步骤，一条一个字符串
    '高球杯加满冰块',
    '倒入威士忌，再注满可乐',
    '轻轻搅拌，用柠檬角装饰'
  ]
}
```

**注意两点：**

1. `id` 必须唯一，且强烈建议只使用英文小写字母和下划线。
2. `ingredients` 里的 `item` 必须是 [src/data/categories.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/data/categories.ts) 里已经存在的材料 id（比如 `whiskey`、`cola`、`lemon`）。如果材料清单里没有，就去 `CATS` 里先补一条：

```ts
['whiskey', '威士忌'],   // [id, 显示给用户看的中文名]
```

改完保存，运行中的 `npm run dev:h5` 或 `npm run dev:weapp` 会自动重新编译，刷新即可看到。

---

## 7. 数据存在哪里

**好消息：本项目不需要服务器，也基本不需要数据库，直接就能跑。**

- 你在界面上勾选的酒柜、自定义原料、调酒记录、昵称头像，都通过 `Taro.getStorageSync` / `Taro.setStorageSync` **保存在手机（或浏览器）本地**，关掉再打开还在。
- 存储的读写封装在 [src/store/useBarStore.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/store/useBarStore.ts) 顶部的 `readJSON` / `writeJSON` 里。
- 每一项都用了一个固定的 key，例如：
  - `homebar-inv-v1`：酒柜库存（在 Wine Cabinet 页维护，Bar 页只读）
  - `homebar-custom-v1`：自定义原料
  - `homebar-records-v1`：调酒记录
  - `homebar-profile-v1`：昵称头像

> [src/services/cloud.ts](file:///Users/yaohui/yaohui-workspace/homebar-miniprogram/src/services/cloud.ts) 是预留给「微信云开发」的调用封装：在小程序里会走云函数，在网页版会自动读取 `src/data/` 里的模拟数据。当前版本的功能并不依赖它，所以你不配置云开发也能完整体验。

**清空本地数据的办法**：在微信开发者工具里点「清缓存 → 清除数据缓存」，或在浏览器里清掉该站点的本地存储。

---

## 8. 常见问题排查

| 现象 | 可能原因 & 解决 |
| --- | --- |
| `npm install` 报错 / 卡住 | 网络问题。换国内镜像后重试：`npm config set registry https://registry.npmmirror.com` |
| `node -v` 报「command not found」 | Node.js 没装好，或装完没重开终端。重新安装 Node.js 并重开终端。 |
| `npm run dev:h5` 端口被占用 | 终端里会提示新端口，用新的地址打开即可；或先关掉之前占用的进程。 |
| 微信开发者工具里一片空白 / 报错 | 先确认 `npm run dev:weapp` 正在运行且没有报错；再确认导入的**项目目录是项目根目录**，而不是 `dist`。 |
| 改了代码小程序没反应 | 确认 `dev:weapp` 的终端没有退出；在开发者工具里点一下「编译」。 |
| H5 和小程序表现不一样 | 正常现象。两个平台底层不同，代码里用 `process.env.TARO_ENV === 'h5'` 做了少量兼容处理。 |
| 想看某段逻辑在哪 | 直接搜关键词。核心算法在 `src/utils/bar.ts`，数据在 `src/data/`，页面在 `src/pages/`。 |

---

## 免责声明

本项目仅用于学习和家庭娱乐。请**理性饮酒、适量饮酒**，未成年人禁止饮酒；饮酒后请勿驾驶。

祝你调出满意的第一杯。🍸