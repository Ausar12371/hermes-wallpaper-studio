/**
 * 壁纸工作室 (Wallpaper Studio) v1.0.0 — Hermes Desktop runtime plugin (MIT)
 * 安装位置: $HERMES_HOME/desktop-plugins/wallpaper/plugin.js
 *
 * 功能
 *  - 给 Hermes 桌面端设置自定义底图（填充 / 完整 / 平铺）
 *  - 四档玻璃面板透明度滑杆（主界面 / 侧栏 / 卡片 / 浮层），越低壁纸越清晰
 *  - 四组一键预设，随主题明暗自动适配，改完即时生效、自动保存
 *  - 换图：按钮选择 / 拖拽图片到预览框 / 直接 Ctrl+V 粘贴（自动压缩）
 *  - 内置示例底图；支持选择 / 拖拽 / Ctrl+V 换图（自动压缩或 file:// 直读）
 *  - 动态壁纸：视频循环层（WebM/MP4 · file:// 直读 · 大文件零压缩）；选择文件自动取路径
 *  - 界面字体：一键预设 / 自定义字体名 / 上传字体文件（ttf-otf-woff）· 字体颜色（黑白蓝红粉红）· 字号滑杆
 *  - 入口：左侧导航「壁纸工作室」· Ctrl+K 搜索"壁纸" · 状态栏右下角小图标
 *
 * 原理：运行时向页面注入一段 <style>（颜色取应用主题变量），不修改任何应用文件。
 */

import {
  Button, cn, haptic, host, ROUTES_AREA, SIDEBAR_NAV_AREA, PALETTE_AREA,
  STATUSBAR_AREAS, Switch, Tip, atom, useValue
} from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useState } from 'react'

