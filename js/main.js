fetch('data/projects.json')
  .then(res => res.json())
  .then(projects => {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = projects.map(p => `
      <a class="card" href="${p.url}">
        <div class="card__body">
          <h3 class="card__title">${p.title}</h3>
          <p class="card__desc">${p.desc}</p>
          <div class="card__meta">
            <ul class="card__tags">
              ${p.tags.map(t => `<li class="tag">${t}</li>`).join('')}
            </ul>
            ${p.updated ? `<span class="card__updated">${p.updated}</span>` : ''}
          </div>
        </div>
      </a>
    `).join('');
  });
