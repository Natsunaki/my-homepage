# 虾米的网站操作手册 📖

> 这份手册教你**直接改代码/文件**来调整网站(比管理页面更进阶,能改的东西更多)。
> 改完推送到 GitHub 后,约 **2 分钟**网站自动更新;构建记录看 <https://github.com/Natsunaki/my-homepage/actions>。

---

## 一、文件地图(哪个文件管什么)

| 文件 / 文件夹 | 管什么 |
| --- | --- |
| `docusaurus.config.js` | 总配置:网站名、副标题、地址、图标、导航栏顶部标题、社交卡片等 |
| `src/data/homepage.json` | 首页大标题、副文字、按钮(也可用管理页「🏠 首页设置」) |
| `src/data/navbar.json` | 顶部导航栏链接(管理页「🧭 导航栏设置」) |
| `src/data/footer.json` | 页脚链接与版权行(管理页「🔗 页脚设置」) |
| `src/css/custom.css` | 全站颜色:主题色、标题色、正文色(管理页「🎨 外观设置」) |
| `blog/` | 博客文章(Markdown 文件) |
| `docs/` | 文档页面;`docs/tools/` 是「工具箱」分类 |
| `src/img/backgrounds/` | 首页随机背景图;**往这里传图就自动进池** |
| `src/img/backgrounds/mobile/` | 只在手机端出现的背景图(竖图放这里) |
| `static/img/` | 头像、logo、favicon、社交卡片 |
| `src/pages/admin/` | 管理页面本身的代码(一般不用动) |
| `src/data/manual.md` | **本手册**;改这里,管理页面的手册就会更新 |

---

## 二、常见修改速查

### 1. 改网站名字 / 副标题
打开 `docusaurus.config.js`:
```js
title: '夏鸣Natsunaki的神秘小网站！',   // 浏览器标签 + 页面标题
tagline: '记录与分享',                  // 副标题(首页分享卡片上的小字)
```
导航栏左上角显示的名字也在同一个文件,搜 `navbar` 里的 `title:`。

### 2. 改首页文字和按钮
用管理页「🏠 首页设置」最方便;想改代码就打开 `src/data/homepage.json`:
```json
{
  "title": "我的小窝",          // 大标题
  "description": "欢迎你的来访！！",  // 标题下方文字
  "buttons": [
    { "label": "博客", "url": "./blog" },
    { "label": "关于我", "url": "./docs/intro" }
  ]
}
```
- 加/删按钮:直接在列表里增删一段 `{ "label": "...", "url": "..." }`
- 链接规则:`http` 开头 = 外部网站;`./blog` = 站内页面

### 3. 改页脚 / 导航栏
用管理页「🔗 页脚设置」「🧭 导航栏设置」;对应文件是 `src/data/footer.json`、`src/data/navbar.json`,格式一看就懂。

### 4. 换图片(全部走"替换同名文件"路线)
| 要换的 | 文件 | 建议 |
| --- | --- | --- |
| 头像 | `static/img/avatar.png` | 正方形 |
| 左上角图标 | `static/img/logo.png` | 正方形(现在是圆形头像) |
| 浏览器标签图标 | `static/img/favicon.ico` | 正方形 |
| 分享缩略图 | `static/img/social-card.png` | 1200×630 |
| 背景图 | 传进 `src/img/backgrounds/` | 横图、≤1MB、宽度 1920 |

> 网页操作:打开文件 → 右上 **⋯ → Delete file** 删旧的 → 回到文件夹 **Add file → Upload files** 传新的(同名)。
> 有多个同名图片要替换时,记住:**位置对了就行,图片本身叫什么名字不重要**(背景图除外,它任意名字都会自动进池)。

### 5. 写文章(blog/)
新建 `blog/日期-名字.md`,顶部 frontmatter:
```markdown
---
date: 2026-11-01T20:00        # 发布时间(决定排序)
slug: my-post                 # 网址后缀:/blog/my-post
title: 文章标题
tags: [随笔, 生活]             # 标签
pinned: true                  # 可选:置顶这篇文章(管理页也能一键置顶)
authors:
  name: 夏鸣
  image_url: /img/avatar.png
---

正文从这里开始,用 Markdown 写。

<!-- truncate -->   ← 这条线以上是列表页显示的摘要(可选,没有就全文显示)

## 二级标题
**加粗**、*斜体*、[链接](https://...)、`代码`
- 列表项
> 引用
```