const ID = 'wallpaper'
const STYLE_ID = 'hermes-wallpaper-plugin'
const STORE_KEY = 'config-v1'
const DEFAULT_IMG = 'data:image/jpeg;base64,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ITHvS0UUAFFKMUYFMQlLj3owKWmITFLRRQAuPejFGDS0ybAPrS4pKUGgAxS0UUwFx70YpM0uaBC0UUUwsFFLxRgUCEopcClxTATHvRilooEFFFFABRRRQFgooooCwUmKWigBMe9JTqMUDG0UuBRgUgEopeKSgdgpMe9LRmkFhMUlGaKBiEZoxS0hNACGkxS0UgEx70lLzSUh2ExRj3paKBjaKXAowKBiUGlOKSkMQikp1ITSAaRmjFLRQA2inUUANpMUpopWGJijFLRQGomKMUtFINRCOKbinHNJg07DExRilooATFGKWikAmKMUtFAEuDS0UVRIUUuPejFOwCUoNGKMUWAWigClxTASilxRigQlFLijFAgFLSYp2KYCUUuKMUEgDS0mKUUwClzRijFMBaKTHvS0CFzS5pMUYo0DQWij8aKYgoopce9ACUUuKMUAJRS4oxQAlFLijFACUUuKMUAJRS4oxQAlFLijHvQAlFFFABRRSYpWAM0lLik/GgYUhNGPejFAxKKXFIfrSAM02lx70YpAJRS4oxRYaGmkp2KTFIYlFLijFACUUuKMUDEptKRmjFKwxKKXFGKLAJTcYp1JikAlFLijFACUUuKMUWASg9KXFNI560rAJRS4oxTKEopcUYosAlFLijFKwCUUuKMUWAfRTqKsi42nUUUAFFGKMGgQUoNJg0YNMB1FIM0tABRS4NLQA2nYFFFABRRg0YNMQUUvNLQIbmnUUUwCiilzTASlzS0UCCiiigQUUUUAGTS5pKXmgAzRmjmjn0oAMijIo59KOfSgAyKMijn0o59KADNGaOaOaAEyaKKKBhRRRQIKTNLRQA3NFOpM0DEooopWGITSU6ikA2il5pMGgYUYowaMUBcacdqKdRSGNopcGkoAKQmg5pMGgAoowaMGkAUhNLRQMbRTqKAuNop1FKwxtFOoosAw0lOop2AbRTqKTHcbRTqKQXG0U6igLjaKdRQFx+KMUtFXYi4mKMUtFFguJiloopgFLigAUtACYoxS0UAApcUlKDQAYox70tFABRRRTsAUUUUWEFFFFFhC496MUClpgJj3paKKAFx70YpKMmiwhcUYozS5FAaiYox70tFMVxMH1pefWiigAoooosAUc+tFFACYPrRj3paKAExRiloyKQ7iYoxRmkyadg1Fx70lFFIYmPejFLRQAmPekpTSUAFFFFIAoooosMKTHvS0UhiYoxS0hNACGkxS0UAJijFLRQA2ilIxSUgExRiloosFxMUYpaKLDuJijFLRRYLiYpCPenGm0WBCYoxS0UrDExRilooATFGKWigBMUYpaKAExRilooAkopcUYqiRKKXFGKAEopcUYoASlGKMUYosAtFFFAXCiiimK4UUUUAGadmkxRiiwri0UUUx3CiiilYQUU4UUwE4paKKACiiimAUUUcetABRS496MUCuJRS4oxQFxKKXFGKAuJRS4oxQFxKKXFGKAuJRS496Tj1oGFFFFFgCiiikAhxSU6igBtFOptABRRRSHoFFFJj3phcQmilxSUrCCiiigYUUUUBcKQ4paTFIYlFLijFMBKKXFGKQCUUuKMUAJRS4pCKAG0UuKMUDuJRS4oxSsFxKKXFGKLBcSilxRiiwXEopcUYosFxKKXFGKLBcfRSg0tVYQ2inUUWAbRTqKLANop1FMBtKMUtFACYFGBS0UCEwKXApcCjFAXEopcUYoC4YoxS4ooEJg0tFFOwBRRmlzRYdxKXFLRQITAowKWigBMCjApaKYBgUUUUAFFFFABRRRQAUUUUAFFFFABgUmBS0UAJgUYFLRQAmBRilopANop1JmiwCUUuaSiw7iYNGKWiiwhMUlOpMUgEowKXFGKB3G4FGBTsCkoC4mBQcUtFIBtFOopjG0U6ikA2inUUWAbRTqD0osAwmkp1FOwxtFOopBcbRTqKLBcbRTqKLBcbRTqKLBcbRTqKLBcbRTqKLBcUDnrTsUlKDVWEGKMUtFIBMUYpaKAExRilooATFGKWimAmKMUtFFgDFLikFOoJExRilooATFGKWiiwCYoxS0UwExRilooATHvS0UUAFFFFABRRRzQAUUuT6UZ9qYCUU7NFFgG0U6iiwDaKdRRYBtFOpM+1FgEopcn0pOaQBRRRQAUUUUAJj3oxS0UAJijFLRQAmKMUtFIBMUYpaKLAJijFLRQA2kxTiaSiw0hMUYpaKBiYoxS0UgExRilooATFGKWigBMUhFKTSU7AJijFLRQAmKMUtFIBMUYpaKAExRilooATFGKWigBMUYpaKAExRilooAdRS4oxVAJTs0mKMe9AWFooFLilYQlFLijFFg0EopcUYosGglFLijFMNBKKXFGKA0EopcUYoDQTFGDS496WgQmKMUtFACYoxTsUYp2AbzS0uKMUAJRS4oxRYVhMUYNLijHvRYLCYNGDTqKLBYbg0YNOoosA3BowadRRYNBuDRg06iiwaDcGjBp1FFgG4NGDTqTHvRYLCYopcUYosFhKKXFGKBjeaMGnYoxQA3FGKdikpAJijBpaKAG4opce9GKBiUUuKMUBoJRS4oxQGglFLijFFg0EopcUYpWDQSilxRiiwaCUhNKaTFOwWEopcUYoGJRS4oxSsAlFLijFFgEopcUYosAlFLijFFgEopcUYosAlFLijFFgEopcUYosAtFFFUhMKKKKYgpQaKKAFoooqQCiiigAooooAKKKKaAKKKKYBRRRQAUox6UUUALRRRQAUUUUEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUDQUhxRRQMSiiigAooooAKKKKACiiipAKKKKACiiigAppNFFNAFFFFMAooooAKKKKkoKKKKACiiigAooooAKKKKACiiigAooooA/9k='

