import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import './index.css'; // 引入页面样式

// 首页文字与按钮来自 src/data/homepage.json(可在「内容管理 → 🏠 首页设置」里修改)
import homepageContent from '../data/homepage.json';

// 自动扫描背景图文件夹(新增背景图只需上传图片文件,无需修改任何代码):
//   src/img/backgrounds/        电脑端使用的图(尽量放横向的图)
//   src/img/backgrounds/mobile/ 只在手机端随机出现(适合竖图)
const desktopCtx = require.context('../img/backgrounds', false, /\.(jpe?g|png|webp)$/i);
const mobileCtx = require.context('../img/backgrounds/mobile', false, /\.(jpe?g|png|webp)$/i);

// webpack 5 里图片模块是 { default: url } 的形式,这里统一取出真实地址
function ctxUrls(ctx) {
    return ctx.keys().map((key) => {
        const mod = ctx(key);
        return typeof mod === 'string' ? mod : (mod && mod.default) || mod;
    });
}

const desktopBackgroundImages = ctxUrls(desktopCtx);
const mobileBackgroundImages = [...ctxUrls(desktopCtx), ...ctxUrls(mobileCtx)];

export default function HomePage() {
    // 判断屏幕比例是否接近手机（高宽比大于1）
    var isMobileRatioOld;
    const isMobileRatio = () => {
        const aspectRatio = window.innerHeight / window.innerWidth;
        return aspectRatio > 1;
    };

    // 定义状态存储背景图片
    const [backgroundImage, setBackgroundImage] = useState('');

    // 随机选择背景图片
    const selectRandomBackgroundImage = () => {
        const images = isMobileRatio() ? mobileBackgroundImages : desktopBackgroundImages;
        const randomIndex = Math.floor(Math.random() * images.length);
        setBackgroundImage(images[randomIndex]);
    };

    // 在组件挂载时选择背景图片
    useEffect(() => {
        // 初始化时选择背景图片
        selectRandomBackgroundImage();
        isMobileRatioOld = isMobileRatio();

        // 监听窗口大小变化，动态调整背景图片
        const handleResize = () => {
            if (isMobileRatio() == isMobileRatioOld) return;
            isMobileRatioOld = isMobileRatio();
            selectRandomBackgroundImage();
        };

        // 添加resize事件监听器
        window.addEventListener('resize', handleResize);

        // 清理事件监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);





    return (
        <Layout description="我的个人主页">
            <div id="index-page-container">

                {/* 背景图片 */}
                <div id="index-page-bg" style={{ backgroundImage: `url(${backgroundImage})` }}></div>
                <div id="index-page-bg-mask"></div>

                {/* 主体内容 */}
                <div id="index-page-main">
                    {/* 标题 / 文字 / 按钮都来自 src/data/homepage.json */}
                    <div id="logo">
                        <span>{homepageContent.title}</span>
                    </div>

                    <div id="index-page-description">
                        {homepageContent.description}
                    </div>

                    <div id="index-page-button-container">
                        <div id="index-page-button">
                            {homepageContent.buttons.map((btn, i) =>
                                btn.url && btn.url.startsWith('http') ? (
                                    <a
                                        key={i}
                                        className="button button--secondary button--lg"
                                        href={btn.url}>
                                        {btn.label}
                                    </a>
                                ) : (
                                    <Link
                                        key={i}
                                        className="button button--secondary button--lg"
                                        to={btn.url || './blog'}>
                                        {btn.label}
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
