/* ─── 팀 데이터 ──────────────────────────────────────── */
const TEAM_SHORT = {
  KIA: 'KIA', LG: 'LG', Samsung: '삼성', Doosan: '두산',
  KT: 'KT', SSG: 'SSG', Lotte: '롯데', NC: 'NC',
  Hanwha: '한화', Kiwoom: '키움',
};

const TEAM_COLORS = {
  KIA:     '#ea0029',
  LG:      '#c30452',
  Samsung: '#074ca1',
  Doosan:  '#131230',
  KT:      '#000000',
  SSG:     '#ce0e2d',
  Lotte:   '#041e42',
  NC:      '#315288',
  Hanwha:  '#FC4E00',
  Kiwoom:  '#570514',
};

const TEAM_ICON_PATHS = {
  custom: {
    KIA:     '../img/icon/icon_kia.png',
    LG:      '../img/icon/icon_lg.png',
    Samsung: '../img/icon/icon_samsung.png',
    Doosan:  '../img/icon/icon_doosan.png',
    KT:      '../img/icon/icon_kt.png',
    SSG:     '../img/icon/icon_ssg.png',
    Lotte:   '../img/icon/icon_lotte.png',
    NC:      '../img/icon/icon_nc.png',
    Hanwha:  '../img/icon/icon_hanhwa.png',
    Kiwoom:  '../img/icon/icon_kiwoom.png',
  },
  initial: {
    KIA:     '../img/icon/initial/initial_kia.png',
    LG:      '../img/icon/initial/initial_lg.png',
    Samsung: '../img/icon/initial/initial_samsung.png',
    Doosan:  '../img/icon/initial/initial_doosan.png',
    KT:      '../img/icon/initial/initial_kt.png',
    SSG:     '../img/icon/initial/initial_ssg.png',
    Lotte:   '../img/icon/initial/initial_lotte.png',
    NC:      '../img/icon/initial/initial_nc.png',
    Hanwha:  '../img/icon/initial/initial_hanwha.png',
    Kiwoom:  '../img/icon/initial/initial_kiwoom.png',
  },
  emblem: {
    KIA:     '../img/icon/emblem/emblem_kia.png',
    LG:      '../img/icon/emblem/emblem_lg.png',
    Samsung: '../img/icon/emblem/emblem_samsung.png',
    Doosan:  '../img/icon/emblem/emblem_doosan.png',
    KT:      '../img/icon/emblem/emblem_kt.png',
    SSG:     '../img/icon/emblem/emblem_ssg.png',
    Lotte:   '../img/icon/emblem/emblem_lotte.png',
    NC:      '../img/icon/emblem/emblem_nc.png',
    Hanwha:  '../img/icon/emblem/emblem_hanwha.png',
    Kiwoom:  '../img/icon/emblem/emblem_kiwoom.png',
  },
};

const iconCacheAll = { custom: {}, initial: {}, emblem: {} };

/* ═══════════════════════════════════════════════════════
   이번 달 기본값 — 매달 이 블록만 수정하세요
   ═══════════════════════════════════════════════════════ */
const MONTHLY_DEFAULTS = {
  year:   2026,
  month:  3,
  bgPath: '../img/wallpapers/KIA_2026-03_opening_mo.jpg',
};
/* ═══════════════════════════════════════════════════════ */

/* ─── 캔버스 비율 ─────────────────────────────────────── */
const CANVAS_RATIOS = {
  r169:   { w: 1080, h: 1920, label: '9:16' },
  r195:   { w: 1080, h: 2340, label: '9:19.5' },
  r209:   { w: 1080, h: 2400, label: '9:20' },
  pc169:  { w: 1920, h: 1080, label: '16:9 PC' },
  pc1610: { w: 2560, h: 1600, label: '16:10' },
};

/* 세이프 존: 상단(상태바) / 하단(홈 인디케이터) */
const SAFE_ZONE = { top: 0.08, bottom: 0.10 };

const CAL_SIZE_SCALE = {
  small:  { cellScale: 0.082, lsCellScale: 0.060 },
  medium: { cellScale: 0.112, lsCellScale: 0.075 },
  large:  { cellScale: 0.148, lsCellScale: 0.095 },
};
// 5주 기준 1:1 정사각형 비율 상수
// calH = cellH × (헤더 0.612 + 라벨 0.38 + 5행) = cellH × 5.992
const CAL_SQUARE = 0.36 * 1.7 + 0.19 * 2.0 + 5;

