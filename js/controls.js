// UI bindings, localization, transport and application startup.
// Classic scripts share scope; load config.js, crt.js, controls.js in this order.
function updateLabels() {
  labels.imageFit.textContent = val("imageFit");
  labels.imageOpacity.textContent = num("imageOpacity").toFixed(2);
  labels.imagePosX.textContent = `${val("imagePosX")}%`;
  labels.imagePosY.textContent = `${val("imagePosY")}%`;
  labels.imageBlurX.textContent = num("imageBlurX").toFixed(2);
  labels.imageBlurY.textContent = num("imageBlurY").toFixed(2);
  labels.pixelate.textContent = num("pixelate").toFixed(2);
  labels.exportDuration.textContent = `${Number(num("exportDuration").toFixed(3))}s`;
  labels.exportFps.textContent = `${Math.round(num("exportFps"))}fps`;
  labels.exportBitrate.textContent = `${Number(num("exportBitrate").toFixed(2))}Mbps`;
  labels.exportScale.textContent = `${num("exportScale").toFixed(2)}x`;
  document.getElementById("exportPixelSizeValue").textContent = `${num("exportPixelSize")}px`;
  const quality = document.getElementById("exportQualityPreset");
  const match = Object.entries(EXPORT_QUALITY_PRESETS).find(([, preset]) =>
    Object.keys(preset).every(key => Number(controls[key].value) === Number(preset[key])));
  quality.value = match ? match[0] : "custom";
  labels.audioVolume.textContent = num("audioVolume").toFixed(2);
  labels.audioBandwidth.textContent = `${Math.round(num("audioBandwidth"))}Hz`;
  labels.audioHiss.textContent = num("audioHiss").toFixed(2);
  labels.audioDrive.textContent = num("audioDrive").toFixed(2);
  labels.audioWow.textContent = num("audioWow").toFixed(2);
  labels.audioReverb.textContent = num("audioReverb").toFixed(2);

  labels.warpDirection.textContent = val("warpDirection");
  labels.scale.textContent = val("scale");
  labels.mapZoom.textContent = num("mapZoom").toFixed(2);
  labels.warpBlurX.textContent = num("warpBlurX").toFixed(2);
  labels.warpBlurY.textContent = num("warpBlurY").toFixed(2);
  labels.brightness.textContent = num("brightness").toFixed(2);
  labels.contrast.textContent = num("contrast").toFixed(2);
  labels.flickerAmount.textContent = num("flickerAmount").toFixed(2);
  labels.flickerSpeed.textContent = num("flickerSpeed").toFixed(2);

  labels.rgbOpacity.textContent = num("rgbOpacity").toFixed(2);
  labels.rgbRedBias.textContent = num("rgbRedBias").toFixed(2);
  labels.rgbGreenBias.textContent = num("rgbGreenBias").toFixed(2);
  labels.rgbBlueBias.textContent = num("rgbBlueBias").toFixed(2);
  labels.rgbPeriod.textContent = `${val("rgbPeriod")}px`;
  labels.rgbBlurX.textContent = num("rgbBlurX").toFixed(2);
  labels.rgbBlurY.textContent = num("rgbBlurY").toFixed(2);
  labels.chromaOffsetX.textContent = num("chromaOffsetX").toFixed(2);
  labels.chromaOffsetY.textContent = num("chromaOffsetY").toFixed(2);
  labels.chromaSoftness.textContent = num("chromaSoftness").toFixed(2);

  labels.maskOpacity.textContent = num("maskOpacity").toFixed(2);
  labels.maskX.textContent = `${Math.min(num("maskX"), num("rgbPeriod") - 1)}px`;
  labels.maskY.textContent = `${Math.min(num("maskY"), num("rgbPeriod") - 1)}px`;
  labels.maskBlurX.textContent = num("maskBlurX").toFixed(2);
  labels.maskBlurY.textContent = num("maskBlurY").toFixed(2);

  labels.beamBlend.textContent = val("beamBlend");
  labels.beamOpacity.textContent = num("beamOpacity").toFixed(2);
  labels.beamHeight.textContent = `${val("beamHeight")}px`;
  labels.beamSpeed.textContent = `${num("beamSpeed").toFixed(1)}s`;

  labels.glowOpacity.textContent = num("glowOpacity").toFixed(2);
  labels.glowBlurX.textContent = num("glowBlurX").toFixed(2);
  labels.glowBlurY.textContent = num("glowBlurY").toFixed(2);
  labels.finalSaturation.textContent = num("finalSaturation").toFixed(2);

  labels.vhsNoise.textContent = num("vhsNoise").toFixed(2);
  labels.vhsJitter.textContent = num("vhsJitter").toFixed(1);
  labels.vhsLineWeave.textContent = num("vhsLineWeave").toFixed(1);
  labels.vhsTracking.textContent = num("vhsTracking").toFixed(2);
  labels.vhsChromaBleed.textContent = num("vhsChromaBleed").toFixed(1);
  labels.vhsThickRinging.textContent = num("vhsThickRinging") > 0.5 ? (currentLang === "zh" ? "开" : "On") : (currentLang === "zh" ? "关" : "Off");
  labels.vhsSharpen.textContent = num("vhsSharpen").toFixed(2);
  labels.vhsSharpenWidth.textContent = num("vhsSharpenWidth").toFixed(2);
  labels.vhsInterlace.textContent = num("vhsInterlace").toFixed(2);
  labels.vhsHeadSwitch.textContent = num("vhsHeadSwitch").toFixed(2);
  labels.vhsDropout.textContent = num("vhsDropout").toFixed(2);

  labels.vignette.textContent = num("vignette").toFixed(2);
  labels.vignetteInner.textContent = `${val("vignetteInner")}%`;
  labels.vignetteOuter.textContent = `${val("vignetteOuter")}%`;
  document.querySelectorAll(".parameter-value-input").forEach(input => {
    if (document.activeElement !== input) input.value = controls[input.dataset.rangeKey].value;
  });
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateLabels);
  control.addEventListener("change", updateLabels);
});