const DEFAULTS = { enabled: true, img: DEFAULT_IMG, fit: 'cover', chrome: 32, sidebar: 28, editor: 30, elevated: 42, fontOn: false, fontStack: '', fontLabel: '', fontData: '', fontFileName: '', fontColor: '', fontScale: 100, vidOn: false, vidPath: '', vidName: '' }
const PRESETS = [
  { id: 'ultra', label: '极清', v: { chrome: 20, sidebar: 16, editor: 18, elevated: 30 } },
  { id: 'clear', label: '清晰', v: { chrome: 28, sidebar: 24, editor: 26, elevated: 38 } },
  { id: 'std', label: '标准', v: { chrome: 40, sidebar: 36, editor: 38, elevated: 50 } },
  { id: 'soft', label: '淡雅', v: { chrome: 56, sidebar: 52, editor: 54, elevated: 66 } }
]
const SLIDERS = [
  { key: 'chrome', label: '主界面' },
  { key: 'sidebar', label: '侧栏' },
  { key: 'editor', label: '卡片/对话' },
  { key: 'elevated', label: '浮层' }
]
const FITS = [ { id: 'cover', label: '填充' }, { id: 'contain', label: '完整' }, { id: 'tile', label: '平铺' } ]
const FONT_FALLBACK = '"Segoe WPC", "Segoe UI", -apple-system, system-ui, sans-serif'
const FONT_PRESETS = [
  { id: 'default', label: '默认', stack: '' },
  { id: 'yahei', label: '微软雅黑', stack: '"Microsoft YaHei"' },
  { id: 'fzst', label: '方正舒体', stack: '"FZShuTi"' },
  { id: 'inkfree', label: 'Ink Free', stack: '"Ink Free"' },
  { id: 'kaiti', label: '楷体', stack: '"KaiTi"' },
  { id: 'simhei', label: '黑体', stack: '"SimHei"' },
  { id: 'simsun', label: '宋体', stack: '"SimSun"' },
  { id: 'duo', label: '中英组合 Ink Free+舒体', stack: '"Ink Free", "FZShuTi"' }
]
const FONT_COLORS = [
  { id: 'cdefault', label: '默认', v: '' },
  { id: 'black', label: '黑', v: '#111111' },
  { id: 'white', label: '白', v: '#ffffff' },
  { id: 'blue', label: '蓝', v: '#3d7eff' },
  { id: 'red', label: '红', v: '#e5484d' },
  { id: 'pink', label: '粉红', v: '#ff6fb5' }
]
const BUILTINS = [
  { id: 'b1', label: '默认示例', img: DEFAULT_IMG }
]
const VID_ID = 'hermes-wallpaper-video'

let cfg = { ...DEFAULTS }
const $cfg = atom(cfg)

function loadCfg(ctx) {
  try {
    const raw = ctx.storage.get(STORE_KEY, null)
    if (raw && typeof raw === 'object') cfg = { ...DEFAULTS, ...raw }
    else if (typeof raw === 'string' && raw) cfg = { ...DEFAULTS, ...JSON.parse(raw) }
  } catch (e) {}
  $cfg.set(cfg)
  apply()
}

function persist(ctx) {
  try { ctx.storage.set(STORE_KEY, cfg) } catch (e) {}
}

function buildCss(s) {
  if (!s.enabled || !s.img) return ''
  const size = s.fit === 'tile' ? 'auto' : (s.fit === 'contain' ? 'contain' : 'cover')
  const repeat = s.fit === 'tile' ? 'repeat' : 'no-repeat'
  return 'html{background:url("' + s.img + '") center center / ' + size + ' ' + repeat + ' fixed !important;}'
    + ':root,:root.dark,:root.light{'
    + '--ui-bg-chrome:color-mix(in srgb, var(--theme-background-seed) ' + s.chrome + '%, transparent) !important;'
    + '--ui-bg-sidebar:color-mix(in srgb, var(--theme-sidebar-seed) ' + s.sidebar + '%, transparent) !important;'
    + '--ui-bg-editor:color-mix(in srgb, var(--theme-card-seed) ' + s.editor + '%, transparent) !important;'
    + '--ui-bg-elevated:color-mix(in srgb, var(--theme-elevated-seed) ' + s.elevated + '%, transparent) !important;}'
}

