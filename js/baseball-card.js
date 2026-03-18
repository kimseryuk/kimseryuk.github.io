/**
 * Baseball Card Generator — app.js
 * - 로컬스토리지 자동 저장/복원
 * - Q&A 쌍 순서 변경 (▲▼ 버튼 + 드래그 앤 드롭)
 */

'use strict';

// ── 상수
const CARD_W      = 1080;
const CARD_H      = 1920;
const MAX_PAIRS   = 10;
const STORAGE_KEY = 'baseball_card_gen_v1';

// ── 상태
// cards: [{ id: number, pairs: [{ id: number, q: string, a: string, img: string|null }] }]
let cards   = [];
let cardUid = 0;
let pairUid = 0;

// ── 드래그 상태
let _drag = null;  // { cardId, pairId }

// ── 저장 타이머
let _saveTimer  = null;
let _badgeTimer = null;

// ── DOM
const cardForms    = document.getElementById('cardForms');
const previewGrid  = document.getElementById('previewGrid');
const addCardBtn   = document.getElementById('addCardBtn');
const resetBtn     = document.getElementById('resetBtn');
const exportBtn    = document.getElementById('exportBtn');
const importInput  = document.getElementById('importInput');
const saveBadge    = document.getElementById('saveBadge');

addCardBtn.addEventListener('click', addCard);
resetBtn.addEventListener('click', resetAll);
exportBtn.addEventListener('click', exportJSON);
importInput.addEventListener('change', importJSON);
document.getElementById('loadSheetBtn').addEventListener('click', loadFromSheet);

// 초기화: 저장 데이터 복원 → 없으면 기본 카드 1장 생성
if (!loadFromStorage()) {
  addCard();
}


// ════════════════════════════════════════════════
// 로컬스토리지
// ════════════════════════════════════════════════

/**
 * 현재 cards 데이터를 localStorage에 저장.
 * immediate=false이면 600ms 디바운스(입력 중 과도한 쓰기 방지).
 * 용량 초과 시 이미지 제외 후 재시도.
 */
function saveToStorage(immediate = false) {
  const doSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      showSaveBadge('✓ 저장됨');
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        try {
          const noImg = cards.map(c => ({
            ...c,
            pairs: c.pairs.map(p => ({ ...p, img: null })),
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(noImg));
          showSaveBadge('⚠ 이미지 제외 저장 (용량 초과)');
        } catch {
          showSaveBadge('✗ 저장 실패 (용량 부족)');
        }
      }
    }
  };

  if (immediate) {
    clearTimeout(_saveTimer);
    doSave();
  } else {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(doSave, 600);
  }
}

/**
 * localStorage에서 데이터 복원.
 * 성공하면 true, 데이터 없으면 false 반환.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return false;

    cards   = data;
    cardUid = data.reduce((m, c) => Math.max(m, c.id), 0);
    pairUid = data.reduce((m, c) => c.pairs.reduce((mp, p) => Math.max(mp, p.id), m), 0);

    removeEmptyState();

    data.forEach(card => {
      renderCardForm(card);
      renderCardPreview(card);

      card.pairs.forEach(pair => {
        renderPairForm(card.id, pair);
        renderPairPreview(card.id, pair);
        syncPairPreview(pair);

        // 텍스트 폼 값 복원
        const qEl = document.getElementById(`pfq-${pair.id}`);
        const aEl = document.getElementById(`pfa-${pair.id}`);
        if (qEl) qEl.value = pair.q;
        if (aEl) aEl.value = pair.a;

        // 썸네일 복원
        if (pair.img) {
          const tw = document.getElementById(`tw-${pair.id}`);
          const ti = document.getElementById(`ti-${pair.id}`);
          if (tw) tw.style.display = 'block';
          if (ti) ti.src = pair.img;
        }
      });

      updatePairLabels(card.id);
      updateAddPairBtn(card.id);
    });

    updateAllCardLabels();
    return true;
  } catch (e) {
    console.warn('[Card Generator] 저장 데이터 로드 실패:', e);
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

// ════════════════════════════════════════════════
// JSON 내보내기 / 불러오기
// ════════════════════════════════════════════════

/** 현재 cards 데이터를 JSON 파일로 다운로드 */
function exportJSON() {
  if (cards.length === 0) {
    alert('내보낼 카드 데이터가 없습니다.');
    return;
  }

  const now      = new Date();
  const stamp    = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const filename = `baseball_cards_${stamp}.json`;

  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);

  showSaveBadge(`✓ ${filename} 저장됨`);
}

