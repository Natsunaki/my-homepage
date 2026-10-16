import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

import './index.css'; // 引入页面样式

export default function HomePage() {
    // 定义背景图片链接数组
    // 图片放在 static/img/backgrounds/ 目录下，替换成你喜欢的图片即可
    // 这里使用 useBaseUrl 处理路径，保证部署在子路径（如 /my-homepage/）下也能正常加载
    const bg1 = useBaseUrl('/img/backgrounds/bg-1.jpg');
    const bg2 = useBaseUrl('/img/backgrounds/bg-2.jpg');
    const bg3 = useBaseUrl('/img/backgrounds/bg-3.jpg');

    const desktopBackgroundImages = [
        bg1,
        bg2,
        bg3,
    ];

    const mobileBackgroundImages = [
        bg1,
        bg2,
        bg3,
    ];

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
                    {/* 首页大标题，改成你自己的 */}
                    <div id="logo">
                        <span>我的小窝</span>
                    </div>

                    <div id="index-page-description">
                        欢迎你的来访！！
                    </div>

                    <div id="index-page-button-container">
                        <div id="index-page-button">
                            <Link
                                className="button button--secondary button--lg"
                                to="./blog">
                                博客
                            </Link>
                            <Link
                                className="button button--secondary button--lg"
                                to="./docs/intro">
                                关于我
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