function buildFontCss(s) {
  if (!s.fontOn) return ''
  var out = ''
  var stack = ''
  var face = ''
  if (s.fontData) {
    face = "@font-face{font-family:'WPCustomFont';src:url(" + s.fontData + ');font-display:swap;}'
    stack = "'WPCustomFont', " + FONT_FALLBACK
  } else if (s.fontStack) {
    stack = s.fontStack + ', ' + FONT_FALLBACK
  }
  if (stack) {
    out += face
      + ':root,:root.dark,:root.light{--dt-font-sans:' + stack + ' !important;}'
      + 'html,:root,body{font-family:' + stack + ' !important;}'
  }
  if (s.fontColor) {
    out += ':root,:root.dark,:root.light{--ui-base:' + s.fontColor + ' !important;--ui-text-primary:' + s.fontColor + ' !important;--dt-foreground:' + s.fontColor + ' !important;}'
      + 'html,:root,body{color:' + s.fontColor + ' !important;}'
  }
  var scale = Number(s.fontScale) || 100
  if (scale !== 100) {
    out += 'html{font-size:calc(.875rem * ' + (scale / 100) + ') !important;}'
  }
  return out
}

function apply() {
  try {
    const c = $cfg.get()
    const css = buildCss(c) + buildFontCss(c)
    let el = document.getElementById(STYLE_ID)
    if (!css) { if (el) el.remove() } else {
      if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el) }
      el.textContent = css
    }
    ensureVideo(c)
  } catch (e) {}
}

let ctxRef = null
function setKey(k, v) {
  cfg = { ...cfg, [k]: v }
  $cfg.set(cfg)
  if (ctxRef) persist(ctxRef)
  apply()
}
function setMany(obj) {
  cfg = { ...cfg, ...obj }
  $cfg.set(cfg)
  if (ctxRef) persist(ctxRef)
  apply()
}

function downscale(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file)
    var im = new Image()
    im.onload = function () {
      try {
        var MAX = 1600, w = im.naturalWidth, h = im.naturalHeight
        var sc = Math.min(1, MAX / Math.max(w, h))
        w = Math.round(w * sc); h = Math.round(h * sc)
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h
        cv.getContext('2d').drawImage(im, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(cv.toDataURL('image/jpeg', 0.86))
      } catch (e) { reject(e) }
    }
    im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    im.src = url
  })
}