document.getElementById("exportQualityPreset").addEventListener("change", event => {
  const preset = EXPORT_QUALITY_PRESETS[event.target.value];
  if (!preset) return;
  for (const key of ["exportScale", "exportFps", "exportBitrate", "exportPixelSize"]) controls[key].value = preset[key];
  updateLabels();
});
for (const key of ["exportScale", "exportFps", "exportBitrate", "exportPixelSize"]) {
  controls[key].addEventListener("input", () => { document.getElementById("exportQualityPreset").value = "custom"; });
}

Object.entries(controls).filter(([, control]) => control.type === "range").forEach(([key, range]) => {
  const title = range.parentElement.querySelector("label span:first-child");
  const row = document.createElement("div");
  row.className = "parameter-stepper";
  const minus = document.createElement("button");
  const plus = document.createElement("button");
  const input = document.createElement("input");
  minus.type = plus.type = "button";
  minus.textContent = "−"; plus.textContent = "+";
  input.type = "number"; input.inputMode = "decimal";
  input.min = range.min; input.max = range.max; input.step = range.step;
  input.value = range.value; input.dataset.rangeKey = key;
  input.className = "parameter-value-input";
  range.setAttribute("aria-label", title?.textContent || key);
  const commit = () => {
    if (input.value.trim() === "" || !Number.isFinite(Number(input.value))) { input.value = range.value; return; }
    range.value = input.value;
    input.value = range.value;
    range.dispatchEvent(new Event("input", { bubbles:true }));
  };
  input.addEventListener("change", commit);
  input.addEventListener("keydown", event => { if (event.key === "Enter") { commit(); input.blur(); } });
  for (const [button, direction] of [[minus,-1],[plus,1]]) {
    button.dataset.stepDirection = String(direction);
    button.dataset.rangeKey = key;
    button.addEventListener("click", () => {
      if (range.step === "any") range.value = String(Number(range.value) + direction * 0.5);
      else direction > 0 ? range.stepUp() : range.stepDown();
      input.value = range.value; range.dispatchEvent(new Event("input", { bubbles:true }));
    });
  }
  row.append(minus, input, plus);
  range.insertAdjacentElement("afterend", row);
});

