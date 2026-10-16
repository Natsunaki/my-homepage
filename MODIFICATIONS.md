# 改造说明（基于蓝本 commit 0f8eb4a）

本文档记录本项目相对蓝本的全部改动，方便你了解「哪些是结构、哪些被换掉了、想恢复某个功能去哪找」。

## 蓝本信息

- 仓库：<https://github.com/DanielToyama/DanielToyama-homepage>
- commit：`0f8eb4afe8b4d02bdc01541b9ffe06f59f4fd24a`（2024-12-22，*updata IframeWithDynamic:add resolution parameter*）
- 完整快照保存在本地：`D:\Z-Code\项目\_blueprint_DanielToyama_0f8eb4a`（仅供对照参考，确认无用后可删除）

## 总体原则

**保留**（站点结构与功能机制）：

- 全屏首页 + 随机背景图（桌面/移动两套列表，随窗口比例切换）
- 博客系统（侧边栏、阅读时长、标签、作者信息）
- 文档系统（侧边栏分组、嵌入外部页面的 iframe 组件）
- giscus 评论（博客文章页、文档页自动挂载，含 `src/theme/` 下的 swizzle 组件）
- 粉色系主题配色、代码高亮主题
- GitHub Actions 自动部署到 gh-pages 的完整流程

**移除**（蓝本作者的个人内容）：

- 昵称（户山兔兔/兔兔）、个人介绍、社交链接（QQ、B 站、友情链接）
- 头像、个人形象 logo、favicon 中的个人图片
- 全部 13 篇个人博客文章及配图
- 个人工具文档（Orzmic/舞萌工具）及 5 张个人截图
- 萌 ICP 备案号、百度统计、必应站长验证文件
- 个人站点 URL、仓库名、giscus 仓库 ID

## 逐项改动清单

### 1. `docusaurus.config.js`（改动最多）

| 配置项 | 蓝本内容 | 现在 |
| --- | --- | --- |
| `title` / `tagline` | 户山兔兔の小家 / 可爱就是正确！ | 我的个人主页 / 记录与分享（占位） |
| `url` / `baseUrl` | `https://DanielToyama.github.io` / `/` | `https://Natsunaki.github.io` / `/my-homepage/` |
| `organizationName` / `projectName` | DanielToyama / DanielToyama.github.io | Natsunaki / my-homepage |
| `themeConfig.giscus` | 作者仓库的 repo/repoId/categoryId | 你的仓库名 + 空 ID（待配置） |
| `themeConfig.image` | img/rabbit.jpg（个人图） | img/social-card.png（占位卡片） |
| `navbar` | 标题/logo/「兔兔」文档入口/MyGitHub | 通用标题/新 logo/「文档」入口/GitHub（指向你的主页） |
| `footer` | 关于我、友情链接、兔兔相关链接、萌ICP备案 | 关于/链接/本项目 三栏通用结构 |
| `copyright` | 含 CC 协议、萌 ICP、表情图 | 通用版权行（含注释说明可自行添加备案/许可） |
| `blog.blogSidebarTitle` | 最近有什么呢 | 最新文章 |
| `scripts` | 百度统计（个人 ID）+ 自定义脚本 + Cloudflare | 仅保留 Cloudflare（环境变量驱动） |

> ⚠️ `url` 与 `baseUrl` 是「项目站点」的配置（仓库名 my-homepage）。
> 若以后改名为 `Natsunaki.github.io` 用户主站，`baseUrl` 需改为 `/`。

### 2. 首页 `src/pages/index.js` + `src/pages/index.css`

- 背景图：由 14 张游戏 wiki 壁纸外链（个人喜好 + 外链依赖）改为 **3 张本地占位背景图**
  （`static/img/backgrounds/`），并使用 `useBaseUrl` 处理路径——**修复了原版在子路径部署下外链/绝对路径可能失效的隐患**
- 文案：「兔兔的小窝」→「我的小窝」；按钮「敲门/看看兔兔」→「博客/关于我」
- 移除 `<head>` 中的百度站点验证 meta（个人验证码）
- `index.css`：默认背景由壁纸外链改为渐变兜底（JS 加载后随机替换）

### 3. 博客 `blog/`

- 移除蓝本全部 13 篇文章及配图（`blog/` 下所有子目录与图片）
- 新增示例文章 `2026-10-16-welcome.md`，**保留原 frontmatter 结构**（date / slug / title / tags / authors 内联写法），可直接复制作为新文章模板

### 4. 文档 `docs/` 与 `sidebars.js`

- `docs/intro.md`：「关于兔兔」→ 通用自我介绍模板（保留段落结构，移除个人履历、音游成绩、5 张截图）
- `docs/tools/`：移除个人工具说明（orztools.md、sdgb2aqua.md）
- 新增 `docs/tools/example.md`：演示 `IframeWithDynamicSrc` 组件用法（该组件完整保留）
- `sidebars.js`：分类「兔兔的妙妙宝箱」→「工具箱」
- 移除 `static/docs/` 下全部个人游戏截图

### 5. 图片资源