function ingest(file, ctx) {
  if (!file || !/^image\//.test(file.type || '')) return
  downscale(file).then(function (dataUrl) {
    setMany({ img: dataUrl, enabled: true })
    haptic('tap')
    try { host.notify({ kind: 'success', message: '壁纸已更新' }) } catch (e) {}
  }).catch(function (e) { try { host.notifyError(e, '图片处理失败') } catch (_) {} })
}

function pickFile(ctx) {
  var inp = document.createElement('input')
  inp.type = 'file'; inp.accept = 'image/*'
  inp.onchange = function () { if (inp.files && inp.files[0]) ingest(inp.files[0], ctx) }
  inp.click()
}

function ensureVideo(s) {
  var el = document.getElementById(VID_ID)
  var want = s.enabled !== false && s.vidOn && s.vidPath
  if (!want) { if (el) el.remove(); return }
  if (!el) {
    el = document.createElement('video')
    el.id = VID_ID
    el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true
    el.setAttribute('muted', ''); el.setAttribute('playsinline', '')
    el.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;z-index:-1;pointer-events:none;background:transparent;'
    el.addEventListener('error', function () {
      try { host.notifyError(new Error('视频播放失败'), '动态壁纸：编码可能不受支持（推荐 WebM/VP9）或文件不可读') } catch (e) {}
    })
    document.body.insertBefore(el, document.body.firstChild)
  }
  var fit = s.fit === 'contain' ? 'contain' : 'cover'
  if (el.style.objectFit !== fit) el.style.objectFit = fit
  if (el.getAttribute('src') !== s.vidPath) { el.setAttribute('src', s.vidPath); try { el.load() } catch (e) {} }
  var pr = el.play(); if (pr && pr.catch) pr.catch(function () {})
}

function pickVideo(ctx) {
  var inp = document.createElement('input')
  inp.type = 'file'; inp.accept = 'video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov,.mkv'
  inp.onchange = function () {
    var f = inp.files && inp.files[0]
    if (!f) return
    var path = ''
    try { if (window.hermesDesktop && window.hermesDesktop.getPathForFile) path = window.hermesDesktop.getPathForFile(f) || '' } catch (e) {}
    if (path) {
      var url = 'file:///' + encodeURI(path.replace(/\\/g, '/'))
      setMany({ vidOn: true, vidPath: url, vidName: f.name })
      try { host.notify({ kind: 'success', message: '动态壁纸已启用：' + f.name }) } catch (e) {}
    } else {
      setMany({ vidOn: true, vidPath: URL.createObjectURL(f), vidName: f.name + '（临时，重启后失效）' })
    }
  }
  inp.click()
}

function Section(props) {
  return jsxs('div', { className: 'flex flex-col gap-2', children: [
    jsx('div', { className: 'text-xs font-medium', style: { color: 'var(--ui-text-tertiary)' }, children: props.title }),
    props.children
  ]})
}

function WallpaperPage() {
  var c = useValue($cfg)
  var ctx = ctxRef
  var activePreset = ''
  for (var i = 0; i < PRESETS.length; i++) {
    var p = PRESETS[i]
    if (p.v.chrome === c.chrome && p.v.sidebar === c.sidebar && p.v.editor === c.editor && p.v.elevated === c.elevated) { activePreset = p.id; break }
  }
  return jsxs('div', { className: 'flex h-full flex-col gap-5 overflow-auto p-5', children: [
    jsxs('div', { className: 'flex flex-col gap-1', children: [
      jsx('div', { className: 'text-base font-semibold', children: '壁纸工作室' }),
      jsx('div', { className: 'text-xs', style: { color: 'var(--ui-text-tertiary)' }, children: '自定义界面底图 · 玻璃透明度 · 字体 / 颜色 / 字号 · 改动即时生效并自动保存' })
    ]}),
    jsxs('div', { className: 'flex items-center gap-3', children: [
      jsx(Switch, { checked: c.enabled, onCheckedChange: function (v) { setKey('enabled', v) } }),
      jsx('span', { className: 'text-sm', children: c.enabled ? '壁纸已启用' : '壁纸已关闭' })
    ]}),
    jsx(Section, { title: '底图（点击预览框选择图片 / 拖拽图片进来 / Ctrl+V 粘贴）', children:
      jsxs('div', {
        className: 'relative flex items-center justify-center overflow-hidden rounded-lg border',
        style: {
          borderColor: 'var(--ui-stroke-secondary)', height: '220px', cursor: 'pointer', outline: 'none',
          backgroundImage: c.img ? 'url(' + c.img + ')' : 'none',
          backgroundSize: c.fit === 'tile' ? 'auto' : (c.fit === 'contain' ? 'contain' : 'cover'),
          backgroundRepeat: c.fit === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center', backgroundColor: 'var(--ui-bg-sidebar)'
        },
        tabIndex: 0,
        onClick: function () { pickFile(ctx) },
        onDragOver: function (e) { e.preventDefault() },
        onDrop: function (e) { e.preventDefault(); ingest(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0], ctx) },
        onPaste: function (e) { ingest(e.clipboardData && e.clipboardData.files && e.clipboardData.files[0], ctx) },
        children: [ !c.img ? jsx('span', { className: 'text-xs', style: { color: 'var(--ui-text-tertiary)' }, children: '还没有图片' }) : null ]
      })
    }),
    jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: [
      jsx(Button, { size: 'sm', onClick: function () { pickFile(ctx) }, children: '选择图片' }),
      jsx(Button, { size: 'sm', variant: 'secondary', onClick: function () { setMany({ img: DEFAULT_IMG }) }, children: '恢复默认图' }),
      jsx(Button, { size: 'sm', variant: 'secondary', onClick: function () { setMany({ ...DEFAULTS }) }, children: '重置全部' })
    ]}),
    jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: [
      jsx('span', { className: 'shrink-0 text-xs', style: { color: 'var(--ui-text-secondary)' }, children: '内置图库' }),
      BUILTINS.map(function (bi) {
        var active = c.img === bi.img
        return jsxs('div', { key: bi.id, className: 'flex flex-col items-center', style: { gap: '4px' }, children: [
          jsx('div', {
            role: 'button', tabIndex: 0,
            onClick: function () { setKey('img', bi.img); haptic('tap') },
            style: {
              width: '108px', height: '60px', borderRadius: '8px', cursor: 'pointer',
              border: '2px solid ' + (active ? 'var(--ui-accent)' : 'var(--ui-stroke-secondary)'),
              backgroundImage: 'url(' + bi.img + ')', backgroundSize: 'cover', backgroundPosition: 'center'
            }
          }),
          jsx('span', { className: 'text-[10px]', style: { color: active ? 'var(--ui-accent)' : 'var(--ui-text-tertiary)' }, children: bi.label })
        ]})
      })
    ]}),
    jsx(Section, { title: '动态壁纸（视频 · 循环播放）', children:
      jsxs('div', { className: 'flex flex-col gap-3', children: [
        jsxs('div', { className: 'flex items-center gap-3', children: [
          jsx(Switch, { checked: !!c.vidOn, onCheckedChange: function (v) { setMany({ vidOn: v }); haptic('tap') } }),
          jsx('span', { className: 'text-sm', children: c.vidOn ? ('视频壁纸已启用' + (c.vidName ? '：' + c.vidName : '')) : '视频壁纸未启用' })
        ]}),
        jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: [
          jsx(Button, { size: 'sm', variant: 'secondary', onClick: function () { pickVideo(ctx) }, children: '选择视频文件…' }),
          jsx(Button, { size: 'sm', variant: 'secondary', onClick: function () { setMany({ vidOn: false }); haptic('tap') }, children: '关闭视频' })
        ]}),
        jsx('span', { className: 'text-xs', style: { color: 'var(--ui-text-tertiary)' }, children: '推荐 WebM（Chromium 必播）· MP4 视应用编码支持 · 大文件零压缩直读、不占存储空间' })
      ]})
    }),
    jsx(Section, { title: '面板透明度（数值越小，壁纸越明显）', children:
      jsxs('div', { className: 'flex flex-col gap-3', children: SLIDERS.map(function (s) {
        return jsxs('div', { className: 'flex items-center gap-3', key: s.key, children: [
          jsx('span', { className: 'shrink-0 text-xs', style: { width: '68px', color: 'var(--ui-text-secondary)' }, children: s.label }),
          jsx('input', {
            type: 'range', min: 5, max: 85, step: 1, value: c[s.key],
            onChange: function (e) { setKey(s.key, Number(e.target.value)) },
            style: { flex: '1', accentColor: 'var(--ui-accent)' }
          }),
          jsx('span', { className: 'shrink-0 text-right text-xs tabular-nums', style: { width: '40px' }, children: c[s.key] + '%' })
        ]})
      })})
    }),
    jsx(Section, { title: '一键预设', children:
      jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: PRESETS.map(function (p) {
        var active = p.id === activePreset
        return jsx(Button, {
          size: 'sm', key: p.id,
          variant: active ? 'default' : 'secondary',
          onClick: function () { setMany({ ...p.v }); haptic('tap') },
          children: p.label
        })
      })})
    }),
    jsx(Section, { title: '适配方式', children:
      jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: FITS.map(function (f) {
        return jsx(Button, { size: 'sm', key: f.id, variant: c.fit === f.id ? 'default' : 'secondary', onClick: function () { setKey('fit', f.id) }, children: f.label })
      })})
    }),
    jsx(FontSection, {}),
    jsx('div', { className: 'text-xs', style: { color: 'var(--ui-text-quaternary)', marginTop: 'auto' }, children: '壁纸工作室 · 由插件提供，随应用启动自动加载；可在 设置 → 插件 中禁用' })
  ]})
}

