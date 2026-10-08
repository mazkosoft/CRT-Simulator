// All navigation uses the original inputs: no duplicate parameter state.
function matchesParameterSearch(text, query) {
  return query.trim().toLocaleLowerCase().split(/\s+/).every(token => text.toLocaleLowerCase().includes(token));
}
function parameterChanged(value, baseline) {
  return String(value) !== String(baseline) && !(value !== '' && baseline !== '' && Number(value) === Number(baseline));
}
if (typeof module !== 'undefined') module.exports = { matchesParameterSearch, parameterChanged };
if (typeof document !== 'undefined') initializeParameterNavigation();

function initializeParameterNavigation() {
  const panel = document.querySelector('aside.control-panel');
  const toolbar = document.getElementById('parameterToolbar');
  const texture=document.getElementById('textureGroup'),optics=document.getElementById('opticsGroup');
  for(const key of ['rgbOpacity','rgbRedBias','rgbGreenBias','rgbBlueBias','rgbBlurX','rgbBlurY','maskOpacity','maskX','maskY','maskBlurX','maskBlurY','flickerAmount','flickerSpeed','beamBlend','beamOpacity','beamHeight','beamSpeed'])texture.querySelector('.group-body').append(controls[key].closest('.control'));
  for(const key of ['warpDirection','scale','mapZoom','warpBlurX','warpBlurY','vignette','vignetteInner','vignetteOuter','glowOpacity','glowBlurX','glowBlurY'])optics.querySelector('.group-body').append(controls[key].closest('.control'));
  document.getElementById('displayGroup').hidden=true;
  for(const [id,zh,en] of [['phosphorGroup','像素分辨率','Pixel resolution'],['audioGroup','声音处理','Sound processing']]){const heading=document.getElementById(id).querySelector('summary');heading.dataset.i18nZh=zh;heading.dataset.i18nEn=en;heading.textContent=currentLang==='zh'?zh:en;}
  const groupOrder=['mediaGroup','presetsGroup','phosphorGroup','textureGroup','tapeGroup','opticsGroup','colorGroup','videoSettingsGroup','audioGroup','exportGroup','userGuideGroup','aboutGroup'];
  const groups = [...panel.querySelectorAll('.control-group')].filter(group=>group.id!=='displayGroup').sort((a,b)=>groupOrder.indexOf(a.id)-groupOrder.indexOf(b.id));
  const search = document.getElementById('parameterSearch');
  const status = document.getElementById('navigationStatus');
  const language=document.querySelector('.dos-tools');
  const header=language.parentElement;
  const mobile = matchMedia('(max-width:900px)');
  const pages = { media:['mediaGroup'], presets:['presetsGroup','mediaGroup'], adjust:['phosphorGroup','textureGroup','tapeGroup','opticsGroup','colorGroup'], export:['videoSettingsGroup','audioGroup','exportGroup'] };
  const common = new Set(['imageFit','effectBoundary','rgbPeriod','pixelate','rgbOpacity','maskOpacity','scale','glowOpacity','vignette','brightness','contrast','finalSaturation','vhsNoise','vhsJitter','vhsChromaBleed','audioVolume','audioBandwidth','audioHiss','audioReverb','exportScale','exportFps','exportBitrate','exportDuration','exportFormat','exportPixelSize']);
  const workspace = document.createElement('div'); workspace.className = 'workspace-body';
  const rail = document.createElement('nav'); rail.className = 'category-rail';
  const editor = document.createElement('div'); editor.className = 'workspace-editor';
  const strip = document.createElement('nav'); strip.className = 'parameter-strip';
  const parameterPicker=document.createElement('select'); parameterPicker.className = 'parameter-picker';
  strip.append(parameterPicker);
  const utilities=toolbar.querySelector('.workspace-utilities');
  const auxiliary=document.createElement('details');auxiliary.className='workspace-auxiliary';
  const auxiliaryTitle=document.createElement('summary');auxiliaryTitle.dataset.i18nZh='更多';auxiliaryTitle.dataset.i18nEn='More';
  utilities.before(auxiliary);auxiliary.append(auxiliaryTitle,utilities);
  let auxiliaryWasMobile=null;
  const content = document.createElement('div'); content.className = 'parameter-content';
  const empty = document.createElement('p'); empty.className = 'workspace-empty';
  workspace.append(rail,editor); editor.append(strip,content); content.append(...groups,empty);toolbar.after(workspace);
  const preview = panel.querySelector('.preview-console'); panel.append(preview);
  const disclosure = document.createElement('details'); disclosure.className = 'preview-options';
  const title = document.createElement('summary');title.dataset.i18nZh='预览设置';title.dataset.i18nEn='Preview settings';disclosure.append(title);
  const previewStatus=document.getElementById('encodedPreviewStatus'), info=document.getElementById('exportPreviewInfo');
  preview.prepend(previewStatus,info);
  disclosure.append(...[...preview.children].filter(el=>!['encodedPreviewStatus','exportPreviewInfo','previewExportButton','compareOriginalButton'].includes(el.id)));
  preview.append(disclosure);
  let page='presets', active='presetsGroup', selected='', baseline=collectConfig();
  let favorites=new Set();
  try {favorites=new Set(JSON.parse(localStorage.getItem('crt-favorite-parameters')||'[]').filter(key=>key in DEFAULT_CONFIG));}catch { /* Storage optional. */ }
  const entries=[...panel.querySelectorAll('[data-config]')].filter(input=>!input.dataset.config.endsWith('Enabled')).map(input=>({input,key:input.dataset.config,item:input.closest('.control'),group:input.closest('.control-group')}));
  const label=entry=>entry.item.querySelector('label span')?.textContent||entry.key;
  const value=entry=>entry.input.type==='checkbox'?(entry.input.checked?'1':'0'):entry.input.value;
  const changed=entry=>parameterChanged(value(entry),baseline[entry.key]);
  function button(zh,en,action) {
    const el=document.createElement('button');el.type='button';el.dataset.i18nZh=zh;el.dataset.i18nEn=en;
    el.textContent=currentLang==='zh'?zh:en;el.addEventListener('click',action);return el;
  }
  const modes=toolbar.querySelector('.workspace-modes');
  const mediaTab=button('媒体','Media',()=>{});mediaTab.dataset.page='media';mediaTab.className='mobile-media-tab';modes.prepend(mediaTab);
  modes.setAttribute('role','tablist');
  modes.setAttribute('aria-label',currentLang==='zh'?'操作面板':'Workspace');
  for(const tab of modes.children){tab.id=`workspace-tab-${tab.dataset.page}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','parameterWorkspace');}
  content.id='parameterWorkspace';content.setAttribute('role','tabpanel');
  modes.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...modes.children].filter(el=>mobile.matches||el!==mediaTab),index=tabs.indexOf(event.target);
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    event.preventDefault();tabs[next].focus();tabs[next].click();
  });
  parameterPicker.addEventListener('change',()=>{selected=parameterPicker.value;content.scrollTop=0;refresh();});
  const categoryButtons=new Map();
  for(const group of groups) {
    const summary=group.querySelector('summary');summary.addEventListener('click',event=>event.preventDefault());
    const btn=button(summary.dataset.i18nZh,summary.dataset.i18nEn,()=>{active=group.id;selected='';search.value='';content.scrollTop=0;refresh();});
    categoryButtons.set(group.id,btn);rail.append(btn);
    if(pages.adjust.includes(group.id)||['mediaGroup','videoSettingsGroup'].includes(group.id)) {
      const detail=document.createElement('details');detail.className='fine-settings';
      const heading=document.createElement('summary');heading.dataset.i18nZh='精细调整';heading.dataset.i18nEn='Fine adjustment';heading.textContent='精细调整';detail.append(heading);
      const body=document.createElement('div');body.className='fine-body';detail.append(body);
      for(const item of [...group.querySelector('.group-body').children]) {
        const input=item.querySelector('[data-config]');if(input&&!input.dataset.config.endsWith('Enabled')&&!common.has(input.dataset.config))body.append(item);
      }
      if(body.children.length)group.querySelector('.group-body').append(detail);
    }
  }
  const favoriteButton=button('常用','Favorites',()=>{active='favorites';selected='';search.value='';refresh();if(mobile.matches)auxiliary.open=false;});
  const modifiedButton=button('已修改','Modified',()=>{active='modified';selected='';search.value='';refresh();if(mobile.matches)auxiliary.open=false;});
  rail.prepend(favoriteButton,modifiedButton);
  rail.addEventListener('keydown',event=>{
    if(!mobile.matches||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...categoryButtons.values()].filter(tab=>!tab.hidden),index=tabs.indexOf(event.target);
    if(index<0)return;
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    event.preventDefault();tabs[next].click();tabs[next].focus();
  });
  for(const entry of entries) {
    const hints=[...entry.item.children].filter(el=>el.classList.contains('hint'));
    if(hints.length){
      const help=document.createElement('details');help.className='parameter-help';
      const heading=document.createElement('summary');heading.dataset.i18nZh='参数说明';heading.dataset.i18nEn='Parameter help';heading.textContent=currentLang==='zh'?'参数说明':'Parameter help';
      help.append(heading,...hints);entry.item.append(help);entry.help=help;
    }
    const tools=document.createElement('div');tools.className='parameter-tools';
    const star=button('☆','☆',()=>{
      favorites.has(entry.key)?favorites.delete(entry.key):favorites.add(entry.key);
      try {localStorage.setItem('crt-favorite-parameters',JSON.stringify([...favorites]));}catch { /* Optional. */ }
      refresh();
    });
    const reset=button('还原','Reset',()=>{
      if(entry.input.type==='checkbox')entry.input.checked=['1',1,true].includes(baseline[entry.key]);else entry.input.value=baseline[entry.key];
      entry.input.dispatchEvent(new Event('input',{bubbles:true}));entry.input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    tools.append(star,reset);entry.item.prepend(tools);entry.star=star;entry.reset=reset;
  }
  function refresh() {
    if(auxiliaryWasMobile!==mobile.matches){auxiliary.open=!mobile.matches;auxiliaryWasMobile=mobile.matches;}
    for(const entry of entries)if(entry.help){
      if(entry.help.dataset.mobile!==String(mobile.matches)){entry.help.open=false;entry.help.dataset.mobile=String(mobile.matches);}
    }
    (mobile.matches?utilities:header).append(language);
    if(!mobile.matches&&page==='media')page='presets';
    auxiliaryTitle.textContent=currentLang==='zh'?'更多':'More';
    modes.setAttribute('aria-label',currentLang==='zh'?'操作面板':'Workspace');
    if(mobile.matches)utilities.append(favoriteButton,modifiedButton);else rail.prepend(favoriteButton,modifiedButton);
    if(mobile.matches)disclosure.append(info);else previewStatus.after(info);
    document.getElementById('previewExportButton').textContent=currentLang==='zh'?(mobile.matches?'刷新预览':'刷新编码预览'):(mobile.matches?'Refresh':'Refresh encoded preview');
    document.getElementById('compareOriginalButton').textContent=currentLang==='zh'?(mobile.matches?'按住对比':'按住对比原图'):(mobile.matches?'Hold original':'Hold for original');
    const query=search.value.trim(), filtered=!!query||['favorites','modified'].includes(active);
    const candidates=entries.filter(entry=>query?matchesParameterSearch(`${label(entry)} ${entry.key} ${entry.item.querySelector('label span')?.dataset.i18nZh||''} ${entry.item.querySelector('label span')?.dataset.i18nEn||''}`,query):active==='favorites'?favorites.has(entry.key):active==='modified'?changed(entry):entry.group.id===active);
    if(!candidates.some(entry=>entry.key===selected))selected=candidates[0]?.key||'';
    for(const group of groups) {
      group.hidden=filtered?!candidates.some(entry=>entry.group===group):group.id!==active;group.open=!group.hidden;
      for(const item of group.querySelectorAll('.control')) {
        const entry=entries.find(entry=>entry.item===item);
        // A wrapper containing nested controls must stay mounted (export controls).
        item.classList.toggle('navigation-hidden',entry?!candidates.includes(entry):filtered&&!item.querySelector('[data-config]'));
      }
      for(const detail of group.querySelectorAll('.fine-settings')) {
        if(filtered)detail.open=true;
        detail.hidden=(mobile.matches||filtered)&&!detail.querySelector('.control:not(.navigation-hidden)');
      }
      for(const heading of group.querySelectorAll('.group-section-title'))heading.hidden=filtered;
    }
    parameterPicker.replaceChildren();
    if(mobile.matches)for(const entry of candidates) {
      const option=document.createElement('option');option.value=entry.key;option.textContent=label(entry);parameterPicker.append(option);
    }
    parameterPicker.value=selected;
    parameterPicker.setAttribute('aria-label',currentLang==='zh'?'选择调整参数':'Choose a parameter');
    strip.hidden=true;
    const shortNames={phosphorGroup:['像素','Pixels'],textureGroup:['CRT','CRT'],opticsGroup:['光学','Optics'],colorGroup:['色彩','Color'],tapeGroup:['VHS','VHS'],audioGroup:['声音','Sound']};
    for(const [id,btn]of categoryButtons){
      btn.hidden=mobile.matches?!(pages[page].length>1&&page!=='presets'&&pages[page].includes(id)):!pages[page].includes(id)&&id!==active;
      const names=shortNames[id];btn.textContent=mobile.matches&&names?names[currentLang==='zh'?0:1]:btn.dataset[currentLang==='zh'?'i18nZh':'i18nEn'];
      btn.setAttribute('aria-pressed',String(id===active&&!query));
      btn.setAttribute('role',mobile.matches?'tab':'button');btn.setAttribute('aria-selected',String(id===active&&!query));
    }
    rail.hidden=mobile.matches&&![...categoryButtons.values()].some(btn=>!btn.hidden);
    rail.setAttribute('role',mobile.matches?'tablist':'navigation');
    rail.setAttribute('aria-label',currentLang==='zh'?'参数分类':'Parameter categories');
    favoriteButton.hidden=modifiedButton.hidden=page!=='adjust';favoriteButton.setAttribute('aria-pressed',String(active==='favorites'));modifiedButton.setAttribute('aria-pressed',String(active==='modified'));
    for(const btn of toolbar.querySelectorAll('[data-page]')){const on=btn.dataset.page===page;btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-selected',String(on));btn.tabIndex=on?0:-1;if(on)content.setAttribute('aria-labelledby',btn.id);}
    for(const entry of entries) {
      entry.star.textContent=favorites.has(entry.key)?'★':'☆';entry.star.setAttribute('aria-pressed',String(favorites.has(entry.key)));
      entry.star.setAttribute('aria-label',`${currentLang==='zh'?'常用':'Favorite'}: ${label(entry)}`);entry.reset.disabled=!changed(entry);
    }
    empty.hidden=!filtered||!!candidates.length;empty.textContent=currentLang==='zh'?'这里还没有参数。可用 ☆ 收藏参数，或搜索参数名称。':'No settings yet. Use ☆ to save favorites, or search by name.';
    status.textContent=query?(currentLang==='zh'?`找到 ${candidates.length} 个参数`:`${candidates.length} settings found`):'';status.hidden=!query;
    search.setAttribute('aria-label',currentLang==='zh'?'查找参数':'Find a setting');title.textContent=currentLang==='zh'?'预览设置':'Preview settings';
  }
  for(const btn of toolbar.querySelectorAll('[data-page]'))btn.addEventListener('click',()=>{page=btn.dataset.page;active=pages[page][0];selected='';search.value='';content.scrollTop=0;refresh();if(mobile.matches)auxiliary.open=false;});
  for(const btn of toolbar.querySelectorAll('[data-group]'))btn.addEventListener('click',()=>{active=btn.dataset.group;selected='';search.value='';content.scrollTop=0;refresh();if(mobile.matches)auxiliary.open=false;});
  search.addEventListener('input',refresh);
  panel.addEventListener('input',event=>{if(event.target.closest('.control'))refreshValues();});
  panel.addEventListener('change',event=>{if(event.target.closest('.control'))refreshValues();});
  function refreshValues(){for(const entry of entries)entry.reset.disabled=!changed(entry);if(active==='modified')refresh();}
  document.addEventListener('crt-config-applied',()=>{baseline=collectConfig();refresh();});
  document.getElementById('languageToggleButton').addEventListener('click',refresh);mobile.addEventListener('change',refresh);
  panel.classList.add('terminal-workspace');refresh();initializeTerminalPreview();
}

// Small synchronous preview passes reuse the renderer and never change live controls.
function initializeTerminalPreview() {
  const machine=document.querySelector('.machine');
  const splitter=document.createElement('div');splitter.className='workspace-splitter';splitter.tabIndex=0;
  splitter.setAttribute('role','separator');splitter.setAttribute('aria-orientation','vertical');
  splitter.setAttribute('aria-valuemin','48');splitter.setAttribute('aria-valuemax','70');
  let share=60;
  function resize(next){share=Math.max(48,Math.min(70,next));machine.style.setProperty('--screen-share',share);machine.style.setProperty('--screen-weight',`${share}fr`);machine.style.setProperty('--panel-weight',`${100-share}fr`);splitter.setAttribute('aria-valuenow',String(Math.round(share)));}
  resize(share);machine.append(splitter);
  splitter.addEventListener('pointerdown',event=>{splitter.setPointerCapture(event.pointerId);});
  splitter.addEventListener('pointermove',event=>{if(splitter.hasPointerCapture(event.pointerId)){const rect=machine.getBoundingClientRect();resize((event.clientX-rect.left)/rect.width*100);}});
  splitter.addEventListener('pointerup',event=>{if(splitter.hasPointerCapture(event.pointerId))splitter.releasePointerCapture(event.pointerId);});
  splitter.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();resize(event.key==='Home'?60:share+(event.key==='ArrowLeft'?-2:2));}});
  const screen=document.querySelector('.screen'), original=document.createElement('canvas');original.className='original-screen';original.hidden=true;screen.append(original);
  const compare=document.getElementById('compareOriginalButton');let comparing=false,frameId=0;
  function drawOriginal(){
    if(!comparing)return;
    const drawable=currentMediaType==='video'?sourceVideo:sourceDrawable;
    if(drawable&&sourceWidth&&sourceHeight){
      original.width=Math.max(2,Math.round(screen.clientWidth*(devicePixelRatio||1)));original.height=Math.max(2,Math.round(screen.clientHeight*(devicePixelRatio||1)));
      const ctx=original.getContext('2d');ctx.fillStyle='#050605';ctx.fillRect(0,0,original.width,original.height);
      const ratio=Math.min(original.width/sourceWidth,original.height/sourceHeight),w=sourceWidth*ratio,h=sourceHeight*ratio;
      ctx.drawImage(drawable,(original.width-w)/2,(original.height-h)/2,w,h);
    }
    frameId=requestAnimationFrame(drawOriginal);
  }
  function compareState(on){comparing=on;original.hidden=!on;compare.setAttribute('aria-pressed',String(on));cancelAnimationFrame(frameId);if(on)drawOriginal();}
  compare.addEventListener('pointerdown',event=>{compare.setPointerCapture(event.pointerId);compareState(true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])compare.addEventListener(event,()=>compareState(false));
  compare.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();compareState(true);}});
  compare.addEventListener('keyup',()=>compareState(false));window.addEventListener('blur',()=>compareState(false));
  const gallery=document.createElement('div');gallery.className='preset-gallery';
  document.querySelector('#presetsGroup .group-body').prepend(gallery);
  const tiles=[];
  for(const option of document.querySelectorAll('#builtInPresetSelect option')){
    const tile=document.createElement('button');tile.type='button';tile.className='preset-tile';
    const thumb=document.createElement('canvas');thumb.width=240;thumb.height=180;
    const caption=document.createElement('span');caption.dataset.i18nZh=option.dataset.i18nZh;caption.dataset.i18nEn=option.dataset.i18nEn;caption.textContent=option.textContent;
    tile.append(thumb,caption);gallery.append(tile);tiles.push({tile,thumb,caption,option});
    tile.addEventListener('click',()=>{document.getElementById('builtInPresetSelect').value=option.value;applyBuiltInPreset();for(const t of tiles)t.tile.setAttribute('aria-pressed',String(t.tile===tile));});
  }
  let generation=0;
  function thumbnails(){
    const token=++generation;let i=0;
    const drawable=currentMediaType==='video'?sourceVideo:sourceDrawable;
    if(!drawable||(currentMediaType==='video'&&sourceVideo.readyState<2))return;
    // Freeze one source frame so all presets compare the same moment.
    const snapshot=document.createElement('canvas');
    snapshot.width=Math.min(640,sourceWidth);snapshot.height=Math.max(1,Math.round(snapshot.width/sourceAspect));
    snapshot.getContext('2d').drawImage(drawable,0,0,snapshot.width,snapshot.height);
    function next(){
      if(token!==generation||i>=tiles.length)return;
      if(previewRenderBusy||exportInProgress){setTimeout(next,250);return;}
      const {thumb,option}=tiles[i++];
      try {
        const settings=sanitizePresetConfig(PRESET_LIBRARY[option.value]);
        const surface=preparePreviewSurface('image',snapshot,sourceWidth,sourceHeight);
        withRenderSurface(surface,settings,{width:320,height:240},null,()=>{
          renderFrame(0);thumb.getContext('2d').drawImage(surface.canvas,0,0,thumb.width,thumb.height);
        });
      }catch(error){console.warn('Preset thumbnail unavailable',error.message);}
      setTimeout(next,20);
    }
    next();
  }
  document.addEventListener('crt-media-ready',thumbnails);
  sourceVideo.addEventListener('seeked',thumbnails);
  let lastThumbnailTime=0;
  sourceVideo.addEventListener('timeupdate',()=>{
    if(!gallery.closest('.control-group').hidden&&!previewRenderBusy&&!exportInProgress&&performance.now()-lastThumbnailTime>2000){lastThumbnailTime=performance.now();thumbnails();}
  });
  document.getElementById('languageToggleButton').addEventListener('click',()=>{
    for(const {caption,option}of tiles)caption.textContent=option.textContent;
    splitter.setAttribute('aria-label',currentLang==='zh'?'调节屏幕与控制台宽度':'Resize monitor and controls');
  });
  splitter.setAttribute('aria-label',currentLang==='zh'?'调节屏幕与控制台宽度':'Resize monitor and controls');
  thumbnails();
}