/** JSON 파일을 불러와 cards 복원 */
function importJSON() {
  const file = importInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      if (!Array.isArray(data) || data.length === 0) {
        alert('올바른 카드 데이터 파일이 아닙니다.');
        return;
      }
      // 간단한 구조 검증
      const valid = data.every(c => Number.isInteger(c.id) && Array.isArray(c.pairs));
      if (!valid) {
        alert('파일 구조가 맞지 않습니다.');
        return;
      }

      const merge = cards.length > 0 && confirm(
        `현재 카드 ${cards.length}장이 있습니다.\n` +
        `[확인] 기존 데이터에 추가\n[취소] 기존 데이터를 지우고 교체`
      );

      if (!merge) {
        // 교체: 전체 초기화 후 복원
        cards = [];
        cardUid = 0;
        pairUid = 0;
        cardForms.innerHTML = '';
        previewGrid.innerHTML = '';
        removeEmptyState();
      }

      // UID 충돌 방지: 가져온 데이터의 ID를 현재 최대값 기준으로 offset
      const cardOffset = cardUid;
      const pairOffset = pairUid;

      data.forEach(card => {
        card.id += cardOffset;
        card.pairs.forEach(p => { p.id += pairOffset; });
        cardUid = Math.max(cardUid, card.id);
        pairUid = Math.max(pairUid, ...card.pairs.map(p => p.id));
        cards.push(card);

        renderCardForm(card);
        renderCardPreview(card);

        card.pairs.forEach(pair => {
          renderPairForm(card.id, pair);
          renderPairPreview(card.id, pair);
          syncPairPreview(pair);

          const qEl = document.getElementById(`pfq-${pair.id}`);
          const aEl = document.getElementById(`pfa-${pair.id}`);
          if (qEl) qEl.value = pair.q;
          if (aEl) aEl.value = pair.a;

          if (pair.img) {
            const tw = document.getElementById(`tw-${pair.id}`);
            const ti = document.getElementById(`ti-${pair.id}`);
            if (tw) tw.style.display = 'block';
            if (ti) ti.src = pair.img;
          }
        });

        updatePairLabels(card.id);
        updateAddPairBtn(card.id);
      });

      updateAllCardLabels();
      saveToStorage(true);
      showSaveBadge(`✓ ${data.length}장 불러옴`);

    } catch {
      alert('JSON 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      importInput.value = '';
    }
  };
  reader.readAsText(file);
}

// ════════════════════════════════════════════════
// 구글 시트 자동 불러오기
// ════════════════════════════════════════════════

const SHEET_ID = '1-zC443uc8x8avYprKUVijO5aYPVdaQ9dWrt3Ba6Cplg';

// ── 카드 내부 가용 높이 (1920 - safe-top 200 - header 88 - safe-bottom 180)
const CARD_CONTENT_H = 1452;
// ── 카드 내부 가용 너비 (1080 - 좌우 패딩 80*2)
const CARD_INNER_W   = 920;

/**
 * 텍스트 길이 기반으로 한 Q&A 쌍이 차지할 픽셀 높이 추정.
 * 폰트/패딩은 CSS와 일치시킴.
 */
function estimatePairHeight(q, a, imgH = 0) {
  const Q_FONT = 32, Q_LINE_H = Q_FONT * 1.45;  // ≈46px
  const A_FONT = 32, A_LINE_H = A_FONT * 1.6;   // ≈51px

  // label(40px) + gap(20px) = 60px 차감
  const TEXT_W = CARD_INNER_W - 40 - 20; // 920px
  // 한글 1글자 ≈ 1em, 영문·숫자 ≈ 0.55em 혼합 평균 0.85em
  const charsPerLineQ = Math.floor(TEXT_W / (Q_FONT * 0.85)); // ≈32
  const charsPerLineA = Math.floor(TEXT_W / (A_FONT * 0.85)); // ≈39

  function lineCount(text, cpl) {
    if (!text) return 1;
    return text.split('\n').reduce((sum, seg) =>
      sum + Math.max(1, Math.ceil(seg.length / cpl)), 0);
  }

  // 패딩 상하(64px) + Q↔A 갭(22px)
  const BASE = 86;
  // 이미지는 80% 너비로 표시됨 → imgH는 applyImage에서 0.8 적용
  const imageH = imgH > 0 ? imgH + 14 : 0;
  return BASE + lineCount(q, charsPerLineQ) * Q_LINE_H
              + lineCount(a, charsPerLineA) * A_LINE_H
              + imageH;
}

