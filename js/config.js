// Defaults, presets and configuration persistence.
// Classic scripts share scope; load config.js, crt.js, controls.js in this order.
const STORAGE_KEY = "crt-media-multipass-webgl-vhs-export-presets-v1";
const PANEL_STATE_KEY = "crt-media-panel-collapsed-v1";
const USER_PRESETS_KEY = "crt-media-user-presets-v1";

function readUiLanguage() {
  try { return localStorage.getItem("crt-ui-lang") === "en" ? "en" : "zh"; }
  catch { return "zh"; } // Local files/privacy settings may deny browser storage.
}

const DEFAULT_CONFIG = {
  "crtEnabled": "1",
  "vhsEnabled": "1",
  "opticsEnabled": "1",
  "imageFit": "contain",
  "imageOpacity": "1",
  "imagePosX": "50",
  "imagePosY": "50",
  "imageBlurX": "0",
  "imageBlurY": "0",
  "warpDirection": "barrel",
  "scale": "38",
  "mapZoom": "0.3",
  "warpBlurX": "3.64",
  "warpBlurY": "0.45",
  "brightness": "1",
  "contrast": "1.51",
  "flickerAmount": "0.07",
  "flickerSpeed": "30",
  "rgbOpacity": "0.54",
  "rgbRedBias": "1",
  "rgbGreenBias": "1",
  "rgbBlueBias": "1",
  "rgbPeriod": "6",
  "rgbBlurX": "3.08",
  "rgbBlurY": "2.92",
  "chromaOffsetX": "0",
  "chromaOffsetY": "0",
  "chromaSoftness": "2.5",
  "maskOpacity": "0.32",
  "maskX": "2",
  "maskY": "2",
  "maskBlurX": "3.53",
  "maskBlurY": "3.59",
  "beamBlend": "color-dodge",
  "beamOpacity": "0.57",
  "beamHeight": "272",
  "beamSpeed": "6.5",
  "glowOpacity": "0.21",
  "glowBlurX": "17.4",
  "glowBlurY": "19.1",
  "finalSaturation": "1",
  "vignette": "1",
  "vignetteInner": "55",
  "vignetteOuter": "117",
  "pixelate": "0",
  "vhsNoise": "0",
  "vhsJitter": "0",
  "vhsTracking": "0",
  "vhsChromaBleed": "0",
  "vhsLineWeave": "0",
  "vhsSharpen": "0",
  "vhsInterlace": "0",
  "vhsHeadSwitch": "0",
  "vhsDropout": "0",
  "vhsSharpenWidth": "2",
  "vhsThickRinging": "0",
  "exportDuration": "6",
  "exportFps": "30",
  "exportBitrate": "50",
  "exportScale": "1",
  "exportPixelSize": "0",
  "exportFormat": "mp4",
  "effectBoundary": "source",
  "audioPreset": "clean",
  "audioVolume": "1",
  "audioBandwidth": "18000",
  "audioHiss": "0",
  "audioDrive": "0",
  "audioWow": "0",
  "audioReverb": "0"
};

// Export-only settings: do not replace the CRT or audio preset.
const EXPORT_QUALITY_PRESETS = {
  original: { exportScale: "1", exportFps: "30", exportBitrate: "50", exportPixelSize: "0" },
  low: { exportScale: "0.5", exportFps: "24", exportBitrate: "1.5", exportPixelSize: "0" },
  network: { exportScale: "0.25", exportFps: "15", exportBitrate: "0.25", exportPixelSize: "0" },
  mosaic: { exportScale: "0.5", exportFps: "15", exportBitrate: "0.5", exportPixelSize: "12" }
};

function exportProgressPercent(completed, total) {
  return total > 0 ? Math.max(0, Math.min(100, completed / total * 100)) : 0;
}

const AUDIO_PRESETS = {
  clean: { audioVolume: "1", audioBandwidth: "18000", audioHiss: "0", audioDrive: "0", audioWow: "0", audioReverb: "0" },
  crt: { audioVolume: "0.92", audioBandwidth: "6000", audioHiss: "0.025", audioDrive: "0.08", audioWow: "0.01", audioReverb: "0.16" },
  vhs: { audioVolume: "0.95", audioBandwidth: "9000", audioHiss: "0.055", audioDrive: "0.16", audioWow: "0.035", audioReverb: "0.08" },
  worn: { audioVolume: "0.88", audioBandwidth: "4200", audioHiss: "0.11", audioDrive: "0.28", audioWow: "0.075", audioReverb: "0.22" }
};

