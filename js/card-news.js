/* ─── 팔레트 ─────────────────────────────────────────────── */
const KIA_RED   = '#ea0029';
const KIA_BLACK = '#111111';

/* ─── 상태 ───────────────────────────────────────────────── */
const state = {
  layout:      'speech-bubble',
  title:       '시범경기 특징',
  items: [
    { left: '승전조가 이렇게 많아?',                       right: '시즌 들어가면 없어짐' },
    { left: '뉴페이스들 좋네\n어린친구들이 잘하는 구만ㅋㅋ', right: '시즌 들어가면\n작년에 나오던 애들만 나옴' },
    { left: '저 선수 폼이 왜저래?\n작년만 못한데?',         right: '시즌 들어가면 알아서 잘함' },
    { left: '뭔 지랄이지?\n그냥 해보는거지?',              right: '시즌 중에 함' },
  ],
  font:        'IMHyemin',
  accentColor: KIA_RED,
  titleSize:   52,
  bodySize:    26,
};

/* ─── 캔버스 ─────────────────────────────────────────────── */
const canvas = document.getElementById('preview-canvas');
const ctx    = canvas.getContext('2d');

const CW = 1080;
const CH = 1350;
const BOTTOM_RESERVE = 500;

/* ─── 레이아웃 렌더러 등록 ───────────────────────────────── */
const LAYOUTS = {
  'speech-bubble': renderSpeechBubble,
  'dark-bubble':   renderDarkBubble,
  'numbered':      renderNumbered,
};

/* ════════════════════════════════════════════════════════════
   공통 유틸
   ════════════════════════════════════════════════════════════ */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}
function hexAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function drawRoundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/* 박스 안 텍스트 (자동 줄바꿈 + 수직 중앙) */
function drawTextInBox(text, bx, by, bw, bh, { font, color, size, weight = '400', align = 'left', padX = 28 }) {
  const maxW  = bw - padX * 2;
  const lineH = size * 1.6;
  ctx.font = `${weight} ${size}px '${font}', 'Pretendard', sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';

  const rawLines = text.split('\n');
  const lines = [];
  rawLines.forEach(raw => {
    let cur = '';
    for (const ch of raw) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch; }
      else cur = test;
    }
    if (cur) lines.push(cur);
  });

  const totalH = lines.length * lineH;
  const startY = by + (bh - totalH) / 2 + size * 0.85;
  ctx.textAlign = align;
  const x = align === 'center' ? bx + bw / 2 : bx + padX;
  lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineH));
}

/* 공통 레이아웃 수치 */
function metrics() {
  const titleH     = 40 + state.titleSize * 2.4;
  const contentTop = titleH + 32;
  const contentBot = CH - BOTTOM_RESERVE;
  const contentH   = contentBot - contentTop;
  const padX       = 60;
  const innerW     = CW - padX * 2;
  const leftW      = Math.floor(innerW * 0.42);
  const arrowW     = 64;
  const rightW     = innerW - leftW - arrowW;
  const n          = state.items.length;
  const rowGap     = 18;
  const rowH       = n > 0 ? Math.floor((contentH - rowGap * (n - 1)) / n) : 0;
  return { titleH, contentTop, padX, innerW, leftW, arrowW, rightW, rowGap, rowH };
}

/* ════════════════════════════════════════════════════════════
   스타일 1 — 말풍선형
   클린 화이트 + 좌 회색 / 우 강조색
   KBO 뉴스카드 느낌으로 제목에 번호 태그 + 하단 컬러 라인
   ════════════════════════════════════════════════════════════ */
function renderSpeechBubble() {
  const A = state.accentColor;
  const { titleH, contentTop, padX, leftW, arrowW, rightW, rowGap, rowH } = metrics();

  /* 배경 */
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, CW, CH);

  /* 제목 영역: 흰 배경 + 하단 강조 라인 */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, titleH);
  ctx.fillStyle = A;
  ctx.fillRect(0, titleH - 5, CW, 5);

  /* 제목 태그 사각형 */
  const tagW = 10;
  ctx.fillStyle = A;
  ctx.fillRect(padX, titleH * 0.25, tagW, titleH * 0.5);

  /* 제목 텍스트 */
  ctx.font = `700 ${state.titleSize}px '${state.font}', 'Pretendard', sans-serif`;
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.title, padX + tagW + 20, titleH / 2);

  /* 항목 행 */
  state.items.forEach((item, i) => {
    const rowY   = contentTop + i * (rowH + rowGap);
    const leftX  = padX;
    const arrowX = padX + leftW;
    const rightX = arrowX + arrowW;

    /* 카드 그림자 효과 (흰 배경 + 약간의 테두리) */
    drawRoundRect(leftX,  rowY, leftW,  rowH, 16, '#ffffff');
    drawRoundRect(rightX, rowY, rightW, rowH, 16, A);

    /* 좌측 상단 말풍선 꼬리 힌트 (좌측 컬러 바) */
    drawRoundRect(leftX, rowY, 6, rowH, 3, hexAlpha(A, 0.35));

    /* 화살표 */
    ctx.font = `700 ${state.bodySize * 1.1}px 'Pretendard', sans-serif`;
    ctx.fillStyle = hexAlpha(A, 0.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('→', arrowX + arrowW / 2, rowY + rowH / 2);

    drawTextInBox(item.left,  leftX + 6, rowY, leftW - 6, rowH,
      { font: state.font, color: '#222222', size: state.bodySize });
    drawTextInBox(item.right, rightX, rowY, rightW, rowH,
      { font: state.font, color: '#ffffff', size: state.bodySize, weight: '700' });
  });
}

/* ════════════════════════════════════════════════════════════
   스타일 2 — 다크형
   검정 배경 + 네온 강조 / 스포츠 잡지 느낌
   ════════════════════════════════════════════════════════════ */
function renderDarkBubble() {
  const A = state.accentColor;
  const { titleH, contentTop, padX, leftW, arrowW, rightW, rowGap, rowH } = metrics();

  /* 배경 */
  ctx.fillStyle = KIA_BLACK;
  ctx.fillRect(0, 0, CW, CH);

  /* 제목 영역: 강조색 풀 배경 */
  ctx.fillStyle = A;
  ctx.fillRect(0, 0, CW, titleH);

  /* 제목 배경 위에 대각선 사선 패턴 (스포티한 느낌) */
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  for (let x = -titleH; x < CW + titleH; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + titleH, titleH);
    ctx.lineTo(x + titleH + 12, titleH);
    ctx.lineTo(x + 12, 0);
    ctx.fill();
  }
  ctx.restore();

  /* 제목 텍스트 */
  ctx.font = `700 ${state.titleSize}px '${state.font}', 'Pretendard', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(state.title, CW / 2, titleH / 2);

  /* 항목 행 */
  state.items.forEach((item, i) => {
    const rowY   = contentTop + i * (rowH + rowGap);
    const leftX  = padX;
    const arrowX = padX + leftW;
    const rightX = arrowX + arrowW;

    drawRoundRect(leftX,  rowY, leftW,  rowH, 16, 'rgba(255,255,255,0.06)');
    drawRoundRect(rightX, rowY, rightW, rowH, 16, A);

    /* 좌측 상단 강조 코너 라인 */
    ctx.strokeStyle = hexAlpha(A, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX + 16, rowY + 2);
    ctx.lineTo(leftX + 2, rowY + 2);
    ctx.lineTo(leftX + 2, rowY + 20);
    ctx.stroke();

    /* 화살표 */
    ctx.font = `400 ${state.bodySize * 1.1}px 'Pretendard', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('→', arrowX + arrowW / 2, rowY + rowH / 2);

    drawTextInBox(item.left,  leftX, rowY, leftW, rowH,
      { font: state.font, color: 'rgba(255,255,255,0.7)', size: state.bodySize });
    drawTextInBox(item.right, rightX, rowY, rightW, rowH,
      { font: state.font, color: '#ffffff', size: state.bodySize, weight: '700' });
  });
}

/* ════════════════════════════════════════════════════════════
   스타일 3 — 번호형
   원형 번호 배지 + 교대 배경 / 인포그래픽 느낌
   ════════════════════════════════════════════════════════════ */
function renderNumbered() {
  const A = state.accentColor;
  const { titleH, contentTop, padX, leftW, arrowW, rowGap, rowH } = metrics();

  /* 배경 */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  /* 제목 영역: 좌측 굵은 바 + 검정 배경 */
  const barW = 18;
  ctx.fillStyle = KIA_BLACK;
  ctx.fillRect(0, 0, CW, titleH);
  ctx.fillStyle = A;
  ctx.fillRect(0, 0, barW, titleH);

  /* 제목 텍스트 */
  ctx.font = `700 ${state.titleSize}px '${state.font}', 'Pretendard', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(state.title, padX, titleH / 2);

  const badgeR  = Math.max(24, rowH * 0.22);
  const badgeGap = 16;

  state.items.forEach((item, i) => {
    const rowY     = contentTop + i * (rowH + rowGap);
    const isEven   = i % 2 === 1;

    /* 행 배경 (교대) */
    ctx.fillStyle = isEven ? '#f8f8f8' : '#ffffff';
    ctx.fillRect(0, rowY, CW, rowH);

    /* 좌측 강조 바 */
    ctx.fillStyle = A;
    ctx.fillRect(0, rowY, 5, rowH);

    const badgeCX  = padX + badgeR + 5;
    const badgeCY  = rowY + rowH / 2;
    const textLeftX = badgeCX + badgeR + badgeGap;
    const leftBoxW  = leftW - badgeR * 2 - badgeGap - 5;
    const arrowX    = textLeftX + leftBoxW;
    const rightX    = arrowX + arrowW;
    const rightBoxW = CW - padX - rightX;

    /* 우측 박스 */
    drawRoundRect(rightX, rowY + 14, rightBoxW, rowH - 28, 14, A);

    /* 번호 원형 배지 */
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = A;
    ctx.fill();
    ctx.font = `700 ${Math.round(badgeR * 0.9)}px 'Pretendard', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), badgeCX, badgeCY);

    /* 화살표 */
    ctx.font = `400 ${state.bodySize}px 'Pretendard', sans-serif`;
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('→', arrowX + arrowW / 2, rowY + rowH / 2);

    drawTextInBox(item.left,  textLeftX, rowY, leftBoxW, rowH,
      { font: state.font, color: '#222222', size: state.bodySize });
    drawTextInBox(item.right, rightX, rowY + 14, rightBoxW, rowH - 28,
      { font: state.font, color: '#ffffff', size: state.bodySize, weight: '700' });
  });

  /* 하단 행 구분선들 */
  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth = 1;
  state.items.forEach((_, i) => {
    if (i === 0) return;
    const y = contentTop + i * (rowH + rowGap) - rowGap / 2;
    ctx.beginPath();
    ctx.moveTo(5, y); ctx.lineTo(CW, y); ctx.stroke();
  });
}

/* ─── 캔버스 스케일 ──────────────────────────────────────── */
function scaleCanvas() {
  const wrap  = canvas.parentElement;
  const maxW  = wrap.clientWidth  - 2;
  const maxH  = wrap.clientHeight - 2;
  const ratio = CW / CH;
  const fitH  = Math.min(maxH, maxW / ratio);
  canvas.style.width  = `${fitH * ratio}px`;
  canvas.style.height = `${fitH}px`;
}

/* ─── 렌더링 ─────────────────────────────────────────────── */
function render() {
  canvas.width  = CW;
  canvas.height = CH;
  const renderer = LAYOUTS[state.layout];
  if (renderer) renderer();
  scaleCanvas();
}

/* ─── 항목 UI 빌드 ───────────────────────────────────────── */
function buildItemsUI() {
  const list = document.getElementById('items-list');
  list.innerHTML = '';
  state.items.forEach((item, i) => {
    const row    = document.createElement('div');
    row.className = 'item-row';

    const delBtn = document.createElement('button');
    delBtn.className = 'item-delete-btn';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => { state.items.splice(i, 1); buildItemsUI(); render(); });

    const leftTA = document.createElement('textarea');
    leftTA.className = 'item-textarea item-textarea--left';
    leftTA.value = item.left; leftTA.rows = 2; leftTA.placeholder = '좌측 텍스트';
    leftTA.addEventListener('input', () => { item.left = leftTA.value; render(); autoResize(leftTA); });

    const arrow = document.createElement('div');
    arrow.className = 'item-row__arrow'; arrow.textContent = '↓';

    const rightTA = document.createElement('textarea');
    rightTA.className = 'item-textarea item-textarea--right';
    rightTA.value = item.right; rightTA.rows = 2; rightTA.placeholder = '우측 텍스트';
    rightTA.addEventListener('input', () => { item.right = rightTA.value; render(); autoResize(rightTA); });

    row.append(delBtn, leftTA, arrow, rightTA);
    list.appendChild(row);
    autoResize(leftTA); autoResize(rightTA);
  });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

/* ─── 이벤트 ─────────────────────────────────────────────── */
document.getElementById('title-input').addEventListener('input', e => { state.title = e.target.value; render(); });
document.getElementById('add-item-btn').addEventListener('click', () => { state.items.push({ left: '', right: '' }); buildItemsUI(); render(); });

document.querySelectorAll('.font-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); state.font = btn.dataset.font; render();
}));

document.querySelectorAll('.layout-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); state.layout = btn.dataset.layout; render();
}));

document.querySelectorAll('.swatch').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.accentColor = btn.dataset.color;
  document.getElementById('color-picker').value = btn.dataset.color;
  render();
}));

document.getElementById('color-picker').addEventListener('input', e => {
  state.accentColor = e.target.value;
  document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
  render();
});

/* 폰트 크기 슬라이더 */
document.getElementById('title-size').addEventListener('input', e => {
  state.titleSize = parseInt(e.target.value, 10);
  document.getElementById('title-size-val').textContent = state.titleSize;
  render();
});
document.getElementById('body-size').addEventListener('input', e => {
  state.bodySize = parseInt(e.target.value, 10);
  document.getElementById('body-size-val').textContent = state.bodySize;
  render();
});

document.getElementById('download-btn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `card-news-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

window.addEventListener('resize', scaleCanvas);

/* ─── 초기화 ─────────────────────────────────────────────── */
async function init() {
  await document.fonts.ready;
  buildItemsUI();
  render();
}

init();