/**
 * 높이 추정값 기준으로 pairs를 카드별로 그룹핑.
 * MAX_PAIRS 초과 또는 카드 높이 초과 시 다음 카드로 넘김.
 */
function groupPairsByHeight(pairs) {
  const groups = [];
  let group = [], groupH = 0;

  for (const p of pairs) {
    const h = estimatePairHeight(p.q, p.a, p.imgH || 0);
    const willOverflow = group.length > 0 && (groupH + h > CARD_CONTENT_H);

    if (willOverflow) {
      groups.push(group);
      group  = [p];
      groupH = h;
    } else {
      group.push(p);
      groupH += h;
    }
  }
  if (group.length) groups.push(group);
  return groups;
}

async function loadFromSheet() {
  const btn = document.getElementById('loadSheetBtn');
  const orig = btn.textContent;
  btn.textContent = '불러오는 중...';
  btn.disabled = true;

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${encodeURIComponent('Select *')}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // B열(index 1) = 질문, C열(index 2) = 답변
    const pairs = json.table.rows
      .map(row => ({
        q: row.c[1]?.v ?? '',
        a: row.c[2]?.v ?? '',
      }))
      .filter(p => p.q || p.a);

    if (pairs.length === 0) {
      showSaveBadge('✗ 데이터가 없습니다');
      return;
    }

    // 기존 카드 있으면 교체 여부 확인
    if (cards.length > 0) {
      const replace = confirm(
        `현재 카드 ${cards.length}장이 있습니다.\n시트 데이터로 교체하시겠습니까?\n[취소] 시 작업을 중단합니다.`
      );
      if (!replace) return;
      cards = [];
      cardUid = 0;
      pairUid = 0;
      cardForms.innerHTML = '';
      previewGrid.innerHTML = '';
    }

    removeEmptyState();

    // 텍스트 길이 기반으로 카드별 그룹 산출
    const groups = groupPairsByHeight(pairs);

    groups.forEach(chunk => {
      cardUid++;
      const card = { id: cardUid, pairs: [] };
      cards.push(card);
      renderCardForm(card);
      renderCardPreview(card);

      chunk.forEach(p => {
        pairUid++;
        const pair = { id: pairUid, q: p.q, a: p.a, img: null };
        card.pairs.push(pair);
        renderPairForm(card.id, pair);
        renderPairPreview(card.id, pair);
        syncPairPreview(pair);

        const qEl = document.getElementById(`pfq-${pair.id}`);
        const aEl = document.getElementById(`pfa-${pair.id}`);
        if (qEl) qEl.value = pair.q;
        if (aEl) aEl.value = pair.a;
      });

      updatePairLabels(card.id);
      updateAddPairBtn(card.id);
    });

    updateAllCardLabels();
    saveToStorage(true);
    showSaveBadge(`✓ ${cards.length}장 생성 완료 (${pairs.length}개 Q&A)`);

  } catch (e) {
    console.error('[loadFromSheet]', e);
    showSaveBadge('✗ 시트 불러오기 실패');
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
}

/** 전체 초기화 */
function resetAll() {
  if (!confirm('모든 카드 데이터를 삭제하고 초기화하시겠습니까?')) return;
  cards       = [];
  cardUid     = 0;
  pairUid     = 0;
  cardForms.innerHTML  = '';
  previewGrid.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
  showEmptyState();
}

/** 저장 배지 표시 (2.5초 후 자동 숨김) */
function showSaveBadge(msg) {
  if (!saveBadge) return;
  saveBadge.textContent = msg;
  saveBadge.classList.add('visible');
  clearTimeout(_badgeTimer);
  _badgeTimer = setTimeout(() => saveBadge.classList.remove('visible'), 2500);
}


// ════════════════════════════════════════════════
// 카드 CRUD
// ════════════════════════════════════════════════

function addCard() {
  cardUid++;
  const card = { id: cardUid, pairs: [] };
  cards.push(card);

  removeEmptyState();
  renderCardForm(card);
  renderCardPreview(card);
  updateAllCardLabels();

  // 기본 3쌍으로 시작
  for (let i = 0; i < 3; i++) _addPairInternal(card);

  updatePairLabels(card.id);
  updateAddPairBtn(card.id);
  saveToStorage(true);
}

