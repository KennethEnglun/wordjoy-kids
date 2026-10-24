/** Bottom tab bar — sister-app IA (字學貓樂園 alignment). */

export const TABS = [
  { id: 'home', zh: '首頁', icon: '🏠', hash: '#/' },
  { id: 'adventure', zh: '冒險', icon: '🗺️', hash: '#/adventure' },
  { id: 'tasks', zh: '任務', icon: '📋', hash: '#/tasks' },
  { id: 'shop', zh: '商店', icon: '🏪', hash: '#/shop' },
  { id: 'character', zh: '角色', icon: '🐱', hash: '#/character' },
]

const TAB_SCREENS = new Set(['home', 'adventure', 'tasks', 'shop', 'character'])

export function showsTabBar(screen) {
  return TAB_SCREENS.has(screen)
}

export function renderTabBar(active, nav) {
  const bar = document.createElement('nav')
  bar.className = 'tab-bar'
  bar.setAttribute('aria-label', '主選單')
  TABS.forEach((t) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `tab-item${t.id === active ? ' active' : ''}`
    b.dataset.tab = t.id
    b.innerHTML = `<span class="tab-icon" aria-hidden="true">${t.icon}</span><span class="tab-label">${t.zh}</span>`
    b.addEventListener('click', () => {
      nav({ screen: t.id })
    })
    bar.appendChild(b)
  })
  return bar
}

export function mountShell(root, { screen, nav, bodyHtml }) {
  root.innerHTML = `
    <div class="app-shell ${showsTabBar(screen) ? 'with-tabs' : 'no-tabs'}">
      <div class="shell-body" id="shell-body">${bodyHtml || ''}</div>
    </div>
  `
  if (showsTabBar(screen)) {
    root.querySelector('.app-shell').appendChild(renderTabBar(screen, nav))
  }
  return root.querySelector('#shell-body')
}
