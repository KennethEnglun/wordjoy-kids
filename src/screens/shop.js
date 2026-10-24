import { mountShell } from '../lib/shell.js'
import { getActiveProfile } from '../lib/storage.js'
import { momoImg, MASCOT_NAME_ZH } from '../lib/mascot.js'

export function renderShop(root, state, nav) {
  const p = getActiveProfile()
  const body = `
    <div class="screen tab-screen">
      <header class="page-head">
        <h1>星星小店</h1>
        <p class="hint">用星星幫 ${MASCOT_NAME_ZH} 換裝扮（即將開放）</p>
      </header>
      <div class="cream-card center">
        ${momoImg('proud', MASCOT_NAME_ZH, 'momo-mascot shop-momo')}
        <p class="stats-inline">⭐ ${p?.stars || 0} · 🪙 ${p?.coins || 0}</p>
        <p class="hint">裝扮／貼紙商店製作中，同「字學貓樂園」一樣用星星換裝。</p>
        <div class="stub-grid">
          <div class="stub-item locked">🎩 帽子<br/><small>🔜</small></div>
          <div class="stub-item locked">🧣 頸巾<br/><small>🔜</small></div>
          <div class="stub-item locked">🪄 星星棒<br/><small>🔜</small></div>
        </div>
      </div>
    </div>
  `
  mountShell(root, { screen: 'shop', nav, bodyHtml: body })
}
