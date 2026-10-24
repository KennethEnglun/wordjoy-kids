import { renderHome } from './screens/home.js'
import { renderThemes } from './screens/themes.js'
import { renderGames } from './screens/games.js'
import { renderPlay } from './screens/play.js'
import { renderResults } from './screens/results.js'
import { renderProfiles } from './screens/profiles.js'
import { renderParent } from './screens/parent.js'
import { renderAdventure } from './screens/adventure.js'
import { renderTasks } from './screens/tasks.js'
import { renderShop } from './screens/shop.js'
import { renderCharacter } from './screens/character.js'

const app = document.getElementById('app')
let state = { screen: 'home' }
let cleanup = null

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '')
  if (!h) return { screen: 'home' }
  const parts = h.split('/').filter(Boolean)
  const tab = parts[0]
  if (['home', 'adventure', 'tasks', 'shop', 'character'].includes(tab)) {
    const next = { screen: tab }
    if (tab === 'adventure' && parts[1]) next.band = parts[1]
    return next
  }
  if (tab === 'profiles') return { screen: 'profiles' }
  if (tab === 'parent') return { screen: 'parent' }
  if (tab === 'themes' && parts[1]) return { screen: 'themes', band: parts[1] }
  if (tab === 'games' && parts[1] && parts[2])
    return { screen: 'games', band: parts[1], theme: parts[2] }
  if (tab === 'play' && parts[1] && parts[2] && parts[3])
    return { screen: 'play', band: parts[1], theme: parts[2], game: parts[3] }
  if (tab === 'results') return { screen: 'results', ...state }
  return { screen: 'home' }
}

function writeHash(s) {
  let hash = '#/'
  if (s.screen === 'home') hash = '#/'
  else if (s.screen === 'adventure')
    hash = s.band ? `#/adventure/${s.band}` : '#/adventure'
  else if (s.screen === 'tasks') hash = '#/tasks'
  else if (s.screen === 'shop') hash = '#/shop'
  else if (s.screen === 'character') hash = '#/character'
  else if (s.screen === 'profiles') hash = '#/profiles'
  else if (s.screen === 'parent') hash = '#/parent'
  else if (s.screen === 'themes') hash = `#/themes/${s.band}`
  else if (s.screen === 'games') hash = `#/games/${s.band}/${s.theme}`
  else if (s.screen === 'play') hash = `#/play/${s.band}/${s.theme}/${s.game}`
  if (location.hash !== hash) history.replaceState(null, '', hash)
}

export function nav(next) {
  state = { ...state, ...next }
  writeHash(state)
  route()
}

async function route() {
  if (cleanup) {
    cleanup()
    cleanup = null
  }
  app.innerHTML = ''
  const s = state.screen
  if (s === 'adventure') renderAdventure(app, state, nav)
  else if (s === 'tasks') renderTasks(app, state, nav)
  else if (s === 'shop') renderShop(app, state, nav)
  else if (s === 'character') renderCharacter(app, state, nav)
  else if (s === 'themes') await renderThemes(app, state, nav)
  else if (s === 'games') renderGames(app, state, nav)
  else if (s === 'play') cleanup = (await renderPlay(app, state, nav)) || null
  else if (s === 'results') renderResults(app, state, nav)
  else if (s === 'profiles') renderProfiles(app, state, nav)
  else if (s === 'parent') renderParent(app, state, nav)
  else renderHome(app, nav)
}

window.addEventListener('hashchange', () => {
  const parsed = parseHash()
  if (parsed) {
    state = { ...state, ...parsed }
    route()
  }
})

const boot = parseHash()
if (boot) state = { ...state, ...boot }
route()
