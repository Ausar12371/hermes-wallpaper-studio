# 大鲸鱼 · Hermes 壁纸插件

> 🖼 **壁纸工作室（Wallpaper Studio）** —— 给 **Hermes Agent 桌面端** 的换壁纸插件：自定义底图、玻璃透明度、**动态视频壁纸**、界面字体 / 颜色 / 字号。
纯"磁盘插件"实现——**不修改任何应用文件**，放进目录即热加载，改完即时生效、重启不丢。

> Desktop wallpaper plugin for the Hermes Agent desktop app. Custom backgrounds, glass opacity, **video wallpapers**, and UI font controls. Pure disk-plugin: drop it in, hot-reloads in seconds, zero app files touched.

---

## ✨ 功能

| 模块 | 说明 |
|---|---|
| **自定义底图** | 填充 / 完整 / 平铺；按钮选择、拖拽进预览框、Ctrl+V 粘贴（自动压缩） |
| **玻璃透明度** | 主界面 / 侧栏 / 卡片 / 浮层 四档滑杆，数值越低壁纸越明显；4 组一键预设 |
| **动态壁纸** | 本地视频循环播放；`file://` 零拷贝直读——**4K 甚至更大也只是一个路径引用**，不复制、不压缩 |
| **界面字体** | 8 组预设 / 自定义字体名 / 上传字体文件（ttf / otf / woff / woff2） |
| **字体颜色** | 黑 / 白 / 蓝 / 红 / 粉红（整套文字色阶跟随变换） |
| **字体大小** | 85% – 130% 滑杆 |
| **实时生效** | 所有改动即时应用并自动保存，重启不丢 |

入口：侧栏「壁纸工作室」· `Ctrl+K` 搜"壁纸" · 状态栏右下角小图标。

## 📦 安装

**方式一（最省事 · 推荐）**：下载 / 解压后**双击 `install.bat`** —— 自动完成安装。

**方式二**：右键 `install.ps1` → "使用 PowerShell 运行"。
（若提示"禁止运行脚本"，改用方式一，或执行：`powershell -ExecutionPolicy Bypass -File .\install.ps1`）

**方式三（手动）**：把 `plugin.js` 放到：

```
Windows:  %LOCALAPPDATA%\hermes\desktop-plugins\wallpaper\plugin.js
类 Unix:  ~/.hermes/desktop-plugins/wallpaper/plugin.js
```

（文件夹名 `wallpaper` 必须与插件 id 一致。）

保存后应用会在**几秒内自动热加载，无需重启**。如果没出现：`Ctrl+K` → **Reload desktop plugins**。

## 🎬 动态壁纸使用指南

1. 打开「壁纸工作室」→「动态壁纸」→「选择视频文件…」
2. 选一个本地视频 → 立即循环播放（自动静音、无缝循环）
3. 「关闭视频」随时退回静态底图；静态底图和视频壁纸可以独立开关

**格式建议**：

- ✅ **WebM (VP9)** —— 最推荐，Chromium 内核必播
- ✅ **MP4 (H.264)** —— 实测可播（应用内置解码支持）
- ❌ HEVC / H.265 —— 通常不支持，需要转码

**为什么大文件也没问题？** 插件不复制、不压缩视频，只记录 `file://` 路径引用——素材放哪都行，播放时直接读原文件（几 GB 的 4K 视频也是秒切）。找素材的话：Wallpaper Engine 创意工坊的视频文件（`steamapps\workshop\content\431960\`）大多是 mp4 / webm，可以拿来直接用。

## ❓ FAQ / 已知坑

- **插件文件 ~500KB 上限**：`plugin.js` 超过约 500KB 会被截断，报 `Invalid or unexpected token`。**大图片 / 视频永远不要 base64 内嵌**，用 `file://` 引用或让用户选择文件（本插件的视频通道就是这么做的）。
- **加载失败去哪看**：`%LOCALAPPDATA%\hermes\logs\desktop.log` 搜 `runtime load failed`。
- **性能**：4K @ 30fps 循环播放对独显毫无压力；核显老机器建议 1080p 以内。
- **卸载**：删除插件文件夹或在 设置 → 插件 中禁用；卸载时插件会自动清理注入的样式和视频层。

## 🔧 实现原理

运行时向页面注入一段 `<style>`（颜色全部走应用主题变量）+ 一个全屏 `<video>` 背景层，不碰 `app.asar`。视频路径获取使用应用暴露的 `webUtils.getPathForFile` 桥（选择/拖入文件 → 得到真实磁盘路径 → 转成 `file://` 引用）。

- 官方文档：[Desktop Plugin SDK](https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk)
- 官方示例仓库：[NousResearch/hermes-example-plugins](https://github.com/NousResearch/hermes-example-plugins)

## 📄 License

MIT