function removeCard(cardId) {
  cards = cards.filter(c => c.id !== cardId);
  document.getElementById(`cform-${cardId}`)?.remove();
  document.getElementById(`cprev-${cardId}`)?.remove();
  updateAllCardLabels();
  if (cards.length === 0) showEmptyState();
  saveToStorage(true);
}


// ════════════════════════════════════════════════
// 쌍(pair) CRUD
// ════════════════════════════════════════════════

/** 내부용: 저장/레이블 갱신 없이 쌍만 추가 */
function _addPairInternal(card) {
  if (card.pairs.length >= MAX_PAIRS) return null;
  pairUid++;
  const pair = { id: pairUid, q: '', a: '', img: null };
  card.pairs.push(pair);
  renderPairForm(card.id, pair);
  renderPairPreview(card.id, pair);
  return pair;
}

/** 버튼으로 쌍 추가 */
function addPair(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card || card.pairs.length >= MAX_PAIRS) return;

  _addPairInternal(card);
  updatePairLabels(cardId);
  updateAddPairBtn(cardId);
  saveToStorage(true);
}

function removePair(cardId, pairId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  card.pairs = card.pairs.filter(p => p.id !== pairId);
  document.getElementById(`pform-${pairId}`)?.remove();
  document.getElementById(`pprev-${pairId}`)?.remove();
  updatePairLabels(cardId);
  updateAddPairBtn(cardId);
  saveToStorage(true);
}

function updatePairData(pairId, key, value) {
  for (const card of cards) {
    const pair = card.pairs.find(p => p.id === pairId);
    if (pair) {
      pair[key] = value;
      syncPairPreview(pair);
      saveToStorage(); // 디바운스 저장
      return;
    }
  }
}


// ════════════════════════════════════════════════
// 쌍 순서 조정
// ════════════════════════════════════════════════

/**
 * pairId를 beforePairId 앞으로 이동.
 * beforePairId === null이면 맨 끝으로 이동.
 * 배열과 DOM을 동시에 갱신.
 */
function movePairTo(cardId, pairId, beforePairId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  const srcIdx = card.pairs.findIndex(p => p.id === pairId);
  if (srcIdx === -1) return;

  // 배열에서 꺼내기
  const [moved] = card.pairs.splice(srcIdx, 1);

  if (beforePairId === null) {
    card.pairs.push(moved);
  } else {
    const tgtIdx = card.pairs.findIndex(p => p.id === beforePairId);
    card.pairs.splice(tgtIdx === -1 ? card.pairs.length : tgtIdx, 0, moved);
  }

  // 폼 DOM 동기화
  const listEl  = document.getElementById(`plist-${cardId}`);
  const srcForm = document.getElementById(`pform-${pairId}`);
  if (listEl && srcForm) {
    if (beforePairId === null) {
      listEl.appendChild(srcForm);
    } else {
      const tgtForm = document.getElementById(`pform-${beforePairId}`);
      if (tgtForm) listEl.insertBefore(srcForm, tgtForm);
    }
  }

  // 미리보기 DOM 동기화
  const pairsEl = document.getElementById(`cpairs-${cardId}`);
  const srcPrev = document.getElementById(`pprev-${pairId}`);
  if (pairsEl && srcPrev) {
    if (beforePairId === null) {
      pairsEl.appendChild(srcPrev);
    } else {
      const tgtPrev = document.getElementById(`pprev-${beforePairId}`);
      if (tgtPrev) pairsEl.insertBefore(srcPrev, tgtPrev);
    }
  }

  updatePairLabels(cardId);
  saveToStorage(true);
}

/** 페이지를 넘어 pair 이동 */
function movePairAcrossCards(fromCardId, pairId, toCardId, toPosition /* 'first' | 'last' */) {
  const fromCard = cards.find(c => c.id === fromCardId);
  const toCard   = cards.find(c => c.id === toCardId);
  if (!fromCard || !toCard) return;

  const srcIdx = fromCard.pairs.findIndex(p => p.id === pairId);
  if (srcIdx === -1) return;

  // 배열에서 꺼내기
  const [moved] = fromCard.pairs.splice(srcIdx, 1);

  // 대상 카드에 삽입
  if (toPosition === 'first') {
    toCard.pairs.unshift(moved);
  } else {
    toCard.pairs.push(moved);
  }

  // 폼 DOM 이동
  const srcForm  = document.getElementById(`pform-${pairId}`);
  const toList   = document.getElementById(`plist-${toCardId}`);
  if (srcForm && toList) {
    if (toPosition === 'first') {
      toList.insertBefore(srcForm, toList.firstChild);
    } else {
      toList.appendChild(srcForm);
    }
  }

  // 미리보기 DOM 이동
  const srcPrev   = document.getElementById(`pprev-${pairId}`);
  const toPairsEl = document.getElementById(`cpairs-${toCardId}`);
  if (srcPrev && toPairsEl) {
    if (toPosition === 'first') {
      toPairsEl.insertBefore(srcPrev, toPairsEl.firstChild);
    } else {
      toPairsEl.appendChild(srcPrev);
    }
  }

  updatePairLabels(fromCardId);
  updatePairLabels(toCardId);
  saveToStorage(true);
}

