const socket = io()

var STOCKS = {
  RELIANCE: { name: 'Reliance Industries',  exchange: 'NSE · India 🇮🇳',     currency: '₹', price: 2849.50 },
  TCS:      { name: 'Tata Consultancy',     exchange: 'NSE · India 🇮🇳',     currency: '₹', price: 3542.00 },
  INFY:     { name: 'Infosys Ltd',          exchange: 'NSE · India 🇮🇳',     currency: '₹', price: 1620.40 },
  HDFCBANK: { name: 'HDFC Bank',            exchange: 'NSE · India 🇮🇳',     currency: '₹', price: 1780.25 },
  WIPRO:    { name: 'Wipro Ltd',            exchange: 'NSE · India 🇮🇳',     currency: '₹', price: 480.60  },
  AAPL:     { name: 'Apple Inc',            exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 250.12  },
  TSLA:     { name: 'Tesla Inc',            exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 244.30  },
  NVDA:     { name: 'NVIDIA Corporation',   exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 481.55  },
  MSFT:     { name: 'Microsoft Corporation',exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 415.80  },
  AMZN:     { name: 'Amazon.com Inc',       exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 178.90  },
  GOOGL:    { name: 'Alphabet Inc',         exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 162.40  },
  META:     { name: 'Meta Platforms',       exchange: 'NASDAQ · USA 🇺🇸',    currency: '$', price: 520.30  },
  SONY:     { name: 'Sony Group Corp',      exchange: 'TSE · Japan 🇯🇵',     currency: '¥', price: 12450   },
  TOYOTA:   { name: 'Toyota Motor Corp',    exchange: 'TSE · Japan 🇯🇵',     currency: '¥', price: 2840    },
  SAMSUNG:  { name: 'Samsung Electronics', exchange: 'KRX · Korea 🇰🇷',     currency: '₩', price: 68500   },
  HSBC:     { name: 'HSBC Holdings',        exchange: 'LSE · UK 🇬🇧',        currency: '£', price: 724.50  },
  SAP:      { name: 'SAP SE',               exchange: 'XETRA · Germany 🇩🇪', currency: '€', price: 198.40  },
}

var openPrices    = {}
var trackedStocks = {}

