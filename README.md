<div align="center">

# 🌐 God's Eye View（上帝之眼）

[![CI](https://github.com/bilawalsidhu/gods-eye-view/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bilawalsidhu/gods-eye-view/actions/workflows/ci.yml) [![Reached #1 on GitHub Trending](https://img.shields.io/badge/%231_GitHub_Trending-thank_you!-F0A63C?style=flat-square&logo=github)](https://x.com/bilawalsidhu/status/2093798887815348521)

### 一个跑在浏览器里的间谍卫星模拟器 —— 然后你发现：数据源是公开的，数据是真的。

照片级写实 3D 地球。实时飞机、船舶、卫星、地震、交通与公共摄像头。由实时 AI 智能体驱动的免手操作语音控制。

_不遗漏任何角落。_

![轨道 HUD、实时跟踪地球、FLIR 地形 —— 然后「开源」了](docs/media/hero-open-source-reveal.gif)

<a href="https://www.youtube.com/@bilawalsidhu">
  <img src="docs/media/youtube-popular-videos.png" alt="YouTube 上的 God's Eye View 系列视频" width="100%">
</a>

▶️ **出自爆款 God's Eye View 系列背后的项目** _（原名 WorldView）_ —— [YouTube 播放量 500 万+](https://youtube.com/playlist?list=PL6qSg2I-7_koPbDnSMo0QeeHX_RknA2uv&si=nBGYMoHWQw41v93Q) · [全网社交平台 2500 万+](https://www.google.com/search?q=god%27s+eye+view)

🏆 **2026 年 8 月登顶 GitHub Trending 日榜与周榜第一**

**[Product Hunt 当日第 8 名](https://www.producthunt.com/products/god-s-eye-view?launch=god-s-eye-view)** · 由话题标签（hashtag）发明者 Chris Messina 的 Hunter 推荐

_“挺酷的”_ —— [Brendan Eich](https://x.com/BrendanEich/status/2094592096401490266)，JavaScript 之父、Mozilla 与 Brave 联合创始人 · 被 **[Pinokio](https://pinokio.co/posts/01m1m4p9xxm3qw7dnnpj2wr93g)** 收录推荐

⚡ **无需 API Key 即可启动。** 用 [Pinokio](https://pinokio.co/apps/github-com-bilawalsidhu-gods-eye-view) 安装，或在终端本地运行。可选 Key 在应用内添加。**[→ 快速开始](#-快速开始)**

</div>

---

<div align="center">

**[快速开始](#-快速开始) · [最初五分钟](#-最初五分钟) · [与它对话](#-与它对话) · [地球上有什么](#-地球上有什么) · [内部原理](#-内部原理) · [Key 与费用](#-api-key) · [参与贡献](CONTRIBUTING.md)**

</div>

---

## 🌍 为什么会有这个项目

God's Eye View 把公开信号汇聚到一个可探索的地球上。实时追踪世界，与它对话，把它弄坏，再把它扩展。

航班应答机、船舶信标、轨道根数、地震仪与公共摄像头，早已在讲述关于这个世界的许多事情。God's Eye View 把它们放在同一个地方，让你能在全局图景与某一架飞机、某一艘船、某一条街道之间自由穿行。它在你浏览器里本地运行，源码可读、可扩展。

> 一半的魔力在于，它看起来像一个禁止入内的座舱。另一半是，它的每一行代码都可以被检视。

大多数数据流是实时的，或定期刷新。交通是基于聚合位置数据，沿真实道路模拟出来的。CCTV 摄像头的姿态与火箭发射轨迹都是粗略估计值。

先从内置的数据源开始，然后加入你自己的。每个图层都是一个独立模块。

---

## 🎛️ 这东西能做什么

- **🛩️ 座舱视角：** 坐在被跟踪的航班里飞行 —— 摄像机全程把真实地形稳稳压在你脚下。
- **📡 联系人（Contacts）：** 一份覆盖目标周边 250 公里的名册，包含附近一切目标 —— 可在实时飞机之间逐一切换，并直接跳进任意一架的座舱。
- **🎯 点哪儿追哪儿：** 摄像机自动锁定、画出渐隐的尾迹、呈现完整元数据 —— 被跟踪的火灾或船只，一键即可交接给最近的实时摄像头。
- **🖊️ 语音白板：** 直接对着世界说出标注 —— 真实的边界多边形、标记与路线。
- **🛫 3D 机库：** 按机型区分的真实飞机模型 —— 787、ATR-72、Citation、Bell 206、MQ-9 —— 当你靠近时，被跟踪目标会从符号自动切换成 3D 模型。
- **🎨 给现实换皮：** 在正常地球上叠加 GLSL 传感器效果 —— CRT、NVG、FLIR/热成像、Noir、Snow。
- **🟩 检测叠加层：** 屏幕上对视野内一切目标绘制边界框与 ID 标签。
- **🎖️ 军用 HUD：** 情报风格的战术平视显示。
- **🌐 全局态势（Global Context）：** 一个开关即可铺开完整态势图 —— 退出时精确回到你原来的视角。
- **🎥 场景导演：** 为短片和演示拍摄电影级的镜头巡游。
- **🔗 分享链接：** 摄像机、风格、图层，甚至某一个被跟踪目标，都能序列化进一条 URL —— 实时目标是「交接」，不是书签。
- **🏠 复位地球：** 一个控件 —— 或一句话 —— 回到完整地球。
- **🌦️ 天气：** 把 GFS 或 ECMWF 预报风场做成动画，在同一条时间轴上回放观测雷达、卫星云图与闪电，并跟踪 NHC/CPHC 气旋路径。无需 Key。
- **📷 地图上的 ALPR 摄像头：** OpenStreetMap 中标注的车牌识别摄像头位置，一次加载一座城市。只有位置与标签；无需 Key。
- **🔭 卫星过境：** 用语音询问任意已加载卫星下一次何时从你头顶升起：升起、最高点、落下时间，以及你是否看得见它。
- **🔎 分析师回答：** 用语音对卫星、数据中心与水坝做计数、筛选与排名，飞机、船舶、火灾与地震同样支持；当某个数据流过期或切换到备用源时，回答会明确说明。
- **🧭 倾斜与正北朝上：** 在垂直俯视与 35° 斜视之间切换，或把北方固定在上方，同时让被跟踪目标始终居中。
- **🔍 免 Key 搜索：** 输入坐标，或内置的城市/地标名称，即可零网络请求飞过去；其他名称在配置后会走 Google，然后是 Photon 与 Nominatim。
- **📦 可分享场景：** 以文件或打包形式导入、预览与分享「导演」场景，包含摄像机锚点、编排运镜与数据包。
- **🌊 尼泊尔洪灾场景：** 回放 Bhote Koshi 洪灾：洪水路径、见证来源与前后对比影像（内置数据限非商业使用；见 [DATA_SOURCES.md](DATA_SOURCES.md)）。

---

<div align="center">

[![关于 God's Eye View 开源发布的 YouTube 视频](https://img.youtube.com/vi/GRJaKcXZS94/maxresdefault.jpg)](https://www.youtube.com/watch?v=GRJaKcXZS94)

▶️ **[以下所有功能的完整演示，在 YouTube 上](https://www.youtube.com/watch?v=GRJaKcXZS94)**

</div>

## ⚡ 快速开始

**无需账号、无需 API Key 即可启动。** 两条路径打开的是同一个应用，自带 Esri 卫星影像与免 Key 地形。若 Esri 不可达，会自动回退到 OSM。航班、军用动态、卫星、地震、公共摄像头、广播与航天发射都无需 Key 即可使用。

若想获得照片级写实的 3D 效果，可为符合条件的个人、非商业用途添加 **Cesium ion token**，或使用 **Google Maps key** 走直接计费路线并获得 Google 地点搜索。服务商条款与配额适用。请在应用的 **POWER UP** 面板中添加 Key；[Key 与费用](#-api-key) 说明了各种方案。

> **已经装过旧版？** 请更新到最新版本。旧版本会向公共 OpenStreetMap Overpass 服务器发起查询，而这些服务器现在会拒绝它们，所以交通、地图标注设施与 ALPR 图层会一直是空的，直到你更新。

### 路径一 —— 一键安装，不用终端

1. 安装或更新 [Pinokio](https://desktop.pinokio.co/) 到 **8.2 或更高版本**。
2. 打开 [Pinokio 中的 God's Eye View](https://pinokio.co/apps/github-com-bilawalsidhu-gods-eye-view)。
3. 点击 **Install**，然后点击 **Start**。

支持 **Windows、macOS 与 Linux**。Pinokio 维护者表示已对修复后的安装脚本做过跨平台测试。启动器会安装锁定版本依赖、寻找一个空闲本地端口并打开应用。

**之前试过但安装失败？** 更新 Pinokio 后重试。8.2 版本修复了启动器安装问题；[维护者的说明在这里](https://pinokio.co/posts/01m1m4p9xxm3qw7dnnpj2wr93g)。

### 路径二 —— 终端 / 编码智能体

请使用 **Node.js 24.x（24.14.0 或更高）或 26.x**。安装自检（doctor）会对已停止维护的 Node 25 给出警告。

```bash
git clone https://github.com/blackjazz07/gods-eye-view-cn
cd gods-eye-view
npm ci
npm run doctor
npm run dev
```

打开 **`http://localhost:4173`**。在首次运行面板中选择 **Live Contacts**、**Space Missions**、**Environmental** 或 **Explore Manually**。

<details>
<summary>启动性能</summary>

一次 M5/Chrome 的时点实测显示冷启动中位数为 1.86 秒。这只是对比基线，不保证在你的机器或网络环境下也能达到。详见 [docs/PERFORMANCE.md](docs/PERFORMANCE.md)。

</details>

**macOS 快捷方式：** `./scripts/dev-fresh.sh` 会清空 Vite 缓存并直接从 Keychain 拉取已配置的 Key。它同样能以无 Key 方式启动。

### 接着加满动力 —— 在应用里，而不是在文件里

Key 是「升级」，不是「前置条件」。当你想加一个时，点击右下角的 **POWER UP** 芯片：Provider Settings 会列出所有受支持的 Key、它能开启什么、以及去哪里获取。粘贴后点击 **SAVE KEYS**，应用会自动重启并启用新能力。全部配置完成后，该芯片会显示 **POWERED UP** —— 如果紧凑布局把它藏起来了，`?setup=1` 可以重新打开同一个面板。

- **Key 存在哪里：** Pinokio 安装 → 应用中被忽略的 `pinokio/ENVIRONMENT`；终端克隆 → 仓库根目录的 `.env`。无论哪种，文件都会在写入密钥 _之前_ 被设为仅所有者可读。这些是本地明文文件，已从 Git 排除；应用用你的 Key 去访问各服务商。
- **你已经有的 Key 依然属于你：** 来自 shell 或 macOS Keychain 的值会显示为 _外部配置_，对面板而言是只读的。
- **先拿哪个：** 先拿免费的 [Cesium ion](https://cesium.com/ion) token（适用于符合条件的个人、非商业用途；以当前条款与配额为准），用于照片级 3D 与全球地形；只有当你要走已开计费的计费路线 + Google 地点搜索时，才需要 Google Maps key；想跟这个世界对话时，才需要阿里云。完整地图与费用见 [Key 与费用](#-api-key)。

<details>
<summary>旧版 Pinokio 与凭据存储</summary>

不要在 Pinokio 8.0.40 原生的 **Configure** 面板里录入凭据：该版本无法正确保存这种嵌套应用文件，而且它会把提交的值写进日志。请改用 GEV 内部的 **POWER UP → Provider Settings**。Pinokio 8.2 的公告修复的是安装问题；它并没有证明这个独立的 Configure 问题已被解决。在 macOS 上，通过 `./scripts/dev-fresh.sh` 使用 Keychain 仍然是更稳妥的存储方案。

</details>

两条路径下，服务器都只绑定 **localhost**，Provider Settings 也只响应来自你本机的请求。浏览器侧 Key（Google Maps、Cesium ion）必须在其服务商处做域名限制 —— [SECURITY.md](SECURITY.md) 给出了方法，并在 [Key 与费用](#-api-key) 之外一并说明了局域网共享规则。

---

## 🕐 最初五分钟

选择一个首次运行任务，或按顺序依次尝试。以下 GIF 展示的是 Google 照片级 3D；你的初始底图取决于你已添加的 Key。

1. **点亮天空。** 接 **Live Contacts** 任务（或自己打开 **Flights**）—— 成千上万架实时飞机沿着真实遥测滑行，检测网格已经在读取画面。点击其中一架：摄像机锁定，一条尾迹在它身后展开，实时遥测卡片弹出。
2. **接管操控。** 在你跟踪的飞机上点 **COCKPIT**，跟着它一路飞下去，并在飞行途中切换传感器：从 NVG 切到 Ironbow FLIR。

![在座舱视角中跟随一架实时飞机飞行并切换传感器模式](docs/media/06-cockpit-ar.gif)

3. **降落到繁忙机场。** 搜索一个机场，打开 **3D** 飞机模型后下降到滑行道：地面上的目标、滑行尾迹，整个停机坪都在实时运转。

![从机场全貌俯视一路下探到滑行道近距检查，并显示 3D 飞机模型](docs/media/start-here/airport-ground-traffic-google-3d.gif)

4. **透过一个公共摄像头看世界。** 在 Austin、London、California、Finland 或 Delaware（实时视频）上方打开 **Cameras**。这些画面不是网页面板嵌进来的摄像头 —— 它们被投影 _进_ 了 3D 城市之中。把覆盖范围切换到 **VIEWSHED**，每个摄像头都会画出它估计的覆盖体 —— 能看到哪里，哪里是盲区。

![俯冲进 Austin 的一个路口，实时公共摄像头画面投影在 3D 场景中](docs/media/03-austin-cctv.gif)

5. **跟踪一个轨道上的目标。** 打开 **Satellites** 并点击 ISS —— 你会跟着它在轨道高度上飞行，轨道环一应俱全。

![跟踪 ISS 沿轨道飞行并跨越乌克兰上空](docs/media/14-iss-over-ukraine.gif)

6. **切换光学效果。** 按 `1`–`7` —— CRT、NVG、FLIR —— 整个实时星球都会透过另一种传感器重新渲染。

![在 CRT、FLIR 与 NVG 之间循环切换同一个密集实时地球](docs/media/01-style-sweep.gif)

7. **与它对话** _（需要阿里云 key）_：_"带我去 LAX，并选中最近的空中飞机。"_
8. **回家。** 点 **Reset Globe** —— 或者直接说 _"拉远到地球视图。"_

**键盘：** `1`–`7` 视觉风格 · `H` HUD · `D` 检测 · `C` 座舱 · `` ` `` 帧率 · `Esc` 退出。触控板双指捏合可缩放地球。

---

## 🛩️ 座舱

> 每一架飞机都应该让你能这样干。

基于实时航班数据构建的实时座舱模式：摄像机跟着你的目标，底下始终是真实地形，一路飞到底 —— 传感器风格会一路随行，而 **Contacts** 让 250 公里名册始终只差一次点击：在飞机之间跳转，然后直接落进下一个座舱。

![在实时飞机之间跳转并直接落入座舱视角](docs/media/12-switch-aircraft-cockpit.gif)

座舱甚至还带自己的简报条：附近的实时信号、区域头条与真实当地天气 —— 还有一个可选开启的 **WX** 模式，会根据你飞机周边的真实观测渲染体积云。

![跟随一个实时军用目标穿越 Normal、NVG 与 Ironbow FLIR，并叠加密集检测](docs/media/start-here/military-cockpit-dense-google-3d.gif)

_座舱模式为什么存在：你正乘着一架真实飞机飞越真实地形 —— 而且你可以选择用哪一种传感器去看这个世界。_

---

## 🎙️ 与它对话

> 语音可以使用 **阿里云 API key**，也可以在同一台机器上选择性地使用已登录的 **ChatGPT/Codex OAuth** 会话。API Key 路径仍然是默认方式。在 Provider Settings 中选择 ChatGPT OAuth，会复用本地已有的登录，或启动 Codex 浏览器登录流程并在完成后选用 OAuth。阿里云 key 仍然驱动 **AI HUD 摘要**：对当前视图的一句简短、五个词的情报风格读解，随你移动而不断重生成。

OAuth 选项是实验性的。阿里云记录了 ChatGPT 套餐在 [Responses API](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) 上的用量规则；但复用 Codex token 的第三方 Realtime 合约尚未得到确认。token 成功签发，并不代表计费或支持条款已经成立。

GEV 会读取 Codex 的文件凭据，但不会写入或刷新它们。它会检查 token 的结构与有效期，并把已过期的登录报告为需要重新认证。登录按钮会执行 `codex login`，只允许一个待处理尝试，并会报告退出失败或两分钟超时。`CODEX_HOME` 必须与 Codex 实际使用的目录一致。如果 `CODEX_AUTH_JSON` 指向别处，请先单独登录或修正这一不一致，再使用该按钮。Codex 凭据存储必须使用 `auth.json`；仅存于 Keychain 和内存中的存储方式 GEV 无法读取。在 Windows 上，登录按钮可能无法启动通过 npm 安装的 Codex；请自行运行 `codex login`，然后选择 OAuth。参见 [Codex 凭据存储](https://learn.chatgpt.com/docs/auth#credential-storage)。

要做一次实时语音自检，可针对你本地的开发服务器运行 `node scripts/qa-voice-auth.mjs http://127.0.0.1:4189 oauth microphone.wav`。使用的 WAV 需包含三秒前置静音，随后是一段简短的口头回复请求。把 `oauth` 换成 `api-key` 即可检查 API Key 路径。该检查会验证音频输入、完整的口头回复、用量、资源清理与重连。截图与不含凭据的结果会保存在 `.gev-logs/voice-auth/` 下。

点击 **GEV MIC**，授予麦克风权限，然后直接说话。这可不只是一个语音遥控器：

- **🧠 它知道自己在看什么。** 智能体在回答前会先拉取实时场景上下文 —— 包括坐标、街道名、已开启图层与视图比例。飞行途中问它 _"这是哪座城市？"_，它知道。
- **🎯 实体问答。** 点击任意飞机、船只或数据中心，问 _"这是什么？"_ 它会用该对象的实时遥测来回答。
- **👁️ 视觉落地。** 在街道层级，它会读取视口截图来识别清晰可辨的标牌与建筑名称，并被明确要求绝不编造标签。
- **🎬 电影级取景。** _"给我看看头顶的飞机"_ 会把摄像机拉远、调整角度，像导演一样把实时交通框进画面。
- **🔒 诚实且安全。** 智能体只会确认真正成功的操作。你的 `DASHSCOPE_API_KEY` 绝不会进入浏览器；客户端只拿到一个短期会话 token。如果你在 Provider Settings 中选择 **USE CHATGPT OAUTH**，本地服务器只会用该登录来签发同类的短期 Realtime 凭据，并且会拒绝非 loopback（非本机回环）客户端的 OAuth 路径。

三十个工具，四类职责 —— 下面的指令直接取自产品的语音测试套件与工具手册：

**🎥 导演它** —— 无人机操作员的摄像机动词：

> 🗣️ _"带我去东京。"_ · _"绕着这片区域慢慢环绕。"_ · _"画出从国会大厦到 Zilker 公园的步行路线。"_ → _"沿着我们刚画的路线飞。"_ · _"拉远到地球视图。"_

**🖊️ 标注它** —— 覆盖在真实世界上的白板：

> 🗣️ _"描出德克萨斯州的轮廓。"_ · _"标注德克萨斯州议会大厦及其场地"_ —— 它画的是**真实的围合边界**，不是一个圆圈。· _"埃菲尔铁塔离卢浮宫有多远？"_ —— 会出现一条连接箭头，并语音报出距离。所有内容都会保留，直到你说 _"清空地图。"_

**✍️ 或者自己画** —— DISPLAY ▸ **Draw**：选择 Area、Line 或 Pin，在真实世界上点击各个顶点，双击结束，再加标签。同一块白板、同样的持久化，不需要麦克风。

![Zilker 公园与 Lady Bird 湖以持久矢量标注的形式绘制在 3D 城市上，通过语音完成](docs/media/01-voice-annotate-zilker.gif)

![一条横跨机场的口头距离测量，从轨道视角检视](docs/media/04-airport-distance.gif)

**🔎 审问它** —— 针对实时图层的分析师查询：

> 🗣️ _"现在德克萨斯上空有多少架航班？"_ · _"哪些船正开往奥克兰？"_ · _"洛杉矶附近最大的火灾是哪个？"_ · _"有东西在四万英尺以上飞行吗？"_ · _"ISS 下一次什么时候过境？"_ · _"视野里有多少个数据中心？"_

**🎛️ 操控它** —— 整台控制台，全程免手操作：

> 🗣️ _"切到夜视，并打开航班图层。"_ · _"打开摄像头视野范围（viewshed）。"_ · _"播放 Austin 附近的一个新闻电台。"_ · _"跟踪那架飞机。"_ → _"进入座舱。"_

**以及连发档** —— 每句一句：

> 🗣️ _"给我看全球基础设施。"_（铺开各图层并拉回地球视图）· _"播放 Orbital Watch。"_（一个完整的电影级场景）· _"把检测密度设为 50%。"_ · _"下一个目标 —— 只要直升机。"_（座舱中）· _"给我看航天任务。"_ · _"切换到 OSM。"_ · _"把画面稍微锐化一点。"_ · _"切换到战术布局。"_ · _"现在有哪些东西开着？"_

![地球随着世界各地的广播电台作为又一个实时图层而不断填充](docs/media/15-global-radio-layer.gif)

_随便问哪儿附近的电台，地球就开始广播 —— 每个电台都是你能够飞过去的真实地点。_

---

**💬 或者从 Claude 和 Codex 里提问。** God's Eye View 同时也是一个 MCP 服务器：让 Claude Desktop、Codex 或 ChatGPT 桌面端展示某个地点，实时地球就会直接在对话里打开。配置只需一分钟 —— 见 [docs/MCP_SETUP.md](docs/MCP_SETUP.md)。

## 🛰️ 地球上有什么

二十个图层与地图源。**其中十七个有免 Key 路径。** 有些在提供方 Key 的支持下会提供额外能力。（🟢 无需 Key · 🟡 免费 Key · 🔴 计费。）

| 图层 | 你能得到什么 | 数据源 | 鉴权 |
| --- | --- | --- | --- |
| 🗺️ **地图栈** | Esri 卫星影像、Google 照片级 3D、OSM，以及 ion 托管的额外影像栈 | Esri / Google / Ion / OSM | 🟢 Esri 卫星 + OSM · 🟡 ion 托管的 Google 3D + 全球地形 · 🔴 直连 Google + 地点搜索 |
| ✈️ **实时航班** | 11,000+ 架实时飞机 + 航迹历史 | OpenSky + adsb.lol | 🟢（🟡 可选，用于更多轮询额度） |
| 🎖️ **军用航班** | 以琥珀色显示的 ADS-B 军用动态 | adsb.lol | 🟢 |
| 🚢 **实时船舶** | 全球数千艘船 | AISStream | 🟡 |
| 🛰️ **卫星** | 838 个对象的星表，按类别着色并带实时图例 —— **DENSE** 芯片会一次性铺满整个 Starlink 星座 | CelesTrak | 🟢 |
| 🌍 **地震** | 全球地震活动，最近 24 小时 | USGS | 🟢 |
| 🚗 **交通** | 沿 OSM 道路行驶的模拟车辆。接入 TomTom 后，实时流速会驱动模拟，并在约 8 公里以下用拥堵颜色表示；单车位置并非实时观测 | TomTom + OSM | 🟢 模拟 · 🟡 实时流速 |
| 📹 **CCTV 网格** | 约 3,900 个公共摄像头被投影 _进_ 3D 空间 —— Austin · Texas（TxDOT）· California（Caltrans）· London（TfL）· Ontario（511）· Finland（Fintraffic）· British Columbia（DriveBC）· Estonia（Tallinn、Tarktee）· Delaware（DelDOT 实时视频）· New South Wales（Live Traffic NSW）· Calgary · Norway（Statens vegvesen）。位置是公开的；姿态是先验估计值，**你可以通过在摄像头自身上拖动 gizmo 来校准** | 各城市 API | 🟢 |
| 📷 **地图上的 ALPR 摄像头** | 由 OpenStreetMap 贡献者标注的车牌识别摄像头位置，一次加载一座城市尺度的视图，带 **SHOW NEAREST**。仅有位置与标签：无车牌数据、无视频 | OpenStreetMap（含 DeFlock 测绘） | 🟢 |
| 📷 **街景** | 街景照片集中在一个面板里，每个提供方一个芯片：街道覆盖线、影像锥、嵌入式查看器与 **FOLLOW**。含 Mapillary 与 Google 街景；Panoramax 与 KartaView 在计划中 | Mapillary · Google | 🟡 Mapillary token · 🔴 Google Maps key |
| 📻 **广播** | 带 **模拟调谐器** 的地理定位世界广播 —— 拖动指针可扫过最多 750 个电台，地球会飞向每个广播方 | Radio Browser / 各广播方 | 🟢 |
| 🚌 **公共交通** | 实时公交、有轨电车、地铁、火车与渡轮，两次上报之间带延迟回放、选中车辆尾迹，以及按模式着色的 DETECT 标签 —— Boston、Austin、Minneapolis、Helsinki、荷兰、挪威、South East Queensland | 各运营方 GTFS-Realtime 数据流 | 🟢 |
| 🚲 **共享单车** | 实时站点可用情况 | GBFS | 🟢 |
| 🧭 **路线导航** | 在地球上点选 A 与 B，即可得到贴合街道的驾车、步行或骑行路线，铺在真实地形上并附逐步导航 —— 然后让摄像机 **沿它飞一遍**。无需 Key、无需地理编码器、无需麦克风 | FOSSGIS 服务器上的 OSRM（OpenStreetMap） | 🟢 |
| 🔥 **活跃火点** | NASA FIRMS 实时探测结果，回溯最近 24 小时 | NASA FIRMS | 🟡 |
| 🚀 **航天任务** | 滚动 30 天的发射记录，含载荷、级次与回收细节 | Launch Library 2 | 🟢（🟡 可选 token 可提高额度） |
| 🎖️ **地图标注设施** | 基于社区测绘、限定在视口范围内的军事设施上下文 —— 天然不完整，并已如实标注 | OpenStreetMap | 🟢 |
| 🌬️ **风场** | 10 米预报风场动画，可选按风速、温度或气压着色，并在地图中心显示读数 | NOAA GFS / ECMWF IFS | 🟢 |
| 🌦️ **观测天气** | 在同一条历史时间轴上叠加降雨雷达（美国本土）、卫星云图（GOES 区域或全球红外，仅云或完整图像）与闪电密度（美洲与太平洋） | NOAA nowCOAST | 🟢 |
| 🌀 **气旋** | 大西洋及北太平洋东部/中部的警报位置、预报路径与不确定锥 | NOAA NHC / CPHC | 🟢 |

**天气，免 Key。** **风场** 会动画显示来自 NOAA GFS 或 ECMWF IFS 的 10 米预报流场，可选颜色场，并在地图中心显示读数。**降雨雷达**、**卫星云图** 与 **闪电密度** 都是观测数据，位于 **WEATHER** 面板的同一条历史时间轴上（可回退一步、**Play**、**Latest**）；**气旋警报** 会绘制 NHC 与 CPHC 的位置、预报路径与锥形区。在 Google 3D Tiles 上，观测类图层会以半透明外壳的形式浮在城市上方，并在你的视野附近做锐化。

在应用里，**Data Layers** 把它们归为 Movement、Cameras、Infrastructure、Events、Weather 与 Utilities 六类。

**底图阶梯 —— 每一档能给你什么：**

| 你拥有的 | 你得到的地球 |
| --- | --- |
| 🟢 什么都没有 | Esri World Imagery 卫星底图 + 免 Key 地形，2D。若 Esri 不可达会自动切换到 OSM；若地形不可用，地球会在没有地形的情况下继续运行 |
| 🟡 一个免费的 Cesium ion token | **Google 照片级 3D 城市** 与全球地形 —— 适用于符合条件的个人、非商业用途；以当前 ion 条款与配额为准 |
| 🔴 一个 Google Maps key | 同样来自 Google 的直连 3D，外加 Google 地点搜索 —— 需开启计费的计费路线 |

![重建的 Falcon 9 上升过程，爬升并弯入其预测轨道](docs/media/08-falcon9-replay.gif)

_航天任务图层回放一次 Falcon 9 上升 —— 标注为 `RECONSTRUCTED ESTIMATE`（重建估计），可在 0.25×–4× 之间拖动。_

**地球上还有：** 街区叠加层 · 可选的座舱 WX 云效。**内置静态基础设施：** 数据中心（4,351）、水坝（704）、海底光缆（712）。

![俯冲进巴哈马，并揭示地球下方带标注的海底光缆路线](docs/media/09-undersea-cables.gif)

**缺一个你想要的图层？** 提个 issue —— 或者把它做出来并提交 PR。

---

## 📷 街景

> 任意提供方的街景照片，集中在一个面板里。本版本内置 **Mapillary**（免费客户端 token）与 **Google 街景**（用你的 Google Maps key）。

**配置。** 在 [mapillary.com/dashboard/developers](https://www.mapillary.com/dashboard/developers) 注册一个具备 **Read** 权限的应用，复制它的 **Client Token**（`MLY|…`）。粘贴到 **POWER UP → Mapillary**，或在 `.env` 中设置 `MAPILLARY_CLIENT_TOKEN` 并重启。没有它时，面板会显示 **KEY REQUIRED**。**Google 街景** 使用 `GOOGLE_MAPS_API_KEY`，且需在 Google Cloud 中为它启用 **Maps JavaScript API**；它的芯片默认关闭，因为每一张全景图都会计入该 Key 的费用。

**使用。** 在 DATA LAYERS → Cameras 下打开 **Street Level**，或使用 STREET LEVEL 面板标题栏中的药丸按钮。每个提供方都有一个自己颜色的芯片（Mapillary 为绿色），同一时间只有一个点亮：点亮一个会关掉另一个。免费的 Mapillary 默认点亮。**IMAGERY**（ALL / 360° / FLAT）与 **SINCE** 筛选器作用于 Mapillary；街景全景图都是 360°，所以在点亮街景时，筛选器与图例会隐藏。点击一条覆盖线即可看到它的影像锥，点击某个锥即可打开照片。在 **Google 3D** 地图上（Google 的条款让街景无法出现在其他地图上，因此其他地图里不会出现），点亮 **GOOGLE STREET VIEW** 并在 3 公里以下点击某条街道，或按 **OPEN STREET VIEW** 针对视图中心，即可在那里打开 Google 的全景图；可沿其箭头前进。照片上方有：**EXPAND**、**FIT / FILL**（Mapillary）与 **FOLLOW**（地球摄像机会跟随照片的视角；仅限 Google 3D 地图）。说明文字会链接到提供方网站上的原图，地球的致谢栏会列出所有已开启的提供方（"© Mapillary contributors, CC BY-SA 4.0"、"Street View imagery © Google"）。

拖动面板标题栏可将面板浮动，从任意边缘可调整尺寸。双击标题栏或将其折叠即可放回侧栏。分享链接会携带提供方开关与筛选状态（`0.m.0` 关闭 Mapillary，`0.r.google-1` 打开街景，`0.p.p` 仅全景图，`0.s.365` 最近一年）。若要新增提供方，请实现 `src/layers/streetLevel/registry.js` 中的契约，并在 `src/app/layers/streetLevel.js` 中注册它。

## 🎖️ 实战任务

基础玩明白之后，试试这些：

| 任务 | 怎么做 |
| --- | --- |
| **🚁 问这颗星球** | _"为什么这些军用直升机都在绕圈飞？"_ 选中一个军用航迹 —— 它会静默地回填约 24 小时的真实轨迹历史 —— 看看它一直在干什么，以堆叠 3D 环的形式呈现。 |
| **✈️ 最后进近** | 点击跟踪一架正在对正跑道的客机，跳进 **座舱**，跟着它飞下去。 |
| **🌃 夜间值守** | 飞到你自己所在的城市，切到 **NVG**，让检测网格与 HUD 读取这个画面。 |
| **🚢 靠港** | 在长滩港上方打开船舶图层。点击一艘油轮查看它的战术卡片与尾迹 —— 然后在 CCTV 面板中点 **NEAREST**，透过公共摄像头看同一片水域。 |
| **📻 东京 FM** | 打开 **广播** 图层，在涩谷上空环绕 —— 然后拖动模拟调谐器指针：每个位置都会吸附到一个真实电台，地球会飞向正在广播的那一方。 |
| **🔥 火线** | 在加利福尼亚上空打开 FIRMS。点击一个探测点 —— 摄像机俯冲过去 —— 读取强度，然后在 CCTV 面板中点 **NEAREST** 获取地面视角。 |
| **🚶 要一条步行路线** _🎙️_ | 告诉这个世界你想去哪儿，然后看一条真实贴合街道的路线在 3D 城市中自行描出 —— 再说 _"飞过去"_：倾斜转弯、缓入缓出的端点，摄像机像无人机镜头一样引导路径。 |
| **📏 测量 LAX 到 DFW** _🎙️_ | _"LAX 离 DFW 有多远？"_ —— 一条箭头横跨整个国家，距离出现在说明中，而两个端点在你环绕时依然钉在真实世界里。 |
| **🚀 发射回放** | 打开 **航天任务**，从最近 30 天里挑一次发射，跟着 T-minus 倒数从上升到入轨 —— 可在 0.25×–4× 之间拖动。标注为 `RECONSTRUCTED ESTIMATE`，因为它确实是重建估计。 |
| **🪦 逛逛飞机坟场** | 从区域视角一路飞进排列密集、完整解析的退役飞机方阵。 |
| **🏗️ 环绕三峡** | 一眼扫过这座大坝及其地形 —— 然后打开 **水坝** 图层，再找到另外 703 座。 |

_🎙️ = 语音任务 —— 需要阿里云 key。_

![把一个选中飞机的近期航迹解析成地形上方的堆叠 3D 环](docs/media/07-helicopter-loops.gif)

_问这颗星球：一个军用目标最近约 24 小时的真实轨迹历史，解析为堆叠的 3D 环。_

![请求一条步行路线，并让生成的路径穿过 3D 城市飞一遍](docs/media/10-walking-route-flythrough.gif)

_"画出这条步行路线……现在飞一遍" —— 倾斜转弯、缓入缓出的端点，摄像机像无人机镜头一样引导路径。_

![从区域视角下降到飞机坟场中排列密集的退役飞机](docs/media/08-boneyard.gif)

_逛逛飞机坟场：成排的退役机体，在 3D 中完整解析。_

---

## 🔧 内部原理

这个地球是如何处理实时数据的：

- **世界稳定的图标。** 飞机与船舶在任意摄像机角度下都指向它们 _真实的现实航向_ —— 无论是否被跟踪，无论垂直俯视还是横跨地平线 —— 靠的是逐帧的屏幕空间航向投影。不旋转、不锁定视口。
- **从断续数据中得到平滑运动。** 实时数据流每 15–30 秒到达一次；地球比实时落后一个间隔进行渲染，并在已知定位点之间插值。航位推算填补空隙。
- **诚实的卫星。** 使用 SGP4 传播，轨道环通过 GMST 重对齐始终锁定在卫星上 —— 不漂移、不逐秒闪烁。
- **落在真实地面上。** 实体高度经过对齐以配合 Google 3D tiles，因此飞机停在停机坪上、摄像头立在街角，而不是漂浮在空中。
- **缓存与请求预算。** 一个 OpenSky 额度调速器、一个 TomTom 每日瓦片预算，以及磁盘缓存的 TLE，可减少重复请求。这些控制不能替代服务商配额或计费控制。
- **服务端凭据。** 每一个涉及私钥的 API（阿里云、AISStream、OpenSky OAuth、摄像头帧）都通过一个加固的服务端代理中转，具备 SSRF 防护、响应大小上限与错误信息脱敏。浏览器能看到的 Key 只有 Google Maps 与 Cesium ion（两者都要在服务商处做限制）。
- **没有框架。** 原生 JavaScript、**CesiumJS** 与 **Vite** —— 再加上用于这颗星球的 **Google Photorealistic 3D Tiles** 与用于语音的 **阿里云 Realtime API**。易读、易改。

```
src/
├── main.js                 # 启动引导：Google 3D tiles、图层注册
├── ui.js                   # 运行时 UI —— 面板、HUD、样式、控制外观层
├── hud.js                  # 情报 HUD + AI 场景摘要
├── keySetup.js             # POWER UP 面板 —— 应用内提供方 Key（仅开发服务器）
├── mapStackController.js   # 底图切换 —— Google 3D / Esri / OSM / ion 影像栈
├── voice/                  # 阿里云 Realtime 会话 + 30 个语音工具
├── layers/                 # 图层组件 —— 天气、风场、气旋、公交、ALPR……
├── data/                   # 每个图层一个模块 + 编排 + 上下文存储
│   ├── iconOrientation.js  # 屏幕投影航向 + 地平线剔除
│   └── local_data/         # 内置数据集（每个目录自带来源说明）
└── scenes/                 # 电影级场景导演
```

权威的运行时参考见 [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md)。

---

## 🔑 API Key

🟢 **无需 Key** · 🟡 **免费 Key** · 🔴 **计费**

使用 **POWER UP → Provider Settings** 添加 Key。下面的表格说明每个提供方能开启什么；启动时不强依赖任何一个。存储与配置细节见[配置说明](#接着加满动力--在应用里而不是在文件里)。

风场、降雨雷达、卫星云图、闪电密度、气旋警报、地图上的 ALPR 摄像头、公共交通、路线导航、Delaware 实时视频，以及坐标或内置地点搜索都无需 Key。若某个图层等待 Key，它的行内会注明是哪一个。

### 选择你想要的能力

七个 Key。五个有免费额度，其中两个 🔴 是计费的：

| | Key | 为什么需要 | 获取方式 |
| --- | --- | --- | --- |
| 🟡 | **Cesium ion** | 🗺️ Google 照片级 3D、全球地形，以及 ion 托管的额外影像栈。免费 Community 套餐适用于符合条件的个人、非商业使用，并含配额 | [cesium.com/ion](https://cesium.com/ion) —— 使用公开的 `assets:read` token，并查看当前[定价/资格](https://cesium.com/platform/cesium-ion/pricing/) |
| 🔴 | **Google Maps** | 直连 Google 照片级 3D、Google 地点搜索与街景（[Map Tiles API](https://developers.google.com/maps/documentation/tile)；街景还需 Maps JavaScript API） | [Google Cloud Console](https://console.cloud.google.com/) —— 请做 URL 限制 |
| 🔴 | **阿里云** | 🎙️ 通过 API Key 实现语音 + AI HUD 摘要。Provider Settings 同时提供 **USE CHATGPT OAUTH**，可在不放弃 API Key 选项的前提下使用云端语音 | [阿里云百炼控制台](https://bailian.console.aliyun.com/) —— API Key 用量按量计费，费用见下 |
| 🟡 | **AISStream** | 🚢 实时全球船舶 | [aisstream.io](https://aisstream.io) —— 免费注册 |
| 🟡 | **NASA FIRMS** | 🔥 实时活跃火点 | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/map_key/) —— 免费 |
| 🟡 | **TomTom** | 🚦 为模拟交通图层提供实时流速与拥堵颜色 | [my.tomtom.com](https://my.tomtom.com/keys) —— 有免费额度 |
| 🟡 | **Mapillary** | 📷 街景覆盖与照片。按设计即为公开客户端 token（见 SECURITY.md） | [mapillary.com/dashboard/developers](https://www.mapillary.com/dashboard/developers) —— 注册应用，复制其 Client Token |

![从城市尺度的实时拥堵一路俯冲进某个路口的公共摄像头](docs/media/05-traffic-to-cctv.gif)

_TomTom key 给你带来什么：把早晚高峰的密度画在城市上 —— 然后从这场拥堵直接俯冲进正在拍它的那个摄像头。_

### 锦上添花

| | Key | 为什么需要 | 获取方式 |
| --- | --- | --- | --- |
| 🟡 | **OpenSky** | ✈️ 更多航班轮询额度（🟢 匿名模式无需 Key 也可用） | [opensky-network.org](https://opensky-network.org) |
| 🟡 | **Launch Library 2** | 🚀 更高的航天任务请求额度（🟢 无需 Key 也可用） | [thespacedevs.com](https://thespacedevs.com) |

如果你需要更高的轮询额度，再添加这些。

`npm run doctor` 会报告 Node/npm 就绪状态、主要提供方的路由，以及每个已配置提供方是在哪里被找到的，同时不打印任何凭据值。在 macOS 上，它感知 Keychain 的结果会给出 `./scripts/dev-fresh.sh` 的预告；而单纯的 `npm run dev` 只读取显式环境变量与 Vite 的 dotenv 值。OpenSky 摘要会在显式 `anon` 或缺少客户端对的 OAuth 模式下报告免 Key 匿名访问，在 OAuth 客户端对齐全时保留仅表示「已存在」的措辞，并在选中 Basic 或自动模式时指出该模式，同时不猜测运行时最终会接受哪套凭据。Basic 模式与凭据文件模式仍属 `dev-fresh.sh` 的高级配置。

<details>
<summary>高级配置：环境变量与 macOS Keychain</summary>

适用于无头机器、编码智能体或脚本化配置：

```bash
# 把 Key 放进 .env（见 .env.example），或作为环境变量传入：
DASHSCOPE_API_KEY="…" AISSTREAM_API_KEY="…" npm run dev -- --host localhost --port 4173

# 在 macOS 上，把任意 Key 存进 Keychain，dev-fresh.sh 会自动拉取：
security add-generic-password -U -s "google-maps-api" -a "api-key" -w
security add-generic-password -U -s "dashscope-api"   -a "api-key" -w
security add-generic-password -U -s "aisstream-api"   -a "api-key" -w
security add-generic-password -U -s "firms-map"       -a "map-key" -w
security add-generic-password -U -s "cesium-ion"      -a "token"   -w
```

OpenSky 可以完全以匿名方式运行（`OPENSKY_AUTH_MODE=anon`），或用 `./scripts/opensky-import-client.sh /path/to/credentials.json` 导入 OAuth 凭据。

</details>

<details>
<summary>实时视频摄像头（HLS）</summary>

带有 `"feedType": "hls"` 且具备已注册的 HTTP(S) `.m3u8` 地址的 CCTV 数据源，会通过一个延迟加载的 hls.js 解码器播放，该解码器由监视器平面与面板共用。DelDOT 使用其官方 HTTPS HLS 目录链接。可用 `CCTV_DELDOT_ENABLED=0` 禁用该数据包。

服务器允许两个并发会话。每个会话最多在内存中保留 12 个分片与 24 MiB；单次下载上限为 4 MiB，并设十秒时限。不会产生分片文件或 ffmpeg 进程。重定向、跨源引用、加密播放列表与非 MPEG-TS 分片都会被拒绝。每个解码器都有自己的客户端租约（每个会话最多八个），原生 HLS 亦同。关闭它只释放该租约；被遗弃的租约在 15 秒无访问后过期。最后一次释放会停止上游工作。实时视频失败时会使用既有的静态图/街景/合成兜底方案，那并不是实时视频。本集成不支持仅提供 RTMP 的数据源。

</details>

### 💸 实际要花多少钱

大致诚实的数字，截至 2026 年年中 —— 请始终核对服务商的定价页面：

| | 费用现实 |
| --- | --- |
| **🟢 大多数图层** | **$0，无需注册。** OpenSky 匿名、USGS、CelesTrak、adsb.lol、城市 CCTV、Radio Browser、GBFS、Launch Library 2、公交数据流、OSRM 路径规划、NOAA 与 ECMWF 天气、OpenStreetMap ALPR 测绘、内置数据集。 |
| **🟡 免费 Key 档** | **$0，需注册。** AISStream、FIRMS、TomTom、OpenSky，以及适用于符合条件的个人/非商业用途的 Cesium ion。服务商配额与资格仍然适用。 |
| **🗺️ Google 3D tiles** | **通过符合条件的 Cesium ion Community 账号在其配额内免费；通过直连 Google key 则按量计费。** 若需要 Google 地点搜索或商业部署，请走直连路线，核实当前服务商条款，并在已开启计费处设置预算告警。 |
| **🔴 阿里云语音** | API Key 会话保留实时消费读数、STD/MINI 模型切换、$2 警告与 **$5 硬性上限**。ChatGPT OAuth 是 Provider Settings 中的显式选择，其用量会被跟踪，但没有按美元估算的费用或消费上限。语音上下文窗口刻意保持很短。 |

Google 的直连 3D 路线出人意料地慷慨：目前每月前 1,000 个 Photorealistic 3D Tiles 会话免费，且一次根请求大约可支撑三小时的渲染。一个节制探索的独立用户，现实中是可以待在免费额度内的。计费仍需开启，所以要限制 Key 并设置配额或预算告警。在依赖这些数字之前，请核对 Google 的[当前定价](https://developers.google.com/maps/billing-and-pricing/pricing)。

### 🧗 门槛故意设得很低

上面的一切都是刻意降低的起步线 —— 足以让你在不跟任何销售团队打交道的情况下，真正尝到地理空间情报、GEOINT 与 OSINT 的味道。你同样会看到天花板：地面 AIS 在远洋中途会静默，而卫星 AIS 要花真金白银；高级影像、SAR 以及更深层的商业数据流都藏在企业合约之后。这不是架构的限制 —— 这里的每一个图层都是一套模式，你可以把它指向自己的数据源。这个仓库交给你的是地基；在上面融合出什么，取决于你。

### 🔒 共享一个实例

默认情况下别人无法访问你的服务器 —— 它只绑定 localhost。若要在局域网内共享，需显式选择加入（`npm run dev -- --host 0.0.0.0 --port 4173`，或在 macOS/Linux 上用 `HOST=0.0.0.0 ./scripts/dev-fresh.sh`）。IP 地址可直接使用；如果你用局域网主机名，请通过 `GEV_ALLOWED_HOSTS=globe.lan` 添加它，因为绑定到 `0.0.0.0` 并不会信任任意 Host 头。但要知道 ⚠️ **一个对局域网可见的服务器，会把你配置的 API Key 交给任何能访问它的人。** 针对产生费用的端点的按 IP 限流默认开启（`GEV_RATELIMIT_DASHSCOPE_PER_MIN`、`GEV_RATELIMIT_GOOGLE_PER_MIN` —— 参见 `.env.example` 进行调节），但在做任何其他事之前，**请先配置服务商配额、用量上限与计费告警**：应用层限流不是计费上限，而单有预算告警并不能阻止消费。完整的威胁模型见 [SECURITY.md](SECURITY.md)。

服务器被共享时，Provider Settings 会被禁用，因此远程用户无法访问 Key 录入面板。

**本启动器仍禁用 Pinokio 局域网共享与 Cloudflare 共享。** 若确需远程访问，请使用经过单独审查的认证代理。[SECURITY.md](SECURITY.md) 说明了相关限制与威胁模型。

---

## 📋 负责任且开放

God's Eye View 运行在 **公开数据、清晰来源与本地优先执行** 之上。没有秘密、没有私有数据集、没有神秘抓取 —— 任何涉及私钥的东西都由服务端中转。它拥有机密作战室的视觉语汇，却完全由公开信号与可检视的代码构建而成。

**这条线。** 本项目建模的是 **事件、资产、基础设施与系统** —— 飞机、船舶、卫星、火灾、摄像头、城市。它不会为具名个人搜索、人脸识别或个人追踪构建任何功能，跨越这条线的 PR 不会被合并。在这里，人不是一种查询类型。

**一起来造它。** 这是那个开启近期空间情报工具浪潮的项目所推出的权威实时 3D 客户端 —— 而它是一块画布：这里的图层，就是一个人能够找到并融合的信号。加一座城市数据包、一个数据源、一种风格、一个语音工具。它是你看世界的窗口；把这个窗口带给更多人。

**状态：** 一个持续演进的探索与学习用开源客户端 —— 快速、可魔改的地基，而非加固过的生产服务。以 **[MIT 许可证](LICENSE)** 发布。内置与实时数据集各有各的条款 —— 见 **[DATA_SOURCES.md](DATA_SOURCES.md)**。安全模型：**[SECURITY.md](SECURITY.md)**。想参与贡献？**[CONTRIBUTING.md](CONTRIBUTING.md)**。

**维护者：** [Bilawal Sidhu](https://github.com/bilawalsidhu) 与 [Sameh Khamis](https://github.com/samehkhamis)，来自 [Halfpixel](https://halfpixel.ai)。
**维护者：** [blackjazz07](https://github.com/blackjazz07)。

<sub>媒体说明：本页的采集 GIF 展示了 Google Photorealistic 3D Tiles 与实时数据图层，以宣传目的使用并带画面内署名；它们并未授权用于单独转载。见[媒体来源与许可](docs/media/README.md)；完整来源条款见 [DATA_SOURCES.md](DATA_SOURCES.md)。</sub>

> [!IMPORTANT]
> God's Eye View 是对公开数据与第三方数据的探索性可视化。
> 数据可能延迟、不完整、经过建模、推断而来，或者就是错的。请勿将其用于
> 航空或海上导航、应急响应、医疗或健康决策、投资决策，或其他安全攸关
> 或运营用途。重要信息请以权威来源核实。

---

## 🧭 接下来

首先 —— 谢谢。谢谢每一位看过 God view 演示、然后跑去做出自己版本的人，也谢谢每一位一直在问什么时候放代码的人：我很感激。而当我发起「是否应该开源」的投票时，你们的态度一点也不含蓄：

<img src="docs/media/open-source-survey.png" alt="关于 God's Eye View 开源的社区投票" width="460">

所以，它来了。走进这个间谍惊悚片的座舱 —— 只不过数据是真的 —— 让我们把它变成我们共同理解这个世界的沙盒，并且乐在其中。这个仓库是基线，它会一直开放，而它的全部意义就在于：你去把它弄坏，再拧上一些我们还没想到过的图层。

来自圈内的一个提醒：在这个领域里做上一周你就会明白，**「当下」是最便宜的那部分**。而当你试图回到过去 —— 把 _发生过什么_ 与 _改变了什么_ 以任何真正有意义的分辨率切块、分发与拖动回放 —— 数据会变得昂贵，算力会变得残酷。这才是长期战役。

**更新 —— 托管版即将推出。** 我们原本计划把这个仓库作为开源客户端保留，另建一个独立专业产品。然后是发布，而最多的请求不是再加一个功能 —— 而是 _"就给我一个链接吧。"_ 所以我们正在 [Halfpixel](https://halfpixel.ai) 构建官方托管的 God's Eye View：无需安装，浏览器打开即用。托管版是进入这个开源项目最轻松的方式。更多消息，敬请期待。

---

<div align="center">

▶️ [观看 God's Eye View 系列](https://youtube.com/playlist?list=PL6qSg2I-7_koPbDnSMo0QeeHX_RknA2uv&si=nBGYMoHWQw41v93Q) · 📬 [Map the World](https://maptheworld.ai/) —— 项目背后的 Newsletter

**🌐 God's Eye View. 不遗漏任何角落。**

</div>
