// ── vote.js — KIA 내야진 투표 ─────────────────────────────
// 보딩 → 투표 → 결과 페이지 흐름

// ─── Firebase 설정 ────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC8095GbmPyLRr381A2ddMCQFDdg-fvlNA",
  authDomain: "baseballvote.firebaseapp.com",
  projectId: "baseballvote",
  storageBucket: "baseballvote.firebasestorage.app",
  messagingSenderId: "8390526421",
  appId: "1:8390526421:web:37f3f0fa1dca3496d3a95c",
  measurementId: "G-8BE0GMLFLF"
};

const COLLECTION     = 'kia-vote-2026';
const LOG_COLLECTION = 'kia-vote-2026-logs';  // 개인 제출 기록

// ─── 상수 ─────────────────────────────────────────────────
const DEADLINE = new Date('2026-03-31T23:59:59+09:00');

const POSITIONS = [
  { id: 'SS', label: '유격수' },
  { id: '2B', label: '2루수' },
  { id: '3B', label: '3루수' },
  { id: '1B', label: '1루수' },
];

// ─── 상태 ─────────────────────────────────────────────────
let players        = [];
let currentTier    = '1군';
let lineup         = emptyLineup();
let draggedPlayer  = null;
let votes          = {};
let db             = null;
let totalVotes     = 0;

function emptyLineup() {
  return {
    SS:  { first: null, second: null },
    '2B': { first: null, second: null },
    '3B': { first: null, second: null },
    '1B': { first: null, second: null },
  };
}

// ─── GA4 이벤트 ───────────────────────────────────────────
function track(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

// ─── 초기화 ───────────────────────────────────────────────
async function init() {
  const closed = isVotingClosed();

  // 헤더 LIVE 배지
  if (closed) {
    const badge = document.getElementById('vote-live-badge');
    if (badge) badge.style.display = 'none';
  }

  // 선수 데이터 로드
  try {
    const res = await fetch('../data/vote-players.json');
    players = await res.json();
  } catch {
    showToast('선수 데이터를 불러오지 못했습니다');
    return;
  }

  // Firebase 초기화 (결과 페이지에서도 필요)
  initFirebase();

  // 결과 미리보기 모드 (?preview)
  if (new URLSearchParams(location.search).has('preview')) {
    showResult(true);
    return;
  }

  // 보딩 페이지 분기
  if (closed) {
    showPage('page-closed');
    track('vote_closed_view');
    document.getElementById('btn-see-result')?.addEventListener('click', () => {
      track('see_final_result');
      showResult(true);
    });
    return;
  }

  // 오프라인 체크
  if (!navigator.onLine) showToast('인터넷 연결을 확인해주세요');

  // 카운트다운
  startCountdown();

  // 보딩 이벤트
  document.getElementById('btn-start').addEventListener('click', startVote);
  document.getElementById('btn-ranking-preview').addEventListener('click', openRankingModal);

  // 오프라인 감지
  window.addEventListener('offline', () => showToast('인터넷 연결이 끊겼습니다'));
  window.addEventListener('online',  () => showToast('인터넷이 복원되었습니다'));

  track('vote_landing_view');
}

function isVotingClosed() {
  return new Date() > DEADLINE;
}

// ─── Firebase ─────────────────────────────────────────────
function initFirebase() {
  if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    console.warn('[vote] Firebase 설정값을 vote.js에 입력해주세요');
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();

    // 투표 집계 구독
    db.collection(COLLECTION).onSnapshot(
      snapshot => {
        votes = {};
        snapshot.forEach(doc => {
          if (doc.id !== '_stats') votes[doc.id] = doc.data().score || 0;
        });
        renderRanking();
      },
      err => console.error('[vote] Firestore 오류:', err)
    );

    // 총 투표수 구독
    db.collection(COLLECTION).doc('_stats').onSnapshot(doc => {
      totalVotes = doc.data()?.totalVotes || 0;
      const el = document.getElementById('total-vote-count');
      if (el) el.textContent = totalVotes.toLocaleString();
    });
  } catch (err) {
    console.error('[vote] Firebase 초기화 실패:', err);
  }
}

// ─── 페이지 전환 ──────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  window.scrollTo(0, 0);
}

