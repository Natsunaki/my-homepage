---
sidebar_position: 1
---

import IframeWithDynamicSrc from '@site/src/components/IframeWithDynamicSrc';

# 工具示例页

这是一篇示例文档，演示怎么把外部网页（比如你写的小工具）嵌入到文档里，
并且支持亮色/暗色主题切换。

[全屏打开](https://docusaurus.io/)

<IframeWithDynamicSrc 
  lightModeSrc="https://docusaurus.io/" 
  darkModeSrc="https://docusaurus.io/" 
  width="800" 
  height="600"  
  mobileHeight="480"
/>

## 说明

- `IframeWithDynamicSrc` 组件位于 `src/components/IframeWithDynamicSrc.js`，
  可在任意文档中 import 使用
- `lightModeSrc` / `darkModeSrc` 分别对应亮色和暗色主题下加载的地址；
  如果你的工具支持通过 query 参数切换主题，可以分别指定
- 不需要这个示例页时，直接删除本文件，并把 `sidebars.js` 中
  `tools/example` 一项删掉即可
