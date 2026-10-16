// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config
const isProd = process.env.NODE_ENV === 'production';
const cloudflareToken = process.env.CLOUDFLARE_TOKEN;
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  // 站点标题与副标题，改成你自己的
  title: '夏鸣Natsunaki的神秘小网站！',
  tagline: '记录与分享',
  favicon: 'img/favicon.ico',

  // 站点正式发布地址（GitHub Pages 项目站点：用户名.github.io/仓库名/）
  url: 'https://Natsunaki.github.io',
  // 站点部署在域名下的哪个路径（项目仓库为 '/仓库名/'，用户主站为 '/'）
  baseUrl: '/my-homepage/',

  // GitHub Pages 部署配置
  organizationName: 'Natsunaki', // 你的 GitHub 用户名
  projectName: 'my-homepage', // 你的仓库名
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.

        },
        blog: {
          blogSidebarTitle: '最新文章',
          blogSidebarCount: 10,
          showReadingTime: true,
          // 允许在文章 frontmatter 里直接写作者信息(不要求 authors.yml)
          onInlineAuthors: 'ignore',
          // 不强制要求文章写「摘要截断标记」
          onUntruncatedBlogPosts: 'ignore',

        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:

    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // giscus 评论功能
      // 到 https://giscus.app 用你的仓库生成配置，把下面四项替换成生成的值
      // （需要仓库为 Public 并安装 giscus App；未配置时评论区会显示一段提示文字）
      giscus: {
        repo: 'Natsunaki/my-homepage',
        repoId: 'R_kgDOVLqP7Q',
        category: '',
        categoryId: '',
      },


      // Replace with your project's social card
      image: 'img/social-card.png',
      navbar: {
        title: '夏鸣Natsunaki的神秘小网站！',
        logo: {
          alt: 'Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          { to: '/blog', label: '博客', position: 'left' },
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '文档',
          },

          {
            href: 'https://github.com/Natsunaki',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: '关于',
            items: [
              {
                label: '自我介绍',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: '链接',
            items: [
              {
                label: '博客',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/Natsunaki',
              },
            ],
          },
          {
            title: '本项目',
            items: [
              {
                label: '项目仓库',
                href: 'https://github.com/Natsunaki/my-homepage',
              },
            ],
          },
        ],
        // 如需备案号、许可证声明等，写在下面这行里
        copyright: `Copyright © ${new Date().getFullYear()} 夏鸣. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  // Cloudflare Web Analytics 脚本（仅在构建时设置了 CLOUDFLARE_TOKEN 环境变量才会注入）
  scripts: [

    ...(isProd && cloudflareToken
      ? [
        {
          src: 'https://static.cloudflareinsights.com/beacon.min.js',
          async: true,
          'data-cf-beacon': `{"token": "${cloudflareToken}"}`,
        },
      ]
      : []),
  ],
};


export default config;