/** ▲ 위로 — pairId만 받아서 현재 카드를 동적으로 탐색 */
function movePairUp(pairId) {
  const cardIdx = cards.findIndex(c => c.pairs.some(p => p.id === pairId));
  if (cardIdx === -1) return;
  const card = cards[cardIdx];
  const idx  = card.pairs.findIndex(p => p.id === pairId);

  if (idx === 0) {
    // 현재 페이지 첫 번째 → 이전 페이지 맨 끝으로
    if (cardIdx <= 0) return;
    movePairAcrossCards(card.id, pairId, cards[cardIdx - 1].id, 'last');
  } else {
    movePairTo(card.id, pairId, card.pairs[idx - 1].id);
  }
}

/** ▼ 아래로 — pairId만 받아서 현재 카드를 동적으로 탐색 */
function movePairDown(pairId) {
  const cardIdx = cards.findIndex(c => c.pairs.some(p => p.id === pairId));
  if (cardIdx === -1) return;
  const card = cards[cardIdx];
  const idx  = card.pairs.findIndex(p => p.id === pairId);

  if (idx >= card.pairs.length - 1) {
    // 현재 페이지 마지막 → 다음 페이지 맨 앞으로
    if (cardIdx >= cards.length - 1) return;
    movePairAcrossCards(card.id, pairId, cards[cardIdx + 1].id, 'first');
  } else {
    const afterNext = card.pairs[idx + 2];
    movePairTo(card.id, pairId, afterNext ? afterNext.id : null);
  }
}


// ════════════════════════════════════════════════
// 드래그 앤 드롭 — 쌍 순서 변경
// ════════════════════════════════════════════════

function onPairDragStart(e, cardId, pairId) {
  _drag = { cardId, pairId };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(pairId));
  // setTimeout으로 드래그 고스트 렌더 후 클래스 추가
  setTimeout(() => {
    document.getElementById(`pform-${pairId}`)?.classList.add('is-dragging');
  }, 0);
}

function onPairDragEnd(_e, pairId) {
  document.getElementById(`pform-${pairId}`)?.classList.remove('is-dragging');
  document.querySelectorAll('.pair-form.drag-over')
    .forEach(el => el.classList.remove('drag-over'));
  _drag = null;
}

function onPairDragOver(e, cardId, pairId) {
  e.preventDefault();
  if (!_drag || _drag.pairId === pairId || _drag.cardId !== cardId) return;
  e.dataTransfer.dropEffect = 'move';
  // 이전 하이라이트 제거 후 현재 대상만 강조
  document.querySelectorAll('.pair-form.drag-over')
    .forEach(el => el.classList.remove('drag-over'));
  document.getElementById(`pform-${pairId}`)?.classList.add('drag-over');
}

function onPairDragLeave(e, pairId) {
  const el = document.getElementById(`pform-${pairId}`);
  // 자식 요소로 이동하는 경우는 무시
  if (el && !el.contains(e.relatedTarget)) {
    el.classList.remove('drag-over');
  }
}

function onPairDrop(e, cardId, targetPairId) {
  e.preventDefault();
  document.querySelectorAll('.pair-form.drag-over')
    .forEach(el => el.classList.remove('drag-over'));

  if (!_drag || _drag.pairId === targetPairId || _drag.cardId !== cardId) return;

  // 드롭한 위치(targetPair) 앞으로 삽입
  movePairTo(cardId, _drag.pairId, targetPairId);
  _drag = null;
}


// ════════════════════════════════════════════════
// 카드 폼 렌더링
// ════════════════════════════════════════════════

