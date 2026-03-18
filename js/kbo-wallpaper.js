/* ─── 팀 데이터 ──────────────────────────────────────── */
const TEAM_SHORT = {
  KIA: 'KIA', LG: 'LG', Samsung: '삼성', Doosan: '두산',
  KT: 'KT', SSG: 'SSG', Lotte: '롯데', NC: 'NC',
  Hanwha: '한화', Kiwoom: '키움',
};

const TEAM_COLORS = {
  KIA:     '#EA0029',
  LG:      '#C30452',
  Samsung: '#1428A0',
  Doosan:  '#1B3964',
  KT:      '#E31837',
  SSG:     '#CE0E2D',
  Lotte:   '#002955',
  NC:      '#1B4D9B',
  Hanwha:  '#FF6600',
  Kiwoom:  '#820024',
};

const TEAM_ICON_PATH = {
  KIA:     '../wallpapers/icon/icon_kia.png',
  LG:      '../wallpapers/icon/icon_lg.png',
  Samsung: '../wallpapers/icon/icon_samsung.png',
  Doosan:  '../wallpapers/icon/icon_doosan.png',
  KT:      '../wallpapers/icon/icon_kt.png',
  SSG:     '../wallpapers/icon/icon_ssg.png',
  Lotte:   '../wallpapers/icon/icon_lotte.png',
  NC:      '../wallpapers/icon/icon_nc.png',
  Hanwha:  '../wallpapers/icon/icon_hanhwa.png',
  Kiwoom:  '../wallpapers/icon/icon_kiwoom.png',
};

const iconCache = {};

/* ═══════════════════════════════════════════════════════
   이번 달 기본값 — 매달 이 블록만 수정하세요
   ═══════════════════════════════════════════════════════ */
const MONTHLY_DEFAULTS = {
  month:  3,                                       // 이번 달 숫자 (3 = 3월)
  bgPath: '../wallpapers/KakaoTalk_Photo_2026-03-15-21-58-27 001.jpeg', // 이번 달 기본 배경 경로
};
/* ═══════════════════════════════════════════════════════ */

/* ─── 캔버스 비율 ─────────────────────────────────────── */
const CANVAS_RATIOS = {
  r169:  { w: 1080, h: 1920, label: '9:16' },
  r195:  { w: 1080, h: 2340, label: '9:19.5' },
  r209:  { w: 1080, h: 2400, label: '9:20' },
};

/* 세이프 존: 상단(상태바) / 하단(홈 인디케이터) */
const SAFE_ZONE = { top: 0.08, bottom: 0.10 };

const CAL_SIZE_SCALE = {
  small:  { cellScale: 0.082, widthRatio: 0.68 },
  medium: { cellScale: 0.112, widthRatio: 0.84 },
  large:  { cellScale: 0.148, widthRatio: 0.90 },
};
const CAL_MIN_MARGIN = 0.05; // 캔버스 너비의 최소 5% 여백 (양쪽)

