# Contributing

Use the complete checkout and a local HTTP server. There is no build step.
Application scripts are classic scripts sharing one scope, loaded in this order:
`config.js`, `crt.js`, `controls.js`. Keep initialization in `controls.js`;
configuration functions may reference renderer/UI bindings after startup.
These files are not independently reusable ES modules.

Before proposing a change:

1. Run `node tests/structure.test.cjs`.
2. Check the browser console and test image/video upload, seek/pause, configuration,
   language switching, fullscreen, PNG export and a short video export.
3. Inspect desktop and 320px-wide/mobile landscape layouts.
4. Preserve relative paths and the root `index.html` GitHub Pages entry point.
5. Document codec/device limitations rather than claiming universal support.
6. Include provenance and license notices for every new dependency or media asset.

For bug reports, include browser/version, operating system, media type, reproduction
steps, expected/actual results and relevant console errors. Do not attach private
media unless you intend to share it publicly.

## 简体中文

使用完整仓库和本地 HTTP 服务，无需构建。三个脚本按
`config.js → crt.js → controls.js` 顺序加载，共享作用域；初始化放在
`controls.js` 中，它们不是可独立使用的 ES 模块。

修改前后运行 `node tests/structure.test.cjs`，检查浏览器控制台，并实测上传、
视频定位暂停、配置、语言、全屏、PNG 和短视频导出。检查桌面、320px 手机及
横屏布局。保留根目录入口与相对路径，新增依赖和资源必须提供来源及授权。
提交问题时说明浏览器版本、系统、复现步骤和错误日志；请勿公开私密媒体。
