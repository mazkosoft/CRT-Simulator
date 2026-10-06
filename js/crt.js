// WebGL renderer, media sources and image/video/audio export.
// Classic scripts share scope; load config.js, crt.js, controls.js in this order.
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl", {
  premultipliedAlpha: false,
  antialias: false,
  preserveDrawingBuffer: true
});

if (!gl) {
  document.body.classList.add("no-webgl");
  throw new Error("WebGL unavailable");
}

const VERT = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const SOURCE_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_resolution;
  uniform vec2 u_imgSize;
  uniform vec2 u_imgOffset;
  uniform float u_opacity;
  uniform float u_pixelate;
  uniform float u_pixelPeriod;

  void main() {
    vec2 screenUv = v_uv;

    if (u_pixelate > 0.001) {
      vec2 block = vec2(max(1.0, u_pixelPeriod));
      vec2 pixel = screenUv * u_resolution;
      vec2 snapped = (floor(pixel / block) + 0.5) * block / u_resolution;
      screenUv = mix(screenUv, snapped, u_pixelate);
    }

    vec2 uv = (screenUv - u_imgOffset) / u_imgSize;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.008, 0.012, 0.012, 1.0);
      return;
    }

    vec4 c = texture2D(u_tex, uv);
    c.rgb *= u_opacity;
    gl_FragColor = vec4(c.rgb, 1.0);
  }
`;

const RGB_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_period;
  uniform vec3 u_rgbBias;

  void main() {
    vec2 px = v_uv * u_resolution;
    float p = max(1.0, u_period);
    float x = mod(px.x, p);
    float third = p / 3.0;

    vec3 c;

    if (x < third) {
      c = vec3(0.95 * u_rgbBias.r, 0.0, 0.0);
    } else if (x < third * 2.0) {
      c = vec3(0.0, 0.72 * u_rgbBias.g, 0.0);
    } else {
      c = vec3(0.0, 0.0, 0.95 * u_rgbBias.b);
    }

    gl_FragColor = vec4(clamp(c, 0.0, 3.0), 1.0);
  }
`;

const MASK_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_period;
  uniform float u_maskX;
  uniform float u_maskY;

  void main() {
    vec2 px = v_uv * u_resolution;
    float p = max(1.0, u_period);

    float mx = step(p - u_maskX, mod(px.x, p));
    float my = step(p - u_maskY, mod(px.y, p));
    float openCell = 1.0 - max(mx, my);

    gl_FragColor = vec4(vec3(openCell), 1.0);
  }
`;

const BLUR_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_resolution;
  uniform vec2 u_direction;
  uniform float u_radius;

  void main() {
    if (u_radius <= 0.001) {
      gl_FragColor = texture2D(u_tex, v_uv);
      return;
    }

    vec2 stepUv = u_direction * (u_radius / 8.0) / max(u_resolution, vec2(1.0));

    vec4 c = vec4(0.0);
    c += texture2D(u_tex, v_uv + stepUv * -8.0) * 0.015625;
    c += texture2D(u_tex, v_uv + stepUv * -7.0) * 0.023438;
    c += texture2D(u_tex, v_uv + stepUv * -6.0) * 0.031250;
    c += texture2D(u_tex, v_uv + stepUv * -5.0) * 0.046875;
    c += texture2D(u_tex, v_uv + stepUv * -4.0) * 0.062500;
    c += texture2D(u_tex, v_uv + stepUv * -3.0) * 0.078125;
    c += texture2D(u_tex, v_uv + stepUv * -2.0) * 0.093750;
    c += texture2D(u_tex, v_uv + stepUv * -1.0) * 0.109375;
    c += texture2D(u_tex, v_uv) * 0.125000;
    c += texture2D(u_tex, v_uv + stepUv *  1.0) * 0.109375;
    c += texture2D(u_tex, v_uv + stepUv *  2.0) * 0.093750;
    c += texture2D(u_tex, v_uv + stepUv *  3.0) * 0.078125;
    c += texture2D(u_tex, v_uv + stepUv *  4.0) * 0.062500;
    c += texture2D(u_tex, v_uv + stepUv *  5.0) * 0.046875;
    c += texture2D(u_tex, v_uv + stepUv *  6.0) * 0.031250;
    c += texture2D(u_tex, v_uv + stepUv *  7.0) * 0.023438;
    c += texture2D(u_tex, v_uv + stepUv *  8.0) * 0.015625;

    gl_FragColor = c;
  }
`;