/* 아이콘 크기 배율 (기본 크기 기준) */
const ICON_SIZE_SCALE = { small: 0.78, medium: 1.0, large: 1.28 };

/* 일 간격: 아이콘 baseSize 비율 (작을수록 아이콘 작아지고 여백 증가) */
const DAY_SPACING = { small: 0.44, medium: 0.34, large: 0.25 };

const DAY_LABELS = {
  sun: ['일', '월', '화', '수', '목', '금', '토'],
  mon: ['월', '화', '수', '목', '금', '토', '일'],
};

const THEMES = {
  dark: {
    title:      '#ffffff',
    dayLabel:   'rgba(255,255,255,0.45)',
    dateNormal: '#e6edf3',
    dateSun:    '#e05555',
    dateSat:    '#5599e0',
    awayCircle: 'rgba(140,140,140,0.20)',
    awayText:   'rgba(200,200,200,0.85)',
  },
  light: {
    title:      '#1a1a1a',
    dayLabel:   'rgba(0,0,0,0.4)',
    dateNormal: '#1a1a1a',
    dateSun:    '#cc2222',
    dateSat:    '#1a55bb',
    awayCircle: 'rgba(100,100,100,0.14)',
    awayText:   'rgba(70,70,70,0.8)',
  },
};

/* ─── 상태 ───────────────────────────────────────────── */
const state = {
  team:        'KIA',
  month:       3,
  calSize:     'medium',
  iconSize:    'large',
  weekStart:   'sun',
  textMode:    'light',
  logoStyle:   'custom',  // 'custom' | 'initial' | 'emblem'
  iconStyle:   'badge',   // 'none' | 'bg' | 'badge'
  cellGap:     'small',   // 'small' | 'medium' | 'large'
  calPos:      'center',  // 'top' | 'center'
  calBgPanel:  'off',     // 'on' | 'off'
  ratio:       'r209',    // 'r169' | 'r195' | 'r209'
  bgFilter:    'all',
  bgImage:     null,
};

let scheduleData  = null;
let wallpaperList = [];

/* ─── Canvas ─────────────────────────────────────────── */
const canvas = document.getElementById('preview-canvas');
const ctx    = canvas.getContext('2d');

/* ─── 유틸 ───────────────────────────────────────────── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── 아이콘 프리로드 (전 스타일) ───────────────────── */
function preloadIcons() {
  return Promise.all(
    Object.entries(TEAM_ICON_PATHS).flatMap(([style, paths]) =>
      Object.entries(paths).map(([key, src]) =>
        new Promise(resolve => {
          const img = new Image();
          img.onload  = () => { iconCacheAll[style][key] = img; resolve(); };
          img.onerror = () => resolve();
          img.src = src;
        })
      )
    )
  );
}

/* ─── 데이터 로드 ────────────────────────────────────── */
async function loadSchedule() {
  try { scheduleData = await (await fetch('../kbo-2026-schedule.json')).json(); }
  catch (e) { console.error('일정 로드 실패:', e); }
}

async function loadWallpapers() {
  try { wallpaperList = await (await fetch('../data/wallpapers.json')).json(); }
  catch { wallpaperList = []; }
  buildBgFilterTabs();
  renderBgSlider(getFilteredWallpapers());
}

/* ─── 배경 필터 ──────────────────────────────────────── */
function getFilteredWallpapers() {
  const isLandscape = CANVAS_RATIOS[state.ratio].w > CANVAS_RATIOS[state.ratio].h;
  const platform = isLandscape ? 'pc' : 'mo';
  let list = wallpaperList.filter(w => !w.platform || w.platform === platform);
  if (state.bgFilter === 'all')    return list;
  if (state.bgFilter === 'common') return list.filter(w => !w.team);
  return list.filter(w => w.team === state.bgFilter);
}