### 6. 写文档(docs/)
在 `docs/` 下新建 `.md` 文件,**不用改任何代码**,它会自动出现在侧边栏。
```markdown
---
sidebar_position: 3   # 侧边栏里的排序位置(数字小的在前;管理页可以 ▲▼ 调)
---

# 文档标题

正文……
```
- 想放进「工具箱」子分类:把文件放到 `docs/tools/` 里
- 分类的显示名:`docs/tools/_category_.json` 里的 `label`

### 7. 改颜色
管理页「🎨 外观设置」最方便。手改的话打开 `src/css/custom.css`,每个变量一行,例如:
```css
:root {
  --ifm-color-primary: #ff99b8;   /* 主题色(按钮/链接/高亮) */
  --ifm-heading-color: #1c1e21;   /* 标题颜色 */
  --ifm-font-color-base: #1c1e21; /* 正文颜色 */
}
[data-theme='dark'] { ... }        /* 暗色模式的同款变量 */
```
色号随便搜一个"在线取色器"就能拿到,例如 `#ff99b8`。

### 8. 评论 / 置顶 / 排序
都在管理页面:💬 评论设置(giscus)、文章旁边「置顶」、文档 ▲▼ 排序。

---

## 三、Markdown 速查

| 想要 | 写法 |
| --- | --- |
| 二级/三级标题 | `## 标题` / `### 标题` |
| 加粗 / 斜体 / 删除线 | `**粗**` / `*斜*` / `~~删~~` |
| 链接 | `[显示文字](https://地址)` |
| 图片 | `![说明](/img/xxx.png)` 或 `![](../img/xxx.png)` |
| 列表 / 有序列表 | `- 项目` / `1. 项目` |
| 引用 | `> 引用文字` |
| 行内代码 / 代码块 | `` `代码` `` / 三个反引号包起来 |
| 分割线 | `---`(单独一行) |
| 表格 | `\| 列1 \| 列2 \|` + 分隔行 `\| --- \| --- \|` |
| 换行 | 空一行 = 新段落;行尾打两个空格 = 强制换行 |

> 管理页编辑器顶部有 13 个按钮,记不住语法就直接点按钮。

---

## 四、图片规范

- **尺寸**:背景 1920 宽;头像/图标 正方形(512 以内);社交卡片 1200×630
- **体积**:单张 ≤ 1MB,越大访问越慢;上传前可以用 <https://squoosh.app> 压一下
- **格式**:`.jpg`(照片)/`.png`(要透明)/`.webp`(体积小)都支持
- **文件名**:英文/数字最稳,避免空格;背景图名字随意(自动扫描)

---

## 五、出问题了怎么办

1. **改坏了想还原**:打开改过的文件 → 右上 **History** → 找到改之前的版本 → 点进去 → 右上 **⋯ → Revert** 提交一个"还原"版本
2. **网站没更新**:看 [构建记录](https://github.com/Natsunaki/my-homepage/actions) 是不是红色 ✗(改出语法错误了)→ 按第 1 条还原;绿色 ✓ 但页面没变 → Ctrl+F5 强刷 / 等 2 分钟
3. **图片不显示**:检查位置和大小写;头像等固定位置的图**必须同名替换**
4. **本地预览**(可选,需要在自己电脑上跑):`npm install` 一次,然后 `npm start`,浏览器开 http://localhost:3000/my-homepage 边改边看

---

## 六、管理页面各面板 ↔ 对应文件

| 管理页面板 | 修改的文件 |
| --- | --- |
| + 新建文章 / 新建文档 / 编辑 | `blog/*.md`、`docs/*.md` |
| 🏠 首页设置 | `src/data/homepage.json` |
| 🧭 导航栏设置 | `src/data/navbar.json` |
| 🔗 页脚设置 | `src/data/footer.json` |
| 🎨 外观设置 | `src/css/custom.css` |
| 💬 评论设置 | `docusaurus.config.js` 的 `themeConfig.giscus` |
| 📖 操作手册(本页) | `src/data/manual.md` |

---

*祝折腾愉快,虾米!遇到手册没写的问题,记得还有个 AI 小助手可以问(笑)* ✨