function FontSection() {
  const c = useValue($cfg)
  const [typed, setTyped] = useState('')
  var activeId = ''
  for (var i = 0; i < FONT_PRESETS.length; i++) {
    if (FONT_PRESETS[i].stack === (c.fontStack || '') && !c.fontData) { activeId = FONT_PRESETS[i].id; break }
  }
  var previewFamily = c.fontData ? "'WPCustomFont'" : (c.fontStack || undefined)
  var parts = []
  if (c.fontLabel) parts.push(c.fontLabel)
  if (c.fontColor) parts.push('彩色')
  if (Number(c.fontScale) && Number(c.fontScale) !== 100) parts.push(c.fontScale + '%')
  var status = c.fontOn ? ('已启用' + (parts.length ? '：' + parts.join(' · ') : '')) : '未启用（选任意字体 / 颜色 / 字号即自动开启）'
  function applyFont(fp) {
    if (fp.id === 'default') { setMany({ fontOn: false, fontStack: '', fontLabel: '', fontData: '', fontFileName: '' }); haptic('tap'); return }
    setMany({ fontOn: true, fontStack: fp.stack, fontLabel: fp.label, fontData: '', fontFileName: '' })
    haptic('tap')
  }
  function applyTyped() {
    var v = (typed || '').trim()
    if (!v) return
    setMany({ fontOn: true, fontStack: '"' + v + '"', fontLabel: v, fontData: '', fontFileName: '' })
    haptic('tap')
  }
  function pickFontFile() {
    var inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2'
    inp.onchange = function () {
      var f = inp.files && inp.files[0]
      if (!f) return
      if (f.size > 2500000) {
        try { host.notifyError(new Error('字体文件过大（' + Math.round(f.size / 1024) + ' KB）'), '超过 2.5MB 上限：建议用子集化的字体文件，或直接输入系统字体名') } catch (e) {}
        return
      }
      var rd = new FileReader()
      rd.onload = function () {
        setMany({ fontOn: true, fontStack: '', fontLabel: '自定义：' + f.name, fontData: String(rd.result || ''), fontFileName: f.name })
        try { host.notify({ kind: 'success', message: '字体已应用：' + f.name }) } catch (e) {}
      }
      rd.onerror = function () { try { host.notifyError(new Error('读取失败'), '字体文件读取失败') } catch (e) {} }
      rd.readAsDataURL(f)
    }
    inp.click()
  }
  return jsx(Section, { title: '界面字体（全局生效 · 即时应用）', children:
    jsxs('div', { className: 'flex flex-col gap-3', children: [
      jsxs('div', { className: 'flex items-center gap-3', children: [
        jsx(Switch, { checked: c.fontOn, onCheckedChange: function (v) { setMany({ fontOn: v }) } }),
        jsx('span', { className: 'text-sm', children: status })
      ]}),
      jsx('div', {
        className: 'rounded-lg border px-4 py-3',
        style: { borderColor: 'var(--ui-stroke-secondary)', fontFamily: previewFamily, fontSize: ((15 * (Number(c.fontScale) || 100)) / 100) + 'px', color: c.fontColor || undefined },
        children: '字体预览：你好，黎魈！Hermes 桌面端 0123 ABCabc'
      }),
      jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: FONT_PRESETS.map(function (fp) {
        return jsx(Button, { size: 'sm', key: fp.id, variant: fp.id === activeId ? 'default' : 'secondary', onClick: function () { applyFont(fp) }, children: fp.label })
      })}),
      jsxs('div', { className: 'flex items-center gap-2', children: [
        jsx('input', {
          value: typed,
          onChange: function (e) { setTyped(e.target.value) },
          onKeyDown: function (e) { if (e.key === 'Enter') applyTyped() },
          placeholder: '输入字体名（如 微软雅黑 / 思源黑体 / HarmonyOS Sans）',
          style: { flex: '1', minWidth: '200px', background: 'var(--ui-bg-sidebar)', color: 'var(--ui-text-primary)', border: '1px solid var(--ui-stroke-secondary)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', outline: 'none' }
        }),
        jsx(Button, { size: 'sm', onClick: applyTyped, children: '应用字体名' })
      ]}),
      jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: [
        jsx(Button, { size: 'sm', variant: 'secondary', onClick: pickFontFile, children: '上传字体文件…' }),
        jsx('span', { className: 'text-xs', style: { color: 'var(--ui-text-tertiary)' }, children: c.fontFileName ? ('已上传：' + c.fontFileName) : '支持 ttf / otf / woff / woff2 · ≤2.5MB（内嵌调用，无需系统安装）' })
      ]}),
      jsxs('div', { className: 'flex flex-wrap items-center gap-2', children: [
        jsx('span', { className: 'shrink-0 text-xs', style: { width: '68px', color: 'var(--ui-text-secondary)' }, children: '字体颜色' }),
        FONT_COLORS.map(function (fc) {
          var active = (c.fontColor || '') === fc.v
          return jsx('button', {
            key: fc.id, type: 'button',
            onClick: function () { setMany({ fontOn: true, fontColor: fc.v }); haptic('tap') },
            style: {
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid ' + (active ? 'var(--ui-accent)' : 'var(--ui-stroke-secondary)'),
              background: active ? 'color-mix(in srgb, var(--ui-accent) 14%, transparent)' : 'var(--ui-bg-sidebar)',
              color: 'var(--ui-text-primary)', fontSize: '12px'
            },
            children: [
              fc.v ? jsx('span', { style: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: fc.v, border: '1px solid color-mix(in srgb, var(--ui-text-secondary) 40%, transparent)' } }) : null,
              jsx('span', { children: fc.label })
            ]
          })
        })
      ]}),
      jsxs('div', { className: 'flex items-center gap-3', children: [
        jsx('span', { className: 'shrink-0 text-xs', style: { width: '68px', color: 'var(--ui-text-secondary)' }, children: '字体大小' }),
        jsx('input', {
          type: 'range', min: 85, max: 130, step: 1,
          value: Number(c.fontScale) || 100,
          onChange: function (e) { setMany({ fontOn: true, fontScale: Number(e.target.value) }) },
          style: { flex: '1', accentColor: 'var(--ui-accent)' }
        }),
        jsx('span', { className: 'shrink-0 text-right text-xs tabular-nums', style: { width: '48px' }, children: (Number(c.fontScale) || 100) + '%' })
      ]})
    ]})
  })
}

