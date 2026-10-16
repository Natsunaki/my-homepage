import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import './admin.css';

const OWNER = 'Natsunaki';
const REPO = 'my-homepage';
const BRANCH = 'main';
const API = 'https://api.github.com';
const PAT_KEY = 'myhomepage_admin_pat';

// ---------- 工具函数 ----------

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

const BLOG_TEMPLATE = (title, slug) => `---
date: ${nowLocal()}
slug: ${slug}
title: ${title}
tags: [随笔]
authors:
  name: 夏鸣
  image_url: ../img/avatar.png
---

在这里写正文(支持 Markdown 语法)……

`;

// ---------- 页面组件 ----------

export default function AdminPage() {
  const [pat, setPat] = useState('');
  const [patDraft, setPatDraft] = useState('');
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState(null); // null=未加载
  const [view, setView] = useState({ mode: 'list' }); // list | edit | new
  const [current, setCurrent] = useState(null); // { path, content, sha }
  const [status, setStatus] = useState(null); // { type:'ok'|'err'|'info', text }
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(PAT_KEY) || '';
    setPat(saved);
    setPatDraft(saved);
  }, []);

  const loadFiles = useCallback(
    async (usePat) => {
      setBusy(true);
      setStatus(null);
      try {
        const data = await gh(usePat, `/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`);
        const list = (data.tree || [])
          .map((t) => t.path)
          .filter((p) => /^blog\/.+\.md$/.test(p) || /^docs\/.+\.md$/.test(p))
          .sort();
        setFiles(list);
      } catch (e) {
        setStatus({ type: 'err', text: '读取文件列表失败:' + e.message });
        setFiles([]);
      } finally {
        setBusy(false);
      }
    },
    []
  );

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
      setStatus({ type: 'ok', text: `登录成功:${me.login}。现在可以保存修改了。` });
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
    setStatus({ type: 'info', text: '已退出登录(仍可浏览和查看内容,保存需要重新登录)。' });
  };

  const openFile = async (path) => {
    setBusy(true);
    setStatus(null);
    try {
      const data = await gh(pat || null, `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${BRANCH}`);
      const content = b64decodeUtf8(data.content);
      setCurrent({ path, content, sha: data.sha });
      setView({ mode: 'edit' });
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
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(current.path).replace(/%2F/g, '/')}`, {
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
      await gh(pat, `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(current.path).replace(/%2F/g, '/')}`, {
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
      loadFiles(pat || null);
    } catch (e) {
      setStatus({ type: 'err', text: '删除失败:' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const createPost = async () => {
    if (!pat) {
      setStatus({ type: 'err', text: '请先登录再新建文章。' });
      return;
    }
    const title = newTitle.trim();
    const name = newName.trim().toLowerCase();
    if (!title) {
      setStatus({ type: 'err', text: '请填写文章标题' });
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setStatus({ type: 'err', text: '文件名请用小写字母、数字和短横线(例如 my-first-post)' });
      return;
    }
    const path = `blog/${todayLocal()}-${name}.md`;
    setBusy(true);
    setStatus(null);
    try {
      const res = await gh(pat, `/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `内容管理页面新建文章: ${path}`,
          content: b64encodeUtf8(BLOG_TEMPLATE(title, name)),
          branch: BRANCH,
        }),
      });
      setCurrent({ path, content: BLOG_TEMPLATE(title, name), sha: res.content.sha });
      setView({ mode: 'edit' });
      setNewTitle('');
      setNewName('');
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

  const blogFiles = (files || []).filter((f) => f.startsWith('blog/')).sort().reverse();
  const docFiles = (files || []).filter((f) => f.startsWith('docs/'));

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

        {status && (
          <div className={`admin-status admin-status--${status.type}`}>{status.text}</div>
        )}

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
              <li>「Token name」随便填(比如 管理页面);「Expiration」建议选 90 天或 Custom 自己定</li>
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
              <button className="button button--primary" onClick={() => {
                setView({ mode: 'new' });
                setStatus(null);
              }}>
                + 新建文章
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
                    <li key={f}>
                      <button className="admin-file-link" disabled={busy} onClick={() => openFile(f)}>
                        {f.replace(/^blog\//, '')}
                      </button>
                    </li>
                  ))}
                </ul>
                <h2>文档页面({docFiles.length})</h2>
                <ul className="admin-file-list">
                  {docFiles.map((f) => (
                    <li key={f}>
                      <button className="admin-file-link" disabled={busy} onClick={() => openFile(f)}>
                        {f.replace(/^docs\//, '')}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {view.mode === 'new' && (
          <div className="admin-new-view">
            <h2>新建文章</h2>
            <label className="admin-field">
              文章标题(中文可以):
              <input
                className="admin-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例如:我的第一篇博客"
              />
            </label>
            <label className="admin-field">
              文件名(小写英文/数字/短横线):
              <input
                className="admin-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如:my-first-post"
              />
            </label>
            <p className="admin-note">
              将创建:<code>{`blog/${todayLocal()}-${newName || '文件名'}.md`}</code>
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
                  onClick={() => {
                    setView({ mode: 'list' });
                    setCurrent(null);
                  }}>
                  返回列表
                </button>
              </div>
            </div>
            <textarea
              className="admin-textarea"
              value={current.content}
              spellCheck={false}
              onChange={(e) => setCurrent({ ...current, content: e.target.value })}
            />
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
