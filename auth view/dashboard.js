const socket = io({ transports: ['websocket', 'polling'] })

var STOCKS      = {}
var livePrices  = {}
var openPrices  = {}
var trackedStocks = {}

fetch('/stocks.json')
  .then(function(r) { return r.json() })
  .then(function(data) {
    STOCKS = data
    buildTicker()
    init()
  })
  .catch(function(err) {
    console.error('Failed to load stocks.json:', err)
  })

function formatPrice(price, currency) {
  if (price == null || isNaN(price)) return (currency || '') + '--'
  return (currency || '') + parseFloat(price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function buildTicker() {
  var keys = Object.keys(STOCKS).slice(0, 18)
  var html = keys.map(function(sym) {
    var s = STOCKS[sym]
    return '<div class="t-item" onclick="window.location.href=\'/share?share=' + sym + '\'">' +
      '<span class="t-sym">' + sym + '</span>' +
      '<span class="t-price" id="tick-' + sym + '">' + formatPrice(s.price || 0, s.currency) + '</span>' +
      '<span class="t-chg up" id="tickchg-' + sym + '">▲0.00</span>' +
      '</div>'
  }).join('')
  var el = document.getElementById('ticker')
  if (el) el.innerHTML = html + html
}

function updateTicker(sym, newPrice) {
  var el  = document.getElementById('tick-' + sym)
  var chg = document.getElementById('tickchg-' + sym)
  if (!el || !STOCKS[sym]) return
  el.textContent = formatPrice(newPrice, STOCKS[sym].currency)
  if (chg && openPrices[sym]) {
    var diff = parseFloat((newPrice - openPrices[sym]).toFixed(2))
    var isUp = diff >= 0
    chg.textContent = (isUp ? '▲' : '▼') + Math.abs(diff).toFixed(2)
    chg.className   = 't-chg ' + (isUp ? 'up' : 'down')
  }
}

var searchInput   = document.getElementById('searchInput')
var searchResults = document.getElementById('searchResults')

if (searchInput) {
  searchInput.addEventListener('input', function() {
    var q = searchInput.value.trim().toUpperCase()
    if (q.length < 1) { searchResults.classList.remove('open'); return }

    var matches = Object.keys(STOCKS).filter(function(s) {
      return s.includes(q) || STOCKS[s].name.toUpperCase().includes(q)
    }).slice(0, 10)

    if (!matches.length) {
      searchResults.innerHTML = '<div class="sr-empty">No results for "' + searchInput.value + '"</div>'
      searchResults.classList.add('open')
      return
    }

    searchResults.innerHTML = matches.map(function(sym) {
      var s = STOCKS[sym]
      var price = livePrices[sym] ? formatPrice(livePrices[sym], s.currency) : '--'
      return '<div class="sr-item">' +
        '<div class="sr-left" onclick="window.location.href=\'/share?share=' + sym + '\'">' +
          '<div class="sr-badge">' + sym.slice(0, 4) + '</div>' +
          '<div class="sr-info">' +
            '<span class="sr-sym">' + sym + '</span>' +
            '<span class="sr-name">' + s.name + '</span>' +
            '<span class="sr-exch">' + s.exchange + ' · ' + price + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="sr-actions">' +
          '<a class="sr-btn sr-btn-view" href="/share?share=' + sym + '">View</a>' +
          '<a class="sr-btn sr-btn-watch" href="/watchlist?add=' + sym + '">+ Watch</a>' +
        '</div>' +
      '</div>'
    }).join('')

    searchResults.classList.add('open')
  })

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var q = searchInput.value.trim().toUpperCase()
      if (q) { window.location.href = '/share?share=' + q; closeSearch() }
    }
    if (e.key === 'Escape') closeSearch()
  })
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-wrap')) closeSearch()
})

function closeSearch() {
  if (searchResults) searchResults.classList.remove('open')
  if (searchInput)   searchInput.value = ''
}

