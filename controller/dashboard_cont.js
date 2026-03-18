const path   = require("path")
const fs     = require("fs")
const bcrypt = require("bcryptjs")
const jwt    = require('jsonwebtoken')
const SECRET = "shlok"

const first = (req, res, next) => {
  const token = req.cookies.token

  if (!token) return res.redirect('/login')

  try {
    const decoded = jwt.verify(token, SECRET)
    console.log(decoded)
    res.send(`<p>hi</p>`)
  } catch (err) {
    console.log(err)
    res.redirect('/login')
  }
}

const YAHOO_SYMBOLS = {
  // existing ones stay...
  RELIANCE:   'RELIANCE.NS',
  TCS:        'TCS.NS',
  INFY:       'INFY.NS',
  HDFCBANK:   'HDFCBANK.NS',
  WIPRO:      'WIPRO.NS',
  AAPL:       'AAPL',
  TSLA:       'TSLA',
  NVDA:       'NVDA',
  MSFT:       'MSFT',
  AMZN:       'AMZN',
  GOOGL:      'GOOGL',
  META:       'META',
  SONY:       'SONY',
  TOYOTA:     '7203.T',
  SAMSUNG:    '005930.KS',
  HSBC:       'HSBC',
  SAP:        'SAP',

  // ✅ ADD THESE
  ICICIBANK:  'ICICIBANK.NS',
  SBIN:       'SBIN.NS',
  HINDUNILVR: 'HINDUNILVR.NS',
  BAJFINANCE: 'BAJFINANCE.NS',
  TATAMOTORS: 'TATAMOTORS.BO',
  NFLX:       'NFLX',
  AMD:        'AMD',
  JPM:        'JPM',
  BAC:        'BAC',
  XOM:        'XOM',
  BP:         'BP',
  BABA:       'BABA',
  BIDU:       'BIDU',
  BHP:        'BHP',
  SHOP:       'SHOP',
  VALE:       'VALE',
}

// ---- Market hours in UTC minutes ----
const MARKET_HOURS = {
  NS: { start: 3 * 60 + 45, end: 10 * 60 },
  T:  { start: 0,            end: 6 * 60 + 30 },
  KS: { start: 0,            end: 6 * 60 + 30 },
  US: { start: 13 * 60 + 30, end: 21 * 60 },
}

function getMarketHours(symbol) {
  if (symbol.endsWith('.NS')) return MARKET_HOURS.NS
  if (symbol.endsWith('.T'))  return MARKET_HOURS.T
  if (symbol.endsWith('.KS')) return MARKET_HOURS.KS
  return MARKET_HOURS.US
}

async function getStockLiveData(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d&t=${Date.now()}`
    const response = await fetch(url, {
      headers: {
        'User-Agent':    'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      }
    })

    const data = await response.json()

    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      console.log(`Symbol not found: ${symbol}`)
      return null
    }

    const result     = data.chart.result[0]
    const meta       = result.meta
    const timestamps = result.timestamp
    const closes     = result.indicators.quote[0].close
    const opens      = result.indicators.quote[0].open
    const highs      = result.indicators.quote[0].high
    const lows       = result.indicators.quote[0].low
    const volumes    = result.indicators.quote[0].volume

    const hours = getMarketHours(symbol)

    const groupedByDate = {}

    timestamps.forEach(function (ts, i) {
      if (!closes[i]) return

      const date    = new Date(ts * 1000)
      const utcTime = date.getUTCHours() * 60 + date.getUTCMinutes()

      if (utcTime < hours.start || utcTime > hours.end) return

      const dateKey = date.toISOString().split('T')[0]

      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = []

      groupedByDate[dateKey].push({
        time:   date.toISOString(),
        open:   opens[i]   ? parseFloat(opens[i].toFixed(2))   : null,
        high:   highs[i]   ? parseFloat(highs[i].toFixed(2))   : null,
        low:    lows[i]    ? parseFloat(lows[i].toFixed(2))    : null,
        close:  closes[i]  ? parseFloat(closes[i].toFixed(2))  : null,
        volume: volumes[i] || 0
      })
    })

    const allDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a))

    if (allDates.length === 0) return null

    const lastDay  = allDates[0]
    const candles  = groupedByDate[lastDay]
    const dayOpen  = candles[0].open
    const dayClose = candles[candles.length - 1].close
    const dayHigh  = Math.max(...candles.map(p => p.high))
    const dayLow   = Math.min(...candles.map(p => p.low))
    const dayChange    = parseFloat((dayClose - dayOpen).toFixed(2))
    const dayChangePct = parseFloat(((dayChange / dayOpen) * 100).toFixed(2))
    const totalVolume  = candles.reduce((sum, p) => sum + p.volume, 0)

    return {
      livePrice:    meta.regularMarketPrice                           || dayClose,
      openPrice:    meta.regularMarketOpen || meta.chartPreviousClose || dayOpen,
      dayLow:       meta.regularMarketDayLow                          || dayLow,
      dayHigh:      meta.regularMarketDayHigh                         || dayHigh,
      currency:     meta.currency                                     || 'N/A',
      marketState:  meta.marketState                                  || 'UNKNOWN',
      exchange:     meta.exchangeName                                 || 'N/A',
      fullName:     meta.longName || meta.shortName                   || symbol,
      lastDay,
      allDates,
      dayOpen,
      dayClose,
      dayChange,
      dayChangePct,
      totalVolume,
      candles,
      allDaysCandles: groupedByDate,
    }

  } catch (err) {
    console.log(`Error fetching ${symbol}:`, err.message)
    return null
  }
}

async function getAllLivePrices(STOCKS) {
  const result = {}

  for (const key of Object.keys(STOCKS)) {
    const yahooSymbol = YAHOO_SYMBOLS[key]

    if (!yahooSymbol) {
      console.log(`No Yahoo symbol mapping for: ${key}`)
      continue
    }

    const data = await getStockLiveData(yahooSymbol)

    if (data) {
      result[key] = data.livePrice
      console.log(
        `${key.padEnd(10)} → ${data.currency} ${data.livePrice}` +
        `  |  Open: ${data.openPrice}` +
        `  |  Low: ${data.dayLow}` +
        `  |  High: ${data.dayHigh}` +
        `  |  Chg: ${data.dayChange >= 0 ? '+' : ''}${data.dayChange} (${data.dayChangePct}%)` +
        `  |  Vol: ${data.totalVolume.toLocaleString()}` +
        `  |  Market: ${data.marketState}`
      )
    } else {
      result[key] = null
      console.log(`${key.padEnd(10)} → failed to fetch`)
    }

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return result
}

module.exports = { first, getStockLiveData, getAllLivePrices ,YAHOO_SYMBOLS}