// ─── 투표 시작 ────────────────────────────────────────────
function startVote() {
  track('vote_start');
  showPage('page-vote');

  // 선수 풀 탭
  document.querySelectorAll('.pool-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pool-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTier = btn.dataset.tier;
      track('tab_switch', { tier: currentTier });
      renderPool();
    });
  });

  // 슬롯 드롭 이벤트
  initSlotDropTargets();

  // 제출 버튼
  document.getElementById('btn-submit').addEventListener('click', submitVote);

  renderPool();
  renderDiamond();
}

// ─── 선수 풀 ──────────────────────────────────────────────
function renderPool() {
  const grid = document.getElementById('pool-grid');
  grid.innerHTML = '';

  const filtered = players.filter(p => p.tier === currentTier);

  filtered.forEach(player => {
    const usage = getUsage(player.id);
    const isFull = usage >= 2;

    const card = document.createElement('div');
    card.className = `player-card${isFull ? ' is-full' : ''}`;
    card.dataset.playerId = player.id;

    const imgHtml = player.img
      ? `<img class="player-card__img" src="${player.img}" alt="${player.name}">`
      : `<div class="player-card__num">${player.no}</div>`;

    card.innerHTML = `
      ${imgHtml}
      <div class="player-card__name">${player.name}</div>
      <div class="player-card__dots">
        <span class="dot${usage < 2 ? ' dot--on' : ''}"></span>
        <span class="dot${usage < 1 ? ' dot--on' : ''}"></span>
      </div>
    `;

    if (!isFull) {
      card.draggable = true;
      initMouseDrag(card, player);
      initTouchDrag(card, player);
    }

    grid.appendChild(card);
  });
}

function getUsage(playerId) {
  let count = 0;
  Object.values(lineup).forEach(pos => {
    if (pos.first?.id  === playerId) count++;
    if (pos.second?.id === playerId) count++;
  });
  return count;
}

// ─── 다이아몬드 ───────────────────────────────────────────
function renderDiamond() {
  POSITIONS.forEach(({ id }) => {
    renderSlot(id, 'first');
    renderSlot(id, 'second');
  });
  checkComplete();
}

function renderSlot(posId, rank) {
  const slot = document.querySelector(`.slot[data-pos="${posId}"][data-rank="${rank}"]`);
  if (!slot) return;

  const player    = lineup[posId][rank];
  const rankLabel = rank === 'first' ? '주전' : '백업';

  if (player) {
    slot.classList.add('has-player');
    const imgHtml = player.img
      ? `<img class="slot-player-img" src="${player.img}" alt="${player.name}">`
      : `<div class="slot-player-num">${player.no}</div>`;
    slot.innerHTML = `
      <span class="slot-rank slot-rank--${rank}">${rankLabel}</span>
      ${imgHtml}
      <span class="slot-player-name">${player.name}</span>
      <button class="slot-remove" aria-label="제거">×</button>
    `;
    slot.querySelector('.slot-remove').addEventListener('click', e => {
      e.stopPropagation();
      track('player_removed', { pos: posId, rank, player_name: player.name });
      lineup[posId][rank] = null;
      renderPool();
      renderDiamond();
    });
  } else {
    slot.classList.remove('has-player');
    slot.innerHTML = `
      <span class="slot-rank slot-rank--${rank}">${rankLabel}</span>
      <span class="slot-empty-txt">여기에<br>드래그</span>
    `;
  }
}

function dropToSlot(posId, rank) {
  if (!draggedPlayer) return;

  const otherRank = rank === 'first' ? 'second' : 'first';
  if (lineup[posId][otherRank]?.id === draggedPlayer.id) {
    showToast('한 포지션에 같은 선수는 한 번만 배치 가능해요');
    draggedPlayer = null;
    return;
  }

  track('player_placed', {
    pos: posId,
    rank,
    player_name: draggedPlayer.name,
    player_id: draggedPlayer.id,
  });

  lineup[posId][rank] = draggedPlayer;
  draggedPlayer = null;
  renderPool();
  renderDiamond();
}

