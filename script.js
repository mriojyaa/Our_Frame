/* ═══════════════════════════════════════════════
   OURFRAME — PHOTOBOOTH SCRIPT
═══════════════════════════════════════════════ */

/* ─── LANDING SETUP ─── */
function buildBgStrip(id) {
  const el = document.getElementById(id);
  for (let i = 0; i < 20; i++) {
    const hole = document.createElement('div');
    hole.className = 'bg-strip-hole';
    el.appendChild(hole);
    if (i % 3 === 0) {
      const frame = document.createElement('div');
      frame.className = 'bg-strip-frame';
      el.appendChild(frame);
    }
  }
}
['bs1','bs2','bs3','bs4','bs5','bs6'].forEach(buildBgStrip);

(function spawnParticles() {
  const landing = document.getElementById('landing');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left  = Math.random() * 100;
    const dur   = 6 + Math.random() * 10;
    const delay = Math.random() * -dur;
    const drift = (Math.random() - 0.5) * 80;
    p.style.cssText = `left:${left}%;bottom:0;--drift:${drift}px;animation-duration:${dur}s;animation-delay:${delay}s;width:${Math.random()>0.6?4:2}px;height:${Math.random()>0.6?4:2}px;`;
    landing.appendChild(p);
  }
})();

/* ─── MOBILE ACCORDION ─── */
function toggleSection(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

/* ─── MOBILE STRIP MODAL ─── */
function openStripModal() {
  document.getElementById('strip-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeStripModal(e) {
  if (e.target === document.getElementById('strip-modal-overlay')) {
    closeStripModalDirect();
  }
}

function closeStripModalDirect() {
  document.getElementById('strip-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── TRANSITIONS ─── */
function enterApp() {
  const curtain = document.getElementById('curtain');
  const landing = document.getElementById('landing');
  const app     = document.getElementById('app');

  curtain.classList.add('drop');
  setTimeout(() => {
    landing.style.display = 'none';
    app.style.display = 'block';
    initApp();
    void app.offsetWidth;
    curtain.classList.remove('drop');
    curtain.classList.add('rise');
    setTimeout(() => {
      app.style.opacity = '1';
      curtain.style.display = 'none';
    }, 700);
  }, 500);
}

function backToLanding() {
  const curtain = document.getElementById('curtain');
  const landing = document.getElementById('landing');
  const app     = document.getElementById('app');

  curtain.style.display = 'block';
  curtain.classList.remove('rise');
  curtain.classList.add('drop');

  setTimeout(() => {
    app.style.display = 'none';
    app.style.opacity = '0';
    landing.style.display = 'flex';
    landing.style.opacity = '1';
    landing.style.transform = 'none';
    curtain.classList.remove('drop');
    curtain.classList.add('rise');
    setTimeout(() => {
      curtain.style.display = 'none';
      curtain.classList.remove('rise');
    }, 700);
  }, 500);
}

/* ─── APP INIT ─── */
let appInited = false;

function initApp() {
  if (appInited) return;
  appInited = true;

  const dateStr = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
  document.getElementById('strip-date').textContent = dateStr;
  document.getElementById('modal-strip-date').textContent = dateStr;

  navigator.mediaDevices.getUserMedia({ video: { width:1280, height:960, facingMode:'user' }, audio: false })
    .then(stream => {
      video.srcObject = stream;
      video.style.filter = buildFilterString(filterState);
      video.style.transform = 'scaleX(-1)';
    })
    .catch(() => {
      setStatus('⚠ Kamera tidak tersedia — izinkan akses kamera');
    });

  setTimeout(resizeEffectCanvas, 300);
}

const video             = document.getElementById('video');
const canvasPreview     = document.getElementById('canvas-preview');
const countdownOverlay  = document.getElementById('countdown-overlay');
const countdownNum      = document.getElementById('countdown-num');
const flashEl           = document.getElementById('flash');
const captureRing       = document.getElementById('capture-ring');
const btnCapture        = document.getElementById('btn-capture');
const btnDownload       = document.getElementById('btn-download');
const modalBtnDownload  = document.getElementById('modal-btn-download');
const photoCounter      = document.getElementById('photo-counter');

function setStatus(msg) {
  document.getElementById('status-msg').textContent = msg;
  const d = document.getElementById('status-msg-desktop');
  if (d) d.textContent = msg;
}

let photos       = [];
let currentFrame = 'cream';
let isMirrored   = true;
let isCounting   = false;

const filterState = { brightness:100, contrast:100, saturate:100, sepia:0, hue:0, blur:0 };

const presets = {
  original: { brightness:100, contrast:100, saturate:100, sepia:0,  hue:0,   blur:0 },
  bw:       { brightness:100, contrast:110, saturate:0,   sepia:0,  hue:0,   blur:0 },
  vintage:  { brightness:95,  contrast:110, saturate:120, sepia:60, hue:0,   blur:0 },
  cool:     { brightness:105, contrast:100, saturate:130, sepia:0,  hue:180, blur:0 },
  warm:     { brightness:105, contrast:100, saturate:140, sepia:30, hue:0,   blur:0 },
  drama:    { brightness:90,  contrast:140, saturate:130, sepia:0,  hue:0,   blur:0 },
  analog:   { brightness:98,  contrast:125, saturate:80,  sepia:22, hue:8,   blur:0 }
};

function buildFilterString(s) {
  return `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) sepia(${s.sepia}%) hue-rotate(${s.hue}deg) blur(${s.blur}px)`;
}

function updateFilter() {
  const keys = ['brightness','contrast','saturate','sepia','hue','blur'];
  keys.forEach(k => {
    const val = parseFloat(document.getElementById(`sl-${k}`).value);
    filterState[k] = val;
    const display = k === 'hue' ? `${val}°` : String(parseFloat(val.toFixed(1)));
    document.getElementById(`val-${k}`).textContent = display;
  });
  document.querySelectorAll('input[type=range]').forEach(sl => {
    const pct = ((sl.value - sl.min) / (sl.max - sl.min)) * 100;
    sl.style.background = `linear-gradient(to right, var(--warm) 0%, var(--warm) ${pct}%, rgba(26,20,16,0.2) ${pct}%)`;
  });
  video.style.filter = buildFilterString(filterState);
  if (isMirrored) video.style.transform = 'scaleX(-1)';
}

function applyPreset(btn, name) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const p = presets[name];
  Object.assign(filterState, p);
  ['brightness','contrast','saturate','sepia','hue','blur'].forEach(k => {
    document.getElementById(`sl-${k}`).value = p[k];
  });
  updateFilter();
}

function resetFilter() {
  applyPreset(document.querySelector('.filter-btn'), 'original');
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');
}

const frameThemes = {
  cream: { bg: '#f5f0e8', text: '#1a1410', accent: '#c8a96e' },
  dark:  { bg: '#1a1410', text: '#f5f0e8', accent: '#c8a96e' },
  rose:  { bg: '#f7e8e4', text: '#7a3525', accent: '#c4705a' },
  gold:  { bg: '#2a1f0e', text: '#f5f0e8', accent: '#d4a843' }
};

/* ─── CUSTOM STRIP ─── */
let customImgSrc = null, customNatW = 0, customNatH = 0;
let customSlots = [], allDetectedSlots = [], isCustomActive = false;

function detectWhiteSlots(imageData, natW, natH) {
  const d = imageData.data;
  const rowWhite = new Float32Array(natH);
  for (let y = 0; y < natH; y++) {
    let count = 0;
    for (let x = 0; x < natW; x++) {
      const i = (y * natW + x) * 4;
      if (d[i] > 215 && d[i+1] > 210 && d[i+2] > 205 && d[i+3] > 200) count++;
    }
    rowWhite[y] = count / natW;
  }
  const slots = [];
  let inSlot = false, slotStart = 0;
  for (let y = 0; y < natH; y++) {
    if (!inSlot && rowWhite[y] >= 0.65) { inSlot = true; slotStart = y; }
    else if (inSlot && rowWhite[y] < 0.35) {
      inSlot = false;
      const h = y - slotStart;
      if (h > natH * 0.04) {
        const mid = Math.round((slotStart + y) / 2);
        let x0 = natW, x1 = 0;
        for (let x = 0; x < natW; x++) {
          const i = (mid * natW + x) * 4;
          if (d[i] > 215 && d[i+1] > 210 && d[i+2] > 205 && d[i+3] > 200) {
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          }
        }
        if (x1 > x0 + 10) slots.push({ x: x0, y: slotStart, w: x1 - x0, h });
      }
    }
  }
  if (inSlot) {
    const h = natH - slotStart;
    if (h > natH * 0.04) slots.push({ x: 0, y: slotStart, w: natW, h });
  }
  return slots;
}

function loadCustomStrip(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      customNatW = img.naturalWidth; customNatH = img.naturalHeight;
      const offscreen = document.createElement('canvas');
      offscreen.width = customNatW; offscreen.height = customNatH;
      const octx = offscreen.getContext('2d');
      octx.drawImage(img, 0, 0);
      const imageData = octx.getImageData(0, 0, customNatW, customNatH);
      allDetectedSlots = detectWhiteSlots(imageData, customNatW, customNatH);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 215 && d[i+1] > 210 && d[i+2] > 205) d[i+3] = 0;
      }
      octx.putImageData(imageData, 0, 0);
      customImgSrc = offscreen.toDataURL('image/png');
      customSlots = []; isCustomActive = false;
      document.getElementById('custom-step-upload').style.display = 'none';
      document.getElementById('custom-step-draw').style.display = 'block';
      const drawImg = document.getElementById('strip-draw-img');
      drawImg.src = customImgSrc;
      drawImg.onload = () => {
        setupPreviewCanvas();
        applySlotCount(Math.min(4, allDetectedSlots.length));
      };
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function setupPreviewCanvas() {
  const canvas = document.getElementById('strip-draw-canvas');
  const img    = document.getElementById('strip-draw-img');
  canvas.width  = img.offsetWidth  || img.naturalWidth;
  canvas.height = img.offsetHeight || img.naturalHeight;
}

function applySlotCount(n) {
  n = Math.max(1, Math.min(n, allDetectedSlots.length));
  customSlots = allDetectedSlots.slice(0, n);
  document.getElementById('slot-count-display').textContent = n;
  const statusEl = document.getElementById('detect-status');
  const adjuster = document.getElementById('slot-adjuster');
  const btn      = document.getElementById('btn-activate-custom');
  if (allDetectedSlots.length === 0) {
    statusEl.innerHTML = '⚠ Slot tidak terdeteksi otomatis.<br><span style="color:var(--rose)">Pastikan slot foto berwarna putih/terang.</span>';
    adjuster.style.display = 'none';
    btn.disabled = true; btn.style.opacity = '0.4';
  } else {
    statusEl.innerHTML = '✓ <strong>' + allDetectedSlots.length + ' slot</strong> berhasil dideteksi otomatis!';
    adjuster.style.display = 'block';
    btn.disabled = false; btn.style.opacity = '1';
  }
  drawDetectedSlots();
}

function adjustSlotCount(delta) {
  const cur = parseInt(document.getElementById('slot-count-display').textContent);
  applySlotCount(cur + delta);
}

function drawDetectedSlots() {
  const canvas = document.getElementById('strip-draw-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scaleX = canvas.width  / customNatW;
  const scaleY = canvas.height / customNatH;
  const colors = ['#ff4d4d','#4d94ff','#4dff88','#ffcc4d'];
  customSlots.forEach((s, i) => {
    const x = s.x*scaleX, y = s.y*scaleY, w = s.w*scaleX, h = s.h*scaleY;
    ctx.save();
    ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = 0.18;
    ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    ctx.fillStyle = colors[i % colors.length];
    ctx.font = 'bold 12px monospace';
    ctx.fillText(i + 1, x + 6, y + 16);
    ctx.restore();
  });
}

function resetCustomStrip() {
  customImgSrc = null; customSlots = []; allDetectedSlots = []; isCustomActive = false;
  document.getElementById('custom-step-upload').style.display = 'block';
  document.getElementById('custom-step-draw').style.display = 'none';
  document.getElementById('custom-active-bar').style.display = 'none';
  document.getElementById('custom-preview-canvas').style.display = 'none';
  document.getElementById('strip-normal-content').style.display = 'block';
  document.getElementById('detect-status').textContent = '🔍 Mendeteksi slot foto otomatis...';
  document.getElementById('slot-adjuster').style.display = 'none';
  const inp = document.querySelector('#custom-step-upload input[type=file]');
  if (inp) inp.value = '';
  applyFrameTheme(currentFrame);
}

function activateCustomStrip() {
  if (!customImgSrc || customSlots.length < 1) return;
  isCustomActive = true;
  document.getElementById('strip-normal-content').style.display = 'none';
  document.getElementById('custom-preview-canvas').style.display = 'block';
  document.getElementById('custom-active-bar').style.display = 'flex';
  document.querySelectorAll('.frame-option').forEach(b => b.classList.remove('active'));
  renderCustomPreview();
  setStatus('✓ Custom strip aktif!');
}

function renderCustomPreview() {
  if (!isCustomActive || !customImgSrc) return;
  const canvas = document.getElementById('custom-preview-canvas');
  const ctx    = canvas.getContext('2d');
  const stripImg = new Image();
  stripImg.onload = () => {
    canvas.width = stripImg.naturalWidth; canvas.height = stripImg.naturalHeight;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!photos.length) { ctx.drawImage(stripImg, 0, 0); return; }
    const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    Promise.all(photos.map(loadImg)).then(imgs => {
      imgs.forEach((img, i) => {
        if (i >= customSlots.length) return;
        const s = customSlots[i];
        const imgAR = img.width/img.height, slotAR = s.w/s.h;
        let sx=0,sy=0,sw=img.width,sh=img.height;
        if (imgAR > slotAR) { sw=img.height*slotAR; sx=(img.width-sw)/2; }
        else { sh=img.width/slotAR; sy=(img.height-sh)/2; }
        ctx.save(); ctx.beginPath(); ctx.rect(s.x,s.y,s.w,s.h); ctx.clip();
        ctx.drawImage(img, sx,sy,sw,sh, s.x,s.y,s.w,s.h); ctx.restore();
      });
      ctx.drawImage(stripImg, 0, 0);
    });
  };
  stripImg.src = customImgSrc;
}

function setFrame(btn, frame) {
  document.querySelectorAll('.frame-option').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`.frame-option[data-frame="${frame}"]`).forEach(b => b.classList.add('active'));
  currentFrame = frame;
  applyFrameTheme(frame);
}

function applyFrameTheme(frame) {
  if (isCustomActive) {
    isCustomActive = false;
    document.getElementById('strip-normal-content').style.display = 'block';
    document.getElementById('custom-preview-canvas').style.display = 'none';
    document.getElementById('custom-active-bar').style.display = 'none';
  }
  const t = frameThemes[frame];

  const desktopSection = document.getElementById('desktop-strip-section');
  if (desktopSection) {
    desktopSection.style.background = t.bg;
    desktopSection.style.color = t.text;
    desktopSection.querySelectorAll('.sidebar-title,.strip-footer,#strip-title').forEach(el => {
      el.style.color = t.accent;
    });
  }

  const modalContent = document.getElementById('modal-strip-content');
  if (modalContent) {
    modalContent.parentElement.style.background = t.bg;
    modalContent.querySelectorAll('.strip-footer,#modal-strip-title').forEach(el => {
      el.style.color = t.accent;
    });
  }
}

function toggleMirror() {
  isMirrored = !isMirrored;
  video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
}

function startCountdown() {
  if (isCounting || photos.length >= 4) return;
  isCounting = true;
  btnCapture.disabled = true;
  let count = 3;
  countdownNum.textContent = count;
  countdownOverlay.classList.add('active');
  setStatus('Bersiap...');
  const timer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(timer);
      countdownOverlay.classList.remove('active');
      capturePhoto();
    } else {
      countdownNum.textContent = count;
      setStatus(`${count}...`);
    }
  }, 1000);
}

