'use strict';

const CARD_W = 1080;
const CARD_H = 1920;

let currentTpl = 'intro';
let introItems = [];
let hlItems    = [];
let itemUid    = 0;

const storyCard   = document.getElementById('storyCard');
const downloadBtn = document.getElementById('downloadBtn');

// ── 탭 전환
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tpl-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    currentTpl = btn.dataset.tpl;
    document.getElementById(`form-${currentTpl}`).classList.add('active');
    renderCard();
  });
});

// ── 입력 리스너 (공통)
document.querySelectorAll('.tpl-form input, .tpl-form textarea').forEach(el => {
  el.addEventListener('input', renderCard);
});

// ── 항목 추가 버튼
document.getElementById('add-intro-item').addEventListener('click', () => {
  if (introItems.length >= 6) return;
  addIntroItem();
  renderCard();
});
document.getElementById('add-hl-item').addEventListener('click', () => {
  if (hlItems.length >= 6) return;
  addHlItem();
  renderCard();
});

downloadBtn.addEventListener('click', downloadCard);


// ════════════════════════════════════════════════
// 항목 폼
// ════════════════════════════════════════════════

function addIntroItem(emoji = '', text = '') {
  const id = ++itemUid;
  introItems.push({ id, emoji, text });

  const container = document.getElementById('intro-items');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.dataset.id = id;
  div.innerHTML = `
    <input type="text" class="input-emoji" placeholder="⚾" maxlength="2" value="${esc(emoji)}">
    <input type="text" class="input-text" placeholder="항목 내용" value="${esc(text)}">
    <button class="btn-remove-item" title="삭제">✕</button>
  `;
  div.querySelector('.input-emoji').addEventListener('input', e => {
    introItems.find(i => i.id === id).emoji = e.target.value;
    renderCard();
  });
  div.querySelector('.input-text').addEventListener('input', e => {
    introItems.find(i => i.id === id).text = e.target.value;
    renderCard();
  });
  div.querySelector('.btn-remove-item').addEventListener('click', () => {
    introItems = introItems.filter(i => i.id !== id);
    div.remove();
    renderCard();
  });
  container.appendChild(div);
}

function addHlItem(name = '', desc = '') {
  const id = ++itemUid;
  hlItems.push({ id, name, desc });

  const container = document.getElementById('hl-items');
  const div = document.createElement('div');
  div.className = 'item-row hl-item-row';
  div.dataset.id = id;
  div.innerHTML = `
    <input type="text" class="input-name" placeholder="Q&amp;A" value="${esc(name)}">
    <input type="text" class="input-desc" placeholder="설명" value="${esc(desc)}">
    <button class="btn-remove-item" title="삭제">✕</button>
  `;
  div.querySelector('.input-name').addEventListener('input', e => {
    hlItems.find(i => i.id === id).name = e.target.value;
    renderCard();
  });
  div.querySelector('.input-desc').addEventListener('input', e => {
    hlItems.find(i => i.id === id).desc = e.target.value;
    renderCard();
  });
  div.querySelector('.btn-remove-item').addEventListener('click', () => {
    hlItems = hlItems.filter(i => i.id !== id);
    div.remove();
    renderCard();
  });
  container.appendChild(div);
}


// ════════════════════════════════════════════════
// 카드 렌더링
// ════════════════════════════════════════════════

function renderCard() {
  if (currentTpl === 'intro')     renderIntroCard();
  else if (currentTpl === 'highlight') renderHighlightCard();
  else                             renderFreeCard();
}

function renderIntroCard() {
  const handle = val('intro-handle') || '@kimseryuk';
  const title  = val('intro-title')  || '이 계정은.';
  const desc   = val('intro-desc');

  const itemsHtml = introItems.map(item => `
    <div class="sc-item">
      <span class="sc-item-emoji">${esc(item.emoji)}</span>
      <span class="sc-item-text">${esc(item.text)}</span>
    </div>
  `).join('');

  storyCard.innerHTML = `
    <div class="sc-intro">
      <div class="sc-handle">${esc(handle)}</div>
      <div class="sc-title-block">
        <div class="sc-title">${esc(title)}</div>
        ${desc ? `<div class="sc-desc">${nl(desc)}</div>` : ''}
      </div>
      ${introItems.length ? `<div class="sc-divider"></div><div class="sc-items">${itemsHtml}</div>` : ''}
      <div class="sc-footer">${esc(handle)}</div>
    </div>
  `;
}