/* 아이콘 크기 배율 (기본 크기 기준) */
const ICON_SIZE_SCALE = { small: 0.78, medium: 1.0, large: 1.28 };

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
    credit:     'rgba(255,255,255,0.22)',
  },
  light: {
    title:      '#1a1a1a',
    dayLabel:   'rgba(0,0,0,0.4)',
    dateNormal: '#1a1a1a',
    dateSun:    '#cc2222',
    dateSat:    '#1a55bb',
    awayCircle: 'rgba(100,100,100,0.14)',
    awayText:   'rgba(70,70,70,0.8)',
    credit:     'rgba(0,0,0,0.22)',
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
  useIcon:     true,
  iconStyle:   'badge',   // 'none' | 'bg' | 'badge'
  calPos:      'center',  // 'top' | 'center'
  calBgPanel:  'off',     // 'on' | 'off'
  textShadow:  'off',     // 'off' | 'soft' | 'strong'
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

/* ─── 아이콘 프리로드 ────────────────────────────────── */
function preloadIcons() {
  return Promise.all(
    Object.entries(TEAM_ICON_PATH).map(([key, src]) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => { iconCache[key] = img; resolve(); };
        img.onerror = () => resolve();
        img.src = src;
      })
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
  if (state.bgFilter === 'all')    return wallpaperList;
  if (state.bgFilter === 'common') return wallpaperList.filter(w => !w.team);
  return wallpaperList.filter(w => w.team === state.bgFilter);
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
        // update all filter tabs
        document.querySelectorAll('.bg-filter-btn').forEach(b =>
          b.classList.toggle('active', b.textContent === label && b.parentElement.id === id || false)
        );
        document.querySelectorAll(`#${id} .bg-filter-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // sync sibling container
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
  const year  = 2026;
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

  const pad = W * 0.03;
  const { cellScale, widthRatio } = CAL_SIZE_SCALE[state.calSize];
  const cellH  = W * cellScale;
  const minPad = W * CAL_MIN_MARGIN;
  const calW   = Math.min(W * widthRatio, W - minPad * 2);
  const calX   = (W - calW) / 2;
  const cellW  = calW / 7;

  const fs = {
    monthTitle: cellH * 0.36,
    dayLabel:   cellH * 0.19,
    dateNum:    cellH * 0.20,
    credit:     W * 0.013,
  };

  const headerH = fs.monthTitle * 1.7;
  const labelH  = fs.dayLabel   * 2.0;
  const calH    = headerH + labelH + rows * cellH;

  // ── 달력 수직 위치 (세이프존 반영)
  const safeTop    = H * SAFE_ZONE.top;
  const safeBottom = H * SAFE_ZONE.bottom;
  const safeAreaH  = H - safeTop - safeBottom;
  const calY = state.calPos === 'top'
    ? safeTop + cellH * 0.3
    : safeTop + (safeAreaH - calH) / 2;

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

  // ── 텍스트 그림자 헬퍼
  const shadowSoft   = isLightText ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)';
  const shadowStrong = isLightText ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)';
  function setShadow() {
    if (state.textShadow === 'soft') {
      ctx.shadowBlur = 8;  ctx.shadowColor = shadowSoft;
    } else if (state.textShadow === 'strong') {
      ctx.shadowBlur = 16; ctx.shadowColor = shadowStrong;
    }
  }
  function clearShadow() { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }

  // ── 월 제목
  setShadow();
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font         = `700 ${fs.monthTitle}px 'Pretendard', sans-serif`;
  ctx.fillStyle    = C.title;
  ctx.fillText(`${year}.${String(month).padStart(2, '0')}`, calX, calY + headerH * 0.75);
  clearShadow();

  // ── 요일 헤더
  DAY_LABELS[state.weekStart].forEach((name, i) => {
    const isSunCol = (state.weekStart === 'sun' && i === 0) || (state.weekStart === 'mon' && i === 6);
    const isSatCol = (state.weekStart === 'sun' && i === 6) || (state.weekStart === 'mon' && i === 5);
    setShadow();
    ctx.font      = `400 ${fs.dayLabel}px 'Pretendard', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isSunCol ? C.dateSun : isSatCol ? C.dateSat : C.dayLabel;
    ctx.fillText(name, calX + i * cellW + cellW / 2, calY + headerH + labelH * 0.78);
    clearShadow();
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

    setShadow();
    ctx.font         = `500 ${fs.dateNum}px 'Pretendard', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle    = dateColor;
    const dateBaseY  = cy + fs.dateNum * 1.1;
    ctx.fillText(String(day), cx + cellW * 0.1, dateBaseY);
    clearShadow();

    const game = games[day];
    if (!game) continue;

    const baseSize = cellH * 0.42;
    const iconSize = baseSize * ICON_SIZE_SCALE[state.iconSize];
    const circleR  = iconSize * 0.60;
    const circleX  = cx + cellW / 2;
    const circleY  = dateBaseY + circleR + cellH * 0.05;

    // 원형 배경 (iconStyle !== 'none')
    if (state.iconStyle !== 'none') {
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
      ctx.fillStyle = game.isHome ? homeCircle : C.awayCircle;
      ctx.fill();
    }

    const iconDrawX = circleX - iconSize / 2;
    const iconDrawY = circleY - iconSize / 2;

    if (state.useIcon && iconCache[game.opponent]) {
      ctx.drawImage(iconCache[game.opponent], iconDrawX, iconDrawY, iconSize, iconSize);

      // 뱃지 (iconStyle === 'badge')
      if (state.iconStyle === 'badge') {
        const badgeR = iconSize * 0.25;
        const badgeX = iconDrawX + iconSize - badgeR * 0.5;
        const badgeY = iconDrawY + badgeR * 0.5;
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
      // 텍스트 모드
      ctx.font         = `600 ${circleR * 0.68}px 'Pretendard', sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = game.isHome ? homeText : C.awayText;
      ctx.fillText(TEAM_SHORT[game.opponent] || game.opponent, circleX, circleY);
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ── 출처
  ctx.font      = `400 ${fs.credit}px 'Pretendard', sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = C.credit;
  ctx.fillText('data: koreabaseball.com', W - pad, H - pad * 0.4);
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
document.getElementById('download-btn')?.addEventListener('click', doDownload);
document.getElementById('mobile-download-btn')?.addEventListener('click', doDownload);

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

// 아이콘/텍스트
bindToggle('[data-useicon]', btn => {
  document.querySelectorAll('[data-useicon]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-useicon="${btn.dataset.useicon}"]`).forEach(b => b.classList.add('active'));
  state.useIcon = btn.dataset.useicon === 'true';
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

// 텍스트 그림자
bindToggle('[data-textshadow]', btn => {
  document.querySelectorAll('[data-textshadow]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-textshadow="${btn.dataset.textshadow}"]`).forEach(b => b.classList.add('active'));
  state.textShadow = btn.dataset.textshadow;
  render();
});

// 캔버스 비율
bindToggle('[data-ratio]', btn => {
  document.querySelectorAll('[data-ratio]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-ratio="${btn.dataset.ratio}"]`).forEach(b => b.classList.add('active'));
  state.ratio = btn.dataset.ratio;
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

/* ─── 초기화 ─────────────────────────────────────────── */
async function init() {
  await document.fonts.ready;
  await Promise.all([loadSchedule(), loadWallpapers(), preloadIcons()]);

  // 이번 달 기본값 적용
  setMonth(MONTHLY_DEFAULTS.month);
  if (MONTHLY_DEFAULTS.bgPath) loadBgImage(MONTHLY_DEFAULTS.bgPath);

  window.addEventListener('resize', scaleCanvas);
}

init();