function buildBgFilterTabs() {
  const usedTeams = [...new Set(wallpaperList.map(w => w.team).filter(Boolean))];
  const hasCommon = wallpaperList.some(w => !w.team);
  const filters = [
    { key: 'all', label: '전체' },
    ...(hasCommon ? [{ key: 'common', label: '공용' }] : []),
    ...usedTeams.map(t => ({ key: t, label: t })),
  ];

  ['bg-filter-tabs', 'm-bg-filter-tabs'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    filters.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = 'bg-filter-btn' + (key === state.bgFilter ? ' active' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${id} .bg-filter-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const otherId = id === 'bg-filter-tabs' ? 'm-bg-filter-tabs' : 'bg-filter-tabs';
        document.querySelectorAll(`#${otherId} .bg-filter-btn`).forEach(b =>
          b.classList.toggle('active', b.dataset.key === key)
        );
        state.bgFilter = key;
        renderBgSlider(getFilteredWallpapers());
      });
      btn.dataset.key = key;
      container.appendChild(btn);
    });
  });
}

function renderBgSlider(list) {
  ['bg-slider', 'm-bg-slider'].forEach(id => {
    const slider = document.getElementById(id);
    if (!slider) return;
    slider.innerHTML = '';
    if (list.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'bg-empty';
      msg.textContent = '이 카테고리에 배경이 없습니다.';
      slider.appendChild(msg);
      return;
    }
    list.forEach((item, i) => {
      const btn   = document.createElement('div');
      btn.className = 'bg-thumb';
      const img   = document.createElement('img');
      img.src = item.path; img.alt = item.name || '';
      const label = document.createElement('span');
      label.className = 'bg-thumb__name';
      label.textContent = item.name || `배경 ${i + 1}`;
      btn.append(img, label);
      btn.dataset.path = item.path;
      btn.addEventListener('click', () => {
        // mark active in all sliders
        document.querySelectorAll('.bg-thumb').forEach(b =>
          b.classList.toggle('active', b.dataset.path === item.path)
        );
        loadBgImage(item.path);
      });
      slider.appendChild(btn);
      if (i === 0) btn.click();
    });
  });
}

function loadBgImage(src) {
  const img = new Image();
  img.onload  = () => { state.bgImage = img; render(); };
  img.onerror = () => { state.bgImage = null; render(); };
  img.src = src;
}

/* ─── 월별 경기 인덱스 ───────────────────────────────── */
function getMonthGames(teamKey, month) {
  if (!scheduleData) return {};
  const map = {};
  for (const g of scheduleData.games) {
    const d = new Date(g.date);
    if (d.getMonth() + 1 !== month) continue;
    if (g.away !== teamKey && g.home !== teamKey) continue;
    const isHome = g.home === teamKey;
    map[d.getDate()] = { opponent: isHome ? g.away : g.home, isHome };
  }
  return map;
}

/* ─── Canvas 렌더링 ──────────────────────────────────── */
function render() {
  const { w, h } = CANVAS_RATIOS[state.ratio];
  canvas.width  = w;
  canvas.height = h;

  if (state.bgImage) {
    const scale = Math.max(w / state.bgImage.width, h / state.bgImage.height);
    const sw = state.bgImage.width  * scale;
    const sh = state.bgImage.height * scale;
    ctx.drawImage(state.bgImage, (w - sw) / 2, (h - sh) / 2, sw, sh);
  } else {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);
  }

  drawCalendar(w, h);
  scaleCanvas();
}