function checkComplete() {
  const filled = POSITIONS.reduce((n, { id }) => {
    if (lineup[id].first)  n++;
    if (lineup[id].second) n++;
    return n;
  }, 0);
  const complete = filled === 8;

  const btn   = document.getElementById('btn-submit');
  const guide = document.getElementById('vote-guide');

  const wasComplete = btn.classList.contains('is-active');
  btn.disabled = !complete;
  btn.classList.toggle('is-active', complete);
  if (guide) guide.textContent = complete ? '완성! 버튼을 눌러 확정하세요 🎉' : `${filled} / 8 슬롯 완성`;

  if (complete && !wasComplete) {
    track('lineup_complete', buildLineupParams());
  }
}

// GA4에 넘길 라인업 파라미터 빌더
function buildLineupParams() {
  return {
    ss_first:   lineup.SS?.first?.name  || null,
    ss_second:  lineup.SS?.second?.name || null,
    sb_first:   lineup['2B']?.first?.name  || null,
    sb_second:  lineup['2B']?.second?.name || null,
    tb_first:   lineup['3B']?.first?.name  || null,
    tb_second:  lineup['3B']?.second?.name || null,
    ob_first:   lineup['1B']?.first?.name  || null,
    ob_second:  lineup['1B']?.second?.name || null,
  };
}