function renderCardForm(card) {
  const el = document.createElement('div');
  el.className = 'card-form';
  el.id = `cform-${card.id}`;

  el.innerHTML = `
    <div class="card-form-header">
      <span class="card-num-label" id="cflabel-${card.id}">CARD 01</span>
      <div class="card-form-actions">
        <button class="btn btn-add-pair" id="addpair-${card.id}"
          onclick="addPair(${card.id})">＋ 쌍 추가</button>
        <button class="btn btn-delete" onclick="removeCard(${card.id})">카드 삭제</button>
      </div>
    </div>
    <div class="pair-list" id="plist-${card.id}"></div>
    <div class="add-pair-row">
      <span class="pair-count-hint" id="pcount-${card.id}"></span>
    </div>
  `;

  cardForms.appendChild(el);
}


// ════════════════════════════════════════════════
// 쌍 폼 렌더링
// ════════════════════════════════════════════════

function renderPairForm(cardId, pair) {
  const list = document.getElementById(`plist-${cardId}`);
  if (!list) return;

  const el = document.createElement('div');
  el.className = 'pair-form';
  el.id = `pform-${pair.id}`;

  // dragover/dragleave/drop은 쌍 전체 영역에서 받음
  el.setAttribute('ondragover',  `onPairDragOver(event, ${cardId}, ${pair.id})`);
  el.setAttribute('ondragleave', `onPairDragLeave(event, ${pair.id})`);
  el.setAttribute('ondrop',      `onPairDrop(event, ${cardId}, ${pair.id})`);

  el.innerHTML = `
    <div class="pair-form-header">
      <div class="drag-handle"
        draggable="true"
        ondragstart="onPairDragStart(event, ${cardId}, ${pair.id})"
        ondragend="onPairDragEnd(event, ${pair.id})"
        title="드래그하여 순서 변경">⠿</div>
      <span class="pair-num-label" id="pflabel-${pair.id}">Q&amp;A 01</span>
      <div class="pair-actions">
        <button class="btn btn-move" onclick="movePairUp(${pair.id})" title="위로">▲</button>
        <button class="btn btn-move" onclick="movePairDown(${pair.id})" title="아래로">▼</button>
        <button class="btn btn-delete" onclick="removePair(${cardId}, ${pair.id})">삭제</button>
      </div>
    </div>
    <div class="pair-form-body">
      <div class="form-group">
        <label>Q · 질문</label>
        <textarea
          id="pfq-${pair.id}"
          placeholder="질문을 입력하세요"
          rows="2"
          oninput="updatePairData(${pair.id}, 'q', this.value)"
        ></textarea>
      </div>
      <div class="form-group">
        <label>A · 답변</label>
        <textarea
          id="pfa-${pair.id}"
          placeholder="답변을 입력하세요"
          rows="3"
          oninput="updatePairData(${pair.id}, 'a', this.value)"
        ></textarea>
      </div>
      <div class="form-group">
        <label>이미지 · 선택 (A 영역에 표시)</label>
        <div class="drop-zone" id="dz-${pair.id}" role="button" tabindex="0">
          <span class="dz-icon">📎</span>
          <div class="dz-text"><strong>클릭</strong>하거나 드래그</div>
          <input type="file" id="fi-${pair.id}" accept="image/*" style="display:none">
        </div>
        <div class="thumb-wrap" id="tw-${pair.id}" style="display:none">
          <img id="ti-${pair.id}" src="" alt="">
          <button class="thumb-remove" onclick="removePairImage(${pair.id})">✕</button>
        </div>
      </div>
    </div>
  `;

  list.appendChild(el);
  setupDropZone(pair.id);
}


// ════════════════════════════════════════════════
// 이미지 드롭존
// ════════════════════════════════════════════════

function setupDropZone(pairId) {
  const dz = document.getElementById(`dz-${pairId}`);
  const fi = document.getElementById(`fi-${pairId}`);

  dz.addEventListener('click',   () => fi.click());
  dz.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); }
  });

  dz.addEventListener('dragenter', e => { e.preventDefault(); dz.classList.add('is-dragover'); });
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('is-dragover'); });
  dz.addEventListener('dragleave', e => {
    if (!dz.contains(e.relatedTarget)) dz.classList.remove('is-dragover');
  });
  dz.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation(); // 쌍 drag-over 이벤트 전파 차단
    dz.classList.remove('is-dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) applyImage(pairId, file);
  });

  fi.addEventListener('change', () => {
    if (fi.files[0]) applyImage(pairId, fi.files[0]);
    fi.value = '';
  });
}

