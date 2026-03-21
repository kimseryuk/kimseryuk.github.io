const grid = document.getElementById('player-grid');
const modal = document.getElementById('player-modal');
const modalImg = document.getElementById('modal-img');
const modalNumber = document.getElementById('modal-number');
const modalName = document.getElementById('modal-name');
const modalPosition = document.getElementById('modal-position');
const modalInfo = document.getElementById('modal-info');
const modalComment = document.getElementById('modal-comment');
const modalGallery = document.getElementById('modal-gallery');

const TABS = ['전체', '투수', '포수', '내야수', '외야수'];
let allPlayers = [];
let activeTab = '전체';

// 이름에서 폴더 경로 추출 (profile.png 제거 후 폴더명)
function folderName(player) {
  return player.image.replace('../img/players/', '').replace('/profile.png', '');
}

fetch('../data/kia-players.json')
  .then(res => res.json())
  .then(players => {
    allPlayers = players;
    buildTabs();
    renderGrid('전체');
  });

function buildTabs() {
  const tabBar = document.getElementById('player-tabs');
  tabBar.innerHTML = TABS.map(t =>
    `<button class="player-tab${t === activeTab ? ' is-active' : ''}" data-tab="${t}">${t}</button>`
  ).join('');
  tabBar.querySelectorAll('.player-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      tabBar.querySelectorAll('.player-tab').forEach(b => b.classList.toggle('is-active', b === btn));
      renderGrid(activeTab);
    });
  });
}

function renderGrid(tab) {
  const visible = allPlayers.filter(p =>
    !(p.number.startsWith('0') && p.number.length > 1) &&
    parseInt(p.number, 10) < 100
  );
  const filtered = tab === '전체'
    ? visible
    : visible.filter(p => p.position === tab);

  // gallery 많은 순, 같으면 등록 순 유지
  filtered.sort((a, b) => {
    const gDiff = (b.gallery ?? 0) - (a.gallery ?? 0);
    if (gDiff !== 0) return gDiff;
    return parseInt(a.number, 10) - parseInt(b.number, 10);
  });

  grid.innerHTML = filtered.map((p) => {
    const origIndex = allPlayers.indexOf(p);
    return `
      <div class="player-card" data-index="${origIndex}" role="button" tabindex="0">
        <div class="player-card__avatar">
          <img
            src="${p.image}"
            alt="${p.name}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          >
          <div class="player-card__fallback" style="display:none">${p.number}</div>
        </div>
        <div class="player-card__body">
          <div class="player-card__meta">
            <span class="player-card__number">#${p.number}</span>
            <span class="player-card__position">${p.position}</span>
          </div>
          <p class="player-card__name">${p.name}</p>
          ${p.gallery > 0 ? `<p class="player-card__gallery-count">사진 ${p.gallery}장</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.player-card').forEach(card => {
    const open = () => openModal(allPlayers[card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

function openModal(p) {
  modalImg.src = p.image;
  modalImg.alt = p.name;
  modalImg.style.display = '';
  modalImg.onerror = () => { modalImg.style.display = 'none'; };
  modalNumber.textContent = '#' + p.number;
  modalName.textContent = p.name;
  modalPosition.textContent = p.position;

  const infoItems = [
    ['투타', p.bat],
    ['생년월일', p.birth],
    ['신장', p.height],
    ['체중', p.weight],
  ].filter(([, v]) => v);
  modalInfo.innerHTML = infoItems.map(([k, v]) =>
    `<div class="player-modal__info-row"><dt>${k}</dt><dd>${v}</dd></div>`
  ).join('');

  modalComment.textContent = p.comment;

  // 갤러리
  if (p.gallery > 0) {
    const folder = folderName(p);
    const imgs = Array.from({ length: p.gallery }, (_, idx) =>
      `<div class="gallery-item">
        <img src="../img/players/${folder}/${idx + 1}.png" alt="${p.name} ${idx + 1}"
          onerror="this.closest('.gallery-item').style.display='none'">
      </div>`
    ).join('');
    modalGallery.innerHTML = `<div class="gallery-grid">${imgs}</div>`;
    modalGallery.style.display = '';
  } else {
    modalGallery.innerHTML = '';
    modalGallery.style.display = 'none';
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal() {
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