// ─── 투표 제출 ────────────────────────────────────────────
async function submitVote() {
  if (!db) { showToast('데이터베이스에 연결되지 않았습니다'); return; }
  if (!navigator.onLine) { showToast('인터넷 연결을 확인해주세요'); return; }

  track('vote_submit_click', buildLineupParams());

  const btn = document.getElementById('btn-submit');
  btn.disabled  = true;
  btn.textContent = '집계 중...';

  try {
    const batch = db.batch();

    // 포지션별 점수 증가
    POSITIONS.forEach(({ id }) => {
      const { first, second } = lineup[id];
      if (first) {
        const ref = db.collection(COLLECTION).doc(`${id}_${first.id}`);
        batch.set(ref, { score: firebase.firestore.FieldValue.increment(2) }, { merge: true });
      }
      if (second) {
        const ref = db.collection(COLLECTION).doc(`${id}_${second.id}`);
        batch.set(ref, { score: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      }
    });

    // 총 투표수 +1
    batch.set(
      db.collection(COLLECTION).doc('_stats'),
      { totalVotes: firebase.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    await batch.commit();

    // 개인 제출 기록 저장 (별도 — 실패해도 투표는 완료)
    db.collection(LOG_COLLECTION).add({
      // 👈 이 줄을 추가하세요! 현재 투표자의 고유 ID를 이름표로 붙이는 겁니다.
      uid: firebase.auth().currentUser.uid, 
      
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      SS_first:         lineup.SS?.first?.id   || null,
      SS_second:        lineup.SS?.second?.id  || null,
      b2_first:         lineup['2B']?.first?.id  || null,
      b2_second:        lineup['2B']?.second?.id || null,
      b3_first:         lineup['3B']?.first?.id  || null,
      b3_second:        lineup['3B']?.second?.id || null,
      b1_first:         lineup['1B']?.first?.id  || null,
      b1_second:        lineup['1B']?.second?.id || null,
      SS_first_name:    lineup.SS?.first?.name   || null,
      SS_second_name:   lineup.SS?.second?.name  || null,
      b2_first_name:    lineup['2B']?.first?.name  || null,
      b2_second_name:   lineup['2B']?.second?.name || null,
      b3_first_name:    lineup['3B']?.first?.name  || null,
      b3_second_name:   lineup['3B']?.second?.name || null,
      b1_first_name:    lineup['1B']?.first?.name  || null,
      b1_second_name:   lineup['1B']?.second?.name || null,
    }).catch(err => console.warn('[vote] 로그 저장 실패:', err));

    track('vote_success', { ...buildLineupParams(), total_votes: totalVotes + 1 });

    showResult(false);
    checkEasterEgg();
  } catch (err) {
    console.error('[vote] 제출 오류:', err);
    track('vote_error', { error_message: err.message });
    showToast('전송에 실패했습니다. 다시 시도해주세요.');
    btn.disabled    = false;
    btn.textContent = '나만의 내야진 확정하기';
    btn.classList.add('is-active');
  }
}

// ─── 순위 팝업 ────────────────────────────────────────────
function openRankingModal() {
  const modal = document.getElementById('modal-ranking');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  renderRankingInto('modal-ranking-grid');
  animateCount('modal-total-count', totalVotes);

  track('ranking_modal_open');

  document.getElementById('btn-modal-close').onclick = closeRankingModal;
  modal.querySelector('.modal-ranking__backdrop').onclick = closeRankingModal;
}

function closeRankingModal() {
  const modal = document.getElementById('modal-ranking');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function animateCount(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (target === 0) { el.textContent = '0'; return; }
  const duration = Math.min(1000 + target * 8, 2000);
  const start = performance.now();
  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString();
      el.classList.remove('is-settled');
      void el.offsetWidth;
      el.classList.add('is-settled');
    }
  }
  requestAnimationFrame(step);
}

// ─── 결과 페이지 ──────────────────────────────────────────
function showResult(viewOnly) {
  showPage('page-result');
  if (!viewOnly) renderMyLineup();
  else document.getElementById('my-lineup-grid').closest('.my-lineup').style.display = 'none';
  renderRanking();
  animateResultTotal();
  track('result_view', { view_only: viewOnly });
  document.getElementById('btn-reset').addEventListener('click', resetVote);
  document.getElementById('btn-share').addEventListener('click', shareResult);
}

function animateResultTotal() {
  animateCount('result-total-count', totalVotes);
}

function renderMyLineup() {
  const container = document.getElementById('my-lineup-grid');

  const playerCard = (player, rank) => {
    if (!player) return '';
    const imgHtml = player.img
      ? `<img src="${player.img}" alt="${player.name}" class="my-photo">`
      : `<div class="my-photo my-photo--num">${player.no}</div>`;
    return `
      <div class="my-player">
        ${imgHtml}
        <div class="my-player__info">
          <span class="my-badge my-badge--${rank}">${rank === 'first' ? '주전' : '백업'}</span>
          <span class="my-player__name">${player.name}</span>
        </div>
      </div>
    `;
  };

  container.innerHTML = POSITIONS.map(({ id, label }) => `
    <div class="my-pos-row">
      <div class="my-pos-label">${label}</div>
      <div class="my-pos-players">
        ${playerCard(lineup[id].first, 'first')}
        ${playerCard(lineup[id].second, 'second')}
      </div>
    </div>
  `).join('');
}

// ─── 이스터에그 ───────────────────────────────────────────
function checkEasterEgg() {
  const has2BSeonbin = lineup['2B'].first?.id === 'p3' || lineup['2B'].second?.id === 'p3';
  if (!has2BSeonbin) {
    track('easter_egg_triggered', { missing_pos: '2B', player: '김선빈' });

    const seonbin = players.find(p => p.id === 'p3');
    const imgEl = document.getElementById('easter-egg-img');
    if (imgEl && seonbin?.img) imgEl.src = seonbin.img;

    setTimeout(() => {
      const el = document.getElementById('easter-egg');
      el?.classList.add('is-visible');
      setTimeout(() => el?.classList.remove('is-visible'), 5000);
    }, 800);
  }
}

function renderRankingInto(containerId) {
  renderRanking(containerId);
}

function renderRanking(containerId = 'ranking-grid') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (Object.keys(votes).length === 0) {
    container.innerHTML = '<div class="rank-loading">집계 중...</div>';
    return;
  }

  container.innerHTML = POSITIONS.map(({ id, label }) => {
    const top3 = Object.entries(votes)
      .filter(([key]) => key.startsWith(id + '_'))
      .map(([key, score]) => {
        const playerId = key.slice(id.length + 1);
        const player   = players.find(p => p.id === playerId);
        return player ? { ...player, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return `
      <div class="rank-pos">
        <div class="rank-pos__label">${label}</div>
        ${top3.length === 0
          ? '<div class="rank-empty">—</div>'
          : top3.map((p, i) => `
            <div class="rank-row ${i === 0 ? 'rank-row--top' : ''}">
              <span class="rank-num">${i + 1}</span>
              <span class="rank-name">${p.name}</span>
              <span class="rank-score">${p.score}점</span>
            </div>`).join('')
        }
      </div>
    `;
  }).join('');
}

function resetVote() {
  track('vote_reset');
  lineup = emptyLineup();
  showPage('page-landing');
}

function shareResult() {
  track('share_click', buildLineupParams());

  const lines = POSITIONS.map(({ id, label }) =>
    `${label}: ${lineup[id].first?.name || '—'} / ${lineup[id].second?.name || '—'}`
  ).join('\n');
  const text = `KIA 타이거즈 내야진 투표\n나의 픽:\n${lines}\n\n함께 투표해요!`;

  if (navigator.share) {
    track('share_native');
    navigator.share({ title: '내야진 투표', text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => {
        track('share_clipboard');
        showToast('링크가 복사되었습니다');
      })
      .catch(() => showToast('공유 기능이 지원되지 않습니다'));
  }
}

// ─── 마우스 드래그 ────────────────────────────────────────
function initMouseDrag(card, player) {
  card.addEventListener('dragstart', () => {
    draggedPlayer = player;
    card.classList.add('is-dragging');
    document.querySelectorAll('.slot').forEach(s => s.classList.add('is-droptarget'));
    track('player_drag_start', { player_name: player.name, method: 'mouse' });
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('is-dragging');
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('is-droptarget', 'is-dragover'));
    draggedPlayer = null;
  });
}

function initSlotDropTargets() {
  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('dragover',  e => { e.preventDefault(); slot.classList.add('is-dragover'); });
    slot.addEventListener('dragleave', ()=> slot.classList.remove('is-dragover'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('is-dragover');
      dropToSlot(slot.dataset.pos, slot.dataset.rank);
    });
  });
}

// ─── 터치 드래그 ──────────────────────────────────────────
const ghost = document.getElementById('drag-ghost');
let touchActive = false;
let touchStartX = 0, touchStartY = 0;

function initTouchDrag(card, player) {
  card.addEventListener('touchstart', e => {
    touchActive  = false;
    touchStartX  = e.touches[0].clientX;
    touchStartY  = e.touches[0].clientY;
  }, { passive: true });

  card.addEventListener('touchmove', e => {
    const t  = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);

    if (!touchActive && (dx > 8 || dy > 8)) {
      touchActive   = true;
      draggedPlayer = player;
      ghost.innerHTML = card.innerHTML;
      ghost.classList.add('is-active');
      document.querySelectorAll('.slot').forEach(s => s.classList.add('is-droptarget'));
      track('player_drag_start', { player_name: player.name, method: 'touch' });
    }

    if (touchActive) {
      e.preventDefault();
      ghost.style.left = t.clientX + 'px';
      ghost.style.top  = t.clientY + 'px';

      ghost.style.display = 'none';
      const under    = document.elementFromPoint(t.clientX, t.clientY);
      ghost.style.display = '';
      const overSlot = under?.closest('.slot[data-pos]');
      document.querySelectorAll('.slot').forEach(s =>
        s.classList.toggle('is-dragover', s === overSlot)
      );
    }
  }, { passive: false });

  card.addEventListener('touchend', e => {
    if (!touchActive) return;
    const t = e.changedTouches[0];

    ghost.classList.remove('is-active');
    document.querySelectorAll('.slot').forEach(s =>
      s.classList.remove('is-droptarget', 'is-dragover')
    );
    touchActive = false;

    ghost.style.display = 'none';
    const under      = document.elementFromPoint(t.clientX, t.clientY);
    ghost.style.display = '';
    const targetSlot = under?.closest('.slot[data-pos]');
    if (targetSlot) dropToSlot(targetSlot.dataset.pos, targetSlot.dataset.rank);
    else draggedPlayer = null;
  }, { passive: true });
}

// ─── 카운트다운 ───────────────────────────────────────────
function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  function update() {
    const diff = DEADLINE - new Date();
    if (diff <= 0) { el.textContent = '마감'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    el.textContent = d > 0 ? `${d}일 ${h}시간` : `${h}시간 ${m}분`;
  }
  update();
  setInterval(update, 30000);
}

// ─── 토스트 ───────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2500);
}

// ─── 시작 ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