function applyImage(pairId, file) {
  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target.result;
    // 이미지 실제 비율로 카드 내 표시 높이 계산
    const img = new Image();
    img.onload = () => {
      const imgW = CARD_INNER_W * 0.8; // CSS: .a-image { width: 80% }
      const displayH = Math.round(img.naturalHeight * (imgW / img.naturalWidth));
      updatePairData(pairId, 'img',  base64);
      updatePairData(pairId, 'imgH', displayH);
      reflowAllCards();
    };
    img.src = base64;
  };
  reader.readAsDataURL(file);
}

function removePairImage(pairId) {
  updatePairData(pairId, 'img',  null);
  updatePairData(pairId, 'imgH', 0);
  reflowAllCards();
}

/**
 * 전체 쌍을 현재 내용(텍스트+이미지 높이) 기준으로 재배치.
 * 이미지 추가/삭제 시 자동 호출됨.
 */
function reflowAllCards() {
  // 모든 카드의 쌍을 순서대로 수집
  const allPairs = cards.flatMap(c => c.pairs.map(p => ({ ...p })));
  if (allPairs.length === 0) return;

  // UI 초기화 (pairUid 유지 — 기존 pair ID 재사용)
  cards = [];
  cardUid = 0;
  cardForms.innerHTML  = '';
  previewGrid.innerHTML = '';
  removeEmptyState();

  // 새 그룹 산출 → 카드 재생성
  const groups = groupPairsByHeight(allPairs);

  groups.forEach(chunk => {
    cardUid++;
    const card = { id: cardUid, pairs: [] };
    cards.push(card);
    renderCardForm(card);
    renderCardPreview(card);

    chunk.forEach(p => {
      card.pairs.push(p);
      renderPairForm(card.id, p);
      renderPairPreview(card.id, p);
      syncPairPreview(p);

      const qEl = document.getElementById(`pfq-${p.id}`);
      const aEl = document.getElementById(`pfa-${p.id}`);
      if (qEl) qEl.value = p.q;
      if (aEl) aEl.value = p.a;

      if (p.img) {
        const tw = document.getElementById(`tw-${p.id}`);
        const ti = document.getElementById(`ti-${p.id}`);
        if (tw) tw.style.display = 'block';
        if (ti) ti.src = p.img;
      }
    });

    updatePairLabels(card.id);
    updateAddPairBtn(card.id);
  });

  updateAllCardLabels();
  saveToStorage(true);
  showSaveBadge('↺ 카드 자동 재배치됨');
}


// ════════════════════════════════════════════════
// 카드 미리보기 렌더링
// ════════════════════════════════════════════════

function renderCardPreview(card) {
  const wrap = document.createElement('div');
  wrap.className = 'card-preview-wrap';
  wrap.id = `cprev-${card.id}`;

  wrap.innerHTML = `
    <span class="cp-label" id="cplabel-${card.id}">CARD 01</span>
    <div class="card-scale-box">
      <div class="card" id="card-${card.id}">
        <div class="card-safe-top"></div>
        <div class="card-top-space">
          <span class="card-header-label">seryuk Q&A<span class="card-header-dot">.</span></span>
        </div>
        <div class="card-pairs" id="cpairs-${card.id}"></div>
        <div class="card-safe-bottom"></div>
      </div>
    </div>
    <button class="btn btn-download" id="cdl-${card.id}" onclick="downloadCard(${card.id})">
      DOWNLOAD CARD 01
    </button>
  `;

  previewGrid.appendChild(wrap);
}


// ════════════════════════════════════════════════
// 쌍 미리보기 렌더링
// ════════════════════════════════════════════════

function renderPairPreview(cardId, pair) {
  const pairsEl = document.getElementById(`cpairs-${cardId}`);
  if (!pairsEl) return;

  const el = document.createElement('div');
  el.className = 'card-pair';
  el.id = `pprev-${pair.id}`;

  el.innerHTML = `
    <div class="card-q">
      <span class="q-label">Q</span>
      <p class="q-text" id="pq-${pair.id}"></p>
    </div>
    <div class="card-a">
      <span class="a-label">A</span>
      <div class="a-body">
        <div class="a-image is-hidden" id="aimg-wrap-${pair.id}">
          <img id="aimg-${pair.id}" src="" alt="">
        </div>
        <p class="a-text" id="pa-${pair.id}"></p>
      </div>
    </div>
  `;

  pairsEl.appendChild(el);
}

