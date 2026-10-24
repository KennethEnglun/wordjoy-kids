import { renderHome } from './screens/home.js'
import { renderThemes } from './screens/themes.js'
import { renderGames } from './screens/games.js'
import { renderPlay } from './screens/play.js'
import { renderResults } from './screens/results.js'
import { renderProfiles } from './screens/profiles.js'
import { renderParent } from './screens/parent.js'

const app = document.getElementById('app')
let state = { screen: 'home' }
let cleanup = null

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '')
  if (!h) return null
  const parts = h.split('/').filter(Boolean)
  if (parts[0] === 'profiles') return { screen: 'profiles' }
  if (parts[0] === 'parent') return { screen: 'parent' }
  if (parts[0] === 'themes' && parts[1]) return { screen: 'themes', band: parts[1] }
  if (parts[0] === 'games' && parts[1] && parts[2])
    return { screen: 'games', band: parts[1], theme: parts[2] }
  if (parts[0] === 'play' && parts[1] && parts[2] && parts[3])
    return { screen: 'play', band: parts[1], theme: parts[2], game: parts[3] }
  return { screen: 'home' }
}

function writeHash(s) {
  let hash = '#/'
  if (s.screen === 'profiles') hash = '#/profiles'
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
  if (s === 'themes') await renderThemes(app, state, nav)
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