function capturePhoto() {
  flashEl.classList.add('flash-on');
  setTimeout(() => flashEl.classList.remove('flash-on'), 150);
  captureRing.classList.remove('animate');
  void captureRing.offsetWidth;
  captureRing.classList.add('animate');

  const w = video.videoWidth  || 640;
  const h = video.videoHeight || 480;

  // Ambil dimensi viewfinder yang tampil di layar
  const vfEl  = document.getElementById('viewfinder');
  const dispW = vfEl.offsetWidth;
  const dispH = vfEl.offsetHeight;

  // Hitung crop agar foto sesuai apa yang terlihat di viewfinder (object-fit: cover)
  const videoAR = w / h;
  const dispAR  = dispW / dispH;

  let sx = 0, sy = 0, sw = w, sh = h;
  if (videoAR > dispAR) {
    // video lebih lebar — crop kiri & kanan
    sh = h;
    sw = Math.round(h * dispAR);
    sx = Math.round((w - sw) / 2);
  } else {
    // video lebih tinggi — crop atas & bawah
    sw = w;
    sh = Math.round(w / dispAR);
    sy = Math.round((h - sh) / 2);
  }

  const canvas = document.createElement('canvas');
  canvas.width  = dispW * 2;   // 2x untuk resolusi lebih tajam
  canvas.height = dispH * 2;
  const ctx = canvas.getContext('2d');

  ctx.save();
  if (isMirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.filter = buildFilterString(filterState);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.filter = 'none';
  drawEffectOnCanvas(ctx, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  photos.push(dataUrl);
  updateStrip();
  const remaining = 4 - photos.length;
  if (remaining > 0) {
    setStatus(`✓ Foto ${photos.length} tersimpan — ${remaining} foto lagi`);
    btnCapture.disabled = false;
  } else {
    setStatus(`✨ Semua 4 foto selesai! Unduh strip kamu`);
    btnDownload.disabled = false;
    modalBtnDownload.disabled = false;
    btnCapture.disabled = true;
    btnCapture.textContent = '✓ Strip Selesai';
  }
  photoCounter.textContent = photos.length;
  isCounting = false;
}

function updateStrip() {
  photos.forEach((src, i) => {
    const slot = document.getElementById(`slot-${i}`);
    if (slot) { slot.innerHTML = `<img src="${src}" alt="foto ${i+1}">`; slot.classList.add('filled'); }
    const mslot = document.getElementById(`mslot-${i}`);
    if (mslot) { mslot.innerHTML = `<img src="${src}" alt="foto ${i+1}">`; mslot.classList.add('filled'); }
  });
  if (isCustomActive) renderCustomPreview();
}

function resetPhotos() {
  photos = [];
  photoCounter.textContent = '0';
  btnCapture.disabled = false;
  btnCapture.textContent = '✦ Ambil Foto';
  btnDownload.disabled = true;
  modalBtnDownload.disabled = true;
  setStatus('Direset — siap mengambil foto baru');
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (slot) { slot.innerHTML = `<span class="slot-num">${i+1}</span>`; slot.classList.remove('filled'); }
    const mslot = document.getElementById(`mslot-${i}`);
    if (mslot) { mslot.innerHTML = `<span class="slot-num">${i+1}</span>`; mslot.classList.remove('filled'); }
  }
}

function downloadStrip() {
  if (photos.length < 4) { setStatus('⚠ Belum 4 foto'); return; }
  if (isCustomActive && customImgSrc && customSlots.length >= 1) {
    const stripImg = new Image();
    stripImg.onload = () => {
      const fc = document.getElementById('final-canvas');
      fc.width = stripImg.naturalWidth; fc.height = stripImg.naturalHeight;
      const ctx = fc.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, fc.width, fc.height);
      const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
      Promise.all(photos.map(loadImg)).then(imgs => {
        imgs.forEach((img, i) => {
          const s = customSlots[i];
          if (!s) return;
          const imgAR = img.width/img.height, slotAR = s.w/s.h;
          let sx=0,sy=0,sw=img.width,sh=img.height;
          if (imgAR > slotAR) { sw=img.height*slotAR; sx=(img.width-sw)/2; }
          else { sh=img.width/slotAR; sy=(img.height-sh)/2; }
          ctx.save(); ctx.beginPath(); ctx.rect(s.x,s.y,s.w,s.h); ctx.clip();
          ctx.drawImage(img, sx,sy,sw,sh, s.x,s.y,s.w,s.h); ctx.restore();
        });
        ctx.drawImage(stripImg, 0, 0);
        const link = document.createElement('a');
        link.download = 'OurFrame-custom-' + Date.now() + '.jpg';
        link.href = fc.toDataURL('image/jpeg', 0.95);
        link.click();
        setStatus('✓ Custom strip berhasil diunduh!');
      });
    };
    stripImg.src = customImgSrc;
    return;
  }
  const theme = frameThemes[currentFrame];
  const PAD=28, PHOTO_W=360, PHOTO_H=Math.round(360*3/4), GAP=12, HEADER_H=60, FOOTER_H=48;
  const STRIP_W=PHOTO_W+PAD*2;
  const STRIP_H=HEADER_H+(PHOTO_H+GAP)*4-GAP+FOOTER_H+PAD*2;
  const fc=document.getElementById('final-canvas');
  fc.width=STRIP_W; fc.height=STRIP_H;
  const ctx=fc.getContext('2d');
  ctx.fillStyle=theme.bg; ctx.fillRect(0,0,STRIP_W,STRIP_H);
  ctx.strokeStyle=theme.accent; ctx.lineWidth=3; ctx.strokeRect(6,6,STRIP_W-12,STRIP_H-12);
  ctx.fillStyle=theme.accent; ctx.font='italic 22px Georgia,serif'; ctx.textAlign='center';
  ctx.fillText('✦ our frame ✦', STRIP_W/2, PAD+32);
  ctx.strokeStyle=theme.accent; ctx.lineWidth=1; ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(PAD,PAD+44); ctx.lineTo(STRIP_W-PAD,PAD+44); ctx.stroke();
  ctx.globalAlpha=1;
  const loadImg=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src=src;});
  Promise.all(photos.map(loadImg)).then(imgs=>{
    imgs.forEach((img,i)=>{
      const y=HEADER_H+PAD+i*(PHOTO_H+GAP);
      ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=8; ctx.shadowOffsetX=2; ctx.shadowOffsetY=2;
      ctx.drawImage(img,PAD,y,PHOTO_W,PHOTO_H);
      ctx.shadowColor='transparent'; ctx.shadowBlur=0;
    });
    const fy=STRIP_H-FOOTER_H/2-4;
    ctx.fillStyle=theme.accent; ctx.font='11px "Courier New",monospace'; ctx.textAlign='center';
    ctx.fillText(new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}).toUpperCase(), STRIP_W/2, fy);
    ctx.font='9px "Courier New",monospace';
    ctx.globalAlpha = 0.55;
    ctx.fillText('© mario — ourframe photobooth', STRIP_W/2, fy + 15);
    ctx.globalAlpha = 1;
    ctx.strokeStyle=theme.accent; ctx.lineWidth=1; ctx.globalAlpha=0.4;
    ctx.beginPath(); ctx.moveTo(PAD,STRIP_H-FOOTER_H); ctx.lineTo(STRIP_W-PAD,STRIP_H-FOOTER_H); ctx.stroke();
    ctx.globalAlpha=1;
    const link=document.createElement('a');
    link.download='OURFRAME-'+Date.now()+'.jpg';
    link.href=fc.toDataURL('image/jpeg',0.95);
    link.click();
    setStatus('✓ Strip berhasil diunduh!');
  });
}