const COMPOSITE_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_base;
  uniform sampler2D u_rgb;
  uniform sampler2D u_mask;

  uniform float u_rgbOpacity;
  uniform float u_maskOpacity;

  uniform float u_beamOpacity;
  uniform float u_beamHeight;
  uniform float u_beamSpeed;
  uniform int u_beamBlend;
  uniform vec2 u_resolution;
  uniform float u_time;

  vec3 screenBlend(vec3 base, vec3 top) {
    return 1.0 - (1.0 - base) * (1.0 - top);
  }

  vec3 colorDodge(vec3 base, vec3 top) {
    return min(vec3(1.0), base / max(vec3(0.001), 1.0 - top));
  }

  float beamAmount(vec2 uv) {
    float speed = max(0.1, u_beamSpeed);
    float p = mod(u_time, speed) / speed;

    /*
      MOVING BEAM 修正：
      1. 0.00 - 0.80 的等待阶段完全不可见，不再停在顶部。
      2. 0.80 - 1.00 才真正扫过屏幕。
      3. 光带形状改成“下方平直亮边 + 上方渐变拖影”。
         uv.y = 1.0 是视觉顶部，uv.y = 0.0 是视觉底部。
         head 是光带下边缘，trail 向上方延伸。
    */
    if (p < 0.80) {
      return 0.0;
    }

    float scan = (p - 0.80) / 0.20;
    float h = max(1.0, u_beamHeight) / max(1.0, u_resolution.y);

    /*
      head 从屏幕顶部外侧扫到屏幕底部外侧。
      给它上下各留一点空间，避免一开始/结束时露出硬边。
    */
    float head = 1.08 - scan * (1.16 + h);

    /*
      d 表示当前位置在光带下边缘上方多少。
      d < 0：在亮边下方，不显示。
      d > h：超过拖影长度，不显示。
    */
    float d = uv.y - head;

    if (d < 0.0 || d > h) {
      return 0.0;
    }

    /*
      lowerPlateau：下方平直亮边。
      upperTrail：上方拖影渐隐。
    */
    float lowerPlateau = 1.0 - smoothstep(h * 0.00, h * 0.14, d);
    float upperTrail = pow(clamp(1.0 - d / h, 0.0, 1.0), 1.55) * 0.78;

    return clamp(max(lowerPlateau, upperTrail), 0.0, 1.0);
  }

  void main() {
    vec3 color = texture2D(u_base, v_uv).rgb;
    vec3 rgb = texture2D(u_rgb, v_uv).rgb;
    float mask = texture2D(u_mask, v_uv).r;

    color = screenBlend(color, rgb * u_rgbOpacity);
    color *= mix(1.0, mask, u_maskOpacity);

    float beam = beamAmount(v_uv) * u_beamOpacity;
    vec3 beamColor = vec3(0.70, 1.0, 0.78) * beam;

    if (u_beamBlend == 0) {
      color += beamColor;
    } else if (u_beamBlend == 1) {
      color = screenBlend(color, beamColor);
    } else if (u_beamBlend == 2) {
      color = colorDodge(color, beamColor);
    } else {
      color = max(color, beamColor);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const WARP_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform float u_scale;
  uniform float u_zoom;
  uniform int u_direction;

  vec2 warpUv(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec2 q = p * u_zoom;
    float r2 = dot(q, q);
    float amount = u_scale / 100.0;
    float factor = 1.0 + amount * pow(r2, 1.12);

    vec2 src;

    if (u_direction == 0) {
      src = p * factor;
    } else {
      src = p / factor;
    }

    return src * 0.5 + 0.5;
  }

  void main() {
    vec2 srcUv = warpUv(v_uv);

    if (srcUv.x < 0.0 || srcUv.x > 1.0 || srcUv.y < 0.0 || srcUv.y > 1.0) {
      gl_FragColor = vec4(0.008, 0.012, 0.012, 1.0);
      return;
    }

    gl_FragColor = texture2D(u_tex, srcUv);
  }
`;

const LUMA_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform float u_brightness;
  uniform float u_contrast;

  void main() {
    vec3 color = texture2D(u_tex, v_uv).rgb;
    color = (color - 0.5) * u_contrast + 0.5;
    color *= u_brightness;
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;

const FINAL_FS = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_main;
  uniform sampler2D u_glow;

  uniform float u_glowOpacity;
  uniform float u_saturation;
  uniform vec2 u_chromaOffset;
  uniform float u_chromaSoftness;
  uniform vec2 u_resolution;
  uniform float u_time;

  uniform float u_vhsNoise;
  uniform float u_vhsJitter;
  uniform float u_vhsTracking;
  uniform float u_vhsChromaBleed;
  uniform float u_vhsLineWeave;
  uniform float u_vhsSharpen;
  uniform float u_vhsSharpenWidth;
  uniform float u_vhsThickRinging;
  uniform float u_vhsInterlace;
  uniform float u_vhsHeadSwitch;
  uniform float u_vhsDropout;

  uniform float u_vignetteOpacity;
  uniform float u_vignetteInner;
  uniform float u_vignetteOuter;
  uniform vec2 u_mediaSize;
  uniform vec2 u_mediaOffset;
  uniform float u_clipMedia;

  vec3 screenBlend(vec3 base, vec3 top) {
    return 1.0 - (1.0 - base) * (1.0 - top);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 applyVhsWarp(vec2 uv) {
    float line = floor(uv.y * u_resolution.y);
    float lineNoise = hash12(vec2(line, floor(u_time * 24.0))) - 0.5;

    float slowWave = sin(uv.y * 72.0 + u_time * 5.5);
    float fastWave = sin(uv.y * 310.0 + u_time * 17.0);

    float jitterPx = (lineNoise * 0.8 + slowWave * 0.15 + fastWave * 0.05) * u_vhsJitter;
    float weavePx = sin(uv.y * 36.0 + u_time * 2.2) * u_vhsLineWeave;

    float trackCenter = fract(0.87 - u_time * 0.085);
    float trackBand = 1.0 - smoothstep(0.0, 0.055, abs(uv.y - trackCenter));
    float trackingPx = trackBand * u_vhsTracking * 36.0 * (hash12(vec2(line * 0.13, u_time)) - 0.5);

    uv.x += (jitterPx + weavePx + trackingPx) / max(1.0, u_resolution.x);
    return uv;
  }

  vec3 applySaturation(vec3 color, float saturation) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), color, saturation);
  }

  vec3 rgbToYiq(vec3 c) {
    return vec3(
      dot(c, vec3(0.299, 0.587, 0.114)),
      dot(c, vec3(0.596, -0.274, -0.322)),
      dot(c, vec3(0.211, -0.523, 0.312))
    );
  }

  vec3 yiqToRgb(vec3 c) {
    return vec3(
      c.x + 0.956 * c.y + 0.621 * c.z,
      c.x - 0.272 * c.y - 0.647 * c.z,
      c.x - 1.106 * c.y + 1.703 * c.z
    );
  }

  vec3 sampleMainClamped(vec2 uv) {
    return texture2D(u_main, clamp(uv, 0.0, 1.0)).rgb;
  }

  vec3 sampleGlowClamped(vec2 uv) {
    return texture2D(u_glow, clamp(uv, 0.0, 1.0)).rgb;
  }

  vec2 sampleIQ(vec2 uv) {
    return rgbToYiq(sampleMainClamped(uv)).yz;
  }

  float luminanceAt(vec2 uv) {
    return dot(sampleMainClamped(uv), vec3(0.299, 0.587, 0.114));
  }

  vec3 sampleNtscComposite(vec2 uv) {
    vec3 sharpRgb = sampleMainClamped(uv);
    vec3 sharpYiq = rgbToYiq(sharpRgb);

    if (u_vhsChromaBleed < 0.001 &&
        length(u_chromaOffset) < 0.001 &&
        u_chromaSoftness < 0.001) {
      return sharpRgb;
    }

    vec2 chromaBase = uv + (u_chromaOffset / max(u_resolution, vec2(1.0)));

    float soft = max(0.0, u_chromaSoftness);
    float bleed = max(0.0, u_vhsChromaBleed);

    float horizPx = max(0.35, bleed * 0.55 + soft * 0.28);
    float vertPx = soft * 0.08;

    vec2 stepX = vec2(horizPx / max(1.0, u_resolution.x), 0.0);
    vec2 stepY = vec2(0.0, vertPx / max(1.0, u_resolution.y));

    vec2 iq = vec2(0.0);
    float w = 0.0;

    iq += sampleIQ(chromaBase + stepX * -5.0 + stepY * 0.70) * 0.030; w += 0.030;
    iq += sampleIQ(chromaBase + stepX * -4.0 + stepY * 0.58) * 0.045; w += 0.045;
    iq += sampleIQ(chromaBase + stepX * -3.0 + stepY * 0.45) * 0.070; w += 0.070;
    iq += sampleIQ(chromaBase + stepX * -2.0 + stepY * 0.32) * 0.100; w += 0.100;
    iq += sampleIQ(chromaBase + stepX * -1.0 + stepY * 0.18) * 0.130; w += 0.130;
    iq += sampleIQ(chromaBase) * 0.145; w += 0.145;
    iq += sampleIQ(chromaBase + stepX *  1.0 - stepY * 0.10) * 0.140; w += 0.140;
    iq += sampleIQ(chromaBase + stepX *  2.0 - stepY * 0.20) * 0.125; w += 0.125;
    iq += sampleIQ(chromaBase + stepX *  3.0 - stepY * 0.30) * 0.100; w += 0.100;
    iq += sampleIQ(chromaBase + stepX *  4.0 - stepY * 0.40) * 0.075; w += 0.075;
    iq += sampleIQ(chromaBase + stepX *  5.0 - stepY * 0.50) * 0.040; w += 0.040;

    iq /= max(w, 0.0001);

    vec3 ntscYiq = vec3(sharpYiq.x, iq.x, iq.y);
    return clamp(yiqToRgb(ntscYiq), 0.0, 1.0);
  }

  vec3 applyLumaSharpen(vec2 uv, vec3 color) {
    if (u_vhsSharpen <= 0.001) return color;

    float widthPx = max(0.5, u_vhsSharpenWidth);
    vec2 px = vec2(widthPx / max(1.0, u_resolution.x), 0.0);
    vec2 py = vec2(0.0, max(0.5, widthPx * 0.35) / max(1.0, u_resolution.y));

    float lC = luminanceAt(uv);
    float lL1 = luminanceAt(uv - px * 0.75);
    float lL2 = luminanceAt(uv - px * 1.50);
    float lR1 = luminanceAt(uv + px * 0.75);
    float lR2 = luminanceAt(uv + px * 1.50);
    float lU = luminanceAt(uv - py);
    float lD = luminanceAt(uv + py);

    /*
      宽核 unsharp mask：
      先用横向为主的低通亮度估计模糊边缘，再把亮度差叠回。
      这会比之前的 1px 邻域锐化明显很多。
    */
    float blurL = lC * 0.30 + (lL1 + lR1) * 0.18 + (lL2 + lR2) * 0.10 + (lU + lD) * 0.07;
    float detail = lC - blurL;
    color += detail * u_vhsSharpen * 2.15;

    /*
      Thick Ringing：
      模拟图中提示的 “white ghosts on the right side of black lines”。
      当左侧比当前像素更暗时，在当前点生成偏右侧白色过冲。
    */
    if (u_vhsThickRinging > 0.5) {
      float leftDarkEdge = max(0.0, lC - lL2);
      float rightBrightOvershoot = max(0.0, lR1 - lC) * 0.35;
      float halo = (leftDarkEdge + rightBrightOvershoot) * u_vhsSharpen;

      vec3 warmWhite = vec3(1.08, 1.04, 0.96);
      color += warmWhite * halo * 0.72;

      /*
        在边缘另一侧给一点暗边，形成廉价模拟锐化的黑白振铃对。
      */
      float darkUndershoot = max(0.0, lL1 - lC) * u_vhsSharpen * 0.22;
      color -= vec3(darkUndershoot);
    }

    return clamp(color, 0.0, 1.0);
  }

  float interlaceMask(vec2 uv) {
    float line = mod(floor(uv.y * u_resolution.y) + floor(u_time * 30.0), 2.0);
    return mix(1.0, 0.82, line * u_vhsInterlace);
  }

  float dropoutMask(vec2 uv) {
    if (u_vhsDropout <= 0.001) return 1.0;
    float bandId = floor(uv.y * u_resolution.y / 12.0);
    float event = step(0.992, hash12(vec2(bandId, floor(u_time * 9.0))));
    float phase = hash12(vec2(bandId * 1.7, floor(u_time * 9.0) + 13.0));
    float yCenter = (bandId * 12.0 + phase * 10.0) / u_resolution.y;
    float band = 1.0 - smoothstep(0.0, 0.004 + u_vhsDropout * 0.012, abs(uv.y - yCenter));
    return 1.0 - event * band * (0.35 + 0.55 * u_vhsDropout);
  }

  float headSwitchMask(vec2 uv) {
    if (u_vhsHeadSwitch <= 0.001) return 1.0;
    float band = smoothstep(0.84, 0.97, uv.y);
    float wave = sin(uv.x * 220.0 + u_time * 14.0) * 0.5 + 0.5;
    return 1.0 - band * u_vhsHeadSwitch * (0.20 + wave * 0.22);
  }

  void main() {
    bool outsideMedia = v_uv.x < u_mediaOffset.x || v_uv.x > u_mediaOffset.x + u_mediaSize.x ||
      v_uv.y < u_mediaOffset.y || v_uv.y > u_mediaOffset.y + u_mediaSize.y;

    if (u_clipMedia > 0.5 && outsideMedia) {
      gl_FragColor = vec4(0.008, 0.012, 0.012, 1.0);
      return;
    }

    vec2 signalUv = applyVhsWarp(v_uv);

    vec3 color = sampleNtscComposite(signalUv);
    color = applyLumaSharpen(signalUv, color);

    vec3 glow = sampleGlowClamped(signalUv);

    color = screenBlend(color, glow * u_glowOpacity);
    color = applySaturation(color, u_saturation);

    float noise = hash12(v_uv * u_resolution + vec2(u_time * 71.0, u_time * 19.0));
    color += (noise - 0.5) * u_vhsNoise;

    float trackCenter = fract(0.87 - u_time * 0.085);
    float trackBand = 1.0 - smoothstep(0.0, 0.045, abs(v_uv.y - trackCenter));
    color += vec3(trackBand * u_vhsTracking * 0.10);

    color *= interlaceMask(v_uv);
    color *= dropoutMask(v_uv);
    color *= headSwitchMask(v_uv);

    vec2 p = (v_uv - 0.5) * 2.0;
    float r = length(p) / 1.41421356;
    float vig = smoothstep(u_vignetteInner, u_vignetteOuter, r);
    color *= 1.0 - vig * u_vignetteOpacity;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

function createShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw new Error("Shader compile failed");
  }

  return shader;
}

function createProgram(fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error("Program link failed");
  }

  const aPosition = gl.getAttribLocation(program, "a_position");
  const uniforms = {};

  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }

  return { program, aPosition, uniforms };
}

const programs = {
  source: createProgram(SOURCE_FS),
  rgb: createProgram(RGB_FS),
  mask: createProgram(MASK_FS),
  blur: createProgram(BLUR_FS),
  composite: createProgram(COMPOSITE_FS),
  warp: createProgram(WARP_FS),
  luma: createProgram(LUMA_FS),
  final: createProgram(FINAL_FS)
};

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]),
  gl.STATIC_DRAW
);

function useProgram(name) {
  const p = programs[name];
  gl.useProgram(p.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(p.aPosition);
  gl.vertexAttribPointer(p.aPosition, 2, gl.FLOAT, false, 0, 0);
  return p.uniforms;
}

function createTexture(w, h, source = null) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (source) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  } else {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }

  return tex;
}

function createTarget(w, h) {
  const texture = createTexture(w, h);
  const fbo = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  return { texture, fbo, width: w, height: h };
}

function resizeTarget(target, w, h) {
  if (target.width === w && target.height === h) return;

  target.width = w;
  target.height = h;

  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
}

function bindTexture(unit, texture, location) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(location, unit);
}

function drawTo(target) {
  if (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.width, target.height);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const targets = {
  fit: createTarget(1, 1),
  imageBlurX: createTarget(1, 1),
  imageBlurred: createTarget(1, 1),

  rgbRaw: createTarget(1, 1),
  rgbBlurX: createTarget(1, 1),
  rgbBlurred: createTarget(1, 1),

  maskRaw: createTarget(1, 1),
  maskBlurX: createTarget(1, 1),
  maskBlurred: createTarget(1, 1),

  preWarp: createTarget(1, 1),
  warped: createTarget(1, 1),
  postBlurX: createTarget(1, 1),
  postBlurred: createTarget(1, 1),

  luma: createTarget(1, 1),
  glowX: createTarget(1, 1),
  glow: createTarget(1, 1)
};

let sourceTexture = null;
let sourceWidth = 1024;
let sourceHeight = 768;
let sourceAspect = sourceWidth / sourceHeight;
let currentObjectURL = null;
let currentSourceFile = null;
let currentMediaType = "demo";
let exportInProgress = false;
let renderFrameOverrideTime = null;
let exportRenderScale = 1;
let exportMosaic = false;
let compatibilityRecording = false;

function lockExportControls() {
  const saved = [...document.querySelectorAll('input, select, button')]
    .map(element => [element, element.disabled]);
  saved.forEach(([element]) => { element.disabled = true; });
  return () => saved.forEach(([element, disabled]) => { element.disabled = disabled; });
}

function showExportProgress(stage, completed = 0, total = 0, detail = "") {
  const names = { preparing:["准备导出","Preparing export"], video:["视频编码","Video encoding"], audio:["音轨处理","Audio processing"], recording:["兼容录制","Compatibility recording"], finalizing:["封装文件","Finalizing file"], done:["导出完成","Export complete"], error:["导出失败","Export failed"] };
  const progress = document.getElementById("exportProgress");
  const title = names[stage][currentLang === "zh" ? 0 : 1];
  document.getElementById("exportProgressPanel").hidden = false;
  document.getElementById("exportProgressLabel").textContent = title;
  if (stage === "done") progress.value = 100;
  else if (total > 0) progress.value = exportProgressPercent(completed, total);
  else progress.removeAttribute("value");
  document.getElementById("exportProgressStatus").textContent = detail || (total > 0 ? `${exportProgressPercent(completed, total).toFixed(1)}%` : title);
}

const exportCanvas = document.createElement("canvas");
const exportCtx = exportCanvas.getContext("2d", { alpha: false });

const sourceVideo = document.createElement("video");
sourceVideo.loop = true;
sourceVideo.muted = false;
sourceVideo.playsInline = true;
sourceVideo.crossOrigin = "anonymous";

function uploadSource(source, w, h) {
  sourceWidth = w;
  sourceHeight = h;
  sourceAspect = w / h;

  let replacement = null;
  try {
    replacement = createTexture(w, h, source);
    if (gl.getError() !== gl.NO_ERROR) throw new Error("Texture upload failed");
  } catch (error) {
    if (replacement) gl.deleteTexture(replacement);
    console.warn("Source image could not be uploaded:", error);
    return false;
  }

  const previous = sourceTexture;
  sourceTexture = replacement;
  if (previous) gl.deleteTexture(previous);
  return true;
}

function uploadVideoFrame() {
  if (currentMediaType !== "video") return;
  if (sourceVideo.readyState < 2) return;

  const vw = sourceVideo.videoWidth || sourceWidth;
  const vh = sourceVideo.videoHeight || sourceHeight;
  sourceWidth = vw;
  sourceHeight = vh;
  sourceAspect = vw / vh;

  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceVideo);
  } catch (error) {
    // Some browsers throw until the first decodable video frame is ready.
  }
}

const controls = {};
document.querySelectorAll("[data-config]").forEach((el) => {
  controls[el.dataset.config] = el;
});

let currentLang = readUiLanguage();

const labels = {
  imageFit: document.getElementById("imageFitValue"),
  imageOpacity: document.getElementById("imageOpacityValue"),
  imagePosX: document.getElementById("imagePosXValue"),
  imagePosY: document.getElementById("imagePosYValue"),
  imageBlurX: document.getElementById("imageBlurXValue"),
  imageBlurY: document.getElementById("imageBlurYValue"),
  pixelate: document.getElementById("pixelateValue"),
  exportDuration: document.getElementById("exportDurationValue"),
  exportFps: document.getElementById("exportFpsValue"),
  exportBitrate: document.getElementById("exportBitrateValue"),
  exportScale: document.getElementById("exportScaleValue"),
  audioVolume: document.getElementById("audioVolumeValue"),
  audioBandwidth: document.getElementById("audioBandwidthValue"),
  audioHiss: document.getElementById("audioHissValue"),
  audioDrive: document.getElementById("audioDriveValue"),
  audioWow: document.getElementById("audioWowValue"),
  audioReverb: document.getElementById("audioReverbValue"),

  warpDirection: document.getElementById("warpDirectionValue"),
  scale: document.getElementById("scaleValue"),
  mapZoom: document.getElementById("mapZoomValue"),
  warpBlurX: document.getElementById("warpBlurXValue"),
  warpBlurY: document.getElementById("warpBlurYValue"),
  brightness: document.getElementById("brightnessValue"),
  contrast: document.getElementById("contrastValue"),
  flickerAmount: document.getElementById("flickerAmountValue"),
  flickerSpeed: document.getElementById("flickerSpeedValue"),

  rgbOpacity: document.getElementById("rgbOpacityValue"),
  rgbRedBias: document.getElementById("rgbRedBiasValue"),
  rgbGreenBias: document.getElementById("rgbGreenBiasValue"),
  rgbBlueBias: document.getElementById("rgbBlueBiasValue"),
  rgbPeriod: document.getElementById("rgbPeriodValue"),
  rgbBlurX: document.getElementById("rgbBlurXValue"),
  rgbBlurY: document.getElementById("rgbBlurYValue"),
  chromaOffsetX: document.getElementById("chromaOffsetXValue"),
  chromaOffsetY: document.getElementById("chromaOffsetYValue"),
  chromaSoftness: document.getElementById("chromaSoftnessValue"),

  maskOpacity: document.getElementById("maskOpacityValue"),
  maskX: document.getElementById("maskXValue"),
  maskY: document.getElementById("maskYValue"),
  maskBlurX: document.getElementById("maskBlurXValue"),
  maskBlurY: document.getElementById("maskBlurYValue"),

  beamBlend: document.getElementById("beamBlendValue"),
  beamOpacity: document.getElementById("beamOpacityValue"),
  beamHeight: document.getElementById("beamHeightValue"),
  beamSpeed: document.getElementById("beamSpeedValue"),

  glowOpacity: document.getElementById("glowOpacityValue"),
  glowBlurX: document.getElementById("glowBlurXValue"),
  glowBlurY: document.getElementById("glowBlurYValue"),
  finalSaturation: document.getElementById("finalSaturationValue"),
  vhsNoise: document.getElementById("vhsNoiseValue"),
  vhsJitter: document.getElementById("vhsJitterValue"),
  vhsLineWeave: document.getElementById("vhsLineWeaveValue"),
  vhsTracking: document.getElementById("vhsTrackingValue"),
  vhsChromaBleed: document.getElementById("vhsChromaBleedValue"),
  vhsThickRinging: document.getElementById("vhsThickRingingValue"),
  vhsSharpen: document.getElementById("vhsSharpenValue"),
  vhsSharpenWidth: document.getElementById("vhsSharpenWidthValue"),
  vhsInterlace: document.getElementById("vhsInterlaceValue"),
  vhsHeadSwitch: document.getElementById("vhsHeadSwitchValue"),
  vhsDropout: document.getElementById("vhsDropoutValue"),

  vignette: document.getElementById("vignetteValue"),
  vignetteInner: document.getElementById("vignetteInnerValue"),
  vignetteOuter: document.getElementById("vignetteOuterValue")
};

function val(key) {
  const control = controls[key];
  if (!control) return "";
  if (control.type === "checkbox") {
    return control.checked ? "1" : "0";
  }
  return control.value;
}

function num(key) {
  return Number(val(key));
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function getBeamMode(value) {
  if (value === "screen") return 1;
  if (value === "color-dodge") return 2;
  if (value === "lighten") return 3;
  return 0;
}

function getWarpDirection(value) {
  return value === "pincushion" ? 1 : 0;
}

function getPreviewSize(width, height, maxSize) {
  const aspect = Math.max(0.1, width / Math.max(1, height));
  const limit = Math.min(2048, maxSize);
  const w = Math.min(960, limit, limit * aspect);
  return { width:Math.max(2, Math.round(w)), height:Math.max(2, Math.round(w / aspect)) };
}

function resize() {
  const baseDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const dpr = baseDpr * (exportInProgress ? exportRenderScale : 1);
  const rect = { width: canvas.clientWidth, height: canvas.clientHeight };
  let w = Math.max(1, Math.round(rect.width * dpr));
  let h = Math.max(1, Math.round(rect.height * dpr));
  if (!exportInProgress) {
    const preview = getPreviewSize(rect.width, rect.height, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    w = preview.width;
    h = preview.height;
  }

  if (exportInProgress && val("effectBoundary") === "source" && sourceAspect > 0) {
    if (w / h > sourceAspect) {
      w = Math.round(h * sourceAspect);
    } else {
      h = Math.round(w / sourceAspect);
    }
  }

  if (exportInProgress) {
    w = Math.max(2, Math.floor(w / 2) * 2);
    h = Math.max(2, Math.floor(h / 2) * 2);
  }
  if (canvas.width === w && canvas.height === h) return;

  canvas.width = w;
  canvas.height = h;

  Object.values(targets).forEach((target) => {
    resizeTarget(target, w, h);
  });
}

function computeImagePlacement() {
  const fit = val("imageFit");
  const posX = num("imagePosX") / 100;
  const posY = num("imagePosY") / 100;

  const canvasAspect = canvas.width / canvas.height;

  let drawW = 1;
  let drawH = 1;

  if (fit === "fill") {
    drawW = 1;
    drawH = 1;
  } else if (fit === "contain") {
    if (sourceAspect > canvasAspect) {
      drawW = 1;
      drawH = canvasAspect / sourceAspect;
    } else {
      drawH = 1;
      drawW = sourceAspect / canvasAspect;
    }
  } else {
    if (sourceAspect > canvasAspect) {
      drawH = 1;
      drawW = sourceAspect / canvasAspect;
    } else {
      drawW = 1;
      drawH = canvasAspect / sourceAspect;
    }
  }

  const offsetX = (1 - drawW) * posX;
  const offsetY = (1 - drawH) * posY;

  return {
    size: [drawW, drawH],
    offset: [offsetX, offsetY]
  };
}

function passSource() {
  const u = useProgram("source");
  const placement = computeImagePlacement();

  bindTexture(0, sourceTexture, u.u_tex);
  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform2f(u.u_imgSize, placement.size[0], placement.size[1]);
  gl.uniform2f(u.u_imgOffset, placement.offset[0], placement.offset[1]);
  gl.uniform1f(u.u_opacity, num("imageOpacity"));
  gl.uniform1f(u.u_pixelate, exportMosaic ? 1 : num("pixelate"));
  gl.uniform1f(u.u_pixelPeriod, exportMosaic ? num("exportPixelSize") : num("rgbPeriod"));

  drawTo(targets.fit);
}

function passBlur(inputTex, outputTarget, radius, dirX, dirY) {
  const u = useProgram("blur");

  bindTexture(0, inputTex, u.u_tex);
  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform2f(u.u_direction, dirX, dirY);
  gl.uniform1f(u.u_radius, radius);

  drawTo(outputTarget);
}

function passRgb() {
  const u = useProgram("rgb");

  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform1f(u.u_period, num("rgbPeriod"));
  gl.uniform3f(u.u_rgbBias, num("rgbRedBias"), num("rgbGreenBias"), num("rgbBlueBias"));

  drawTo(targets.rgbRaw);
}

function passMask() {
  const u = useProgram("mask");
  const period = num("rgbPeriod");

  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform1f(u.u_period, period);
  gl.uniform1f(u.u_maskX, clamp(num("maskX"), 0, period - 1));
  gl.uniform1f(u.u_maskY, clamp(num("maskY"), 0, period - 1));

  drawTo(targets.maskRaw);
}

function passComposite(time) {
  const u = useProgram("composite");

  bindTexture(0, targets.imageBlurred.texture, u.u_base);
  bindTexture(1, targets.rgbBlurred.texture, u.u_rgb);
  bindTexture(2, targets.maskBlurred.texture, u.u_mask);

  gl.uniform1f(u.u_rgbOpacity, num("rgbOpacity"));
  gl.uniform1f(u.u_maskOpacity, num("maskOpacity"));

  gl.uniform1f(u.u_beamOpacity, num("beamOpacity"));
  gl.uniform1f(u.u_beamHeight, num("beamHeight"));
  gl.uniform1f(u.u_beamSpeed, num("beamSpeed"));
  gl.uniform1i(u.u_beamBlend, getBeamMode(val("beamBlend")));
  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform1f(u.u_time, time);

  drawTo(targets.preWarp);
}

function passWarp() {
  const u = useProgram("warp");

  bindTexture(0, targets.preWarp.texture, u.u_tex);
  gl.uniform1f(u.u_scale, num("scale"));
  gl.uniform1f(u.u_zoom, num("mapZoom"));
  gl.uniform1i(u.u_direction, getWarpDirection(val("warpDirection")));

  drawTo(targets.warped);
}

function passLuma(time) {
  const u = useProgram("luma");

  const baseBrightness = num("brightness");
  const amount = num("flickerAmount");
  const speed = num("flickerSpeed");

  const slow = Math.sin(time * speed * Math.PI * 2.0) * 0.45;
  const fast = Math.sin(time * speed * Math.PI * 9.7) * 0.18;
  const jitter = (Math.sin(time * 53.17) + Math.sin(time * 91.91)) * 0.08;
  const brightness = Math.max(0, baseBrightness + (slow + fast + jitter) * amount);

  bindTexture(0, targets.postBlurred.texture, u.u_tex);
  gl.uniform1f(u.u_brightness, brightness);
  gl.uniform1f(u.u_contrast, num("contrast"));

  drawTo(targets.luma);
}

function passFinal() {
  const u = useProgram("final");

  bindTexture(0, targets.luma.texture, u.u_main);
  bindTexture(1, targets.glow.texture, u.u_glow);

  gl.uniform1f(u.u_glowOpacity, num("glowOpacity"));
  gl.uniform1f(u.u_saturation, num("finalSaturation"));
  gl.uniform2f(u.u_chromaOffset, num("chromaOffsetX"), num("chromaOffsetY"));
  gl.uniform1f(u.u_chromaSoftness, num("chromaSoftness"));
  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  gl.uniform1f(u.u_time, performance.now() / 1000);

  gl.uniform1f(u.u_vhsNoise, num("vhsNoise"));
  gl.uniform1f(u.u_vhsJitter, num("vhsJitter"));
  gl.uniform1f(u.u_vhsTracking, num("vhsTracking"));
  gl.uniform1f(u.u_vhsChromaBleed, num("vhsChromaBleed"));
  gl.uniform1f(u.u_vhsLineWeave, num("vhsLineWeave"));
  gl.uniform1f(u.u_vhsSharpen, num("vhsSharpen"));
  gl.uniform1f(u.u_vhsSharpenWidth, num("vhsSharpenWidth"));
  gl.uniform1f(u.u_vhsThickRinging, num("vhsThickRinging"));
  gl.uniform1f(u.u_vhsInterlace, num("vhsInterlace"));
  gl.uniform1f(u.u_vhsHeadSwitch, num("vhsHeadSwitch"));
  gl.uniform1f(u.u_vhsDropout, num("vhsDropout"));

  gl.uniform1f(u.u_vignetteOpacity, num("vignette"));
  gl.uniform1f(u.u_vignetteInner, num("vignetteInner") / 100);
  gl.uniform1f(u.u_vignetteOuter, num("vignetteOuter") / 100);
  const placement = computeImagePlacement();
  gl.uniform2f(u.u_mediaSize, placement.size[0], placement.size[1]);
  gl.uniform2f(u.u_mediaOffset, placement.offset[0], placement.offset[1]);
  gl.uniform1f(u.u_clipMedia, val("effectBoundary") === "media" ? 1 : 0);

  drawTo(null);
}

function renderFrame(ms) {
  const effectiveMs = renderFrameOverrideTime === null ? ms : renderFrameOverrideTime;
  const time = effectiveMs / 1000;

  resize();

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0.008, 0.012, 0.012, 1.0);

  uploadVideoFrame();
  passSource();

  passBlur(targets.fit.texture, targets.imageBlurX, num("imageBlurX"), 1, 0);
  passBlur(targets.imageBlurX.texture, targets.imageBlurred, num("imageBlurY"), 0, 1);

  passRgb();
  passBlur(targets.rgbRaw.texture, targets.rgbBlurX, num("rgbBlurX"), 1, 0);
  passBlur(targets.rgbBlurX.texture, targets.rgbBlurred, num("rgbBlurY"), 0, 1);

  passMask();
  passBlur(targets.maskRaw.texture, targets.maskBlurX, num("maskBlurX"), 1, 0);
  passBlur(targets.maskBlurX.texture, targets.maskBlurred, num("maskBlurY"), 0, 1);

  passComposite(time);
  passWarp();

  passBlur(targets.warped.texture, targets.postBlurX, num("warpBlurX"), 1, 0);
  passBlur(targets.postBlurX.texture, targets.postBlurred, num("warpBlurY"), 0, 1);

  passLuma(time);

  passBlur(targets.luma.texture, targets.glowX, num("glowBlurX"), 1, 0);
  passBlur(targets.glowX.texture, targets.glow, num("glowBlurY"), 0, 1);

  passFinal();
}

let lastPreviewFrame = -Infinity;
function render(ms) {
  const frameInterval = document.getElementById("previewQuality").value === "smooth" ? 1000 / 15 : 1000 / 30;
  if ((!exportInProgress || compatibilityRecording) && ms - lastPreviewFrame >= frameInterval - 1) {
    renderFrame(ms);
    lastPreviewFrame = ms;
  }
  requestAnimationFrame(render);
}

function syncExportCanvasSize() {
  if (exportCanvas.width !== canvas.width) exportCanvas.width = canvas.width;
  if (exportCanvas.height !== canvas.height) exportCanvas.height = canvas.height;
}

function seekSourceVideo(time) {
  if (currentMediaType !== "video" || !Number.isFinite(sourceVideo.duration)) {
    return Promise.resolve();
  }

  const end = Math.max(0, sourceVideo.duration - 0.001);
  const target = Math.min(Math.max(0, time), end);
  if (Math.abs(sourceVideo.currentTime - target) < 0.0005) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      sourceVideo.removeEventListener("seeked", finish);
      resolve();
    };
    sourceVideo.addEventListener("seeked", finish, { once: true });
    sourceVideo.currentTime = target;
  });
}

async function drawExportFrame(ms) {
  if (currentMediaType === "video") {
    await seekSourceVideo(ms / 1000);
  }

  renderFrameOverrideTime = ms;
  renderFrame(ms);
  renderFrameOverrideTime = null;
  syncExportCanvasSize();
  exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
}

function resetToDemo() {
  controls.exportDuration.value = DEFAULT_CONFIG.exportDuration;
  updateLabels();
  currentMediaType = "image";
  currentSourceFile = null;
  sourceVideo.pause();
  sourceVideo.removeAttribute("src");
  sourceVideo.load();
  document.getElementById("imageUpload").value = "";
  syncPlaybackControls();
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    uploadSource(image, image.naturalWidth, image.naturalHeight);
    setPresetStatus("Default desktop loaded / 已载入默认桌面图");
  };
  image.onerror = () => {
    setPresetStatus("Default image could not be loaded / 默认图片无法加载");
  };
  image.src = new URL("assets/demo-desktop.png", document.baseURI).href;
}

document.getElementById("imageUpload").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  currentSourceFile = file;

  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  currentObjectURL = URL.createObjectURL(file);

  if (file.type.startsWith("image/")) {
    controls.exportDuration.value = DEFAULT_CONFIG.exportDuration;
    updateLabels();
    currentMediaType = "image";
    sourceVideo.pause();
    sourceVideo.removeAttribute("src");
    sourceVideo.load();
    syncPlaybackControls();

    const img = new Image();
    img.onload = () => {
      uploadSource(img, img.naturalWidth, img.naturalHeight);
    };
    img.src = currentObjectURL;
    return;
  }

  if (file.type.startsWith("video/")) {
    currentMediaType = "video";
    sourceVideo.src = currentObjectURL;
    sourceVideo.loop = true;
    sourceVideo.muted = false;
    syncPlaybackControls();
    sourceVideo.playsInline = true;

    sourceVideo.addEventListener("loadedmetadata", () => {
      sourceWidth = sourceVideo.videoWidth || 1024;
      sourceHeight = sourceVideo.videoHeight || 768;
      sourceAspect = sourceWidth / sourceHeight;
      if (Number.isFinite(sourceVideo.duration) && sourceVideo.duration > 0) {
        controls.exportDuration.max = String(Math.max(60, sourceVideo.duration));
        controls.exportDuration.value = String(sourceVideo.duration);
        const input = document.querySelector('.parameter-value-input[data-range-key="exportDuration"]');
        if (input) input.max = controls.exportDuration.max;
        updateLabels();
      }
    }, { once: true });

    sourceVideo.addEventListener("canplay", () => {
      uploadVideoFrame();
      startPlayback();
    }, { once: true });
  }
});

document.getElementById("clearImageButton").addEventListener("click", () => {
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  document.getElementById("imageUpload").value = "";
  currentSourceFile = null;
  resetToDemo();
});

document.getElementById("showDemoButton").addEventListener("click", () => {
  resetToDemo();
});

async function downloadCurrentFrame() {
  if (exportInProgress) return;
  exportInProgress = true;
  exportRenderScale = Math.max(0.25, Math.min(3, num("exportScale")));
  try {
    resize();
    renderFrame(performance.now());
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG encoding failed");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crt-processed-frame.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
    setPresetStatus("PNG exported at source ratio / 已按源媒体比例导出 PNG");
  } catch (error) {
    console.error(error);
    setPresetStatus("PNG export failed / PNG 导出失败");
  } finally {
    exportInProgress = false;
    exportRenderScale = 1;
    resize();
  }
}

async function downloadProcessedVideo() {
  if (exportInProgress) return;
  if (currentMediaType !== "video") {
    setPresetStatus("Load a video first / 请先加载视频");
    return;
  }

  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
    setPresetStatus("MediaRecorder unsupported / 浏览器不支持视频导出");
    return;
  }

  const mimeCandidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];
  let mimeType = "";
  for (const m of mimeCandidates) {
    if (MediaRecorder.isTypeSupported(m)) {
      mimeType = m;
      break;
    }
  }

  const stream = canvas.captureStream(num("exportFps"));
  const options = { videoBitsPerSecond: Math.round(num("exportBitrate") * 1000000) };
  if (mimeType) options.mimeType = mimeType;
  const recorder = new MediaRecorder(stream, options);
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  const originalLoop = sourceVideo.loop;
  const originalMuted = sourceVideo.muted;
  const originalTime = sourceVideo.currentTime;
  const wasPaused = sourceVideo.paused;

  exportInProgress = true;
  // Compatibility recording needs the live render loop.
  const unlock = lockExportControls();
  const duration = Math.min(num("exportDuration"), sourceVideo.duration);
  let timer;
  let recordingError;
  let stopRecording;
  try {
    sourceVideo.pause();
    sourceVideo.loop = false;
    sourceVideo.muted = true;
    await seekSourceVideo(0);

    const done = new Promise(resolve => { recorder.onstop = resolve; });
    recorder.start(100);
    showExportProgress("recording", 0, duration);
    setPresetStatus("Recording video export... / 正在录制导出视频…");

    stopRecording = () => {
      sourceVideo.removeEventListener("ended", stopRecording);
      if (recorder.state !== "inactive") recorder.stop();
    };
    sourceVideo.addEventListener("ended", stopRecording);
    // The preview renderer is deliberately allowed to run during recording.
    compatibilityRecording = true;
    timer = setInterval(() => {
      showExportProgress("recording", sourceVideo.currentTime, duration);
      if (sourceVideo.currentTime >= duration) stopRecording();
    }, 100);
    recorder.onerror = event => { recordingError = event.error || new Error("Recording failed"); stopRecording(); };
    await sourceVideo.play();
    await done;
    if (recordingError) throw recordingError;
    clearInterval(timer);
    showExportProgress("finalizing");

    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crt-processed-video.webm";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    showExportProgress("done");
    setPresetStatus("Video export complete / 视频导出完成");
  } catch (error) {
    showExportProgress("error", 0, 0, String(error.message || error));
    if (recorder.state !== "inactive") recorder.stop();
  } finally {
    clearInterval(timer);
    if (stopRecording) sourceVideo.removeEventListener("ended", stopRecording);
    stream.getTracks().forEach(track => track.stop());
    unlock();
    exportInProgress = false;
    compatibilityRecording = false;
    sourceVideo.loop = originalLoop;
    sourceVideo.muted = originalMuted;
    sourceVideo.currentTime = originalTime;
    if (!wasPaused) sourceVideo.play().catch(() => {});
  }
}

function makeDriveCurve(amount) {
  const size = 2048;
  const curve = new Float32Array(size);
  const drive = 1 + Math.max(0, amount) * 28;
  for (let i = 0; i < size; i++) {
    const x = (i * 2) / (size - 1) - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

async function processRetroAudio(buffer) {
  const channels = val("audioChannels") === "mono" ? 1 : Math.min(2, buffer.numberOfChannels);
  const context = new OfflineAudioContext(channels, buffer.length, buffer.sampleRate);
  const source = context.createBufferSource();
  source.buffer = buffer;

  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 70;
  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = Math.max(1200, num("audioBandwidth"));
  lowPass.Q.value = 0.45;
  const drive = context.createWaveShaper();
  drive.curve = makeDriveCurve(num("audioDrive"));
  drive.oversample = "2x";
  const gain = context.createGain();
  gain.gain.value = num("audioVolume");

  source.connect(highPass).connect(lowPass).connect(drive).connect(gain);

  let channelOutput = gain;
  if (val("audioChannels") === "narrow" && channels === 2) {
    const merger = context.createChannelMerger(2);
    const splitter = context.createChannelSplitter(2);
    const left = context.createGain();
    const right = context.createGain();
    left.gain.value = 0.78;
    right.gain.value = 0.78;
    gain.connect(splitter);
    splitter.connect(left, 0); splitter.connect(right, 1);
    left.connect(merger, 0, 0); right.connect(merger, 0, 1);
    channelOutput = merger;
  }

  const reverb = num("audioReverb");
  if (reverb > 0) {
    const impulseSeconds = 0.045 + reverb * 0.28;
    const impulse = context.createBuffer(channels, Math.ceil(context.sampleRate * impulseSeconds), context.sampleRate);
    for (let channel = 0; channel < channels; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const decay = Math.pow(1 - i / data.length, 2.4);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    const convolver = context.createConvolver();
    const wet = context.createGain();
    const dry = context.createGain();
    convolver.buffer = impulse;
    wet.gain.value = reverb * 0.45;
    dry.gain.value = 1 - reverb * 0.22;
    channelOutput.connect(dry).connect(context.destination);
    channelOutput.connect(convolver).connect(wet).connect(context.destination);
  } else {
    channelOutput.connect(context.destination);
  }

  const wow = num("audioWow");
  if (wow > 0) {
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.45;
    lfoGain.gain.value = wow;
    lfo.connect(lfoGain).connect(source.playbackRate);
    lfo.start();
  }

  const hiss = num("audioHiss");
  if (hiss > 0) {
    const noiseBuffer = context.createBuffer(channels, buffer.length, buffer.sampleRate);
    for (let channel = 0; channel < channels; channel++) {
      const data = noiseBuffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * hiss;
    }
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 4600;
    noiseFilter.Q.value = 0.7;
    noise.buffer = noiseBuffer;
    noise.connect(noiseFilter).connect(context.destination);
    noise.start();
  }

  source.start();
  return context.startRendering();
}

async function downloadHighQualityVideo() {
  const mb = globalThis.Mediabunny;
  const hasWebCodecs = typeof VideoEncoder !== "undefined";
  if (!hasWebCodecs || !mb || !mb.Output || !mb.CanvasSource) {
    if (currentMediaType === "video") {
      setPresetStatus("Offline encoder unavailable; using compatibility WebM / 离线编码不可用，改用兼容 WebM");
      return downloadProcessedVideo();
    }
    setPresetStatus("Offline encoder requires a current Chrome or Edge browser / 高质量导出需要新版 Chrome 或 Edge");
    return;
  }

  if (exportInProgress) return;
  exportInProgress = true;
  const fps = Math.max(10, Math.min(60, Math.round(num("exportFps"))));
  const duration = Math.max(0.001, num("exportDuration"));
  const bitrate = Math.round(Math.max(0.1, Math.min(120, num("exportBitrate"))) * 1000 * 1000);
  exportRenderScale = Math.max(0.25, Math.min(3, num("exportScale")));
  exportMosaic = num("exportPixelSize") > 0;
  const useWebm = val("exportFormat") === "webm";
  const originalTime = sourceVideo.currentTime;
  const wasPaused = sourceVideo.paused;
  const unlock = lockExportControls();
  try {
    if (currentMediaType === "video") sourceVideo.pause();
    showExportProgress("preparing");
    resize();
    syncExportCanvasSize();
    const output = new mb.Output({
      format: useWebm ? new mb.WebMOutputFormat() : new mb.Mp4OutputFormat(),
      target: new mb.BufferTarget()
    });
    const videoSource = new mb.CanvasSource(exportCanvas, {
      codec: useWebm ? "vp9" : "avc",
      bitrate,
      frameRate: fps
    });
    output.addVideoTrack(videoSource, { frameRate: fps });
    let audioSource = null;
    let audioSamples = null;

    if (currentMediaType === "video" && currentSourceFile && mb.Input && mb.AudioSampleSink) {
      const input = new mb.Input({ source: new mb.BlobSource(currentSourceFile), formats: mb.ALL_FORMATS });
      const audioTrack = await input.getPrimaryAudioTrack();
      if (audioTrack && await audioTrack.canDecode()) {
        audioSource = new mb.AudioBufferSource({ codec: useWebm ? "opus" : "aac", bitrate: 192000 });
        output.addAudioTrack(audioSource);
        audioSamples = new mb.AudioSampleSink(audioTrack).samples(0, duration);
      }
    }

    await output.start();
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    const exportStarted = performance.now();
    const exportTimings = { renderMs:0, encodeMs:0, frames:totalFrames };
    setPresetStatus(`Offline ${useWebm ? "WebM" : "MP4"} render: 0% / 正在离线高质量渲染…`);
    showExportProgress("video", 0, totalFrames);

    for (let i = 0; i < totalFrames; i++) {
      const renderStarted = performance.now();
      await drawExportFrame(i * 1000 / fps);
      exportTimings.renderMs += performance.now() - renderStarted;
      const encodeStarted = performance.now();
      await videoSource.add(i / fps, Math.min(1 / fps, duration - i / fps));
      exportTimings.encodeMs += performance.now() - encodeStarted;
      if (i % Math.max(1, Math.floor(fps / 5)) === 0 || i === totalFrames - 1) {
        const elapsed = (performance.now() - exportStarted) / 1000;
        const rate = (i + 1) / Math.max(0.001, elapsed);
        showExportProgress("video", i + 1, totalFrames, currentLang === "zh"
          ? `${i + 1}/${totalFrames} 帧 · ${rate.toFixed(1)} 帧/秒 · 本阶段剩余约 ${Math.ceil((totalFrames - i - 1) / rate)} 秒`
          : `${i + 1}/${totalFrames} frames · ${rate.toFixed(1)} fps · ~${Math.ceil((totalFrames - i - 1) / rate)}s left in this stage`);
        await new Promise(resolve => setTimeout(resolve, 0));
        setPresetStatus(currentLang === "zh" ? `正在导出 ${Math.round((i + 1) / totalFrames * 100)}% · ${rate.toFixed(1)} 帧/秒 · 预计剩余 ${Math.ceil((totalFrames - i - 1) / rate)} 秒` : `Export ${Math.round((i + 1) / totalFrames * 100)}% · ${rate.toFixed(1)} fps · ${Math.ceil((totalFrames - i - 1) / rate)}s remaining`);
      }
    }

    if (audioSource && audioSamples) {
      showExportProgress("audio");
      for await (const sample of audioSamples) {
        try {
          await audioSource.add(await processRetroAudio(sample.toAudioBuffer()));
          showExportProgress("audio", sample.timestamp + sample.duration, Math.min(duration, sourceVideo.duration));
        } finally { sample.close(); }
      }
    }

    showExportProgress("finalizing");
    await output.finalize();
    console.info("CRT export timing", { ...exportTimings, totalMs:performance.now() - exportStarted });
    const mime = useWebm ? "video/webm" : "video/mp4";
    const url = URL.createObjectURL(new Blob([output.target.buffer], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `crt-simulator-${useWebm ? "export.webm" : "export.mp4"}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
    showExportProgress("done");
    setPresetStatus(`High-quality ${useWebm ? "WebM" : "MP4"} exported / 高质量视频已导出`);
  } catch (error) {
    console.error(error);
    const detail = error && error.message ? `: ${error.message}` : "";
    showExportProgress("error", 0, 0, detail);
    setPresetStatus(`High-quality export failed${detail} / 高质量导出失败；请尝试兼容 WebM`);
  } finally {
    exportInProgress = false;
    exportRenderScale = 1;
    exportMosaic = false;
    unlock();
    if (currentMediaType === "video") {
      sourceVideo.currentTime = originalTime;
      if (!wasPaused) sourceVideo.play().catch(() => {});
    }
    resize();
  }
}