function Chip() {
  return jsx(Tip, { label: '壁纸工作室', children:
    jsxs('button', {
      type: 'button',
      className: cn('inline-flex h-full items-center gap-1 px-1.5 text-[0.6875rem] transition-colors', 'text-(--ui-text-tertiary) hover:text-foreground'),
      onClick: function () { haptic('tap'); host.navigate('/wallpaper') },
      children: [ jsx('span', { 'aria-hidden': true, children: '🖼' }), jsx('span', { children: '壁纸' }) ]
    })
  })
}

export default {
  id: ID,
  name: '壁纸工作室',
  defaultEnabled: true,
  register(ctx) {
    ctxRef = ctx
    loadCfg(ctx)
    ctx.registerMany([
      { id: 'page', area: ROUTES_AREA, data: { path: '/wallpaper' }, render: function () { return jsx(WallpaperPage, {}) } },
      { id: 'nav', area: SIDEBAR_NAV_AREA, data: { path: '/wallpaper', label: '壁纸工作室', codicon: 'symbol-color' } },
      { id: 'open', area: PALETTE_AREA, data: { id: 'wallpaper.open', label: '打开壁纸工作室', keywords: ['壁纸', 'wallpaper', '背景', 'background', 'beijing'], run: function () { host.navigate('/wallpaper') } } },
      { id: 'chip', area: STATUSBAR_AREAS.right, order: 125, render: function () { return jsx(Chip, {}) } }
    ])
    if (typeof ctx.onDispose === 'function') {
      ctx.onDispose(function () { var el = document.getElementById(STYLE_ID); if (el) el.remove(); var v = document.getElementById(VID_ID); if (v) v.remove() })
    } else if (typeof ctx.onCleanup === 'function') {
      ctx.onCleanup(function () { var el = document.getElementById(STYLE_ID); if (el) el.remove(); var v = document.getElementById(VID_ID); if (v) v.remove() })
    }
  }
}