| 文件 | 蓝本内容 | 现在 |
| --- | --- | --- |
| `static/img/logo.svg` | 内嵌 base64 个人兔子图（1MB） | 简洁矢量占位 logo（渐变 + N，约 0.5KB） |
| `static/img/favicon.ico` | 个人兔子头像 | 渐变占位图标（64×64 标准 ICO） |
| `static/img/rabbit.jpg` | 个人形象图（社交卡片/作者头像） | 删除 |
| `src/rabbit.jpg` | 个人形象图（**无任何引用**的死文件） | 删除 |
| `static/img/avatar.png` | — | 新增：博客作者头像占位 |
| `static/img/social-card.png` | — | 新增：社交卡片占位（1200×630） |
| `static/img/backgrounds/bg-1~3.jpg` | — | 新增：首页背景占位（1920×1080 渐变） |

### 6. 评论组件 `src/components/Comment.tsx`

- 蓝本行为：giscus 未配置时直接 `throw` 报错（页面崩溃）
- 现在：未配置时渲染一段提示文字并引导去配置，**不影响构建和页面渲染**

### 7. 部署工作流 `.github/workflows/`

| 项目 | 蓝本 | 现在 | 原因 |
| --- | --- | --- | --- |
| 触发分支 | `master` | `main` | 你的仓库默认分支是 main |
| 权限 | 未声明 | `permissions: contents: write` | 新仓库的 `GITHUB_TOKEN` 默认只读，不加这行推送 gh-pages 会 403 |
| actions 版本 | checkout@v3 / setup-node@v3 | @v4 | v3 已过时 |
| Node 版本 | 18 | 22 | 18 已停止维护 |

### 8. 清理的死代码（蓝本中残留、未被引用的文件）

- `src/components/HomepageFeatures/`：Docusaurus 默认模板残留组件，引用的 3 个 svg 在仓库中并不存在，且没有任何页面引用它
- `src/pages/index.module.css`：无任何引用
- `src/pages/markdown-page.md`：默认模板示例页，导航中无入口

### 9. 个人验证/统计文件（删除）

- `static/BingSiteAuth.xml`：蓝本作者的必应站长验证文件
- `static/baidu—analytics.js` + 配置中的百度统计 ID：蓝本作者的统计脚本

### 10. 项目元信息

- `package.json` / `package-lock.json`：`name` 由 `my-website` 改为 `my-homepage`（两处同步修改，避免 `npm ci` 校验不一致）
- `README.md`：由一句话介绍重写为完整的使用/个性化/部署文档
- `.gitignore`：移除蓝本个人条目（`update.bat`）；`.gitignore` 其余规则保持不变

## 需要你自己完成的事（清单）

- [ ] **推送到 GitHub**：本仓库已在本地完成首次提交（main 分支），
  推送到 `Natsunaki/my-homepage` 后会自动触发部署工作流
- [ ] **giscus 评论**：到 <https://giscus.app> 生成配置，填入 `docusaurus.config.js`
- [ ] **GitHub Pages 设置**：Settings → Pages → Source 选 `gh-pages` 分支
  与 Actions → General → Workflow permissions 选 Read and write
- [ ] **替换占位内容**：头像、logo、favicon、社交卡片、背景图、「关于我」、示例文章
- [ ] **改站点名称**：`docusaurus.config.js` 的 `title`、`tagline`、`navbar.title`
- [ ] 可选：Cloudflare 统计（`CLOUDFLARE_TOKEN` Secret）；自定义域名时修改 `url`/`baseUrl`
- [ ] 可选：页脚版权行按需补充备案号、CC 协议声明

## 验证情况

本次改造已完成以下验证（2026-10-16）：

- ✅ **构建通过**：`npm ci && npm run build`（Node 22.20.0，Docusaurus 3.2.x）
  成功生成静态文件；`onBrokenLinks: 'throw'` 校验全部内部链接无死链
- ✅ **页面渲染验证**（本地启动构建产物、浏览器实测）：
  - 首页：导航栏、随机背景图（本地占位图）、标题与按钮、亮/暗主题切换均正常
  - 博客文章页：frontmatter（日期/阅读时长/作者头像/标签）正常，
    评论区显示「未配置」引导提示（不会报错）
  - 文档页：侧边栏（关于我 + 工具箱分组）、上下页导航、评论区提示正常
  - 页脚：三栏结构与版权行正常
- ⬜ 未验证项：giscus 评论（需要你在 giscus.app 配置后才能生效）、GitHub Pages 线上部署

> 本机（当前电脑）原本没有安装 Node.js 和 Git，本次验证使用了便携版本
> （存放于 `D:\Z-Code\项目\.tools\`）。日常开发建议正规安装：
> `winget install OpenJS.NodeJS.LTS` 和 `winget install Git.Git`。

## 与蓝本的功能对照（想找某个功能去哪看）

| 功能 | 位置 |
| --- | --- |
| 首页随机背景逻辑 | `src/pages/index.js` |
| 首页样式（遮罩、按钮、移动端适配） | `src/pages/index.css` |
| 明暗主题 iframe 组件 | `src/components/IframeWithDynamicSrc.js` |
| 评论区如何挂到博客/文档页 | `src/theme/BlogPostPage/index.tsx`、`src/theme/DocItem/Layout/index.tsx`、`src/theme/DocCategoryGeneratedIndexPage/index.tsx` |
| 博客文章 SEO/结构化数据定制 | `src/theme/BlogPostPage/Metadata/`、`StructuredData/` |
| 主题配色 | `src/css/custom.css` |
| 自动部署 | `.github/workflows/deploy.yml`（主分支推送）、`test-deploy.yml`（PR 构建测试） |
