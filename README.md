# 我的个人主页

基于 [Docusaurus 3](https://docusaurus.io/) 搭建的个人主页，包含：

- 自定义全屏首页（随机背景图）
- 博客（支持标签、作者、阅读时长、评论区）
- 文档区（侧边栏分组，可嵌入外部工具页面）
- giscus 评论、访问统计（可选）

> 本项目以朋友的项目为蓝本改造而来（蓝本 commit `0f8eb4a`），
> 已剥离蓝本作者的全部个人内容，仅保留站点结构与功能机制。
> 详细改动清单见 [MODIFICATIONS.md](./MODIFICATIONS.md)。

## 环境要求

- Node.js 18+（推荐 22 LTS）
- Git

## 本地开发

```bash
npm install        # 安装依赖（首次或依赖变更后执行）
npm run start      # 启动开发服务器，默认 http://localhost:3000/my-homepage/
npm run build      # 构建到 build/ 目录
npm run serve      # 本地预览构建产物
```

## 部署（GitHub Pages）

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）会自动
构建并发布到 `gh-pages` 分支。

首次部署前需要在仓库完成两件事：

1. **Settings → Actions → General → Workflow permissions**：
   选择 **Read and write permissions**（工作流里已声明 `permissions: contents: write`，保持一致即可）
2. **Settings → Pages → Source**：选择 **Deploy from a branch**，分支选 `gh-pages`，目录选 `/(root)`

部署完成后访问：<https://natsunaki.github.io/my-homepage/>

> ⚠️ 站点地址与 `docusaurus.config.js` 中的 `url` / `baseUrl` 相关。
> 当前按「项目站点」配置：`url = https://Natsunaki.github.io`，`baseUrl = /my-homepage/`。
> 如果你以后把仓库改名为 `Natsunaki.github.io`（用户主站），需要把 `baseUrl` 改成 `/`。

## 个性化指南

| 想改什么 | 改哪里 |
| --- | --- |
| 站名 / 副标题 / 导航栏 | `docusaurus.config.js` 的 `title` `tagline` `navbar` |
| 首页文字、背景图逻辑 | `src/pages/index.js`（配合 `src/pages/index.css`） |
| 首页背景图片 | 替换 `static/img/backgrounds/` 下的图片（可增删，注意同步 `index.js` 里的列表） |
| 「关于我」页面 | `docs/intro.md` |
| 头像 | 替换 `static/img/avatar.png` |
| Logo / 站点图标 | 替换 `static/img/logo.svg`、`static/img/favicon.ico` |
| 分享缩略图（社交卡片） | 替换 `static/img/social-card.png` |
| 主题配色 | `src/css/custom.css` 中的 `--ifm-color-primary-*` |
| 页脚链接 / 版权 | `docusaurus.config.js` 的 `footer` |
| 侧边栏分组 | `sidebars.js` |

### 配置评论（giscus）

1. 仓库需为 **Public**，并安装 giscus App：<https://github.com/apps/giscus>
2. 打开 <https://giscus.app>，填入仓库名，选择一个 Discussion 分类（分类需已存在）
3. 把页面生成的 `repoId`、`category`、`categoryId` 填入
   `docusaurus.config.js` 的 `themeConfig.giscus`

未配置时，博客/文档页面底部会显示一段提示文字（不会报错）。
详细配置另见蓝本作者写过的一篇文章思路：<https://giscus.app/zh-CN>。

### 访问统计（可选）

项目保留了 Cloudflare Web Analytics 的接入结构：构建时设置了
`CLOUDFLARE_TOKEN` 环境变量，就会自动注入统计脚本。

在 GitHub Actions 中使用：仓库 **Settings → Secrets and variables → Actions**
添加名为 `CLOUDFLARE_TOKEN` 的 Secret 即可。

（蓝本原有的百度统计、必应站长验证文件已随个人内容移除。）

## 写作

- **新文章**：在 `blog/` 下新建 `.md` 文件，顶部 frontmatter 写法参考
  `blog/2026-10-16-welcome.md` 或直接复制它修改
- **新文档**：在 `docs/` 下新建 `.md` 文件，并在 `sidebars.js` 中登记
- **嵌入外部工具**：参考 `docs/tools/example.md`，使用
  `src/components/IframeWithDynamicSrc.js` 组件嵌入

## 目录结构

```
├── blog/                        # 博客文章（Markdown）
├── docs/                        # 文档页面（Markdown）
├── src/
│   ├── components/              # 自定义组件
│   │   ├── Comment.tsx          # giscus 评论组件
│   │   └── IframeWithDynamicSrc.js  # 支持明暗主题切换的 iframe 组件
│   ├── css/custom.css           # 全局主题配色
│   ├── pages/                   # 自定义页面（首页在这里）
│   └── theme/                   # swizzle 的主题组件（给博客/文档页挂评论区）
├── static/                      # 静态资源（图片等，原样发布）
│   └── img/                     # logo / favicon / 头像 / 背景图 / 社交卡片
├── docusaurus.config.js         # 站点主配置
├── sidebars.js                  # 文档侧边栏配置
└── .github/workflows/           # GitHub Actions 自动部署
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run start` | 本地开发（热更新） |
| `npm run build` | 生产构建 |
| `npm run serve` | 预览构建产物 |
| `npm run clear` | 清除缓存（构建异常时试试） |