controls.audioPreset.addEventListener("change", () => {
  const preset = AUDIO_PRESETS[val("audioPreset")];
  if (!preset) return;
  Object.entries(preset).forEach(([key, value]) => {
    if (controls[key]) controls[key].value = value;
  });
  updateLabels();
});

document.getElementById("exportConfigButton").addEventListener("click", downloadConfig);

document.getElementById("importConfigButton").addEventListener("click", () => {
  document.getElementById("configUpload").click();
});

document.getElementById("configUpload").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyConfig(JSON.parse(reader.result));
      setPresetStatus("Configuration imported / 已导入配置");
    } catch (error) {
      console.warn("Config import failed:", error);
      setPresetStatus("Invalid configuration file / 配置文件无效");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
});

document.getElementById("saveLocalButton").addEventListener("click", () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectConfig()));
    setPresetStatus("Configuration saved locally / 已保存到本地");
  } catch (error) {
    setPresetStatus("Local storage unavailable / 本地存储不可用");
  }
});

document.getElementById("loadLocalButton").addEventListener("click", () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { setPresetStatus("No local configuration / 尚无本地配置"); return; }
  try {
    applyConfig(JSON.parse(raw));
    setPresetStatus("Local configuration loaded / 已读取本地配置");
  } catch (error) {
    console.warn("Local config failed:", error);
  }
});

document.getElementById("resetConfigButton").addEventListener("click", () => {
  applyConfig(DEFAULT_CONFIG);
  setPresetStatus("Reset to default settings / 已恢复默认参数");
});