/* ─── 달력 그리기 ────────────────────────────────────── */
function drawCalendar(W, H) {
  const year  = MONTHLY_DEFAULTS.year;
  const month = state.month;
  const games = getMonthGames(state.team, month);
  const C     = THEMES[state.textMode];

  const teamColor  = TEAM_COLORS[state.team] || '#e05555';
  const homeCircle = hexToRgba(teamColor, 0.25);
  const homeText   = teamColor;

  const daysInMonth = new Date(year, month, 0).getDate();
  const rawFirst    = new Date(year, month - 1, 1).getDay();
  const firstCell   = state.weekStart === 'mon'
    ? (rawFirst === 0 ? 6 : rawFirst - 1)
    : rawFirst;
  const rows = Math.ceil((firstCell + daysInMonth) / 7);

  const isLandscape = W > H;
  const BASE = isLandscape ? H : W;  // 폰트·셀 기준 치수

  const { cellScale, lsCellScale } = CAL_SIZE_SCALE[state.calSize];
  const cellH = BASE * (isLandscape ? lsCellScale : cellScale);
  const calW  = cellH * CAL_SQUARE;  // 5주 기준 1:1 정사각형
  // 모바일: 항상 가로 중앙 / PC: 좌측 or 중앙 (일러스트는 오른쪽)
  const calX = isLandscape
    ? (state.calPos === 'center' ? (W - calW) / 2 : W * 0.05)
    : (W - calW) / 2;
  const cellW = calW / 7;

  const fs = {
    monthTitle: cellH * 0.36,
    dayLabel:   cellH * 0.19,
    dateNum:    cellH * 0.20,
  };

  const headerH = fs.monthTitle * 1.7;
  const labelH  = fs.dayLabel   * 2.0;
  const calH    = headerH + labelH + rows * cellH;

  // ── 달력 수직 위치 (세이프존 반영)
  // PC 가로형은 상태바/홈 인디케이터 없으므로 여백 최소화
  const safeTop    = isLandscape ? H * 0.05 : H * SAFE_ZONE.top;
  const safeBottom = isLandscape ? H * 0.05 : H * SAFE_ZONE.bottom;
  const safeAreaH  = H - safeTop - safeBottom;
  // PC: 세로는 항상 중앙 / 모바일: top=상단, center=중앙
  const calY = isLandscape
    ? safeTop + (safeAreaH - calH) / 2
    : (state.calPos === 'top'
        ? safeTop + cellH * 0.3
        : safeTop + (safeAreaH - calH) / 2);

  // 라이트 모드(어두운 글씨) ↔ 다크 모드(밝은 글씨)
  const isLightText = state.textMode === 'light';

  // ── 달력 반투명 배경 패널
  if (state.calBgPanel === 'on') {
    const pp = cellH * 0.35;
    ctx.beginPath();
    ctx.roundRect(calX - pp, calY - pp, calW + pp * 2, calH + pp * 2, cellH * 0.28);
    ctx.fillStyle = isLightText ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)';
    ctx.fill();
  }

  // ── 월 제목
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font         = `700 ${fs.monthTitle}px 'Pretendard', sans-serif`;
  ctx.fillStyle    = C.title;
  ctx.fillText(`${year}.${String(month).padStart(2, '0')}`, calX, calY + headerH * 0.75);

  // ── 요일 헤더
  DAY_LABELS[state.weekStart].forEach((name, i) => {
    const isSunCol = (state.weekStart === 'sun' && i === 0) || (state.weekStart === 'mon' && i === 6);
    const isSatCol = (state.weekStart === 'sun' && i === 6) || (state.weekStart === 'mon' && i === 5);
    ctx.font      = `400 ${fs.dayLabel}px 'Pretendard', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isSunCol ? C.dateSun : isSatCol ? C.dateSat : C.dayLabel;
    ctx.fillText(name, calX + i * cellW + cellW / 2, calY + headerH + labelH * 0.78);
  });

  // ── 날짜 셀
  const gridY = calY + headerH + labelH;

  for (let day = 1; day <= daysInMonth; day++) {
    const idx = firstCell + day - 1;
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const cx  = calX + col * cellW;
    const cy  = gridY + row * cellH;

    const isSunCol  = (state.weekStart === 'sun' && col === 0) || (state.weekStart === 'mon' && col === 6);
    const isSatCol  = (state.weekStart === 'sun' && col === 6) || (state.weekStart === 'mon' && col === 5);
    const dateColor = isSunCol ? C.dateSun : isSatCol ? C.dateSat : C.dateNormal;

    ctx.font         = `500 ${fs.dateNum}px 'Pretendard', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle    = dateColor;
    const dateBaseY  = cy + fs.dateNum * 1.1;
    ctx.fillText(String(day), cx + cellW * 0.1, dateBaseY);

    const game = games[day];
    if (!game) continue;

    const baseSize = cellH * DAY_SPACING[state.cellGap];
    const iconSize = baseSize * ICON_SIZE_SCALE[state.iconSize];
    const circleR  = iconSize * 0.60;
    const circleX  = cx + cellW / 2;
    const circleY  = dateBaseY + circleR + cellH * 0.05;

    const isInitial = state.logoStyle === 'initial';

    // 원형 배경
    // · 심볼(initial): 항상 표시 — 홈=팀 색 진하게, 어웨이=검정
    // · 그 외: iconStyle !== 'none' 일 때만
    if (isInitial || state.iconStyle !== 'none') {
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
      ctx.fillStyle = game.isHome ? homeCircle : C.awayCircle;
      ctx.fill();
    }

    const iconCache = iconCacheAll[state.logoStyle] || {};

    if (iconCache[game.opponent]) {
      // 비율 유지하며 circleR 기준 fit
      const cachedImg = iconCache[game.opponent];
      const aspect    = cachedImg.naturalWidth / cachedImg.naturalHeight;
      const fitScale  = isInitial ? 0.88 : (state.logoStyle === 'emblem' ? 1.15 : 1.0);
      const fitSize   = iconSize * fitScale;
      let drawW, drawH;
      if (aspect >= 1) { drawW = fitSize; drawH = fitSize / aspect; }
      else             { drawH = fitSize; drawW = fitSize * aspect; }
      ctx.drawImage(cachedImg, circleX - drawW / 2, circleY - drawH / 2, drawW, drawH);

      // 뱃지 (iconStyle === 'badge')
      if (state.iconStyle === 'badge') {
        const badgeR = iconSize * 0.25;
        const badgeX = circleX + iconSize / 2 - badgeR * 0.5;
        const badgeY = circleY - iconSize / 2 + badgeR * 0.5;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = game.isHome ? teamColor : 'rgba(110,110,110,0.92)';
        ctx.fill();
        ctx.font         = `700 ${badgeR * 1.1}px 'Pretendard', sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#ffffff';
        ctx.fillText(game.isHome ? 'H' : 'A', badgeX, badgeY);
        ctx.textBaseline = 'alphabetic';
      }
    } else {
      // 이미지 없을 때 텍스트 fallback
      ctx.font         = `600 ${circleR * 0.68}px 'Pretendard', sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = game.isHome ? homeText : C.awayText;
      ctx.fillText(TEAM_SHORT[game.opponent] || game.opponent, circleX, circleY);
      ctx.textBaseline = 'alphabetic';
    }
  }

}

/* ─── 캔버스 미리보기 스케일 ─────────────────────────── */
function scaleCanvas() {
  const wrap  = canvas.parentElement;
  const maxW  = wrap.clientWidth  - 2;
  const maxH  = wrap.clientHeight - 2;
  const ratio = canvas.width / canvas.height;
  const fitW  = Math.min(maxW, maxH * ratio);
  canvas.style.width  = `${fitW}px`;
  canvas.style.height = `${fitW / ratio}px`;
}

/* ─── 상태 변경 헬퍼 ─────────────────────────────────── */
function setTeam(teamKey) {
  state.team = teamKey;
  document.querySelectorAll('.team-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.team === teamKey)
  );
  const cur = TEAM_SHORT[teamKey] || teamKey;
  const el = document.getElementById('team-current');
  const badge = document.getElementById('m-badge-team');
  if (el)    el.textContent    = cur;
  if (badge) badge.textContent = cur;
  document.getElementById('team-accordion')?.classList.remove('open');
  if (state.bgFilter !== 'all' && state.bgFilter !== 'common') {
    renderBgSlider(getFilteredWallpapers());
  }
  render();
}

function setMonth(month) {
  state.month = month;
  document.querySelectorAll('.month-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.month, 10) === month)
  );
  const label = `${month}월`;
  const el    = document.getElementById('month-current');
  const badge = document.getElementById('m-badge-month');
  if (el)    el.textContent    = label;
  if (badge) badge.textContent = label;
  document.getElementById('month-accordion')?.classList.remove('open');
  render();
}

/* ─── calPos 라벨 & 슬라이더 레이아웃 갱신 ─────────── */
function updateCalPosLabels() {
  const isLandscape = CANVAS_RATIOS[state.ratio].w > CANVAS_RATIOS[state.ratio].h;
  document.querySelectorAll('[data-calpos="top"]').forEach(btn => {
    btn.textContent = isLandscape ? '좌측' : '상단';
  });
  // 배경 슬라이더 썸네일 비율 전환
  document.querySelectorAll('.bg-slider').forEach(el => {
    el.classList.toggle('bg-slider--landscape', isLandscape);
  });
}

/* ─── 공통 토글 이벤트 헬퍼 ─────────────────────────── */
function bindToggle(selector, handler) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => handler(btn));
  });
}