function appendStock(symbol) {
  symbol = symbol.toUpperCase().trim()
  if (!STOCKS[symbol]) { showToast('Stock "' + symbol + '" not found', 'error'); return }
  if (trackedStocks[symbol]) { showToast(symbol + ' already on dashboard', 'error'); return }

  var s      = STOCKS[symbol]
  var price  = livePrices[symbol] || 0
  var open   = openPrices[symbol] || price
  var change = price && open ? parseFloat((price - open).toFixed(2)) : 0
  var pct    = open ? parseFloat(((change / open) * 100).toFixed(2)) : 0
  var isUp   = change >= 0

  var card = document.createElement('div')
  card.className = 'stock-card'
  card.id = 'card-' + symbol
  card.addEventListener('click', function() {
    window.location.href = '/share?share=' + symbol
  })

  card.innerHTML =
    '<div class="card-top">' +
      '<div class="card-info">' +
        '<span class="card-sym">' + symbol + '</span>' +
        '<span class="card-name">' + s.name + '</span>' +
        '<span class="card-exch">' + s.exchange + '</span>' +
      '</div>' +
      '<div class="card-badge ' + (isUp ? 'up' : 'down') + '" id="badge-' + symbol + '">' +
        (isUp ? '▲ GAIN' : '▼ LOSS') +
      '</div>' +
    '</div>' +
    '<div class="card-price-wrap">' +
      '<span class="card-price" id="price-' + symbol + '">' + formatPrice(price, s.currency) + '</span>' +
      '<span class="card-change ' + (isUp ? 'up' : 'down') + '" id="change-' + symbol + '">' +
        (isUp ? '▲ +' : '▼ ') + change + ' (' + (isUp ? '+' : '') + pct + '%)' +
      '</span>' +
    '</div>' +
    '<div class="card-stats">' +
      '<div class="stat"><span class="stat-l">OPEN</span><span class="stat-v">' + formatPrice(open, s.currency) + '</span></div>' +
      '<div class="stat"><span class="stat-l">HIGH</span><span class="stat-v up" id="high-' + symbol + '" data-val="' + price + '">' + formatPrice(price, s.currency) + '</span></div>' +
      '<div class="stat"><span class="stat-l">LOW</span><span class="stat-v down" id="low-' + symbol + '" data-val="' + price + '">' + formatPrice(price, s.currency) + '</span></div>' +
      '<div class="stat"><span class="stat-l">VOL</span><span class="stat-v">--</span></div>' +
    '</div>' +
    '<div class="card-actions">' +
      '<button class="btn-view" id="bview-' + symbol + '">View More</button>' +
      '<button class="btn-watch" id="bwatch-' + symbol + '">⭐ Watchlist</button>' +
    '</div>'

  document.getElementById('emptyState').style.display = 'none'
  document.getElementById('stockGrid').appendChild(card)

  setTimeout(function() {
    var bv = document.getElementById('bview-'  + symbol)
    var bw = document.getElementById('bwatch-' + symbol)
    if (bv) bv.addEventListener('click', function(e) { e.stopPropagation(); window.location.href = '/share?share=' + symbol })
    if (bw) bw.addEventListener('click', function(e) { e.stopPropagation(); window.location.href = '/watchlist?add=' + symbol })
  }, 0)

  trackedStocks[symbol] = true
  updateCount()
  showToast(symbol + ' added ✅', 'success')
}

function updateCard(sym, newPrice) {
  if (!STOCKS[sym] || newPrice == null) return
  var prev = livePrices[sym]
  livePrices[sym] = newPrice
  if (!openPrices[sym]) openPrices[sym] = newPrice

  var open   = openPrices[sym]
  var change = parseFloat((newPrice - open).toFixed(2))
  var pct    = parseFloat(((change / open) * 100).toFixed(2))
  var isUp   = change >= 0
  var curr   = STOCKS[sym].currency

  var priceEl  = document.getElementById('price-'  + sym)
  var changeEl = document.getElementById('change-' + sym)
  var badgeEl  = document.getElementById('badge-'  + sym)
  var highEl   = document.getElementById('high-'   + sym)
  var lowEl    = document.getElementById('low-'    + sym)

  if (priceEl) {
    priceEl.textContent = formatPrice(newPrice, curr)
    priceEl.classList.remove('price-flash-up', 'price-flash-down')
    void priceEl.offsetWidth
    if (prev != null) priceEl.classList.add(newPrice >= prev ? 'price-flash-up' : 'price-flash-down')
  }
  if (changeEl) {
    changeEl.textContent = (isUp ? '▲ +' : '▼ ') + change + ' (' + (isUp ? '+' : '') + pct + '%)'
    changeEl.className   = 'card-change ' + (isUp ? 'up' : 'down')
  }
  if (badgeEl) {
    badgeEl.textContent = isUp ? '▲ GAIN' : '▼ LOSS'
    badgeEl.className   = 'card-badge ' + (isUp ? 'up' : 'down')
  }
  if (highEl) {
    var h = parseFloat(highEl.dataset.val || 0)
    if (newPrice > h) { highEl.dataset.val = newPrice; highEl.textContent = formatPrice(newPrice, curr) }
  }
  if (lowEl) {
    var l = parseFloat(lowEl.dataset.val || Infinity)
    if (newPrice < l) { lowEl.dataset.val = newPrice; lowEl.textContent = formatPrice(newPrice, curr) }
  }

  updateTicker(sym, newPrice)
}

