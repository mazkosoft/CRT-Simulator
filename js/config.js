// Defaults, presets and configuration persistence.
// Classic scripts share scope; load config.js, crt.js, controls.js in this order.
const STORAGE_KEY = "crt-media-multipass-webgl-vhs-export-presets-v1";
const PANEL_STATE_KEY = "crt-media-panel-collapsed-v1";
const USER_PRESETS_KEY = "crt-media-user-presets-v1";

const DEFAULT_CONFIG = {
  "imageFit": "contain",
  "imageOpacity": "1",
  "imagePosX": "50",
  "imagePosY": "50",
  "imageBlurX": "0",
  "imageBlurY": "0",
  "warpDirection": "barrel",
  "scale": "80",
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
  "exportScale": "1.5",
  "exportFormat": "mp4",
  "effectBoundary": "source",
  "audioPreset": "clean",
  "audioVolume": "1",
  "audioChannels": "stereo",
  "audioBandwidth": "18000",
  "audioHiss": "0",
  "audioDrive": "0",
  "audioWow": "0",
  "audioReverb": "0"
};

const AUDIO_PRESETS = {
  clean: { audioVolume: "1", audioChannels: "stereo", audioBandwidth: "18000", audioHiss: "0", audioDrive: "0", audioWow: "0", audioReverb: "0" },
  crt: { audioVolume: "0.92", audioChannels: "mono", audioBandwidth: "6000", audioHiss: "0.025", audioDrive: "0.08", audioWow: "0.01", audioReverb: "0.16" },
  vhs: { audioVolume: "0.95", audioChannels: "narrow", audioBandwidth: "9000", audioHiss: "0.055", audioDrive: "0.16", audioWow: "0.035", audioReverb: "0.08" },
  worn: { audioVolume: "0.88", audioChannels: "mono", audioBandwidth: "4200", audioHiss: "0.11", audioDrive: "0.28", audioWow: "0.075", audioReverb: "0.22" }
};

function collectConfig() {
  const config = {};
  Object.keys(controls).forEach((key) => {
    config[key] = controls[key].type === "checkbox"
      ? (controls[key].checked ? "1" : "0")
      : controls[key].value;
  });
  return config;
}

function applyConfig(config) {
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    if (!controls[key]) return;
    const nextValue = config[key] ?? DEFAULT_CONFIG[key];
    if (controls[key].type === "checkbox") {
      controls[key].checked = nextValue === "1" || nextValue === 1 || nextValue === true || nextValue === "true";
    } else {
      controls[key].value = nextValue;
    }
  });
  updateLabels();
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
  "clean-vhs": {
    ...DEFAULT_CONFIG,
    vhsNoise: "0.06",
    vhsJitter: "5.0",
    vhsTracking: "0.10",
    vhsChromaBleed: "8.0",
    vhsLineWeave: "2.0",
    chromaSoftness: "10",
    vhsSharpen: "1.35",
    vhsSharpenWidth: "2.0",
    vhsThickRinging: "1",
    vhsInterlace: "0.18",
    vhsHeadSwitch: "0.08",
    vhsDropout: "0.05"
  },
  "vhs": {
          "exportDuration": "6",
          "exportFps": "30",
          "imageFit": "contain",
          "imageOpacity": "1",
          "imagePosX": "50",
          "imagePosY": "50",
          "pixelate": "0",
          "imageBlurX": "7.29",
          "imageBlurY": "2.91",
          "finalSaturation": "1.04",
          "warpDirection": "barrel",
          "scale": "80",
          "mapZoom": "0.3",
          "warpBlurX": "7.5",
          "warpBlurY": "0",
          "brightness": "1",
          "contrast": "1.46",
          "flickerAmount": "0.07",
          "flickerSpeed": "30",
          "vignette": "1",
          "vignetteInner": "55",
          "vignetteOuter": "120",
          "rgbOpacity": "0.54",
          "rgbRedBias": "1",
          "rgbGreenBias": "1",
          "rgbBlueBias": "1",
          "rgbPeriod": "6",
          "rgbBlurX": "3.08",
          "rgbBlurY": "2.92",
          "maskOpacity": "0.43",
          "maskX": "2",
          "maskY": "2",
          "maskBlurX": "3.53",
          "maskBlurY": "3.59",
          "beamBlend": "color-dodge",
          "beamOpacity": "0.29",
          "beamHeight": "272",
          "beamSpeed": "20.5",
          "glowOpacity": "0.4",
          "glowBlurX": "16.9",
          "glowBlurY": "17.5",
          "vhsNoise": "0.21",
          "vhsJitter": "4.2",
          "vhsLineWeave": "1.1",
          "vhsTracking": "0.59",
          "vhsChromaBleed": "20.5",
          "vhsThickRinging": "0",
          "vhsSharpen": "2",
          "vhsSharpenWidth": "7.85",
          "vhsInterlace": "0",
          "vhsHeadSwitch": "0",
          "vhsDropout": "0",
          "chromaOffsetX": "18.38",
          "chromaOffsetY": "-11.88",
          "chromaSoftness": "0"
  },
  "damaged-vhs": {
    ...DEFAULT_CONFIG,
    vhsNoise: "0.16",
    vhsJitter: "18.0",
    vhsTracking: "0.22",
    vhsChromaBleed: "18.0",
    vhsLineWeave: "6.0",
    chromaOffsetX: "2.5",
    chromaSoftness: "18",
    vhsSharpen: "0.42",
    vhsInterlace: "0.34",
    vhsHeadSwitch: "0.36",
    vhsDropout: "0.28"
  },
  "vaporwave": {
    ...DEFAULT_CONFIG,
    finalSaturation: "1.45",
    rgbRedBias: "1.18",
    rgbGreenBias: "0.92",
    rgbBlueBias: "1.28",
    vhsChromaBleed: "12.0",
    chromaOffsetX: "1.5",
    chromaSoftness: "12",
    vhsNoise: "0.05",
    glowOpacity: "0.34"
  }
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
  applyConfig(sanitizePresetConfig(preset));
  setPresetStatus(key === "vhs" ? "Applied system preset: VHS / 已应用系统预设：VHS" : `Applied built-in preset: ${key}`);
}