/* ─── 업로드 핸들러 ──────────────────────────────────── */
function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    document.querySelectorAll('.bg-thumb').forEach(b => b.classList.remove('active'));
    state.bgImage = img;
    render();
  };
  img.src = URL.createObjectURL(file);
}
document.getElementById('bg-upload')?.addEventListener('change', handleBgUpload);
document.getElementById('m-bg-upload')?.addEventListener('change', handleBgUpload);

/* ─── 다운로드 ───────────────────────────────────────── */
function doDownload() {
  const team  = TEAM_SHORT[state.team] || state.team;
  const month = String(state.month).padStart(2, '0');
  const link  = document.createElement('a');
  link.download = `kbo-2026-${month}-${team}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function doDownloadBg() {
  const { w, h } = CANVAS_RATIOS[state.ratio];
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w; offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');
  if (state.bgImage) {
    const scale = Math.max(w / state.bgImage.width, h / state.bgImage.height);
    const sw = state.bgImage.width  * scale;
    const sh = state.bgImage.height * scale;
    offCtx.drawImage(state.bgImage, (w - sw) / 2, (h - sh) / 2, sw, sh);
  } else {
    offCtx.fillStyle = '#0d1117';
    offCtx.fillRect(0, 0, w, h);
  }
  const team  = TEAM_SHORT[state.team] || state.team;
  const month = String(state.month).padStart(2, '0');
  const link  = document.createElement('a');
  link.download = `kbo-2026-${month}-${team}-bg.png`;
  link.href = offCanvas.toDataURL('image/png');
  link.click();
}

document.getElementById('download-btn')?.addEventListener('click', doDownload);
document.getElementById('mobile-download-btn')?.addEventListener('click', doDownload);
document.getElementById('download-bg-btn')?.addEventListener('click', doDownloadBg);
document.getElementById('mobile-download-bg-btn')?.addEventListener('click', doDownloadBg);

/* ─── 컨트롤 이벤트 ──────────────────────────────────── */

// 팀
document.querySelectorAll('.team-btn').forEach(btn =>
  btn.addEventListener('click', () => setTeam(btn.dataset.team))
);

// 월
document.querySelectorAll('.month-btn').forEach(btn =>
  btn.addEventListener('click', () => setMonth(parseInt(btn.dataset.month, 10)))
);

// 달력 크기
bindToggle('[data-calsize]', btn => {
  document.querySelectorAll('[data-calsize]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-calsize="${btn.dataset.calsize}"]`).forEach(b => b.classList.add('active'));
  state.calSize = btn.dataset.calsize;
  render();
});