function updateCount() {
  var c = Object.keys(trackedStocks).length
  var el = document.getElementById('stockCount')
  if (el) el.textContent = c + ' tracked'
}

var _toastTimer = null
function showToast(msg, type) {
  var t = document.getElementById('toast')
  if (!t) return
  clearTimeout(_toastTimer)
  t.textContent = msg
  t.className   = type === 'error' ? 'error' : ''
  t.classList.add('show')
  _toastTimer = setTimeout(function() { t.classList.remove('show') }, 3000)
}

document.querySelectorAll('.slink[data-filter]').forEach(function(link) {
  link.addEventListener('click', function() {
    document.querySelectorAll('.slink').forEach(function(l) { l.classList.remove('active') })
    link.classList.add('active')
  })
})

/* ── AI CHAT — calls backend /api/ask-ai ─────────────────── */
var aiInput    = document.getElementById('aiInput')
var aiSend     = document.getElementById('aiSend')
var aiMessages = document.getElementById('aiMessages')

function askAI(question) {
  if (!question) question = aiInput ? aiInput.value.trim() : ''
  if (!question) return
  if (aiInput) aiInput.value = ''
  if (aiSend)  aiSend.disabled = true

  addAIMsg(question, 'user')

  var typingDiv = document.createElement('div')
  typingDiv.className = 'ai-msg bot'
  typingDiv.innerHTML = '<div class="ai-avatar-dot">⚡</div><div class="ai-bubble ai-typing"></div>'
  if (aiMessages) { aiMessages.appendChild(typingDiv); aiMessages.scrollTop = aiMessages.scrollHeight }

  // ✅ calls YOUR backend — Gemini key stays safe on server
  fetch('/api/ask-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question })
  })
  .then(function(r) { return r.json() })
  .then(function(data) {
    typingDiv.remove()
    addAIMsg(data.reply, 'bot')
  })
  .catch(function() {
    typingDiv.remove()
    addAIMsg('Something went wrong. Please try again.', 'bot')
  })
  .finally(function() { if (aiSend) aiSend.disabled = false })
}

function addAIMsg(text, role) {
  if (!aiMessages) return
  var div = document.createElement('div')
  div.className = 'ai-msg ' + role
  div.innerHTML = (role === 'bot' ? '<div class="ai-avatar-dot">⚡</div>' : '') +
    '<div class="ai-bubble">' + text + '</div>'
  aiMessages.appendChild(div)
  aiMessages.scrollTop = aiMessages.scrollHeight
}

if (aiSend)  aiSend.addEventListener('click',   function() { askAI(aiInput ? aiInput.value.trim() : '') })
if (aiInput) aiInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') askAI(aiInput.value.trim()) })

/* ── SOCKET + INIT ───────────────────────────────────────── */
var DEFAULT_CARDS = ['RELIANCE', 'AAPL', 'WIPRO', 'TCS', 'TSLA', 'NVDA']

function init() {
  DEFAULT_CARDS.forEach(function(sym) {
    if (STOCKS[sym]) appendStock(sym)
  })

  var stockList = {}
  Object.keys(STOCKS).forEach(function(k) { stockList[k] = true })
  socket.emit('stock_list', stockList)

  socket.on('imp_shares', function(prices) {
    Object.keys(prices).forEach(function(sym) {
      var newPrice = prices[sym]
      if (newPrice == null || !STOCKS[sym]) return
      if (!openPrices[sym]) openPrices[sym] = parseFloat(newPrice)
      updateCard(sym, parseFloat(newPrice))
    })
  })

  socket.on('connect',    function() { console.log('✅ Socket connected') })
  socket.on('disconnect', function() { console.log('❌ Socket disconnected') })
}