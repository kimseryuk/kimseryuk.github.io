const grid = document.getElementById('player-grid');
const modal = document.getElementById('player-modal');
const modalImg = document.getElementById('modal-img');
const modalNumber = document.getElementById('modal-number');
const modalName = document.getElementById('modal-name');
const modalPosition = document.getElementById('modal-position');
const modalComment = document.getElementById('modal-comment');

fetch('../data/kia-players.json')
  .then(res => res.json())
  .then(players => {
    grid.innerHTML = players.map((p, i) => `
      <div class="player-card" data-index="${i}" role="button" tabindex="0">
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
          <p class="player-card__comment">${p.comment}</p>
        </div>
      </div>
    `).join('');

    // 카드 클릭 → 모달
    grid.querySelectorAll('.player-card').forEach(card => {
      const open = () => {
        const p = players[card.dataset.index];
        modalImg.src = p.image;
        modalImg.alt = p.name;
        modalImg.style.display = '';
        modalImg.onerror = () => { modalImg.style.display = 'none'; };
        modalNumber.textContent = '#' + p.number;
        modalName.textContent = p.name;
        modalPosition.textContent = p.position;
        modalComment.textContent = p.comment;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
    });
  });

// 모달 닫기
function closeModal() {
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