function formatPrice(price, currency) {
  var formatted = parseFloat(price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return currency + formatted
}

function appendStock(symbol) {
  symbol = symbol.toUpperCase().trim()

  if (!STOCKS[symbol]) {
    showToast('Stock "' + symbol + '" not found', 'error')
    return
  }

  if (trackedStocks[symbol]) {
    showToast(symbol + ' is already on dashboard', 'error')
    return
  }

  var stock     = STOCKS[symbol]
  var price     = stock.price
  var open      = openPrices[symbol] || price
  var change    = parseFloat((price - open).toFixed(2))
  var changePct = parseFloat(((change / open) * 100).toFixed(2))
  var isUp      = change >= 0

  var card       = document.createElement('div')
  card.className = 'stock-card'
  card.id        = 'card-' + symbol

  card.style.cursor = 'pointer'
  card.addEventListener('click', function () {
    window.location.href = '/share?share=' + symbol
  })

  card.innerHTML = `
    <div class="card-top">
      <div class="card-info">
        <span class="card-symbol">${symbol}</span>
        <span class="card-name">${stock.name}</span>
        <span class="card-exchange">${stock.exchange}</span>
      </div>
      <div class="card-badge ${isUp ? 'up' : 'down'}" id="badge-${symbol}">
        ${isUp ? '▲' : '▼'} ${isUp ? 'GAIN' : 'LOSS'}
      </div>
    </div>

    <div class="card-price-wrap">
      <span class="card-price" id="price-${symbol}">${formatPrice(price, stock.currency)}</span>
      <span class="card-change ${isUp ? 'up' : 'down'}" id="change-${symbol}">
        ${isUp ? '▲ +' : '▼ '}${change} (${isUp ? '+' : ''}${changePct}%)
      </span>
    </div>

    <div class="card-stats">
      <div class="stat">
        <span class="stat-l">Open</span>
        <span class="stat-v">${formatPrice(open, stock.currency)}</span>
      </div>
      <div class="stat">
        <span class="stat-l">High</span>
        <span class="stat-v up">${formatPrice(price, stock.currency)}</span>
      </div>
      <div class="stat">
        <span class="stat-l">Low</span>
        <span class="stat-v down">${formatPrice(price, stock.currency)}</span>
      </div>
      <div class="stat">
        <span class="stat-l">Vol</span>
        <span class="stat-v">--</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-action btn-view"  id="btn-view-${symbol}">View More</button>
      <button class="btn-action btn-watch" id="btn-watch-${symbol}">+ Watchlist</button>
    </div>
  `

  document.getElementById('stockGrid').appendChild(card)
  document.getElementById('emptyState').style.display = 'none'

  setTimeout(function () {
    document.getElementById('btn-view-' + symbol).addEventListener('click', function (e) {
      e.stopPropagation()
      window.location.href = '/share?share=' + symbol
    })
    document.getElementById('btn-watch-' + symbol).addEventListener('click', function (e) {
      e.stopPropagation()
      window.location.href = '/watchlist?add=' + symbol
    })
  }, 0)

  trackedStocks[symbol] = true
  updateStockCount()
  showToast(symbol + ' added to dashboard ✅', 'success')
}

function updateCard(symbol, newPrice) {
  if (!STOCKS[symbol]) return

  STOCKS[symbol].price = newPrice

  if (!openPrices[symbol]) {
    openPrices[symbol] = newPrice
  }

  var open      = openPrices[symbol]
  var change    = parseFloat((newPrice - open).toFixed(2))
  var changePct = parseFloat(((change / open) * 100).toFixed(2))
  var isUp      = change >= 0
  var currency  = STOCKS[symbol].currency

  var priceEl  = document.getElementById('price-'  + symbol)
  var changeEl = document.getElementById('change-' + symbol)
  var badgeEl  = document.getElementById('badge-'  + symbol)

  if (priceEl) {
    priceEl.textContent = formatPrice(newPrice, currency)
    // Add visual feedback
    priceEl.style.transition = 'background-color 0.3s'
    priceEl.style.backgroundColor = 'rgba(255, 106, 0, 0.2)'
    setTimeout(() => {
      priceEl.style.backgroundColor = 'transparent'
    }, 300)
  }

  if (changeEl) {
    changeEl.textContent = (isUp ? '▲ +' : '▼ ') + change + ' (' + (isUp ? '+' : '') + changePct + '%)'
    changeEl.className   = 'card-change ' + (isUp ? 'up' : 'down')
  }

  if (badgeEl) {
    badgeEl.textContent = (isUp ? '▲ GAIN' : '▼ LOSS')
    badgeEl.className   = 'card-badge ' + (isUp ? 'up' : 'down')
  }
}

function viewMore(symbol)  { window.location.href = '/share?share=' + symbol }
function addWatch(symbol)  { window.location.href = '/watchlist?add=' + symbol }

function updateStockCount() {
  var count = Object.keys(trackedStocks).length
  document.getElementById('stockCount').textContent =
    count + (count === 1 ? ' stock tracked' : ' stocks tracked')
}

var searchInput    = document.getElementById('searchInput')
var searchDropdown = document.getElementById('searchDropdown')
var searchBtn      = document.getElementById('searchBtn')

searchInput.addEventListener('input', function () {
  var query = searchInput.value.trim().toUpperCase()
  if (query.length < 1) { searchDropdown.classList.remove('open'); return }

  var matches = Object.keys(STOCKS).filter(function (s) {
    return s.includes(query) || STOCKS[s].name.toUpperCase().includes(query)
  }).slice(0, 6)

  if (matches.length === 0) { searchDropdown.classList.remove('open'); return }

  searchDropdown.innerHTML = matches.map(function (s) {
    return `
      <div class="dropdown-item">
        <div class="di-left" onclick="window.location.href='/share?share=${s}'" style="cursor:pointer; flex:1">
          <span class="di-sym">${s}</span>
          <span class="di-name">${STOCKS[s].name} · ${STOCKS[s].exchange}</span>
        </div>
        <span class="di-add" onclick="window.location.href='/watchlist?add=${s}'" style="cursor:pointer">+ Watchlist</span>
      </div>
    `
  }).join('')

  searchDropdown.classList.add('open')
})

searchBtn.addEventListener('click', function () {
  var query = searchInput.value.trim().toUpperCase()
  if (query) { window.location.href = '/share?share=' + query; closeSearch() }
})

searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    var query = searchInput.value.trim().toUpperCase()
    if (query) { window.location.href = '/share?share=' + query; closeSearch() }
  }
})