function collectConfig() {
  const config = {};
  Object.keys(controls).forEach((key) => {
    config[key] = controls[key].type === "checkbox"
      ? (controls[key].checked ? "1" : "0")
      : controls[key].value;
  });
  config.previewSettings = {};
  for (const id of ['previewMode', 'previewQuality', 'autoEncodedPreview', 'audioAuditionInput']) {
    const control = document.getElementById(id);
    config.previewSettings[id] = control.type === 'checkbox' ? control.checked : control.value;
  }
  config.previewSettings.playbackVolume = sourceVideo.volume;
  return config;
}

function applyConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Invalid configuration');
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    if (!controls[key]) return;
    const nextValue = config[key] ?? DEFAULT_CONFIG[key];
    if (controls[key].type === "checkbox") {
      controls[key].checked = nextValue === "1" || nextValue === 1 || nextValue === true || nextValue === "true";
    } else {
      controls[key].value = nextValue;
    }
  });
  const preview = config.previewSettings;
  if (preview && typeof preview === 'object') {
    const options = { previewMode:['effect','encoded'], previewQuality:['fine','smooth'], audioAuditionInput:['original','processed'] };
    for (const [id, allowed] of Object.entries(options)) {
      if (allowed.includes(preview[id])) document.getElementById(id).value = preview[id];
    }
    if (typeof preview.autoEncodedPreview === 'boolean') document.getElementById('autoEncodedPreview').checked = preview.autoEncodedPreview;
    if (typeof preview.playbackVolume === 'number' && Number.isFinite(preview.playbackVolume)) setPlaybackVolume(preview.playbackVolume);
    enableAudioAudition();
  }
  updateLabels();
  document.dispatchEvent(new Event('crt-config-applied'));
}