// 아이콘 크기
bindToggle('[data-iconsize]', btn => {
  document.querySelectorAll('[data-iconsize]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-iconsize="${btn.dataset.iconsize}"]`).forEach(b => b.classList.add('active'));
  state.iconSize = btn.dataset.iconsize;
  render();
});

// 주 시작
bindToggle('[data-week]', btn => {
  document.querySelectorAll('[data-week]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-week="${btn.dataset.week}"]`).forEach(b => b.classList.add('active'));
  state.weekStart = btn.dataset.week;
  render();
});

// 일 간격
bindToggle('[data-cellgap]', btn => {
  document.querySelectorAll('[data-cellgap]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-cellgap="${btn.dataset.cellgap}"]`).forEach(b => b.classList.add('active'));
  state.cellGap = btn.dataset.cellgap;
  render();
});

// 로고 스타일
bindToggle('[data-logostyle]', btn => {
  document.querySelectorAll('[data-logostyle]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-logostyle="${btn.dataset.logostyle}"]`).forEach(b => b.classList.add('active'));
  state.logoStyle = btn.dataset.logostyle;
  render();
});

// 아이콘 배경 스타일 (none / bg / badge)
bindToggle('[data-iconstyle]', btn => {
  document.querySelectorAll('[data-iconstyle]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-iconstyle="${btn.dataset.iconstyle}"]`).forEach(b => b.classList.add('active'));
  state.iconStyle = btn.dataset.iconstyle;
  render();
});

// 달력 위치
bindToggle('[data-calpos]', btn => {
  document.querySelectorAll('[data-calpos]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-calpos="${btn.dataset.calpos}"]`).forEach(b => b.classList.add('active'));
  state.calPos = btn.dataset.calpos;
  render();
});

// 달력 배경 패널
bindToggle('[data-calbgpanel]', btn => {
  document.querySelectorAll('[data-calbgpanel]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-calbgpanel="${btn.dataset.calbgpanel}"]`).forEach(b => b.classList.add('active'));
  state.calBgPanel = btn.dataset.calbgpanel;
  render();
});


// 캔버스 비율
bindToggle('[data-ratio]', btn => {
  document.querySelectorAll('[data-ratio]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-ratio="${btn.dataset.ratio}"]`).forEach(b => b.classList.add('active'));
  state.ratio = btn.dataset.ratio;
  updateCalPosLabels();
  renderBgSlider(getFilteredWallpapers());
  render();
});

// 글씨 모드
bindToggle('[data-textmode]', btn => {
  document.querySelectorAll('[data-textmode]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-textmode="${btn.dataset.textmode}"]`).forEach(b => b.classList.add('active'));
  state.textMode = btn.dataset.textmode;
  render();
});

/* ─── 데스크탑: 아코디언 ─────────────────────────────── */
['team', 'month'].forEach(key => {
  document.getElementById(`${key}-header`)?.addEventListener('click', () => {
    document.getElementById(`${key}-accordion`)?.classList.toggle('open');
  });
});

/* ─── 데스크탑: 상세 설정 패널 ──────────────────────── */
document.getElementById('advanced-toggle')?.addEventListener('click', () => {
  const panel  = document.getElementById('advanced-panel');
  const toggle = document.getElementById('advanced-toggle');
  const isOpen = panel.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
});

document.querySelectorAll('.adv-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.adv-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.adv-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`adv-pane-${tab.dataset.advTab}`)?.classList.add('active');
  });
});

/* ─── 모바일: 탭 전환 ────────────────────────────────── */
document.querySelectorAll('.m-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.m-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`m-panel-${tab.dataset.mPanel}`)?.classList.add('active');
  });
});

/* ─── 배경 슬라이더 드래그 스크롤 ───────────────────── */
function enableDragScroll(el) {
  let isDown = false, startX, scrollLeft, moved = false;
  let velX = 0, lastX = 0, rafId = null;

  function momentum() {
    if (Math.abs(velX) < 0.5) return;
    el.scrollLeft -= velX;
    velX *= 0.92;
    rafId = requestAnimationFrame(momentum);
  }

  el.addEventListener('mousedown', e => {
    cancelAnimationFrame(rafId);
    isDown = true; moved = false; velX = 0;
    el.style.cursor = 'grabbing';
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    lastX = e.pageX;
  });

  const end = () => {
    if (!isDown) return;
    isDown = false;
    el.style.cursor = 'grab';
    el.classList.remove('dragging');
    rafId = requestAnimationFrame(momentum);
  };
  el.addEventListener('mouseleave', end);
  el.addEventListener('mouseup', end);

  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.pageX - el.offsetLeft - startX;
    if (!moved && Math.abs(dx) > 4) { moved = true; el.classList.add('dragging'); }
    if (!moved) return;
    e.preventDefault();
    velX = lastX - e.pageX;
    lastX = e.pageX;
    el.scrollLeft = scrollLeft - dx;
  });

  el.style.cursor = 'grab';
}

/* ─── 초기화 ─────────────────────────────────────────── */
async function init() {
  await document.fonts.ready;
  await Promise.all([loadSchedule(), loadWallpapers(), preloadIcons()]);

  // 이번 달 기본값 적용 (배경은 renderBgSlider 첫 항목 자동선택으로 처리)
  setMonth(MONTHLY_DEFAULTS.month);

  // 드래그 스크롤 활성화
  ['bg-slider', 'm-bg-slider'].forEach(id => {
    const el = document.getElementById(id);
    if (el) enableDragScroll(el);
  });

  window.addEventListener('resize', scaleCanvas);
}

init();