/** 쌍 데이터 → 미리보기 카드 동기화 */
function syncPairPreview(pair) {
  const qEl     = document.getElementById(`pq-${pair.id}`);
  const aEl     = document.getElementById(`pa-${pair.id}`);
  const imgWrap = document.getElementById(`aimg-wrap-${pair.id}`);
  const imgEl   = document.getElementById(`aimg-${pair.id}`);

  if (qEl) qEl.textContent = pair.q;
  if (aEl) aEl.textContent = pair.a;

  if (imgWrap && imgEl) {
    if (pair.img) {
      imgEl.src = pair.img;
      imgWrap.classList.remove('is-hidden');
    } else {
      imgEl.src = '';
      imgWrap.classList.add('is-hidden');
    }
  }
}


// ════════════════════════════════════════════════
// 레이블 & 상태 갱신
// ════════════════════════════════════════════════

function updateAllCardLabels() {
  cards.forEach((card, ci) => {
    const n = String(ci + 1).padStart(2, '0');
    setText(`cflabel-${card.id}`, `CARD ${n}`);
    setText(`cplabel-${card.id}`, `CARD ${n}`);
    setText(`cdl-${card.id}`,     `DOWNLOAD CARD ${n}`);
  });
}

function updatePairLabels(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  card.pairs.forEach((pair, pi) => {
    const n = String(pi + 1).padStart(2, '0');
    setText(`pflabel-${pair.id}`, `Q&A ${n}`);
  });
}

function updateAddPairBtn(cardId) {
  const card  = cards.find(c => c.id === cardId);
  if (!card) return;
  const btn   = document.getElementById(`addpair-${cardId}`);
  const hint  = document.getElementById(`pcount-${cardId}`);
  const count = card.pairs.length;
  if (btn)  btn.disabled = count >= MAX_PAIRS;
  if (hint) hint.textContent = `${count} / ${MAX_PAIRS}쌍`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}


// ════════════════════════════════════════════════
// PNG 다운로드 (html2canvas)
// ════════════════════════════════════════════════

async function downloadCard(cardId) {
  const cardEl = document.getElementById(`card-${cardId}`);
  if (!cardEl) return;

  const ci       = cards.findIndex(c => c.id === cardId);
  const filename = `card_${String(ci + 1).padStart(2, '0')}.png`;
  const btn      = document.getElementById(`cdl-${cardId}`);
  const origText = btn ? btn.textContent : '';

  if (btn) { btn.textContent = '저장 중...'; btn.disabled = true; }

  /**
   * off-screen clone 방식:
   * 미리보기 카드는 transform:scale(0.25) 적용됨.
   * clone에서 transform 제거 → html2canvas가 1080×1920 그대로 캡처.
   * base64 이미지는 allowTaint:true로 CORS 없이 처리.
   */
  const offscreen = document.createElement('div');
  Object.assign(offscreen.style, {
    position:      'fixed',
    top:           '-99999px',
    left:          '-99999px',
    width:         `${CARD_W}px`,
    height:        `${CARD_H}px`,
    overflow:      'hidden',
    zIndex:        '-9999',
    pointerEvents: 'none',
    background:    '#ffffff',
  });

  const clone = cardEl.cloneNode(true);
  clone.style.position        = 'relative';
  clone.style.width           = `${CARD_W}px`;
  clone.style.height          = `${CARD_H}px`;
  clone.style.transform       = 'none';
  clone.style.transformOrigin = 'top left';

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(offscreen, {
      scale:           1,
      width:           CARD_W,
      height:          CARD_H,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#ffffff',
      logging:         false,
      x: 0, y: 0, scrollX: 0, scrollY: 0,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (err) {
    console.error('[Card Generator] 다운로드 오류:', err);
    alert('다운로드 중 오류가 발생했습니다.\n콘솔을 확인해주세요.');
  } finally {
    document.body.removeChild(offscreen);
    const ciNow = cards.findIndex(c => c.id === cardId);
    if (btn) {
      btn.textContent = ciNow >= 0
        ? `DOWNLOAD CARD ${String(ciNow + 1).padStart(2, '0')}`
        : origText;
      btn.disabled = false;
    }
  }
}


// ════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════

function removeEmptyState() {
  previewGrid.querySelector('.empty-state')?.remove();
}

function showEmptyState() {
  previewGrid.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">⚾</span>
      <p>"카드 추가" 버튼으로 카드를 만들어보세요</p>
    </div>
  `;
}