function downloadConfig() {
  const blob = new Blob([JSON.stringify(collectConfig(), null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crt-multipass-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

const PRESET_LIBRARY = {
  "soft-analog-video": {
    "imageFit": "contain",
    "effectBoundary": "source",
    "imageOpacity": "1",
    "imagePosX": "50",
    "imagePosY": "50",
    "pixelate": "0",
    "rgbOpacity": "0",
    "rgbRedBias": "1",
    "rgbGreenBias": "1",
    "rgbBlueBias": "1",
    "rgbPeriod": "1",
    "rgbBlurX": "3.34",
    "rgbBlurY": "2.92",
    "maskOpacity": "0",
    "maskX": "0",
    "maskY": "0",
    "maskBlurX": "3.53",
    "maskBlurY": "3.59",
    "warpDirection": "barrel",
    "scale": "38",
    "mapZoom": "0.3",
    "warpBlurX": "3.94",
    "warpBlurY": "1.94",
    "flickerAmount": "0",
    "flickerSpeed": "30",
    "vignette": "0",
    "vignetteInner": "55",
    "vignetteOuter": "120",
    "beamBlend": "color-dodge",
    "beamOpacity": "0",
    "beamHeight": "272",
    "beamSpeed": "20.5",
    "glowOpacity": "0.16",
    "glowBlurX": "13.2",
    "glowBlurY": "3",
    "brightness": "0.81",
    "contrast": "1",
    "finalSaturation": "1.04",
    "imageBlurX": "2.42",
    "imageBlurY": "0",
    "vhsNoise": "0.05",
    "vhsJitter": "0.1",
    "vhsLineWeave": "0.2",
    "vhsTracking": "0",
    "vhsChromaBleed": "23.2",
    "vhsThickRinging": "1",
    "vhsSharpen": "1.13",
    "vhsSharpenWidth": "4.1",
    "vhsInterlace": "0",
    "vhsHeadSwitch": "0",
    "vhsDropout": "0",
    "chromaOffsetX": "11.76",
    "chromaOffsetY": "-0.5",
    "chromaSoftness": "0",
    "audioPreset": "crt",
    "audioVolume": "0.92",
    "audioBandwidth": "6000",
    "audioHiss": "0.025",
    "audioDrive": "0.06",
    "audioWow": "0",
    "audioReverb": "0.1",
    "exportPixelSize": "0",
    "exportFps": "24",
    "exportBitrate": "10",
    "exportScale": "1",
    "exportFormat": "mp4"
  },
  "default": DEFAULT_CONFIG,
  "soft-crt": {
    ...DEFAULT_CONFIG,
    imageBlurX: "0.35",
    imageBlurY: "0.35",
    warpBlurX: "1.2",
    warpBlurY: "1.0",
    glowOpacity: "0.26",
    glowBlurX: "14",
    glowBlurY: "14",
    rgbOpacity: "0.30",
    vhsNoise: "0",
    vhsInterlace: "0"
  },
};

function setPresetStatus(message) {
  const translated = splitBilingual(message || "");
  message = translated ? translated[currentLang] : message;
  const el = document.getElementById("presetStatusText");
  if (el) {
    el.textContent = message || "";
    el.classList.toggle("is-active", Boolean(message));
  }
  document.getElementById("configStatusText").textContent = message || "";
}

function getUserPresets() {
  try {
    return JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function saveUserPresets(data) {
  localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(data));
}

function refreshUserPresetSelect() {
  const select = document.getElementById("userPresetSelect");
  const presets = getUserPresets();
  const names = Object.keys(presets);

  select.innerHTML = "";

  if (!names.length) {
    select.innerHTML = '<option value="">No saved presets / 暂无预设</option>';
    return;
  }

  names.sort().forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function sanitizePresetConfig(source) {
  const result = {};
  if (source.previewSettings && typeof source.previewSettings === 'object') result.previewSettings = { ...source.previewSettings };
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    result[key] = source[key] ?? DEFAULT_CONFIG[key];
  });
  return result;
}

function saveCurrentUserPreset() {
  const input = document.getElementById("userPresetNameInput");
  const name = input.value.trim();

  if (!name) {
    setPresetStatus("Please enter a preset name / 请输入预设名");
    return;
  }

  const presets = getUserPresets();
  presets[name] = sanitizePresetConfig(collectConfig());
  saveUserPresets(presets);
  refreshUserPresetSelect();
  document.getElementById("userPresetSelect").value = name;
  setPresetStatus(`Saved preset: ${name}`);
}

function loadSelectedUserPreset() {
  const name = document.getElementById("userPresetSelect").value;
  const presets = getUserPresets();
  if (!name || !presets[name]) {
    setPresetStatus("No preset selected / 未选择预设");
    return;
  }
  applyConfig(sanitizePresetConfig(presets[name]));
  setPresetStatus(`Loaded preset: ${name}`);
}

function deleteSelectedUserPreset() {
  const name = document.getElementById("userPresetSelect").value;
  const presets = getUserPresets();
  if (!name || !presets[name]) {
    setPresetStatus("No preset selected / 未选择预设");
    return;
  }
  delete presets[name];
  saveUserPresets(presets);
  refreshUserPresetSelect();
  setPresetStatus(`Deleted preset: ${name}`);
}

function applyBuiltInPreset() {
  const key = document.getElementById("builtInPresetSelect").value;
  const preset = PRESET_LIBRARY[key];
  if (!preset) return;
  const config = sanitizePresetConfig(preset);
  config.exportDuration = controls.exportDuration.value;
  delete config.previewSettings;
  applyConfig(config);
  setPresetStatus(key === "vhs" ? "Applied system preset: VHS / 已应用系统预设：VHS" : `Applied built-in preset: ${key}`);
}

// User-supplied looks; original clip durations are deliberately excluded.
Object.assign(PRESET_LIBRARY, {
  "worn-network-vhs": {
    "imageFit": "contain",
    "effectBoundary": "source",
    "imageOpacity": "1",
    "imagePosX": "50",
    "imagePosY": "50",
    "pixelate": "0",
    "rgbOpacity": "0",
    "rgbRedBias": "1",
    "rgbGreenBias": "1",
    "rgbBlueBias": "1",
    "rgbPeriod": "1",
    "rgbBlurX": "3.27",
    "rgbBlurY": "2.92",
    "maskOpacity": "0",
    "maskX": "0",
    "maskY": "0",
    "maskBlurX": "0",
    "maskBlurY": "3.59",
    "warpDirection": "barrel",
    "scale": "52",
    "mapZoom": "0.3",
    "warpBlurX": "0",
    "warpBlurY": "0",
    "flickerAmount": "0",
    "flickerSpeed": "30",
    "vignette": "0",
    "vignetteInner": "55",
    "vignetteOuter": "120",
    "beamBlend": "color-dodge",
    "beamOpacity": "0.29",
    "beamHeight": "272",
    "beamSpeed": "20.5",
    "glowOpacity": "0.49",
    "glowBlurX": "20.7",
    "glowBlurY": "17.5",
    "brightness": "1",
    "contrast": "1",
    "finalSaturation": "1.37",
    "imageBlurX": "0",
    "imageBlurY": "0",
    "vhsNoise": "0.19",
    "vhsJitter": "1.7",
    "vhsLineWeave": "0",
    "vhsTracking": "0",
    "vhsChromaBleed": "25.3",
    "vhsThickRinging": "1",
    "vhsSharpen": "2.84",
    "vhsSharpenWidth": "4",
    "vhsInterlace": "0",
    "vhsHeadSwitch": "0.2",
    "vhsDropout": "0",
    "chromaOffsetX": "9.4",
    "chromaOffsetY": "-23",
    "chromaSoftness": "0",
    "audioPreset": "crt",
    "audioVolume": "1",
    "audioBandwidth": "7900",
    "audioHiss": "0",
    "audioDrive": "0.08",
    "audioWow": "0",
    "audioReverb": "0",
    "exportPixelSize": "3",
    "exportFps": "24",
    "exportBitrate": "1",
    "exportScale": "0.5",
    "exportFormat": "mp4"
  },
  "glowing-pixel-crt": {
    "imageFit": "contain",
    "effectBoundary": "source",
    "imageOpacity": "1",
    "imagePosX": "50",
    "imagePosY": "50",
    "pixelate": "1",
    "rgbOpacity": "0.46",
    "rgbRedBias": "0.89",
    "rgbGreenBias": "1.03",
    "rgbBlueBias": "1",
    "rgbPeriod": "6",
    "rgbBlurX": "2",
    "rgbBlurY": "0",
    "maskOpacity": "0.43",
    "maskX": "1",
    "maskY": "1",
    "maskBlurX": "2.94",
    "maskBlurY": "2.9",
    "warpDirection": "barrel",
    "scale": "61",
    "mapZoom": "0.3",
    "warpBlurX": "1",
    "warpBlurY": "0",
    "flickerAmount": "0.1",
    "flickerSpeed": "30",
    "vignette": "0",
    "vignetteInner": "55",
    "vignetteOuter": "117",
    "beamBlend": "color-dodge",
    "beamOpacity": "0.57",
    "beamHeight": "272",
    "beamSpeed": "6.5",
    "glowOpacity": "0.66",
    "glowBlurX": "35.3",
    "glowBlurY": "16.5",
    "brightness": "1",
    "contrast": "1.51",
    "finalSaturation": "1",
    "imageBlurX": "0",
    "imageBlurY": "0",
    "vhsNoise": "0",
    "vhsJitter": "0",
    "vhsLineWeave": "0",
    "vhsTracking": "0",
    "vhsChromaBleed": "0",
    "vhsThickRinging": "0",
    "vhsSharpen": "0",
    "vhsSharpenWidth": "2",
    "vhsInterlace": "0",
    "vhsHeadSwitch": "0",
    "vhsDropout": "0",
    "chromaOffsetX": "0",
    "chromaOffsetY": "0",
    "chromaSoftness": "2.5",
    "audioPreset": "clean",
    "audioVolume": "1",
    "audioBandwidth": "18000",
    "audioHiss": "0",
    "audioDrive": "0",
    "audioWow": "0",
    "audioReverb": "0",
    "exportPixelSize": "0",
    "exportFps": "30",
    "exportBitrate": "50",
    "exportScale": "1",
    "exportFormat": "mp4",
    "previewSettings": {
      "previewMode": "encoded",
      "previewQuality": "fine",
      "autoEncodedPreview": true,
      "audioAuditionInput": "original",
      "playbackVolume": 1
    }
  }
});
