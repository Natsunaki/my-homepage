import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { marked } from 'marked';
import './admin.css';

const OWNER = 'Natsunaki';
const REPO = 'my-homepage';
const BRANCH = 'main';
const API = 'https://api.github.com';
const PAT_KEY = 'myhomepage_admin_pat';

// ---------- 通用工具 ----------

function b64decodeUtf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function nowLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function gh(pat, path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(pat ? { Authorization: 'Bearer ' + pat } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j.message) msg += ' — ' + j.message;
    } catch (e) {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function encPath(path) {
  return encodeURIComponent(path).replace(/%2F/g, '/');
}

// ---------- frontmatter 小工具(只处理简单的一层键值) ----------

function splitFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return { fm: m[1], rest: content.slice(m[0].length) };
}

function getFm(content, key) {
  const parts = splitFrontmatter(content);
  if (!parts) return null;
  const line = parts.fm.split(/\r?\n/).find((l) => new RegExp('^' + key + '\\s*:').test(l));
  if (!line) return null;
  return line.replace(new RegExp('^' + key + '\\s*:\\s*'), '').trim();
}

function setFm(content, key, value) {
  const parts = splitFrontmatter(content);
  if (!parts) return null;
  let lines = parts.fm.split(/\r?\n/).filter((l) => !new RegExp('^' + key + '\\s*:').test(l));
  if (value !== null) lines.unshift(`${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n` + parts.rest;
}

// ---------- 颜色工具(外观设置用) ----------

const DEFAULT_LIGHT = { primary: '#ff99b8', heading: '#1c1e21', text: '#1c1e21' };
const DEFAULT_DARK = { primary: '#ff9ee0', heading: '#e3e3e3', text: '#e3e3e3' };

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function hexToRgb(hex) {
  const m = String(hex).replace('#', '');
  return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255];
}

function rgbToHex(r, g, b) {
  const p = (n) => Math.round(Math.min(255, Math.max(0, n * 255))).toString(16).padStart(2, '0');
  return '#' + p(r) + p(g) + p(b);
}

// 把颜色整体调亮/调暗(dL 为亮度增量,范围约 -0.4 ~ 0.4)
function shiftLightness(hex, dL) {
  let [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  l = clamp01(l + dL);
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (t) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    r = f(h + 1 / 3);
    g = f(h);
    b = f(h - 1 / 3);
  }
  return rgbToHex(r, g, b);
}

// 从一个主题色派生整套深浅色阶(与 Infima 变量一一对应)
function primaryShades(hex) {
  return {
    '--ifm-color-primary': hex,
    '--ifm-color-primary-dark': shiftLightness(hex, -0.08),
    '--ifm-color-primary-darker': shiftLightness(hex, -0.14),
    '--ifm-color-primary-darkest': shiftLightness(hex, -0.3),
    '--ifm-color-primary-light': shiftLightness(hex, 0.12),
    '--ifm-color-primary-lighter': shiftLightness(hex, 0.2),
    '--ifm-color-primary-lightest': shiftLightness(hex, 0.4),
  };
}

function pickVar(cssText, name) {
  const m = cssText.match(new RegExp(name + '\\s*:\\s*([^;]+);'));
  return m ? m[1].trim() : '';
}

function replaceVar(cssText, name, value) {
  return cssText.replace(new RegExp('(' + name + '\\s*:\\s*)([^;]+)(;)'), '$1' + value + '$3');
}

const BLOG_TEMPLATE = (title, slug) => `---
date: ${nowLocal()}
slug: ${slug}
title: ${title}
tags: [随笔]
authors:
  name: 夏鸣
  image_url: /img/avatar.png
---

在这里写正文(支持 Markdown 语法)……

`;

const DOC_TEMPLATE = (title, position) => `---
sidebar_position: ${position}
---

# ${title}

在这里写正文(支持 Markdown 语法)……

`;

// ---------- 页面组件 ----------