/* ─── EFFECT ENGINE ─── */
const effectCanvas = document.getElementById('effect-canvas');
const ectx = effectCanvas.getContext('2d');
let currentEffect  = 'none';
let effectAnimId   = null;
let effectParticles = [];

function resizeEffectCanvas() {
  const vf = document.getElementById('viewfinder');
  effectCanvas.width  = vf.offsetWidth;
  effectCanvas.height = vf.offsetHeight;
}
window.addEventListener('resize', resizeEffectCanvas);

function setEffect(btn, name) {
  document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentEffect = name;
  effectParticles = [];
  if (effectAnimId) { cancelAnimationFrame(effectAnimId); effectAnimId = null; }
  ectx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
  if (name !== 'none') runEffect();
}

function runEffect() {
  resizeEffectCanvas();
  const W = effectCanvas.width, H = effectCanvas.height;
  ectx.clearRect(0, 0, W, H);

  if (currentEffect === 'vignette') {
    const grad = ectx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
    grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(1,'rgba(0,0,0,0.65)');
    ectx.fillStyle = grad; ectx.fillRect(0,0,W,H); return;
  }
  if (currentEffect === 'scanlines') {
    for (let y=0;y<H;y+=4){ectx.fillStyle='rgba(0,0,0,0.18)';ectx.fillRect(0,y,W,2);} return;
  }
  if (currentEffect === 'rainbow') {
    const t=Date.now()*0.001, grad=ectx.createLinearGradient(0,0,W,H);
    const colors=['rgba(255,0,0,0.2)','rgba(255,165,0,0.2)','rgba(255,255,0,0.2)','rgba(0,200,0,0.2)','rgba(0,100,255,0.2)','rgba(128,0,255,0.2)'];
    const off=(t*0.12)%1;
    colors.forEach((c,i,a)=>grad.addColorStop(((i/a.length)+off)%1,c));
    ectx.fillStyle=grad; ectx.fillRect(0,0,W,H);
    effectAnimId=requestAnimationFrame(runEffect); return;
  }
  if (currentEffect === 'lightleak') {
    const t=Date.now()*0.0008;
    const x=W*(0.5+0.4*Math.sin(t)), y=H*(0.3+0.2*Math.cos(t*0.7));
    const g1=ectx.createRadialGradient(x,y,0,x,y,W*0.6);
    g1.addColorStop(0,'rgba(255,200,100,0.45)');g1.addColorStop(0.4,'rgba(255,120,60,0.2)');g1.addColorStop(1,'rgba(255,80,40,0)');
    ectx.fillStyle=g1;ectx.fillRect(0,0,W,H);
    const g2=ectx.createRadialGradient(W-x*0.4,H-y*0.3,0,W-x*0.4,H-y*0.3,W*0.4);
    g2.addColorStop(0,'rgba(200,100,255,0.3)');g2.addColorStop(1,'rgba(200,100,255,0)');
    ectx.fillStyle=g2;ectx.fillRect(0,0,W,H);
    effectAnimId=requestAnimationFrame(runEffect); return;
  }
  if (currentEffect === 'glitch') {
    if(Math.random()<0.35){
      const s=Math.floor(Math.random()*5)+2;
      for(let i=0;i<s;i++){
        const sy=Math.random()*H,sh=Math.random()*18+2,shift=(Math.random()-0.5)*30;
        ectx.fillStyle=`rgba(${Math.random()>0.5?'255,0,80':'0,200,255'},0.18)`;
        ectx.fillRect(shift,sy,W,sh);
      }
    }
    if(Math.random()<0.2){
      ectx.fillStyle='rgba(255,0,80,0.09)';ectx.fillRect(4,0,W,H);
      ectx.fillStyle='rgba(0,200,255,0.09)';ectx.fillRect(-4,0,W,H);
    }
    effectAnimId=requestAnimationFrame(runEffect); return;
  }
  if (currentEffect === 'analog') {
    // Warm yellowish color wash
    ectx.fillStyle = 'rgba(210,180,100,0.10)';
    ectx.fillRect(0, 0, W, H);

    // Faded/lifted shadows — light overlay on dark areas (milky blacks)
    const fadeGrad = ectx.createLinearGradient(0, 0, 0, H);
    fadeGrad.addColorStop(0, 'rgba(245,235,200,0.06)');
    fadeGrad.addColorStop(1, 'rgba(200,170,120,0.12)');
    ectx.fillStyle = fadeGrad;
    ectx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ectx.createRadialGradient(W/2, H/2, H*0.15, W/2, H/2, H*0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.6, 'rgba(10,5,0,0.15)');
    vig.addColorStop(1, 'rgba(10,5,0,0.65)');
    ectx.fillStyle = vig;
    ectx.fillRect(0, 0, W, H);

    // Film grain
    const dotCount = Math.floor(W * H * 0.06);
    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const bright = Math.random() > 0.5;
      ectx.fillStyle = bright ? 'rgba(255,245,210,0.16)' : 'rgba(0,0,0,0.14)';
      ectx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle horizontal light leak at top
    const leak = ectx.createLinearGradient(0, 0, W, 0);
    leak.addColorStop(0,   'rgba(255,210,120,0.13)');
    leak.addColorStop(0.3, 'rgba(255,210,120,0.04)');
    leak.addColorStop(1,   'rgba(255,210,120,0)');
    ectx.fillStyle = leak;
    ectx.fillRect(0, 0, W, H * 0.35);

    effectAnimId = requestAnimationFrame(runEffect); return;
  }

  if (currentEffect === 'grain') {    const dotCount = Math.floor(W * H * 0.08);
    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const bright = Math.random() > 0.5;
      ectx.fillStyle = bright ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
      ectx.fillRect(x, y, 1.5, 1.5);
    }
    effectAnimId=requestAnimationFrame(runEffect); return;
  }

  const particleConfigs = {
    hearts:   {max:18, emoji:'💕', floatUp:true,  randSize:()=>Math.random()*20+10},
    stars:    {max:28, emoji:'✨', floatUp:false, randSize:()=>Math.random()*16+8},
    bubbles:  {max:22, type:'bubble'},
    snow:     {max:50, type:'snow'},
    confetti: {max:40, type:'confetti'}
  };
  const cfg = particleConfigs[currentEffect];
  if (!cfg) return;

  while(effectParticles.length < cfg.max) {
    if(cfg.emoji) {
      effectParticles.push({x:Math.random()*W, y:cfg.floatUp?H+20:Math.random()*H, size:cfg.randSize(), speed:Math.random()*1.5+0.5, drift:(Math.random()-0.5)*1.2, opacity:Math.random()*0.6+0.4, wobble:Math.random()*Math.PI*2, phase:Math.random()*Math.PI*2, phaseSpeed:Math.random()*0.04+0.02});
    } else if(cfg.type==='bubble') {
      effectParticles.push({x:Math.random()*W, y:H+20, r:Math.random()*18+6, speed:Math.random()*1.2+0.4, drift:(Math.random()-0.5)*0.8, opacity:Math.random()*0.4+0.2});
    } else if(cfg.type==='snow') {
      effectParticles.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*4+1, speed:Math.random()*1.2+0.3, drift:(Math.random()-0.5)*0.6, opacity:Math.random()*0.6+0.3});
    } else if(cfg.type==='confetti') {
      const colors=['#ff4444','#ffaa00','#44dd44','#4488ff','#dd44dd','#ff88aa','#44eeff'];
      effectParticles.push({x:Math.random()*W, y:-10, w:Math.random()*10+4, h:Math.random()*5+2, color:colors[Math.floor(Math.random()*colors.length)], speed:Math.random()*2+1, drift:(Math.random()-0.5)*2, rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.2});
    }
  }

  effectParticles.forEach(p => {
    if(cfg.emoji && cfg.floatUp) {
      p.y-=p.speed; p.x+=Math.sin(p.wobble)*p.drift*0.5; p.wobble+=0.05;
      ectx.save(); ectx.globalAlpha=p.opacity*Math.max(0,p.y/H);
      ectx.font=`${p.size}px serif`; ectx.textAlign='center';
      ectx.fillText(cfg.emoji,p.x,p.y); ectx.restore();
      if(p.y<-30){p.x=Math.random()*W;p.y=H+20;p.size=cfg.randSize();p.speed=Math.random()*1.5+0.5;}
    } else if(cfg.emoji && !cfg.floatUp) {
      p.phase+=p.phaseSpeed;
      ectx.save(); ectx.globalAlpha=0.4+0.5*Math.abs(Math.sin(p.phase));
      ectx.font=`${p.size}px serif`; ectx.textAlign='center';
      ectx.fillText(cfg.emoji,p.x,p.y); ectx.restore();
    } else if(cfg.type==='bubble') {
      p.y-=p.speed; p.x+=p.drift;
      ectx.save(); ectx.globalAlpha=p.opacity;
      ectx.beginPath(); ectx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ectx.strokeStyle='rgba(150,220,255,0.9)'; ectx.lineWidth=1.5; ectx.stroke();
      const bg=ectx.createRadialGradient(p.x-p.r*0.3,p.y-p.r*0.3,0,p.x,p.y,p.r);
      bg.addColorStop(0,'rgba(255,255,255,0.3)');bg.addColorStop(1,'rgba(150,220,255,0.1)');
      ectx.fillStyle=bg; ectx.fill(); ectx.restore();
      if(p.y<-30){p.x=Math.random()*W;p.y=H+20;p.r=Math.random()*18+6;p.speed=Math.random()*1.2+0.4;}
    } else if(cfg.type==='snow') {
      p.y+=p.speed; p.x+=p.drift;
      ectx.save(); ectx.globalAlpha=p.opacity;
      ectx.beginPath(); ectx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ectx.fillStyle='rgba(220,240,255,0.95)'; ectx.fill(); ectx.restore();
      if(p.y>H+10){p.x=Math.random()*W;p.y=-10;}
    } else if(cfg.type==='confetti') {
      p.y+=p.speed; p.x+=p.drift; p.rot+=p.rotSpeed;
      ectx.save(); ectx.translate(p.x,p.y); ectx.rotate(p.rot);
      ectx.fillStyle=p.color; ectx.globalAlpha=0.85;
      ectx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ectx.restore();
      if(p.y>H+20){p.x=Math.random()*W;p.y=-10;}
    }
  });
  effectAnimId=requestAnimationFrame(runEffect);
}

