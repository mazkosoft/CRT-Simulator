# CRT Simulator

[English](#english) · [简体中文](#简体中文)

[Live demo / 在线体验](https://mazkosoft.github.io/CRT-Simulator/) · [Source / 开源仓库](https://github.com/mazkosoft/CRT-Simulator)

<a id="english"></a>

## English

A browser-local image/video effects tool in a beige retro terminal. The current
renderer uses multipass **WebGL**, not the previous DOM/SVG implementation.
It is a creative CRT/VHS approximation, not a calibrated hardware emulator.
Project credit: ㄢ誌慖（mazko）.

### Features

- Curvature, RGB phosphor, mask, glow and moving beam.
- VHS noise, jitter, interlace, chroma bleed, sharpening and dropouts.
- Built-in/custom presets, JSON import/export and local configuration.
- Playback, seeking, volume dial, fullscreen zoom/pan and mobile fine adjustment.
- PNG and offline frame-by-frame MP4/WebM export with WebCodecs/Mediabunny.
- Export audio gain, bandwidth, hiss, distortion, modulation and reverb.
- English/Chinese controls, About and Credits groups.

### Online user guide

#### Load media and choose a look

Open the [live demo](https://mazkosoft.github.io/CRT-Simulator/). The supplied image
loads automatically. In **Media & Export**, choose an image/video. **Load default
image** and **Clear** both return to the sample; neither deletes your local file.
Input format support depends on browser decoders.

Use `contain` for the full source, `cover` to fill/crop, or `fill` to stretch.
**Source aspect ratio** makes exported dimensions follow the source instead of
adding letterbox bars. Curvature/vignette may still create intentional dark edges.
The preview screen ratio can differ from the export ratio.

In **Presets**, select a built-in look and press **Apply**, then adjust CRT,
phosphor/mask, beam/glow and VHS groups. Save your current settings before replacing
them with a preset. On phones use number fields and `−`/`+` for precision; the panel
scrolls independently. **Fine/Smooth** changes preview refresh rate, not export quality.

#### Playback and inspection

**Play/Pause** controls video. Dragging the timeline pauses and seeks; press Play
to resume. Images have no active timeline. Drag the volume dial up/right to increase
or down/left to decrease; wheel/arrows also work, Home sets zero and End sets maximum.
Zero is mute. This controls original-source listening only, not export audio.

**View** enters fullscreen or an in-page fallback. Use `+`/`−`, wheel or two-finger
pinch to zoom, drag to pan, and the percentage button to reset. Exit or Escape returns.
Zoom affects inspection only. The power key hides the preview; it does not unload
media or stop video playback.

#### Configuration

**Config** opens JSON import/export, local save/load and reset. Named presets and
local settings belong to the current browser/origin, not other devices. Export JSON
for backup/sharing; it contains settings, not media. Keep existing configuration keys.

#### Image and video export

**Export image** saves the current processed frame as PNG. Casing, glass reflection
and controls are excluded.

Before **High-quality export**, set duration, fps, bitrate, resolution multiplier and
format. MP4 uses H.264/AAC and WebM VP9/Opus when a source audio track is available.
A still image can generate an animated effects clip. Video export starts at source
time zero, not the timeline cursor. Keep duration within the source length for
predictable audio/video output; this is not an in/out editing range.

Try 1–3 seconds, 30 fps and 1× resolution first. Bitrate is an encoder target, not
a file-size/quality guarantee. Seeking, rendering and encoding depend on the device;
offline export is not necessarily faster than realtime. Keep the tab open and active.
Long/high-resolution outputs consume memory. Check the resulting file before use.

#### Retro audio

Select a preset in **Retro audio**, then adjust export gain, bandwidth, hiss,
distortion, wow/reverb and channels. These effects apply to offline export, not live
listening. Silent sources remain silent. Preview-volume zero does not mute export;
adjust export audio gain separately.

Known limitations: “narrow stereo” currently attenuates channels rather than mixing
stereo width. Audio is processed in decoded chunks, which can limit reverb tails and
modulation continuity at boundaries. The compatibility recorder does not provide
the same offline audio processing. Decoder/encoder support varies by browser.

### Local development and structure

Clone/download the complete repository, not just `index.html`. No build step:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

With Windows' Python launcher use `py -m http.server`. Open `http://127.0.0.1:8080/`.
Use localhost HTTP or HTTPS for consistent codec behavior; `file://` is not recommended.
Node.js is only needed for developer checks.

```text
index.html                 Page structure / GitHub Pages entry
css/crt.css                Casing, screen and physical controls
css/ui.css                 Parameter panel, dialogs and sliders
js/config.js               Defaults, presets and configuration
js/crt.js                  WebGL, media and image/video/audio export
js/controls.js             UI, language, transport and startup
assets/demo-desktop.png    Supplied default image
vendor/                    Mediabunny bundle and its license
tests/structure.test.cjs   Dependency-free checks
CONTRIBUTING.md            Development / bug-report guide
LICENSE                    Original-code MIT license
THIRD_PARTY_NOTICES.md     Third-party provenance and licenses
```

Classic scripts share scope and load in `config → crt → controls` order. Initialization
lives in controls; these are not independent ES modules. No duplicate `dist` is maintained.
All paths are relative for project-site hosting.

For branch-based GitHub Pages, choose the intended branch and root folder; publish
HTML, CSS, JS, assets and vendor together. No build workflow is required. Local
changes are not online until committed, pushed and deployed.

### Troubleshooting and privacy

- WebGL is required; check browser/GPU settings if the fallback appears.
- Start with a current Chrome/Edge for offline export, but codec/OS/resolution support
  is not guaranteed. Other browsers may preview without the requested encoder.
- Press Play if browser policy blocks sound autoplay.
- If offline encoding is unavailable, video input can use realtime compatibility
  WebM recording. Still-image video export requires the offline encoder. Encoding
  errors are reported; automatic fallback is not guaranteed.
- Reduce duration, fps and resolution for failed/slow exports; try WebM and inspect
  the console. Compatibility recording is not lossless/offline rendering.
- Selected media is processed locally, not uploaded by the app. External About/Credits
  links contact other sites. Browser storage restrictions may prevent local saving.

Run `node tests/structure.test.cjs` and the manual checks in [CONTRIBUTING.md](CONTRIBUTING.md).
Structural tests do not certify visual quality, codecs or audio fidelity.
[Report issues](https://github.com/mazkosoft/CRT-Simulator/issues) with reproduction details.

### Credits and licensing

Original code is [MIT](LICENSE). Mediabunny 1.61.3 remains MPL-2.0. Retromator/Chafalleiro
is a historical technical reference; its BSD-2-Clause notice is retained. itorr/vaporwave
is UX/product inspiration only; no permission to reuse its code/resources is inferred.
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). MIT code licensing does not grant
rights to third-party content visible in the supplied screenshot or imported media.

<a id="简体中文"></a>

## 简体中文

在浏览器本地处理图片与视频的 CRT／录像带复古效果工具，外观为米色终端一体机。
当前使用多通道 **WebGL**，不是旧版 DOM／SVG 滤镜。用于视觉创作，不是经校准的硬件仿真。
Project credit: ㄢ誌慖（mazko）。

### 功能

曲率、RGB 荧光粉、遮罩、辉光、光带、VHS 噪声／抖动／隔行／渗色／锐化／掉磁；
内置及自定义预设、JSON 配置、本地保存；视频定位播放、音量、全屏缩放与手机精细调参；
PNG、离线逐帧 MP4／WebM 和导出音轨处理；中英文界面及独立关于／鸣谢。

### 在线体验使用说明书

#### 载入媒体与选择效果

打开[在线体验](https://mazkosoft.github.io/CRT-Simulator/)，默认图自动载入。
在“媒体与导出”选择图片或视频。“载入默认图”和“清除”都会恢复示例，不删除本地文件。
输入格式支持取决于浏览器解码器。

`contain` 保留完整画面，`cover` 填满并裁切，`fill` 拉伸。“按源媒体比例导出”让输出
尺寸跟随源媒体，避免比例黑边；曲率和暗角仍可能形成刻意暗边。预览与导出比例可以不同。

在“效果预设”选内置效果并点击应用，再展开 CRT、荧光粉／遮罩、光带／辉光、VHS 分组微调。
应用预设会替换参数，重要设置请先保存。手机可用数字框及 `−`／`+` 精调，面板独立滚动。
“精细／流畅”只改变预览刷新率，不改变导出质量。

#### 播放与查看细节

播放键控制视频；拖动进度条暂停并定位，需再按播放才能继续。图片模式禁用进度条。
音量旋钮向上／右拖增加、向下／左拖减少，支持滚轮、方向键、Home 归零、End 最大。
归零即静音，仅控制原视频试听，不改变导出音量。

“放大查看”进入全屏或页面内放大。用 `+`／`−`、滚轮、双指缩放，拖动平移；
百分比按钮重置，退出或 Escape 返回。缩放仅用于查看，不影响输出。
电源键隐藏预览，不卸载媒体，也不停止视频播放。

#### 保存配置

“配置”打开 JSON 导入导出、本地保存／读取和恢复默认。命名预设及配置属于当前浏览器和
网址，不跨设备同步；导出 JSON 便于备份或分享。配置只含参数，不含媒体，保留已有键名。

#### 导出图片与视频

“导出图片”保存当前效果帧为 PNG，不包含机壳、玻璃和控件。

“高质量导出”前设置时长、帧率、码率、分辨率倍率和格式。MP4 使用 H.264／AAC，
WebM 使用 VP9／Opus，声音取决于源音轨及解码支持。图片也能生成带动态效果的视频。
视频从源文件零秒导出，不从进度条位置导出；时长不要超过源视频，以保证音画结果可预期。
当前提供导出时长，不是剪辑入点／出点。

建议先用 1–3 秒、30fps、1× 试导。码率是编码目标，不保证文件大小或画质。
离线仍需定位、渲染和编码，不保证快于实时。保持标签页开启且活跃；长视频和高分辨率
占用内存较多，正式使用前检查输出文件。

#### 复古音频

选择音频预设，再调导出音量、带宽、底噪、失真、音调抖动、混响及声道。
这些效果仅用于离线导出，不用于实时试听。无音轨的源不会自动生成声音。
试听音量为零不代表导出静音，需单独调整导出音量。

已知限制：“窄立体声”目前为声道衰减，不是完整声场混合；音频按解码块处理，块边界
可能限制混响尾音及调制连续性；兼容录制不提供相同的离线音频处理。编解码支持因浏览器而异。

### 本地运行、结构和 Pages

克隆完整仓库，不要只下载 HTML。无需构建，使用已安装的静态服务，例如：

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Windows 有 Python 启动器时可用 `py -m http.server`，打开 `http://127.0.0.1:8080/`。
建议 localhost HTTP 或 HTTPS，不推荐用 `file://` 测试导出。Node.js 仅用于开发检查。

文件结构见英文段落。两份 CSS 分别负责机壳和参数界面；三个脚本分别负责配置、
渲染／媒体导出、界面初始化，按 `config → crt → controls` 加载并共享作用域，不是独立 ES 模块。
不维护重复的 dist 单文件版。Pages 从分支发布时选择目标分支及根目录，并同时发布全部
CSS、JS、assets 和 vendor。本地修改需提交、推送、部署后才在线生效，本任务不会自动推送。

### 常见问题与隐私

- 需要 WebGL；不可用时检查浏览器及 GPU 设置。
- 高质量导出可先用新版 Chrome／Edge，但不能保证所有系统、编码器和分辨率支持。
- 有声自动播放受限时手动按播放。
- 离线编码不可用时，视频可用实时兼容 WebM 录制；图片动画导出需要离线编码器。
  编码出错会提示，不保证自动回退。
- 导出慢或失败时降低时长、帧率、分辨率，尝试 WebM 并检查控制台。
- 应用不上传媒体；关于／鸣谢外链会访问其他网站。隐私模式或存储限制可能影响本地保存。

运行 `node tests/structure.test.cjs` 并按 [CONTRIBUTING.md](CONTRIBUTING.md) 实测。
结构测试不代表画质、音质或编码器兼容保证；可到 [Issues](https://github.com/mazkosoft/CRT-Simulator/issues) 提交复现信息。

### 鸣谢与协议

原创代码为 [MIT](LICENSE)，Mediabunny 1.61.3 为 MPL-2.0；保留 Retromator／Chafalleiro
历史技术参考的 BSD-2-Clause 声明。itorr/vaporwave 仅为产品／交互灵感，不推定其代码和资源授权。
详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。代码 MIT 授权不授予默认截图中的
第三方内容及用户媒体的权利，请只分发有权使用的媒体。