export default function AdminPage() {
  const [pat, setPat] = useState('');
  const [patDraft, setPatDraft] = useState('');
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState(null);
  const [metas, setMetas] = useState({}); // path -> { sha, content, pinned, pos, title }
  const [view, setView] = useState({ mode: 'list' });
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', name: '' });
  const [newDoc, setNewDoc] = useState({ title: '', name: '', dir: 'docs/' });
  const [appearance, setAppearance] = useState(null);
  const [comments, setComments] = useState(null);
  const [homepage, setHomepage] = useState(null);
  const [footer, setFooter] = useState(null);
  const taRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(PAT_KEY) || '';
    setPat(saved);
    setPatDraft(saved);
  }, []);

  // 读取文件列表;已登录时额外读取每个文件的元信息(标题/置顶/排序位置)
  const loadFiles = useCallback(async (usePat) => {
    setBusy(true);
    setStatus(null);
    try {
      const data = await gh(usePat, `/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`);
      const list = (data.tree || [])
        .map((t) => t.path)
        .filter((p) => /^blog\/.+\.md$/.test(p) || /^docs\/.+\.md$/.test(p))
        .sort();
      setFiles(list);
      if (usePat) {
        const entries = await Promise.all(
          list.map(async (p) => {
            try {
              const d = await gh(usePat, `/repos/${OWNER}/${REPO}/contents/${encPath(p)}?ref=${BRANCH}`);
              const content = b64decodeUtf8(d.content);
              const pos = parseInt(getFm(content, 'sidebar_position'), 10);
              return [
                p,
                {
                  sha: d.sha,
                  content,
                  pinned: getFm(content, 'pinned') === 'true',
                  pos: Number.isNaN(pos) ? null : pos,
                  title: getFm(content, 'title') || (content.match(/^#\s+(.+)$/m) || [])[1] || null,
                },
              ];
            } catch (e) {
              return [p, null];
            }
          })
        );
        setMetas(Object.fromEntries(entries.filter(([, v]) => v)));
      } else {
        setMetas({});
      }
    } catch (e) {
      setStatus({ type: 'err', text: '读取文件列表失败:' + e.message });
      setFiles([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(pat || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    const candidate = patDraft.trim();
    if (!candidate) {
      setStatus({ type: 'err', text: '请先粘贴访问令牌' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const me = await gh(candidate, '/user');
      await gh(candidate, `/repos/${OWNER}/${REPO}`);
      window.localStorage.setItem(PAT_KEY, candidate);
      setPat(candidate);
      setUser(me.login);
      setStatus({ type: 'ok', text: `登录成功:${me.login}。现在可以保存、置顶、排序了。` });
      loadFiles(candidate);
    } catch (e) {
      setStatus({
        type: 'err',
        text:
          '登录失败:' +
          e.message +
          '(请检查令牌是否有效、是否勾选了 my-homepage 仓库的 Contents 读写权限)',
      });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    window.localStorage.removeItem(PAT_KEY);
    setPat('');
    setPatDraft('');
    setUser(null);
    setStatus({ type: 'info', text: '已退出登录(仍可浏览内容,保存/置顶/排序需要重新登录)。' });
    loadFiles(null);
  };

  const openFile = async (path) => {
    setBusy(true);
    setStatus(null);
    try {
      const meta = metas[path];
      if (meta) {
        setCurrent({ path, content: meta.content, sha: meta.sha });
      } else {
        const d = await gh(pat || null, `/repos/${OWNER}/${REPO}/contents/${encPath(path)}?ref=${BRANCH}`);
        setCurrent({ path, content: b64decodeUtf8(d.content), sha: d.sha });
      }
      setView({ mode: 'edit' });
      setShowPreview(false);
    } catch (e) {
      setStatus({ type: 'err', text: '打开文件失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveFile = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录(粘贴访问令牌)再保存。' });
      return;
    }
    if (current.path.startsWith('blog/') && !current.content.trim().startsWith('---')) {
      const ok = window.confirm('注意:这篇文章开头缺少 --- 包围的 frontmatter(标题/日期等),可能不符合文章格式。仍要保存吗?');
      if (!ok) return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encPath(current.path)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `内容管理页面更新: ${current.path}`,
          content: b64encodeUtf8(current.content),
          sha: current.sha,
          branch: BRANCH,
        }),
      });
      setCurrent({ ...current, sha: res.content.sha });
      setStatus({ type: 'ok', text: '保存成功!GitHub 正在重新构建网站,约 2 分钟后刷新网站页面即可看到更新。' });
      loadFiles(pat);
    } catch (e) {
      if (e.status === 409) {
        setStatus({ type: 'err', text: '保存失败:文件已被其他地方修改,请返回列表重新打开再改。' });
      } else if (e.status === 401 || e.status === 403) {
        setStatus({ type: 'err', text: '保存失败:令牌无效或权限不足,请重新登录。' });
      } else {
        setStatus({ type: 'err', text: '保存失败:' + e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteFile = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再删除。' });
      return;
    }
    const ok = window.confirm(`确定要删除 ${current.path} 吗?删除后可以在 GitHub 的历史记录里找回。`);
    if (!ok) return;
    setBusy(true);
    setStatus(null);
    try {
      await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encPath(current.path)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `内容管理页面删除: ${current.path}`,
          sha: current.sha,
          branch: BRANCH,
        }),
      });
      setView({ mode: 'list' });
      setCurrent(null);
      setStatus({ type: 'ok', text: '已删除。约 2 分钟后网站会自动更新。' });
      loadFiles(pat);
    } catch (e) {
      setStatus({ type: 'err', text: '删除失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  // 用修改后的内容覆盖保存某个文件的元信息
  const putContent = async (path, newContent, message) => {
    const meta = metas[path];
    const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encPath(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: b64encodeUtf8(newContent),
        sha: meta.sha,
        branch: BRANCH,
      }),
    });
    const pos = parseInt(getFm(newContent, 'sidebar_position'), 10);
    setMetas((prev) => ({
      ...prev,
      [path]: {
        ...meta,
        content: newContent,
        sha: res.content.sha,
        pinned: getFm(newContent, 'pinned') === 'true',
        pos: Number.isNaN(pos) ? null : pos,
      },
    }));
  };

  // 置顶 / 取消置顶(仅博客文章)
  const togglePinned = async (path) => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再操作置顶。' });
      return;
    }
    const meta = metas[path];
    if (!meta) {
      setStatus({ type: 'err', text: '还没有读到该文件内容,请点「刷新列表」后再试。' });
      return;
    }
    if (!splitFrontmatter(meta.content)) {
      setStatus({ type: 'err', text: '这个文件顶部没有 --- 包围的 frontmatter,无法设置置顶。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const next = setFm(meta.content, 'pinned', meta.pinned ? null : 'true');
      await putContent(path, next, `内容管理页面${meta.pinned ? '取消置顶' : '置顶'}: ${path}`);
      setStatus({
        type: 'ok',
        text: meta.pinned ? '已取消置顶。约 2 分钟后网站更新。' : '已置顶!它会显示在博客列表最前面(约 2 分钟后网站更新)。',
      });
    } catch (e) {
      setStatus({ type: 'err', text: '操作失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  // 调整文档的 sidebar_position(排序)
  const changePosition = async (path, newPos) => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再调整排序。' });
      return;
    }
    const meta = metas[path];
    if (!meta) {
      setStatus({ type: 'err', text: '还没有读到该文件内容,请点「刷新列表」后再试。' });
      return;
    }
    if (!splitFrontmatter(meta.content)) {
      setStatus({ type: 'err', text: '这个文档顶部没有 --- 包围的 frontmatter,无法设置排序位置。' });
      return;
    }
    if (newPos < 1) return;
    setBusy(true);
    setStatus(null);
    try {
      const next = setFm(meta.content, 'sidebar_position', String(newPos));
      await putContent(path, next, `内容管理页面调整排序: ${path} → ${newPos}`);
      setStatus({ type: 'ok', text: `已将排序位置改为 ${newPos}(约 2 分钟后网站更新)。` });
    } catch (e) {
      setStatus({ type: 'err', text: '调整失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const createPost = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再新建文章。' });
      return;
    }
    const title = newPost.title.trim();
    const name = newPost.name.trim().toLowerCase();
    if (!title) {
      setStatus({ type: 'err', text: '请填写文章标题' });
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setStatus({ type: 'err', text: '文件名请用小写字母、数字和短横线(例如 my-first-post)' });
      return;
    }
    const path = `blog/${todayLocal()}-${name}.md`;
    const content = BLOG_TEMPLATE(title, name);
    setBusy(true);
    setStatus(null);
    try {
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `内容管理页面新建文章: ${path}`,
          content: b64encodeUtf8(content),
          branch: BRANCH,
        }),
      });
      setCurrent({ path, content, sha: res.content.sha });
      setView({ mode: 'edit' });
      setNewPost({ title: '', name: '' });
      setStatus({ type: 'ok', text: '文章已创建,可以直接编辑正文,改完点「保存」。' });
      loadFiles(pat);
    } catch (e) {
      if (e.status === 422) {
        setStatus({ type: 'err', text: '创建失败:同名文件已存在,换个文件名再试。' });
      } else {
        setStatus({ type: 'err', text: '创建失败:' + e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const createDoc = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再新建文档。' });
      return;
    }
    const title = newDoc.title.trim();
    const name = newDoc.name.trim().toLowerCase();
    if (!title) {
      setStatus({ type: 'err', text: '请填写文档标题' });
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setStatus({ type: 'err', text: '文件名请用小写字母、数字和短横线(例如 my-note)' });
      return;
    }
    const path = `${newDoc.dir}${name}.md`;
    // 自动给出排序位置:取该目录下已有文档的最大位置 + 1
    const siblingPositions = files
      .filter((f) => f.startsWith(newDoc.dir) && !f.slice(newDoc.dir.length).includes('/'))
      .map((f) => (metas[f] && metas[f].pos) || 0);
    const position = (siblingPositions.length ? Math.max(...siblingPositions) : 0) + 1;
    const content = DOC_TEMPLATE(title, position);
    setBusy(true);
    setStatus(null);
    try {
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `内容管理页面新建文档: ${path}`,
          content: b64encodeUtf8(content),
          branch: BRANCH,
        }),
      });
      setCurrent({ path, content, sha: res.content.sha });
      setView({ mode: 'edit' });
      setNewDoc({ title: '', name: '', dir: newDoc.dir });
      setStatus({ type: 'ok', text: '文档已创建,可以直接编辑正文,改完点「保存」。' });
      loadFiles(pat);
    } catch (e) {
      if (e.status === 422) {
        setStatus({ type: 'err', text: '创建失败:同名文件已存在,换个文件名再试。' });
      } else {
        setStatus({ type: 'err', text: '创建失败:' + e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  // ---------- 外观设置（颜色） ----------

  const openAppearance = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录(需要写入权限)再修改外观。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const d = await gh(pat, `/repos/${OWNER}/${REPO}/contents/src/css/custom.css?ref=${BRANCH}`);
      const css = b64decodeUtf8(d.content);
      const idx = css.indexOf("[data-theme='dark']");
      const lightPart = idx >= 0 ? css.slice(0, idx) : css;
      const darkPart = idx >= 0 ? css.slice(idx) : css;
      setAppearance({
        css,
        sha: d.sha,
        lightPrimary: pickVar(lightPart, '--ifm-color-primary') || DEFAULT_LIGHT.primary,
        lightHeading: pickVar(lightPart, '--ifm-heading-color') || DEFAULT_LIGHT.heading,
        lightText: pickVar(lightPart, '--ifm-font-color-base') || DEFAULT_LIGHT.text,
        darkPrimary: pickVar(darkPart, '--ifm-color-primary') || DEFAULT_DARK.primary,
        darkHeading: pickVar(darkPart, '--ifm-heading-color') || DEFAULT_DARK.heading,
        darkText: pickVar(darkPart, '--ifm-font-color-base') || DEFAULT_DARK.text,
      });
      setView({ mode: 'appearance' });
    } catch (e) {
      setStatus({ type: 'err', text: '读取样式文件失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveAppearance = async () => {
    if (!pat || !appearance) {
      setStatus({ type: 'err', text: '请先登录再保存。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const idx = appearance.css.indexOf("[data-theme='dark']");
      let lightPart = idx >= 0 ? appearance.css.slice(0, idx) : appearance.css;
      let darkPart = idx >= 0 ? appearance.css.slice(idx) : '';

      const applyShades = (text, primary, heading, text2) => {
        let out = text;
        const shades = primaryShades(primary);
        Object.keys(shades).forEach((k) => {
          out = replaceVar(out, k, shades[k]);
        });
        out = replaceVar(out, '--ifm-heading-color', heading);
        out = replaceVar(out, '--ifm-font-color-base', text2);
        return out;
      };

      lightPart = applyShades(lightPart, appearance.lightPrimary, appearance.lightHeading, appearance.lightText);
      if (idx >= 0) {
        darkPart = applyShades(darkPart, appearance.darkPrimary, appearance.darkHeading, appearance.darkText);
      }
      const nextCss = lightPart + darkPart;

      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/src/css/custom.css`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '内容管理页面更新外观颜色',
          content: b64encodeUtf8(nextCss),
          sha: appearance.sha,
          branch: BRANCH,
        }),
      });
      setAppearance({ ...appearance, css: nextCss, sha: res.content.sha });
      setStatus({ type: 'ok', text: '外观已保存!约 2 分钟后网站更新,刷新即可看到新颜色。' });
    } catch (e) {
      setStatus({ type: 'err', text: '保存失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  // ---------- 评论设置（giscus） ----------

  const openComments = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const d = await gh(pat || null, `/repos/${OWNER}/${REPO}/contents/docusaurus.config.js?ref=${BRANCH}`);
      const text = b64decodeUtf8(d.content);
      const pick = (key) => {
        const m = text.match(new RegExp(key + ":\\s*'([^']*)'"));
        return m ? m[1] : '';
      };
      setComments({
        text,
        sha: d.sha,
        repoId: pick('repoId'),
        category: pick('category'),
        categoryId: pick('categoryId'),
      });
      setView({ mode: 'comments' });
    } catch (e) {
      setStatus({ type: 'err', text: '读取配置文件失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveComments = async () => {
    if (!pat || !comments) {
      setStatus({ type: 'err', text: '请先登录再保存。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      let text = comments.text;
      const setKey = (key, value) => {
        text = text.replace(new RegExp('(' + key + ":\\s*')[^']*(')"), '$1' + value + '$2');
      };
      setKey('repoId', comments.repoId.trim());
      setKey('category', comments.category.trim());
      setKey('categoryId', comments.categoryId.trim());

      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/docusaurus.config.js`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '内容管理页面更新评论(giscus)配置',
          content: b64encodeUtf8(text),
          sha: comments.sha,
          branch: BRANCH,
        }),
      });
      setComments({ ...comments, text, sha: res.content.sha });
      setStatus({ type: 'ok', text: '评论配置已保存!约 2 分钟后网站更新,文章底部就会出现评论区。' });
    } catch (e) {
      setStatus({ type: 'err', text: '保存失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  // ---------- 首页设置 / 页脚设置(读写 src/data/*.json) ----------

  // 链接统一规则:http 开头 = 外部链接(href);其余 = 站内路径(to)
  const linkToForm = (l) => ({ label: l.label || '', url: l.href || l.to || '' });
  const formToLink = (l) => (l.url.startsWith('http') ? { label: l.label, href: l.url } : { label: l.label, to: l.url });

  const openJsonFile = async (path, setter, mode, label, transform) => {
    setBusy(true);
    setStatus(null);
    try {
      const d = await gh(pat || null, `/repos/${OWNER}/${REPO}/contents/${encPath(path)}?ref=${BRANCH}`);
      const raw = JSON.parse(b64decodeUtf8(d.content));
      setter({ data: transform ? transform(raw) : raw, sha: d.sha, path });
      setView({ mode });
    } catch (e) {
      setStatus({ type: 'err', text: '读取 ' + path + ' 失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveJsonFile = async (state, setter, message, fileData) => {
    if (!pat || !state) {
      setStatus({ type: 'err', text: '请先登录再保存。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const text = JSON.stringify(fileData || state.data, null, 2) + '\n';
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encPath(state.path)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: b64encodeUtf8(text), sha: state.sha, branch: BRANCH }),
      });
      setter({ ...state, sha: res.content.sha });
      setStatus({ type: 'ok', text: '已保存!约 2 分钟后网站更新,刷新首页/拉到页面底部即可看到。' });
    } catch (e) {
      setStatus({ type: 'err', text: '保存失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const openHomepage = () =>
    openJsonFile('src/data/homepage.json', setHomepage, 'homepage', '首页设置', (raw) => ({
      title: raw.title || '',
      description: raw.description || '',
      buttons: (raw.buttons || []).map((b) => ({ label: b.label || '', url: b.url || '' })),
    }));

  const updateHomepage = (patch) => setHomepage((s) => s && { ...s, data: { ...s.data, ...patch } });

  const setHomepageButton = (i, patch) =>
    setHomepage((s) => ({
      ...s,
      data: { ...s.data, buttons: s.data.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) },
    }));

  const addHomepageButton = () =>
    setHomepage((s) => ({ ...s, data: { ...s.data, buttons: [...s.data.buttons, { label: '新按钮', url: './blog' }] } }));

  const removeHomepageButton = (i) =>
    setHomepage((s) => ({ ...s, data: { ...s.data, buttons: s.data.buttons.filter((b, idx) => idx !== i) } }));

  const saveHomepage = () => saveJsonFile(homepage, setHomepage, '内容管理页面更新首页设置');

  const openFooter = () =>
    openJsonFile('src/data/footer.json', setFooter, 'footer', '页脚设置', (raw) => ({
      columns: (raw.columns || []).map((c) => ({
        title: c.title || '',
        links: (c.links || []).map(linkToForm),
      })),
      copyright: raw.copyright || '',
    }));

  const updateFooter = (patch) => setFooter((s) => s && { ...s, data: { ...s.data, ...patch } });

  const setFooterColumn = (ci, patch) =>
    setFooter((s) => ({
      ...s,
      data: { ...s.data, columns: s.data.columns.map((c, i) => (i === ci ? { ...c, ...patch } : c)) },
    }));

  const setFooterLink = (ci, li, patch) =>
    setFooter((s) => ({
      ...s,
      data: {
        ...s.data,
        columns: s.data.columns.map((c, i) =>
          i === ci ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : c
        ),
      },
    }));

  const addFooterLink = (ci) =>
    setFooter((s) => ({
      ...s,
      data: {
        ...s.data,
        columns: s.data.columns.map((c, i) =>
          i === ci ? { ...c, links: [...c.links, { label: '新链接', url: '' }] } : c
        ),
      },
    }));

  const removeFooterLink = (ci, li) =>
    setFooter((s) => ({
      ...s,
      data: {
        ...s.data,
        columns: s.data.columns.map((c, i) =>
          i === ci ? { ...c, links: c.links.filter((l, j) => j !== li) } : c
        ),
      },
    }));

  const saveFooter = () => {
    const fileData = {
      columns: footer.data.columns.map((c) => ({ title: c.title, links: c.links.map(formToLink) })),
      copyright: footer.data.copyright,
    };
    return saveJsonFile(footer, setFooter, '内容管理页面更新页脚设置', fileData);
  };

  // ---------- Markdown 工具栏 ----------

  const insertMd = (prefix, suffix = '', placeholder = '') => {
    const ta = taRef.current;
    if (!ta || !current) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const value = current.content;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + prefix + sel + suffix + value.slice(e);
    setCurrent({ ...current, content: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + prefix.length + sel.length + suffix.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const mdLinePrefix = (prefix) => {
    const ta = taRef.current;
    if (!ta || !current) return;
    const value = current.content;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    setCurrent({ ...current, content: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length);
    });
  };

  const toolbar = [
    { label: 'H2', title: '二级标题', act: () => mdLinePrefix('## ') },
    { label: 'H3', title: '三级标题', act: () => mdLinePrefix('### ') },
    { label: 'B', title: '加粗', act: () => insertMd('**', '**', '粗体文字') },
    { label: 'I', title: '斜体', act: () => insertMd('*', '*', '斜体文字') },
    { label: '~~', title: '删除线', act: () => insertMd('~~', '~~', '删除的文字') },
    { label: '🔗', title: '链接', act: () => insertMd('[', '](https://)', '链接文字') },
    { label: '🖼', title: '图片', act: () => insertMd('![', '](../img/)', '图片说明') },
    { label: '代码', title: '行内代码', act: () => insertMd('`', '`', '代码') },
    { label: '{ }', title: '代码块', act: () => insertMd('```\n', '\n```', '代码内容') },
    { label: '引用', title: '引用', act: () => mdLinePrefix('> ') },
    { label: '列表', title: '无序列表', act: () => mdLinePrefix('- ') },
    { label: '1.', title: '有序列表', act: () => mdLinePrefix('1. ') },
    { label: '—', title: '分割线', act: () => insertMd('\n---\n', '', '') },
  ];

  // ---------- 列表排序与分组 ----------

  const blogFiles = (files || [])
    .filter((f) => f.startsWith('blog/'))
    .sort((a, b) => {
      const pa = metas[a] && metas[a].pinned ? 0 : 1;
      const pb = metas[b] && metas[b].pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return b.localeCompare(a); // 日期文件名倒序 = 新的在前
    });
  const docFiles = (files || [])
    .filter((f) => f.startsWith('docs/'))
    .sort((a, b) => {
      const pa = metas[a] && metas[a].pos != null ? metas[a].pos : 9999;
      const pb = metas[b] && metas[b].pos != null ? metas[b].pos : 9999;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });

  const blogDate = (path) => {
    const m = path.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  };

  const showName = (path, prefix) => {
    const meta = metas[path];
    if (meta && meta.title) return meta.title;
    return path.replace(prefix, '');
  };

  const previewHtml = current && showPreview ? marked.parse(current.content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') || '') : '';

  return (
    <Layout title="内容管理">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="admin-wrap">
        <div className="admin-header">
          <h1>内容管理</h1>
          <div className="admin-login-state">
            {pat ? (
              <span className="admin-user">
                已登录{user ? `:${user}` : ''}
                <button className="button button--secondary button--sm" onClick={logout}>
                  退出登录
                </button>
              </span>
            ) : (
              <span className="admin-user">未登录(只读)</span>
            )}
          </div>
        </div>

        {status && <div className={`admin-status admin-status--${status.type}`}>{status.text}</div>}

        {!pat && (
          <details className="admin-help" open>
            <summary>第一次使用?点这里看「登录」说明(只需设置一次)</summary>
            <ol>
              <li>
                打开 GitHub 的令牌创建页:
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                  github.com/settings/personal-access-tokens/new
                </a>
              </li>
              <li>「Token name」随便填(比如 管理页面);「Expiration」建议选 90 天或自定义</li>
              <li>
                「Repository access」选 <b>Only select repositories</b>,只勾选 <code>my-homepage</code>
              </li>
              <li>
                「Permissions → Repository permissions」找到 <b>Contents</b>,设置为 <b>Read and write</b>
              </li>
              <li>点最下方「Generate token」,复制那串令牌,粘贴到下面输入框</li>
            </ol>
            <p className="admin-note">
              令牌只保存在你自己的浏览器里(不会上传到网站仓库);换浏览器/换电脑需要重新粘贴一次;
              随时可以在 GitHub 的令牌页面里 Revoke(吊销)让它失效。
            </p>
          </details>
        )}

        {!pat && (
          <div className="admin-login-box">
            <input
              type="password"
              className="admin-input"
              placeholder="粘贴访问令牌(以 github_pat_ 或 ghp_ 开头)"
              value={patDraft}
              onChange={(e) => setPatDraft(e.target.value)}
            />
            <button className="button button--primary" disabled={busy} onClick={login}>
              保存登录
            </button>
          </div>
        )}

        {view.mode === 'list' && (
          <div className="admin-list-view">
            <div className="admin-list-actions">
              <button
                className="button button--primary"
                onClick={() => {
                  setView({ mode: 'newPost' });
                  setStatus(null);
                }}>
                + 新建文章
              </button>
              <button
                className="button button--primary"
                onClick={() => {
                  setView({ mode: 'newDoc' });
                  setStatus(null);
                }}>
                + 新建文档
              </button>
              <button className="button button--secondary" disabled={busy} onClick={openHomepage}>
                🏠 首页设置
              </button>
              <button className="button button--secondary" disabled={busy} onClick={openFooter}>
                🔗 页脚设置
              </button>
              <button className="button button--secondary" disabled={busy} onClick={openAppearance}>
                🎨 外观设置
              </button>
              <button className="button button--secondary" disabled={busy} onClick={openComments}>
                💬 评论设置
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => loadFiles(pat || null)}>
                刷新列表
              </button>
              <a className="button button--link" href="/my-homepage/" target="_blank" rel="noreferrer">
                打开网站 ↗
              </a>
            </div>

            {files === null ? (
              <p>正在读取文件列表…</p>
            ) : (
              <>
                <h2>博客文章({blogFiles.length})</h2>
                <ul className="admin-file-list">
                  {blogFiles.map((f) => (
                    <li key={f} className="admin-file-row">
                      <button className="admin-file-link" disabled={busy} onClick={() => openFile(f)}>
                        {metas[f] && metas[f].pinned && <span className="admin-badge">置顶</span>}
                        {showName(f, 'blog/')}
                      </button>
                      <span className="admin-file-date">{blogDate(f)}</span>
                      <button
                        className="button button--secondary admin-small-btn"
                        disabled={busy}
                        onClick={() => togglePinned(f)}>
                        {metas[f] && metas[f].pinned ? '取消置顶' : '置顶'}
                      </button>
                    </li>
                  ))}
                </ul>
                <h2>文档页面({docFiles.length})</h2>
                <ul className="admin-file-list">
                  {docFiles.map((f) => (
                    <li key={f} className="admin-file-row">
                      <button className="admin-file-link" disabled={busy} onClick={() => openFile(f)}>
                        {metas[f] && metas[f].pos != null && <span className="admin-badge admin-badge--pos">#{metas[f].pos}</span>}
                        {showName(f, 'docs/')}
                      </button>
                      <button
                        className="button button--secondary admin-small-btn"
                        title="往上移一位"
                        disabled={busy}
                        onClick={() => changePosition(f, ((metas[f] && metas[f].pos) || 1) - 1)}>
                        ▲
                      </button>
                      <button
                        className="button button--secondary admin-small-btn"
                        title="往下移一位"
                        disabled={busy}
                        onClick={() => changePosition(f, ((metas[f] && metas[f].pos) || 0) + 1)}>
                        ▼
                      </button>
                    </li>
                  ))}
                </ul>
                {!pat && <p className="admin-note">登录后可以:置顶文章、调整文档排序、看到文章标题。</p>}
              </>
            )}
          </div>
        )}

        {view.mode === 'newPost' && (
          <div className="admin-new-view">
            <h2>新建文章(博客)</h2>
            <label className="admin-field">
              文章标题(中文可以):
              <input
                className="admin-input"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="例如:我的第一篇博客"
              />
            </label>
            <label className="admin-field">
              文件名(小写英文/数字/短横线):
              <input
                className="admin-input"
                value={newPost.name}
                onChange={(e) => setNewPost({ ...newPost, name: e.target.value })}
                placeholder="例如:my-first-post"
              />
            </label>
            <p className="admin-note">
              将创建:<code>{`blog/${todayLocal()}-${newPost.name || '文件名'}.md`}</code>
            </p>
            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={createPost}>
                创建
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
          </div>
        )}

        {view.mode === 'newDoc' && (
          <div className="admin-new-view">
            <h2>新建文档</h2>
            <label className="admin-field">
              文档标题:
              <input
                className="admin-input"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="例如:我的工具箱介绍"
              />
            </label>
            <label className="admin-field">
              文件名(小写英文/数字/短横线):
              <input
                className="admin-input"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                placeholder="例如:my-note"
              />
            </label>
            <label className="admin-field">
              放置位置:
              <select
                className="admin-input"
                value={newDoc.dir}
                onChange={(e) => setNewDoc({ ...newDoc, dir: e.target.value })}>
                <option value="docs/">文档根目录</option>
                <option value="docs/tools/">工具箱(docs/tools)</option>
              </select>
            </label>
            <p className="admin-note">
              将创建:<code>{`${newDoc.dir}${newDoc.name || '文件名'}.md`}</code>
              ,并自动排在当前目录最后;创建后可以用列表里的 ▲▼ 调整顺序。
            </p>
            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={createDoc}>
                创建
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
          </div>
        )}

        {view.mode === 'appearance' && appearance && (
          <div className="admin-new-view">
            <h2>外观设置(颜色)</h2>
            <p className="admin-note">
              主题色会自动派生出一整套深浅色(按钮、链接、导航高亮都会跟着变);保存后约 2 分钟网站更新。
            </p>

            <h3>亮色模式</h3>
            <div className="admin-color-grid">
              <label className="admin-color-item">
                主题色
                <input
                  type="color"
                  value={appearance.lightPrimary}
                  onChange={(e) => setAppearance({ ...appearance, lightPrimary: e.target.value })}
                />
                <code className="admin-hex">{appearance.lightPrimary}</code>
              </label>
              <label className="admin-color-item">
                标题颜色
                <input
                  type="color"
                  value={appearance.lightHeading}
                  onChange={(e) => setAppearance({ ...appearance, lightHeading: e.target.value })}
                />
                <code className="admin-hex">{appearance.lightHeading}</code>
              </label>
              <label className="admin-color-item">
                正文颜色
                <input
                  type="color"
                  value={appearance.lightText}
                  onChange={(e) => setAppearance({ ...appearance, lightText: e.target.value })}
                />
                <code className="admin-hex">{appearance.lightText}</code>
              </label>
            </div>
            <div className="admin-swatches">
              {Object.values(primaryShades(appearance.lightPrimary)).map((c) => (
                <span key={c + '_l'} className="admin-swatch" style={{ background: c }} title={c} />
              ))}
            </div>

            <h3>暗色模式</h3>
            <div className="admin-color-grid">
              <label className="admin-color-item">
                主题色
                <input
                  type="color"
                  value={appearance.darkPrimary}
                  onChange={(e) => setAppearance({ ...appearance, darkPrimary: e.target.value })}
                />
                <code className="admin-hex">{appearance.darkPrimary}</code>
              </label>
              <label className="admin-color-item">
                标题颜色
                <input
                  type="color"
                  value={appearance.darkHeading}
                  onChange={(e) => setAppearance({ ...appearance, darkHeading: e.target.value })}
                />
                <code className="admin-hex">{appearance.darkHeading}</code>
              </label>
              <label className="admin-color-item">
                正文颜色
                <input
                  type="color"
                  value={appearance.darkText}
                  onChange={(e) => setAppearance({ ...appearance, darkText: e.target.value })}
                />
                <code className="admin-hex">{appearance.darkText}</code>
              </label>
            </div>
            <div className="admin-swatches">
              {Object.values(primaryShades(appearance.darkPrimary)).map((c) => (
                <span key={c + '_d'} className="admin-swatch" style={{ background: c }} title={c} />
              ))}
            </div>

            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={saveAppearance}>
                {busy ? '保存中…' : '保存外观'}
              </button>
              <button
                className="button button--secondary"
                disabled={busy}
                onClick={() =>
                  setAppearance({
                    ...appearance,
                    lightPrimary: DEFAULT_LIGHT.primary,
                    lightHeading: DEFAULT_LIGHT.heading,
                    lightText: DEFAULT_LIGHT.text,
                    darkPrimary: DEFAULT_DARK.primary,
                    darkHeading: DEFAULT_DARK.heading,
                    darkText: DEFAULT_DARK.text,
                  })
                }>
                恢复默认颜色
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
          </div>
        )}

        {view.mode === 'comments' && comments && (
          <div className="admin-new-view">
            <h2>评论设置(giscus)</h2>
            <details className="admin-help" open>
              <summary>怎么拿到下面这三个值?(需要在 GitHub 网页上点几下,只需一次)</summary>
              <ol>
                <li>
                  开启 Discussions:打开
                  <a href="https://github.com/Natsunaki/my-homepage/settings" target="_blank" rel="noreferrer">
                    仓库设置
                  </a>
                  → Features 一节勾选 Discussions
                </li>
                <li>
                  安装 giscus 应用:打开
                  <a href="https://github.com/apps/giscus" target="_blank" rel="noreferrer">
                    github.com/apps/giscus
                  </a>
                  → Install → 选择 my-homepage 仓库 → 授权
                </li>
                <li>
                  打开
                  <a href="https://giscus.app/zh-CN" target="_blank" rel="noreferrer">
                    giscus.app
                  </a>
                  → 仓库填 Natsunaki/my-homepage → 分类选 Announcements → 页面上会生成 repoId / category / categoryId 三个值
                </li>
                <li>把三个值粘贴到下面,点保存</li>
              </ol>
            </details>
            <label className="admin-field">
              repoId(GitHub 仓库 ID):
              <input
                className="admin-input"
                value={comments.repoId}
                onChange={(e) => setComments({ ...comments, repoId: e.target.value })}
              />
            </label>
            <label className="admin-field">
              category(Discussion 分类名,例如 Announcements):
              <input
                className="admin-input"
                value={comments.category}
                onChange={(e) => setComments({ ...comments, category: e.target.value })}
              />
            </label>
            <label className="admin-field">
              categoryId(分类 ID):
              <input
                className="admin-input"
                value={comments.categoryId}
                onChange={(e) => setComments({ ...comments, categoryId: e.target.value })}
              />
            </label>
            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={saveComments}>
                {busy ? '保存中…' : '保存评论设置'}
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
          </div>
        )}

        {view.mode === 'homepage' && homepage && (
          <div className="admin-new-view">
            <h2>首页设置(大标题 / 文字 / 按钮)</h2>
            <label className="admin-field">
              大标题:
              <input
                className="admin-input"
                value={homepage.data.title}
                onChange={(e) => updateHomepage({ title: e.target.value })}
              />
            </label>
            <label className="admin-field">
              标题下面的文字:
              <input
                className="admin-input"
                value={homepage.data.description}
                onChange={(e) => updateHomepage({ description: e.target.value })}
              />
            </label>
            <h3>按钮</h3>
            {homepage.data.buttons.map((btn, i) => (
              <div className="admin-link-row" key={i}>
                <input
                  className="admin-input admin-input--label"
                  placeholder="按钮文字"
                  value={btn.label}
                  onChange={(e) => setHomepageButton(i, { label: e.target.value })}
                />
                <input
                  className="admin-input"
                  placeholder="跳转地址(如 ./blog 或 https://…)"
                  value={btn.url}
                  onChange={(e) => setHomepageButton(i, { url: e.target.value })}
                />
                <button className="button button--secondary admin-small-btn" onClick={() => removeHomepageButton(i)}>
                  删除
                </button>
              </div>
            ))}
            <div className="admin-list-actions">
              <button className="button button--secondary admin-small-btn" onClick={addHomepageButton}>
                + 添加按钮
              </button>
            </div>
            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={saveHomepage}>
                {busy ? '保存中…' : '保存首页设置'}
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
            <p className="admin-note">
              地址规则:`http` 开头 = 外部网站;`./blog`、`/docs/intro` 这样的 = 站内页面。保存后约 2 分钟生效。
            </p>
          </div>
        )}

        {view.mode === 'footer' && footer && (
          <div className="admin-new-view">
            <h2>页脚设置(网站最下面的链接)</h2>
            {footer.data.columns.map((col, ci) => (
              <div className="admin-footer-col" key={ci}>
                <label className="admin-field">
                  栏目标题:
                  <input
                    className="admin-input"
                    value={col.title}
                    onChange={(e) => setFooterColumn(ci, { title: e.target.value })}
                  />
                </label>
                {col.links.map((link, li) => (
                  <div className="admin-link-row" key={li}>
                    <input
                      className="admin-input admin-input--label"
                      placeholder="显示文字"
                      value={link.label}
                      onChange={(e) => setFooterLink(ci, li, { label: e.target.value })}
                    />
                    <input
                      className="admin-input"
                      placeholder="地址(http 开头 = 外链)"
                      value={link.url}
                      onChange={(e) => setFooterLink(ci, li, { url: e.target.value })}
                    />
                    <button
                      className="button button--secondary admin-small-btn"
                      onClick={() => removeFooterLink(ci, li)}>
                      删除
                    </button>
                  </div>
                ))}
                <button className="button button--secondary admin-small-btn" onClick={() => addFooterLink(ci)}>
                  + 添加链接
                </button>
              </div>
            ))}
            <label className="admin-field">
              底部版权行:
              <input
                className="admin-input"
                value={footer.data.copyright}
                onChange={(e) => updateFooter({ copyright: e.target.value })}
              />
            </label>
            <div className="admin-list-actions">
              <button className="button button--primary" disabled={busy} onClick={saveFooter}>
                {busy ? '保存中…' : '保存页脚设置'}
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => setView({ mode: 'list' })}>
                返回列表
              </button>
            </div>
          </div>
        )}

        {view.mode === 'edit' && current && (
          <div className="admin-edit-view">
            <div className="admin-edit-bar">
              <code>{current.path}</code>
              <div className="admin-list-actions">
                <button className="button button--primary" disabled={busy} onClick={saveFile}>
                  {busy ? '保存中…' : '保存'}
                </button>
                <button className="button button--danger" disabled={busy} onClick={deleteFile}>
                  删除
                </button>
                <button
                  className="button button--secondary"
                  disabled={busy}
                  onClick={() => setShowPreview((v) => !v)}>
                  {showPreview ? '关闭预览' : '实时预览'}
                </button>
                <button
                  className="button button--secondary"
                  disabled={busy}
                  onClick={() => {
                    setView({ mode: 'list' });
                    setCurrent(null);
                  }}>
                  返回列表
                </button>
              </div>
            </div>
            <div className="admin-toolbar">
              {toolbar.map((b) => (
                <button key={b.label} className="button button--secondary admin-small-btn" title={b.title} onClick={b.act}>
                  {b.label}
                </button>
              ))}
            </div>
            <div className={`admin-editor-grid${showPreview ? ' admin-editor-grid--with-preview' : ''}`}>
              <textarea
                ref={taRef}
                className="admin-textarea"
                value={current.content}
                spellCheck={false}
                onChange={(e) => setCurrent({ ...current, content: e.target.value })}
              />
              {showPreview && (
                <div
                  className="admin-preview markdown"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
            <p className="admin-note">
              提示:保存后约 2 分钟网站自动更新(可在
              <a href={`https://github.com/${OWNER}/${REPO}/actions`} target="_blank" rel="noreferrer">
                构建记录
              </a>
              里看进度)。
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