function drawEffectOnCanvas(ctx, W, H) {
  if(currentEffect==='none') return;
  if(currentEffect==='analog'){
    ctx.fillStyle='rgba(210,180,100,0.10)';
    ctx.fillRect(0,0,W,H);
    const fadeGrad=ctx.createLinearGradient(0,0,0,H);
    fadeGrad.addColorStop(0,'rgba(245,235,200,0.06)');
    fadeGrad.addColorStop(1,'rgba(200,170,120,0.12)');
    ctx.fillStyle=fadeGrad; ctx.fillRect(0,0,W,H);
    const vig=ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,H*0.9);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    vig.addColorStop(0.6,'rgba(10,5,0,0.15)');
    vig.addColorStop(1,'rgba(10,5,0,0.65)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
    const dotCount=Math.floor(W*H*0.06);
    for(let i=0;i<dotCount;i++){
      const x=Math.random()*W, y=Math.random()*H;
      ctx.fillStyle=Math.random()>0.5?'rgba(255,245,210,0.16)':'rgba(0,0,0,0.14)';
      ctx.fillRect(x,y,1.5,1.5);
    }
    const leak=ctx.createLinearGradient(0,0,W,0);
    leak.addColorStop(0,'rgba(255,210,120,0.13)');
    leak.addColorStop(0.3,'rgba(255,210,120,0.04)');
    leak.addColorStop(1,'rgba(255,210,120,0)');
    ctx.fillStyle=leak; ctx.fillRect(0,0,W,H*0.35);
    return;
  }
  if(currentEffect==='vignette'){
    const g=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.65)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  } else if(currentEffect==='scanlines'){
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,0.18)';ctx.fillRect(0,y,W,2);}
  } else if(currentEffect==='rainbow'){
    const g=ctx.createLinearGradient(0,0,W,H);
    ['rgba(255,0,0,0.2)','rgba(255,165,0,0.2)','rgba(255,255,0,0.2)','rgba(0,200,0,0.2)','rgba(0,100,255,0.2)','rgba(128,0,255,0.2)'].forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c));
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  } else if(currentEffect==='lightleak'){
    const g1=ctx.createRadialGradient(W*0.8,H*0.2,0,W*0.8,H*0.2,W*0.6);
    g1.addColorStop(0,'rgba(255,200,100,0.45)');g1.addColorStop(1,'rgba(255,80,40,0)');
    ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);
  } else if(currentEffect==='glitch'){
    for(let i=0;i<4;i++){
      ctx.fillStyle=`rgba(${i%2?'255,0,80':'0,200,255'},0.13)`;
      ctx.fillRect((Math.random()-0.5)*20,Math.random()*H,W,Math.random()*14+3);
    }
    ctx.fillStyle='rgba(255,0,80,0.07)';ctx.fillRect(4,0,W,H);
    ctx.fillStyle='rgba(0,200,255,0.07)';ctx.fillRect(-4,0,W,H);
  } else if(currentEffect==='grain'){
    const dotCount = Math.floor(W * H * 0.08);
    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const bright = Math.random() > 0.5;
      ctx.fillStyle = bright ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  } else {
    effectParticles.forEach(p=>{
      if(currentEffect==='hearts'||currentEffect==='stars'){
        const emoji=currentEffect==='hearts'?'💕':'✨';
        ctx.save();ctx.globalAlpha=p.opacity||0.7;
        ctx.font=`${p.size}px serif`;ctx.textAlign='center';
        ctx.fillText(emoji,p.x*(W/effectCanvas.width),p.y*(H/effectCanvas.height));ctx.restore();
      } else if(currentEffect==='bubbles'){
        const scale=W/effectCanvas.width;
        ctx.save();ctx.globalAlpha=p.opacity;
        ctx.beginPath();ctx.arc(p.x*scale,p.y*scale,p.r*scale,0,Math.PI*2);
        ctx.strokeStyle='rgba(150,220,255,0.9)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
      } else if(currentEffect==='snow'){
        const scale=W/effectCanvas.width;
        ctx.save();ctx.globalAlpha=p.opacity;
        ctx.beginPath();ctx.arc(p.x*scale,p.y*scale,p.r*scale,0,Math.PI*2);
        ctx.fillStyle='rgba(220,240,255,0.95)';ctx.fill();ctx.restore();
      } else if(currentEffect==='confetti'){
        const scale=W/effectCanvas.width;
        ctx.save();ctx.translate(p.x*scale,p.y*scale);ctx.rotate(p.rot);
        ctx.fillStyle=p.color;ctx.globalAlpha=0.85;
        ctx.fillRect(-p.w*scale/2,-p.h*scale/2,p.w*scale,p.h*scale);ctx.restore();
      }
    });
  }
}
