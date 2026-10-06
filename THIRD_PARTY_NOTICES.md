# Third-party notices

## Mediabunny 1.61.3

This repository distributes the unmodified browser bundle at
`vendor/mediabunny.min.cjs` to support offline MP4/WebM encoding, decoding,
and muxing in the browser.

- Project: https://github.com/Vanilagy/mediabunny
- Version: 1.61.3
- License: Mozilla Public License 2.0
- Full license text: `vendor/MEDIABUNNY-LICENSE.txt`
- Corresponding source: https://github.com/Vanilagy/mediabunny/tree/v1.61.3
- Upstream package: https://www.npmjs.com/package/mediabunny/v/1.61.3
- Bundle checked against: https://cdn.jsdelivr.net/npm/mediabunny@1.61.3/dist/bundles/mediabunny.min.cjs
- SHA-256: `d17c404d9e1742f7c5f2cd5c3786c6b185741714f78e120153dd6f8b0992e1b3`

Mediabunny is separate third-party code. The original DOM CRT Simulator code
remains under the repository's stated MIT license. No Mediabunny source files
have been modified in this repository.

## Mediabunny AAC encoder 1.61.3 and FFmpeg

The unmodified `vendor/mediabunny-aac-encoder.min.js` is the official
`@mediabunny/aac-encoder` browser bundle, including its worker and WebAssembly
payload. It supplies software AAC when native audio encoding is unavailable.

- Package: https://www.npmjs.com/package/@mediabunny/aac-encoder/v/1.61.3
- Extension source: https://github.com/Vanilagy/mediabunny/tree/v1.61.3/packages/aac-encoder
- Extension license: MPL-2.0; full text: `vendor/AAC-ENCODER-LICENSE.txt`
- Bundle SHA-256: `0f8cba8e4c803cf14cc2ac7b2978a6b5d56ae7ba7f7f9770bfc09a7f3d1ff2bb`
- Original build/replacement instructions: `vendor/AAC-ENCODER-README.md`
- Embedded FFmpeg AAC encoder: LGPL-2.1-or-later; full text: `vendor/FFMPEG-LGPL-2.1.txt`
- FFmpeg source: https://github.com/FFmpeg/FFmpeg
- FFmpeg licensing: https://ffmpeg.org/legal.html

The upstream build instructions enable the native FFmpeg AAC encoder, not
GPL/nonfree components. The package does not identify an exact FFmpeg revision;
this repository does not assert one. The extension and embedded FFmpeg retain
their own licenses and are not relicensed as MIT. No ntsc-rs source was copied.

## Retromator / Chafalleiro — historical reference

Project: https://github.com/Chafalleiro/retromator
Upstream license: https://github.com/Chafalleiro/retromator/blob/main/LICENSE

Earlier project documentation recorded direct technical study of the DOM/SVG
curvature approach. The current renderer uses WebGL; retain the earlier BSD
notice rather than discard attribution during a renderer/documentation migration.
Retromator media, fonts, displacement images and other bundled resources are not
distributed here. This notice does not change the license of unrelated original code.

```text
BSD 2-Clause License

Copyright (c) 2022, Chafalleiro
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## itorr / vaporwave — product/UX inspiration only

Project: https://github.com/itorr/vaporwave

The prior documentation credits parameterized effects and preset-style interaction.
No source, images, logos, preset data or bundled resources from that project are
included here. No reusable license has been confirmed in this audit; do not assume
this repository's MIT license grants rights to that project.

## Other references and media

- MDN WebGL documentation: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- ntsc-rs-web was suggested as a research/UI reference by the project owner:
  https://github.com/ntsc-rs/ntsc-rs-web . It is not a runtime dependency; no code or
  assets from it are introduced by this repository restructuring.
- `assets/demo-desktop.png` is the project-owner-supplied demonstration screenshot.
  The MIT license covers original software, not a blanket grant over third-party
  icons, imagery or other content visible within that screenshot. Replace it with
  media you have rights to redistribute when needed.

## 简体中文

原创代码采用根目录 MIT 协议；Mediabunny 保留 MPL-2.0，其完整协议和对应版本源码
地址见上方。历史 Retromator 技术参考继续保留 BSD-2-Clause 声明，不打包其资源。
itorr/vaporwave 没有在本次核查中确认可复用授权，仅鸣谢产品／交互思路，不能纳入本项目 MIT。
默认截图由项目所有者提供，代码授权不等于对截图中第三方内容的无限授权。

## Single-file distribution

`dist/crt-simulator-standalone.html` is generated from this repository's source.
It embeds the same default screenshot and unmodified Mediabunny bundle, together
with the full original MIT license, these notices and the MPL-2.0 license text.
Open About → Full licenses and third-party notices to read the embedded notices.
The source/build files remain available in this repository; the corresponding
Mediabunny source is linked above. `assets/readme-preview.jpg` is an application
screenshot and has the same visible-media rights caveat as the default image.
