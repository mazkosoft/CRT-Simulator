<div align="center">

# DOM CRT Simulator

**A real-DOM CRT display effect for the web.**  
真实 DOM 网页的 CRT 屏幕模拟器。

[English](#english) · [简体中文](#简体中文)

![License](https://img.shields.io/badge/license-MIT-green)
![Third--party](https://img.shields.io/badge/third--party-BSD--2--Clause-blue)
![Dependencies](https://img.shields.io/badge/runtime_dependencies-none-brightgreen)
![Stack](https://img.shields.io/badge/HTML%20%2F%20CSS%20%2F%20SVG%20%2F%20JS-native-orange)

**Live demo:** https://mazkosoft.github.io/CRT-Simulator/  
**Repository:** https://github.com/mazkosoft/CRT-Simulator

</div>

---

<a id="english"></a>

# English

## Overview

DOM CRT Simulator is an experimental CRT effect for **real, interactive DOM pages**.

The main goal is not to render a fake webpage into a `<canvas>`, and not to mirror the page through screenshots. The page itself remains normal HTML, so native browser behavior such as text selection, caret rendering, form controls, hover, click, scrolling, and dynamic DOM updates can continue to work.

The CRT look is built from native browser technologies:

```text
real DOM
   ↓
SVG displacement / phosphor / mask pipeline
   ↓
post-warp blur + bloom
   ↓
CSS overlays: scanlines / beam / noise / vignette / flicker
   ↓
final CRT output
```

No framework, package manager, CDN library, external font, external image, or runtime dependency is required by the current single-file build.

---

## Features

- Real DOM content — not a screenshot-based UI
- Barrel / pincushion screen curvature
- Runtime-generated displacement map
- Adjustable displacement-map resolution
- RGB phosphor stripe simulation
- Adjustable RGB channel bias
- Phosphor blur on X / Y axes
- Cell / shadow-mask simulation
- Adjustable mask blur
- Scanlines
- Moving beam with selectable blend mode
- CRT flicker
- Vignette
- Post-warp blur
- Full-frame bloom / glow
- Selectable glow blend algorithm
- Brightness / contrast / saturation applied to the complete CRT stage
- JSON preset import / export
- Chinese parameter UI
- No build step

---

## Quick start

Download `index.html` and open it directly in a modern browser.

For more consistent browser behavior, serving it through a local HTTP server is recommended:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Chrome / Chromium-based browsers are currently the primary development target.

---

## How it works

### 1. Real DOM layer

The webpage remains ordinary HTML. The CRT effect is applied to the rendered DOM instead of replacing the DOM with a Canvas UI.

This means the browser still owns:

```text
selection
caret
inputs
links
hover states
focus
scrolling
DOM updates
```

### 2. Curvature

Curvature is implemented with SVG `feDisplacementMap`.

A displacement texture is generated at runtime. Its red and green channels encode horizontal and vertical displacement. The map is then supplied to the SVG filter through `<feImage>`.

Conceptually:

```text
viewport coordinates
→ radial distortion function
→ R/G displacement map
→ feDisplacementMap
→ curved DOM image
```

The generated map is resolution-scaled through `filterQuality`, so curvature quality can be traded for performance.

### 3. RGB phosphor simulation

The RGB phosphor pattern is generated as a tiny runtime tile and repeated with SVG `<feTile>`.

The current implementation does not simply place a red/green/blue translucent texture over the page. The phosphor pattern participates in the SVG image-processing chain and is recombined with the warped image.

Available blend approximations include:

| Mode | Behavior |
|---|---|
| `plus-lighter` | Additive-style emission; closest to the physical idea of emissive RGB phosphors |
| `screen` | Softer bloom-like combination |
| `color-dodge` | Stronger, more stylized luminous response |
| `lighten` | Reduced additive approximation |
| `normal` | Linear mix; intentionally less CRT-like |

For a physically motivated starting point, use:

```json
"rgbBlend": "plus-lighter"
```

The current visual preset intentionally defaults to:

```json
"rgbBlend": "color-dodge"
```

because it produces a stronger stylized phosphor response.

### 4. Cell / shadow mask

A second runtime-generated tile represents the darker gaps between phosphor cells.

The mask can be adjusted independently with:

```text
opacity
X thickness
Y thickness
X blur
Y blur
```

### 5. Bloom / glow

The current bloom is generated from the complete post-warp CRT image:

```text
post-warp image
→ Gaussian blur
→ gain
→ blend with original CRT image
```

This is deliberately different from drawing decorative radial gradients. The glow is derived from the displayed image itself.

Supported glow blend approximations:

```text
screen
plus-lighter
color-dodge
lighten
normal
```

`screen` is a good general-purpose bloom mode. `plus-lighter` is more aggressively additive.

### 6. Final overlays

Effects that do not need to participate in the expensive displacement pipeline are kept as lighter CSS overlays:

```text
scanlines
moving beam
noise
vignette
flicker
```

This reduces the amount of work performed by the SVG filter.

---

## Performance

Applying a full-screen SVG filter to a live DOM tree is expensive.

The heaviest operations are usually:

```text
1. full-frame bloom blur
2. feDisplacementMap curvature
3. RGB phosphor blur
4. mask blur
5. post-warp blur
```

Every scroll, animation, hover, input change, or other repaint can cause the filtered surface to be recomputed.

For a lighter preset, start around:

```json
{
  "filterQuality": 0.35,
  "postBlurX": 0.3,
  "postBlurY": 0.3,
  "glowMode": "fast",
  "glowOpacity": 0.25,
  "glowBlurX": 5,
  "glowBlurY": 5
}
```

The project intentionally prioritizes **real DOM compatibility** over the raw rendering efficiency of a pure WebGL CRT shader.

---

## Current default preset

```json
{
  "warpDirection": "barrel",
  "warpScale": 110,
  "mapZoom": 0.71,
  "mapGain": 0.32,
  "filterQuality": 0.5,
  "postBlurX": 0.83,
  "postBlurY": 0.75,
  "brightness": 1,
  "contrast": 1.29,
  "flickerAmount": 0.46,
  "flickerSpeed": 4.3,
  "vignetteOpacity": 0,
  "vignetteInner": 38,
  "vignetteOuter": 103,
  "rgbOpacity": 0.47,
  "rgbBlend": "color-dodge",
  "redBias": 1,
  "greenBias": 1,
  "blueBias": 1,
  "rgbPeriod": 7,
  "rgbBlurX": 2.09,
  "rgbBlurY": 2.09,
  "maskOpacity": 0.19,
  "maskX": 2,
  "maskY": 2,
  "maskBlurX": 3.04,
  "maskBlurY": 2.94,
  "beamBlend": "plus-lighter",
  "beamOpacity": 0.28,
  "beamHeight": 130,
  "beamSpeed": 9,
  "glowOpacity": 0.38,
  "glowMode": "balanced",
  "glowQuality": 0.65,
  "glowBlurX": 8,
  "glowBlurY": 8,
  "saturation": 1
}
```

---

## Known limitations

**Visual geometry and DOM hit-testing are not the same thing.** SVG filters change the rendered appearance, but they do not rewrite the browser's layout geometry. Strong curvature can therefore create visible offset between a distorted element and its original hit area.

**SVG filtering on a large live DOM surface can be expensive.** A pure WebGL renderer can run a comparable visual pipeline more efficiently because it works directly on GPU textures/framebuffers.

**Blend modes are browser rendering approximations.** CSS/SVG blending is not numerically identical to a custom linear-light WebGL shader.

**Browser differences exist.** Chrome / Chromium is the main development target. Firefox and Safari can produce different SVG-filter or blend-mode results.

---

## Third-party acknowledgements and provenance

This project is intentionally explicit about external references.

### Chafalleiro / Retromator

Repository:  
**https://github.com/Chafalleiro/retromator**

License: **BSD 2-Clause**

Retromator / Videomator was an important technical reference while developing the real-DOM curvature approach, particularly its use of SVG `<feImage>` together with `<feDisplacementMap>` to distort live webpage/video content.

This project does **not** redistribute Retromator's `sphere_wide_1.png`, fonts, images, audio, screen-dirt assets, or other bundled media. The current implementation generates its own displacement map at runtime and substantially extends the processing pipeline with its own RGB phosphor, mask, bloom, configuration, and performance logic.

Because the curvature implementation was developed with Retromator as a direct technical reference, its BSD 2-Clause copyright and license notice is preserved in full in the [Third-party license notices](#third-party-license-notices) section below.

### itorr / vaporwave — 「蒸気機」

Repository:  
**https://github.com/itorr/vaporwave**

Project page:  
**https://lab.magiconch.com/vaporwave/**

The project was referenced for the idea of a **parameterized visual-effects tool / preset-oriented UI workflow**.

No source code, image assets, logos, presets, or bundled resources from `itorr/vaporwave` are included in this repository.

At the time this README was prepared, the upstream repository did not expose a LICENSE file. For that reason it is treated strictly as a design / UX reference here, not as reusable source code.

### MDN Web Docs

Documentation:  
**https://developer.mozilla.org/**

MDN was used as documentation/reference material for standard browser APIs, SVG filters, Canvas-generated data URLs, CSS filters, and blend modes. No MDN library is bundled.

### Project lineage

Earlier visual/parameter experiments are available at:

**https://github.com/mazkosoft/CRT-Simulator**  
**https://mazkosoft.github.io/CRT-Simulator/**

---

## Licensing

Unless otherwise noted, the original code in this repository is released under the **MIT License**.

Third-party material is **not relicensed** by this project. Where an upstream license notice is required, it is retained below.

Because this repository currently keeps licensing information in a single README file, GitHub may not automatically detect and display the repository license as it would with a standalone `LICENSE` file. The full license grant is nevertheless reproduced below.

<a id="third-party-license-notices"></a>

### MIT License — DOM CRT Simulator

```text
MIT License

Copyright (c) 2026 Mazko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### BSD 2-Clause License — Retromator / Chafalleiro

The following notice is retained for the Retromator technical reference / adapted approach described above.

```text
BSD 2-Clause License

Copyright (c) 2022, Chafalleiro
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

---

<a id="简体中文"></a>

# 简体中文

## 项目简介

DOM CRT Simulator 是一个面向 **真实、可交互 DOM 网页** 的 CRT 屏幕效果实验。

这个项目的重点不是把网页截图后再丢进 Canvas，也不是重新用 Canvas 画一套“看起来像网页”的假 UI。页面本体仍然是普通 HTML，因此浏览器原生的文字选择、输入光标、表单、hover、点击、滚动以及动态 DOM 更新都可以继续存在。

整体处理结构：

```text
真实 DOM
   ↓
SVG 桶形 / 荧光粉 / 单元罩处理
   ↓
后置模糊 + 辉光
   ↓
CSS 扫描线 / 光带 / 噪声 / 暗角 / 闪烁
   ↓
最终 CRT 画面
```

当前单文件版本不依赖框架、npm 包、CDN、外部字体、外部图片或运行时第三方库。

---

## 功能

- 真实 DOM，而非截图镜像
- 桶形 / 枕形屏幕畸变
- 运行时动态生成位移图
- 可调整位移贴图分辨率
- RGB 荧光粉条带模拟
- RGB 三通道独立偏置
- 荧光粉 X / Y 模糊
- 单元罩 / 阴罩模拟
- 单元罩 X / Y 模糊
- 扫描线
- 可切换混合模式的移动光带
- CRT 闪烁
- 暗角
- 桶形后模糊
- 基于完整画面的辉光 / Bloom
- 可切换辉光混合算法
- 整体亮度 / 对比度 / 饱和度
- JSON 参数配置导入 / 导出
- 中文参数控制面板
- 无需构建

---

## 快速使用

直接下载并打开 `index.html` 即可。

为了获得更稳定的浏览器行为，推荐使用本地 HTTP Server：

```bash
python -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

目前主要以 Chrome / Chromium 浏览器作为开发与测试目标。

---

## 实现原理

### 1. 真实 DOM

网页本体仍然是普通 HTML，CRT 效果施加在浏览器已经渲染出的 DOM 上，而不是用 Canvas 替换网页。

因此下面这些行为依旧由浏览器原生处理：

```text
文字选择
输入光标
input / textarea
链接
hover
focus
滚动
动态 DOM 更新
```

### 2. 桶形畸变

桶形效果由 SVG `feDisplacementMap` 完成。

页面运行时会动态生成一张位移贴图，其中：

```text
R 通道 → 水平位移
G 通道 → 垂直位移
```

处理流程：

```text
视口坐标
→ 径向畸变函数
→ RGB 位移贴图
→ feDisplacementMap
→ 弯曲后的 DOM 画面
```

`filterQuality` 会改变位移图分辨率，因此可以在清晰度和性能之间取舍。

### 3. RGB 荧光粉

RGB 荧光粉不是简单在网页上覆盖一层半透明彩条。

当前版本会运行时生成小尺寸 RGB tile，再通过 SVG `<feTile>` 平铺，并让它真正进入画面处理管线。

混合模式：

| 模式 | 特点 |
|---|---|
| `plus-lighter` | 更接近真实 CRT 的加法发光 |
| `screen` | 更柔和，更像一般 Bloom |
| `color-dodge` | 更强、更亮、更风格化 |
| `lighten` | 较弱的增亮近似 |
| `normal` | 普通线性混合，CRT 感较弱 |

从真实 CRT 的发光机制出发，推荐：

```json
"rgbBlend": "plus-lighter"
```

当前默认预设为了得到更强烈的视觉效果使用：

```json
"rgbBlend": "color-dodge"
```

### 4. 单元罩 / Shadow Mask

另一张运行时生成的小 tile 用于模拟荧光粉单元之间较暗的间隙。

可以独立控制：

```text
透明度
X 厚度
Y 厚度
X 模糊
Y 模糊
```

### 5. 辉光 / Bloom

当前辉光来自**完整 CRT 画面本身**：

```text
桶形后的画面
→ Gaussian Blur
→ 增益
→ 与原 CRT 画面重新混合
```

不是额外画几个径向光斑。

支持：

```text
screen
plus-lighter
color-dodge
lighten
normal
```

一般推荐 `screen`；需要更强烈的加法发光时可使用 `plus-lighter`。

### 6. 最终叠加效果

不需要参加昂贵 SVG 位移计算的效果留在 CSS Overlay：

```text
扫描线
移动光带
噪声
暗角
闪烁
```

这样可以减少整个 SVG Filter 的重绘负担。

---

## 性能说明

真实 DOM 上的全屏 SVG Filter 本身就比较重。

当前主要性能消耗通常来自：

```text
1. 完整画面的辉光模糊
2. feDisplacementMap 桶形
3. RGB 荧光粉模糊
4. 单元罩模糊
5. 后置模糊
```

页面滚动、hover、输入、动画或其它重绘发生时，浏览器都有可能重新计算滤镜结果。

性能优先可以从以下参数开始：

```json
{
  "filterQuality": 0.35,
  "postBlurX": 0.3,
  "postBlurY": 0.3,
  "glowMode": "fast",
  "glowOpacity": 0.25,
  "glowBlurX": 5,
  "glowBlurY": 5
}
```

这个项目的设计取舍是：

```text
优先保留真实 DOM 交互
而不是追求纯 WebGL CRT Shader 的最高性能
```

---

## 当前默认参数

```json
{
  "warpDirection": "barrel",
  "warpScale": 110,
  "mapZoom": 0.71,
  "mapGain": 0.32,
  "filterQuality": 0.5,
  "postBlurX": 0.83,
  "postBlurY": 0.75,
  "brightness": 1,
  "contrast": 1.29,
  "flickerAmount": 0.46,
  "flickerSpeed": 4.3,
  "vignetteOpacity": 0,
  "vignetteInner": 38,
  "vignetteOuter": 103,
  "rgbOpacity": 0.47,
  "rgbBlend": "color-dodge",
  "redBias": 1,
  "greenBias": 1,
  "blueBias": 1,
  "rgbPeriod": 7,
  "rgbBlurX": 2.09,
  "rgbBlurY": 2.09,
  "maskOpacity": 0.19,
  "maskX": 2,
  "maskY": 2,
  "maskBlurX": 3.04,
  "maskBlurY": 2.94,
  "beamBlend": "plus-lighter",
  "beamOpacity": 0.28,
  "beamHeight": 130,
  "beamSpeed": 9,
  "glowOpacity": 0.38,
  "glowMode": "balanced",
  "glowQuality": 0.65,
  "glowBlurX": 8,
  "glowBlurY": 8,
  "saturation": 1
}
```

---

## 已知限制

**视觉畸变不会改变 DOM 的真实命中区域。** SVG Filter 改变的是最终渲染结果，而不是浏览器布局坐标。因此桶形特别强时，视觉位置和真实 hitbox 会产生偏移。

**全屏实时 SVG Filter 的性能成本很高。** 与直接处理 GPU Texture / Framebuffer 的纯 WebGL CRT 相比，真实 DOM 路线更容易产生性能压力。

**CSS / SVG 混合不等同于自定义 WebGL Shader。** 当前部分混合算法是浏览器 SVG arithmetic / CSS blending 的近似。

**不同浏览器的结果可能存在差异。** 当前主要以 Chrome / Chromium 为目标环境。

---

## 第三方项目、来源与授权说明

为了让项目的来源关系清楚，本项目对开发过程中实际参考过的第三方项目做明确标注。

### Chafalleiro / Retromator

仓库：  
**https://github.com/Chafalleiro/retromator**

协议：**BSD 2-Clause**

Retromator / Videomator 是本项目实现“真实 DOM 桶形畸变”时的重要技术参考，尤其是其利用 SVG `<feImage>` + `<feDisplacementMap>` 对网页 / 视频内容直接进行弯曲处理的方案。

本项目**没有打包或重新分发** Retromator 仓库中的 `sphere_wide_1.png`、字体、图片、音频、screen dirt 等资源。当前版本使用运行时自行生成的位移贴图，并在此基础上重新实现和扩展了 RGB 荧光粉、单元罩、辉光、配置系统与性能控制等逻辑。

由于桶形处理方案在开发过程中直接研究并参考了 Retromator，本 README 在下方完整保留其 BSD 2-Clause Copyright 与 License Notice。

### itorr / vaporwave — 「蒸気機」

仓库：  
**https://github.com/itorr/vaporwave**

项目页面：  
**https://lab.magiconch.com/vaporwave/**

开发过程中参考了其“**参数化影像效果工具 / 预设式控制界面**”的产品与交互思路。

当前仓库**没有复制、打包或分发** `itorr/vaporwave` 的源码、图片、Logo、预设数据或其它资源。

在整理本 README 时，其上游仓库没有公开可见的 LICENSE 文件。因此本项目只将其作为设计 / UX 参考，不将其代码视为可在本项目 MIT 协议下重新分发的内容。

### MDN Web Docs

文档：  
**https://developer.mozilla.org/**

用于查询 SVG Filter、Canvas Data URL、CSS Filter、Blend Mode 等标准 Web API。项目没有打包任何 MDN 软件库。

### 项目演进

此前的 CRT 参数与视觉实验位于：

**https://github.com/mazkosoft/CRT-Simulator**  
**https://mazkosoft.github.io/CRT-Simulator/**

---

## 开源协议

除下方明确列出的第三方内容外，本仓库原创代码采用 **MIT License**。

第三方项目不会因为出现在本仓库中而被重新授权。需要保留上游 License Notice 的内容，继续按照上游协议处理。

由于当前按“单 README 文件”方式发布，GitHub 不一定会像存在独立 `LICENSE` 文件时一样自动识别仓库协议；但 MIT 授权全文已经完整写在本文档中。

完整协议见上方 English 部分的：

- `MIT License — DOM CRT Simulator`
- `BSD 2-Clause License — Retromator / Chafalleiro`

---

## Credits

**DOM CRT Simulator** — Mazko / MazkoSoft

Technical reference / curvature approach:  
**Chafalleiro / Retromator**  
https://github.com/Chafalleiro/retromator

Parameterized visual-tool UX reference:  
**itorr / vaporwave**  
https://github.com/itorr/vaporwave

Web standards reference:  
**MDN Web Docs**  
https://developer.mozilla.org/

---

<div align="center">

Made for the open web.

[English](#english) · [简体中文](#简体中文)

</div>