function renderHighlightCard() {
  const handle   = val('hl-handle')   || '@kimseryuk';
  const title    = val('hl-title')    || '하이라이트 안내';
  const subtitle = val('hl-subtitle') || '';

  const itemsHtml = hlItems.map((item, idx) => `
    <div class="sc-hl-item${idx < hlItems.length - 1 ? ' has-border' : ''}">
      <div class="sc-hl-name">${esc(item.name)}</div>
      ${item.desc ? `<div class="sc-hl-desc">${esc(item.desc)}</div>` : ''}
    </div>
  `).join('');

  storyCard.innerHTML = `
    <div class="sc-highlight">
      <div class="sc-header-block">
        <div class="sc-label">highlight guide</div>
        <div class="sc-title">${esc(title)}</div>
        ${subtitle ? `<div class="sc-subtitle">${esc(subtitle)}</div>` : ''}
      </div>
      <div class="sc-hl-items">${itemsHtml}</div>
      <div class="sc-footer">${esc(handle)}</div>
    </div>
  `;
}

function renderFreeCard() {
  const label    = val('free-label');
  const headline = val('free-headline');
  const body     = val('free-body');
  const sub      = val('free-sub');

  storyCard.innerHTML = `
    <div class="sc-free">
      ${label    ? `<div class="sc-label">${esc(label)}</div>` : ''}
      <div class="sc-free-body">
        ${headline ? `<div class="sc-free-headline">${nl(headline)}</div>` : ''}
        ${body     ? `<div class="sc-free-text">${nl(body)}</div>` : ''}
      </div>
      ${sub ? `<div class="sc-footer">${esc(sub)}</div>` : ''}
    </div>
  `;
}


// ════════════════════════════════════════════════
// 다운로드
// ════════════════════════════════════════════════

async function downloadCard() {
  downloadBtn.disabled = true;
  downloadBtn.textContent = '저장 중...';

  const offscreen = document.createElement('div');
  Object.assign(offscreen.style, {
    position:   'fixed',
    top:        '-99999px',
    left:       '-99999px',
    width:      `${CARD_W}px`,
    height:     `${CARD_H}px`,
    overflow:   'hidden',
    zIndex:     '-9999',
  });
  document.body.appendChild(offscreen);

  const clone = storyCard.cloneNode(true);
  clone.style.position        = 'relative';
  clone.style.width           = `${CARD_W}px`;
  clone.style.height          = `${CARD_H}px`;
  clone.style.transform       = 'none';
  clone.style.transformOrigin = 'top left';
  offscreen.appendChild(clone);

  try {
    const canvas = await html2canvas(offscreen, {
      scale:           1,
      width:           CARD_W,
      height:          CARD_H,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#0d1117',
    });
    const url = canvas.toDataURL('image/png');
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `story-${currentTpl}-${Date.now()}.png`;
    a.click();
  } finally {
    document.body.removeChild(offscreen);
    downloadBtn.disabled    = false;
    downloadBtn.textContent = '↓ 저장';
  }
}


// ════════════════════════════════════════════════
// 유틸
// ════════════════════════════════════════════════

function val(id) { return document.getElementById(id).value.trim(); }
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function nl(str) { return esc(str).replace(/\n/g, '<br>'); }


// ── 초기화: 기본 항목
addIntroItem('⚾', '경기 리뷰 & 기록');
addIntroItem('🎨', '팬아트 & 만화');
addIntroItem('❓', 'Q&A 팬들과의 대화');

addHlItem('Q&A',  '팬들의 질문과 답변 모음');
addHlItem('시즌',  '경기별 기록과 리뷰');
addHlItem('만화',  '선수 캐릭터 작품');

renderCard();
