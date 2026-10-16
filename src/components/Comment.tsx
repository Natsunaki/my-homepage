import React from 'react'
import { useThemeConfig, useColorMode } from '@docusaurus/theme-common'
import Giscus, { GiscusProps } from '@giscus/react'
import { useLocation } from '@docusaurus/router';

const defaultConfig: Partial<GiscusProps> = {
  id: 'comments',
  mapping: 'specific',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  loading: 'lazy',
  strict: '1', // 用根据路径标题自动生成的 sha1 值，精确匹配 github discussion，避免路径重叠（比如父和子路径）时评论加载串了
  lang: 'zh-CN',
}

export default function Comment(): JSX.Element {
  const themeConfig = useThemeConfig()

  // merge default config
  const giscus = { ...defaultConfig, ...themeConfig.giscus }

  if (!giscus.repo || !giscus.repoId || !giscus.categoryId) {
    // 尚未在 docusaurus.config.js 中配置 giscus 评论
    // （到 https://giscus.app 生成配置后填入 themeConfig.giscus 即可启用）
    return (
      <div
        style={{
          margin: '2rem 0',
          padding: '1rem',
          border: '1px dashed var(--ifm-color-emphasis-400)',
          borderRadius: '8px',
          color: 'var(--ifm-color-emphasis-600)',
          textAlign: 'center',
        }}>
        评论区尚未配置：请在 docusaurus.config.js 的 themeConfig.giscus
        中填入仓库信息（可参考 README 的「配置评论」一节）。
      </div>
    )
  }

  const path = useLocation().pathname.replace(/^\/|\/$/g, '');
  const firstSlashIndex = path.indexOf('/');
  var subPath: string = ""
  if (firstSlashIndex !== -1) {
    subPath = path.substring(firstSlashIndex + 1)
  } else {
    subPath = "index"
  }

  giscus.term = subPath
  giscus.theme =
    useColorMode().colorMode === 'dark' ? 'transparent_dark' : 'light'

  return (
    <Giscus {...giscus} />
  )
}