document.addEventListener('click', function (e) {
  if (!e.target.closest('.search-wrap')) closeSearch()
})

function closeSearch() {
  searchDropdown.classList.remove('open')
  searchInput.value = ''
}

document.querySelectorAll('.sidebar-link[data-market]').forEach(function (link) {
  link.addEventListener('click', function () {
    document.querySelectorAll('.sidebar-link').forEach(function (l) { l.classList.remove('active') })
    link.classList.add('active')
  })
})

function showToast(msg, type) {
  type = type || 'success'
  var existing = document.getElementById('dashboard-toast')
  if (existing) existing.remove()

  var toast = document.createElement('div')
  toast.id  = 'dashboard-toast'
  toast.textContent = msg
  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '28px',
    left:         '50%',
    transform:    'translateX(-50%) translateY(10px)',
    background:   '#1a1209',
    border:       '1px solid ' + (type === 'error' ? 'rgba(255,68,68,0.35)' : 'rgba(255,106,0,0.35)'),
    borderRadius: '100px',
    padding:      '10px 24px',
    fontSize:     '0.78rem',
    color:        type === 'error' ? '#FF5555' : '#FF8C44',
    zIndex:       '9999',
    opacity:      '0',
    transition:   'opacity 0.3s ease, transform 0.3s ease',
    whiteSpace:   'nowrap',
    fontFamily:   'DM Sans, sans-serif',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
    pointerEvents:'none',
  })

  document.body.appendChild(toast)
  requestAnimationFrame(function () {
    toast.style.opacity   = '1'
    toast.style.transform = 'translateX(-50%) translateY(0)'
  })
  setTimeout(function () {
    toast.style.opacity   = '0'
    toast.style.transform = 'translateX(-50%) translateY(10px)'
    setTimeout(function () { toast.remove() }, 300)
  }, 3000)
}

/* ============================================================
   ON LOAD - FIXED VERSION
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  appendStock('RELIANCE')
  appendStock('AAPL')
  appendStock('WIPRO')
  appendStock('TCS')

  socket.emit('stock_list', STOCKS)

  // FIXED: Now updates STOCKS object with new prices
  socket.on('imp_shares', function (imp_share_price) {
    console.log('Received price updates:', imp_share_price)
    
    Object.keys(imp_share_price).forEach(function (key) {
      var newPrice = imp_share_price[key]
      if (newPrice == null || !STOCKS[key]) return

      // CRITICAL FIX: Update the STOCKS object with the new price
      STOCKS[key].price = parseFloat(newPrice)

      if (!openPrices[key]) {
        openPrices[key] = parseFloat(newPrice)
      }

      updateCard(key, parseFloat(newPrice))
    })
    
    console.log('STOCKS object updated with live prices:', STOCKS)
  })

})

// REMOVE ALL BACKEND CODE FROM HERE - it doesn't belong in frontend file
// The following code should be deleted as it's backend code mixed in:
// - const path = require("path")
// - const fs = require("fs")
// - const bcrypt = require("bcryptjs")
// - const jwt = require('jsonwebtoken')
// - const first = (req, res, next) => {...}
// - const YAHOO_SYMBOLS = {...}
// - const MARKET_HOURS = {...}
// - function getMarketHours(symbol) {...}
// - async function getStockLiveData(symbol) {...}
// - async function getAllLivePrices(STOCKS) {...}
// - module.exports = {...}