function normalizePlaybackVolume(value) {
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(1, value)) * 100) / 100 : 1;
}
function setPlaybackVolume(value) {
  sourceVideo.volume = normalizePlaybackVolume(value);
  const percent = Math.round(sourceVideo.volume * 100);
  const knob = document.getElementById("playbackVolumeKnob");
  knob.setAttribute("aria-valuenow", String(percent));
  knob.setAttribute("aria-valuetext", `${percent}%`);
  knob.style.setProperty("--dial-angle", `${-135 + percent * 2.7}deg`);
  document.getElementById("playbackVolumeValue").textContent = `${percent}%`;
}
function syncPlaybackControls() {
  const playing = currentMediaType === "video" && !sourceVideo.paused;
  const play = document.getElementById("monitorPlayButton");
  play.classList.toggle("is-playing", playing);
  play.setAttribute("aria-label", currentLang === "zh" ? (playing ? "暂停" : "播放") : (playing ? "Pause" : "Play"));
  document.getElementById("playbackLabel").textContent = currentLang === "zh" ? (playing ? "暂停" : "播放") : (playing ? "Pause" : "Play");
  play.disabled = currentMediaType !== "video";
  syncPlaybackProgress();
  if (currentMediaType !== "video") document.getElementById("playbackStatusText").hidden = true;
}
function startPlayback() {
  const status = document.getElementById("playbackStatusText");
  sourceVideo.play().then(() => { status.hidden = true; }).catch(() => {
    status.hidden = false;
    status.textContent = currentLang === "zh" ? "请按播放按钮启用有声播放。" : "Press Play to enable playback with sound.";
  });
}
for (const name of ["play", "pause", "volumechange", "ended"]) sourceVideo.addEventListener(name, syncPlaybackControls);
document.getElementById("monitorPlayButton").addEventListener("click", () => document.getElementById("playPauseButton").click());
function formatPlaybackTime(seconds) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;
}
function syncPlaybackProgress() {
  const progress = document.getElementById("playbackProgress");
  const available = currentMediaType === "video" && Number.isFinite(sourceVideo.duration) && sourceVideo.duration > 0;
  progress.disabled = !available || exportInProgress;
  progress.max = available ? sourceVideo.duration : 1;
  progress.value = available ? sourceVideo.currentTime : 0;
  progress.setAttribute("aria-valuetext", `${formatPlaybackTime(available ? sourceVideo.currentTime : 0)} / ${formatPlaybackTime(available ? sourceVideo.duration : 0)}`);
  document.getElementById("playbackCurrentTime").textContent = formatPlaybackTime(available ? sourceVideo.currentTime : 0);
  document.getElementById("playbackDuration").textContent = formatPlaybackTime(available ? sourceVideo.duration : 0);
}
const progressControl = document.getElementById("playbackProgress");
progressControl.addEventListener("pointerdown", () => { if (!progressControl.disabled) sourceVideo.pause(); });
progressControl.addEventListener("input", () => {
  if (currentMediaType !== "video" || exportInProgress || !Number.isFinite(sourceVideo.duration)) { syncPlaybackProgress(); return; }
  sourceVideo.pause();
  sourceVideo.currentTime = Math.max(0, Math.min(sourceVideo.duration, Number(progressControl.value)));
  syncPlaybackProgress();
});
for (const name of ["timeupdate", "loadedmetadata", "durationchange", "seeked", "emptied"]) sourceVideo.addEventListener(name, syncPlaybackProgress);
const volumeKnob = document.getElementById("playbackVolumeKnob");
for (let i = 0; i <= 10; i++) {
  const tick = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tick.setAttribute("d", i % 5 === 0 ? "M38 3v7" : "M38 3v4");
  tick.setAttribute("transform", `rotate(${-135 + i * 27} 38 38)`);
  document.getElementById("volumeTicks").append(tick);
}
let volumeDrag = null;
volumeKnob.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button !== 0) return;
  volumeDrag = { id:event.pointerId, x:event.clientX, y:event.clientY, value:sourceVideo.volume };
  volumeKnob.setPointerCapture(event.pointerId);
  volumeKnob.focus();
});
volumeKnob.addEventListener("pointermove", event => {
  if (volumeDrag?.id !== event.pointerId) return;
  setPlaybackVolume(volumeDrag.value + (event.clientX - volumeDrag.x + volumeDrag.y - event.clientY) / 160);
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) volumeKnob.addEventListener(name, () => { volumeDrag = null; });
volumeKnob.addEventListener("wheel", event => {
  event.preventDefault();
  setPlaybackVolume(sourceVideo.volume + (event.deltaY < 0 ? 0.05 : -0.05));
}, { passive:false });
volumeKnob.addEventListener("keydown", event => {
  const steps = { ArrowUp:0.01, ArrowRight:0.01, ArrowDown:-0.01, ArrowLeft:-0.01, PageUp:0.1, PageDown:-0.1 };
  if (!(event.key in steps) && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  setPlaybackVolume(event.key === "Home" ? 0 : event.key === "End" ? 1 : sourceVideo.volume + steps[event.key]);
});
setPlaybackVolume(1);

document.getElementById("playPauseButton").addEventListener("click", () => {
  if (currentMediaType !== "video") return;
  if (sourceVideo.paused) {
    startPlayback();
  } else {
    sourceVideo.pause();
  }
});

document.getElementById("restartVideoButton").addEventListener("click", () => {
  if (currentMediaType !== "video") return;
  sourceVideo.currentTime = 0;
  startPlayback();
});



function splitBilingual(htmlText) {
  const normalized = htmlText.trim();
  const brMatch = normalized.match(/^(.*?)<br\s*\/?>(.*)$/i);
  if (brMatch) {
    return {
      en: brMatch[1].trim(),
      zh: brMatch[2].trim()
    };
  }

  const textOnly = normalized.replace(/<[^>]+>/g, "");
  const parts = textOnly.split(" / ");

  if (parts.length >= 2) {
    return {
      en: parts.slice(0, -1).join(" / ").trim(),
      zh: parts[parts.length - 1].trim()
    };
  }

  return null;
}

function prepareI18nElement(el) {
  if (el.dataset.i18nReady === "1") return;
  const split = splitBilingual(el.innerHTML);
  if (!split) return;

  el.dataset.i18nReady = "1";
  el.dataset.i18nEn = split.en;
  el.dataset.i18nZh = split.zh;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.lang = lang;
  try { localStorage.setItem("crt-ui-lang", lang); } catch { /* Language switching still works without persistence. */ }

  document.querySelectorAll(
    ".control-group summary, .control label span:first-child, .control-panel button, .control-panel h2, .control-panel option"
  ).forEach((el) => {
    if (el.id === "languageToggleButton") return;
    prepareI18nElement(el);
    if (el.dataset.i18nReady === "1") {
      el.innerHTML = lang === "zh" ? el.dataset.i18nZh : el.dataset.i18nEn;
    }
  });

  updateLabels();
  document.querySelectorAll("[data-i18n-zh][data-i18n-en]").forEach(el => {
    el.textContent = lang === "zh" ? el.dataset.i18nZh : el.dataset.i18nEn;
  });
  document.getElementById("aboutGuideLink").href = `https://github.com/mazkosoft/CRT-Simulator#${lang === "zh" ? "简体中文" : "english"}`;
  document.getElementById("languageLabel").textContent = lang === "zh" ? "语言" : "Language";
  document.getElementById("languageToggleButton").setAttribute("aria-label", lang === "zh" ? "切换为英文" : "Switch to Chinese");
  document.getElementById("dosCaption").textContent = lang === "zh" ? "本地媒体处理控制台" : "LOCAL MEDIA PROCESSING CONSOLE";
  document.querySelector(".control-panel h2").textContent = lang === "zh" ? "显像控制台" : "CRT CONTROL";
  document.getElementById("powerButton").setAttribute("aria-label", lang === "zh" ? "显示器电源" : "Monitor power");
  document.getElementById("diskLabel").textContent = lang === "zh" ? "配置" : "Config";
  document.getElementById("diskSaveButton").setAttribute("aria-label", lang === "zh" ? "配置管理" : "Configuration");
  document.getElementById("volumeLabel").textContent = lang === "zh" ? "音量" : "Volume";
  document.getElementById("playbackProgress").setAttribute("aria-label", lang === "zh" ? "播放进度" : "Playback position");
  document.getElementById("playbackVolumeKnob").setAttribute("aria-label", lang === "zh" ? "播放音量" : "Playback volume");
  syncPlaybackControls();
  document.getElementById("fullscreenLabel").textContent = lang === "zh" ? "放大查看" : "View";
  document.getElementById("fullscreenPreview").setAttribute("aria-label", lang === "zh" ? "放大查看" : "Fullscreen view");
  document.getElementById("exitFullscreenPreview").textContent = lang === "zh" ? "退出全屏" : "Exit fullscreen";
  document.getElementById("previewQualityLabel").textContent = lang === "zh" ? "预览模式" : "Preview mode";
  document.querySelector('#previewQuality option[value="fine"]').textContent = lang === "zh" ? "精细" : "Fine";
  document.querySelector('#previewQuality option[value="smooth"]').textContent = lang === "zh" ? "流畅" : "Smooth";
  document.querySelectorAll(".parameter-stepper").forEach(row => {
    const range = controls[row.querySelector("input").dataset.rangeKey];
    const title = range.parentElement.querySelector("label span:first-child")?.textContent || range.dataset.config;
    range.setAttribute("aria-label", title);
    row.querySelector("input").setAttribute("aria-label", title);
    row.querySelector('[data-step-direction="-1"]').setAttribute("aria-label", `${lang === "zh" ? "减少" : "Decrease"} ${title}`);
    row.querySelector('[data-step-direction="1"]').setAttribute("aria-label", `${lang === "zh" ? "增加" : "Increase"} ${title}`);
  });
}

applyLanguage("zh");
document.getElementById("languageToggleButton").addEventListener("click", () => {
  applyLanguage(currentLang === "zh" ? "en" : "zh");
});


document.getElementById("applyBuiltInPresetButton").addEventListener("click", applyBuiltInPreset);
document.getElementById("saveUserPresetButton").addEventListener("click", saveCurrentUserPreset);
document.getElementById("loadUserPresetButton").addEventListener("click", loadSelectedUserPreset);
document.getElementById("deleteUserPresetButton").addEventListener("click", deleteSelectedUserPreset);
document.getElementById("downloadImageButton").addEventListener("click", downloadCurrentFrame);
document.getElementById("downloadVideoButton").addEventListener("click", downloadHighQualityVideo);
const configDialog = document.getElementById("configDialog");
document.getElementById("diskSaveButton").addEventListener("click", () => configDialog.showModal());
document.getElementById("closeConfigDialog").addEventListener("click", () => configDialog.close());
configDialog.addEventListener("close", () => document.getElementById("diskSaveButton").focus());
const previewScreen = document.querySelector(".screen");
let previewZoom = 1;
let previewX = 0;
let previewY = 0;
const previewPointers = new Map();
let previewToolsTimer;
function showPreviewTools() {
  previewScreen.classList.remove("preview-tools-hidden");
  clearTimeout(previewToolsTimer);
  previewToolsTimer = setTimeout(() => {
    if (!previewScreen.querySelector(".preview-tools").contains(document.activeElement)) previewScreen.classList.add("preview-tools-hidden");
  }, 2400);
}
for (const eventName of ["pointermove", "pointerdown", "wheel", "keydown", "focusin"]) previewScreen.addEventListener(eventName, showPreviewTools);
document.getElementById("exitFullscreenPreview").addEventListener("click", async () => {
  if (document.fullscreenElement === previewScreen) await document.exitFullscreen();
  previewScreen.classList.remove("preview-expanded");
  syncPreviewFullscreen();
  document.getElementById("fullscreenPreview").focus();
});
function updatePreviewZoom(next) {
  previewZoom = Math.max(1, Math.min(8, next));
  if (previewZoom === 1) previewX = previewY = 0;
  canvas.style.transform = `translate(${previewX}px, ${previewY}px) scale(${previewZoom})`;
  document.getElementById("zoomResetPreview").textContent = `${Math.round(previewZoom * 100)}%`;
}
document.getElementById("fullscreenPreview").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === previewScreen) await document.exitFullscreen();
    else if (previewScreen.requestFullscreen) await previewScreen.requestFullscreen();
    else previewScreen.classList.toggle("preview-expanded");
  } catch (error) {
    previewScreen.classList.toggle("preview-expanded");
  }
  syncPreviewFullscreen();
});
document.getElementById("zoomInPreview").addEventListener("click", () => updatePreviewZoom(previewZoom * 1.25));
document.getElementById("zoomOutPreview").addEventListener("click", () => updatePreviewZoom(previewZoom / 1.25));
document.getElementById("zoomResetPreview").addEventListener("click", () => updatePreviewZoom(1));
function syncPreviewFullscreen() {
  updatePreviewZoom(1);
  showPreviewTools();
}
document.addEventListener("fullscreenchange", syncPreviewFullscreen);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { previewScreen.classList.remove("preview-expanded"); syncPreviewFullscreen(); }
});
previewScreen.addEventListener("wheel", event => {
  if (document.fullscreenElement !== previewScreen && !previewScreen.classList.contains("preview-expanded")) return;
  event.preventDefault();
  updatePreviewZoom(previewZoom * Math.exp(-event.deltaY * 0.002));
}, { passive:false });
previewScreen.addEventListener("pointerdown", event => {
  if (event.target.closest("button") || (document.fullscreenElement !== previewScreen && !previewScreen.classList.contains("preview-expanded"))) return;
  previewPointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
  previewScreen.setPointerCapture(event.pointerId);
});
previewScreen.addEventListener("pointermove", event => {
  const previous = previewPointers.get(event.pointerId);
  if (!previous) return;
  const other = [...previewPointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
  if (other) {
    const before = Math.hypot(previous.x - other.x, previous.y - other.y);
    const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
    if (before > 0) updatePreviewZoom(previewZoom * after / before);
  } else if (previewZoom > 1) {
    previewX += event.clientX - previous.x;
    previewY += event.clientY - previous.y;
    updatePreviewZoom(previewZoom);
  }
  previewPointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
  previewScreen.addEventListener(name, event => previewPointers.delete(event.pointerId));
}
document.getElementById("powerButton").addEventListener("click", () => {
  const machine = document.querySelector(".machine");
  const off = machine.classList.toggle("machine-off");
  document.getElementById("powerButton").setAttribute("aria-pressed", String(!off));
  setPresetStatus(off ? "Monitor standby / 显示器已待机" : "Monitor on / 显示器已开启");
});

refreshUserPresetSelect();

document.querySelectorAll(".control-group").forEach(group => {
  const body = document.createElement("div");
  body.className = "group-body";
  while (group.children.length > 1) body.append(group.children[1]);
  group.append(body);
});

applyConfig(DEFAULT_CONFIG);
resetToDemo();
requestAnimationFrame(render);
