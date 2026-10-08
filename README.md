# Toad Trading — Paper Trading Simulator

A browser-based stock / ETF simulator for practising trading and competing on returns.
No build step, no framework — plain HTML / CSS / JavaScript.

**Live:** https://loca023.github.io/toadtrading.io/

## Features

- **Simulation projects** — each with its own name, starting capital (default HK$100,000),
  start/end date and base currency (HKD / USD / EUR). Runs are independent.
- **Tradable assets** — 119 instruments across US, Hong Kong and Europe:
  stocks, ETFs, bonds, plus FX pairs and cryptocurrencies.
- **Order types** — buy, sell, **short selling** and **leverage** (margin up to 2×).
  Commission is a flat **HK$40 per trade** on both the buy and the sell side.
- **Bankruptcy rule** — if net asset value falls to zero or below, the project is
  stopped and marked as game over.
- **Performance report** — generated when a project ends: total return, max drawdown,
  peak NAV, realised / unrealised P&L and leverage used.
- **Market data** — today's top gainers and losers, YTD ETF performance, hot rankings
  by volume, and a 10-year ETF stability ranking. Markets are shown in separate
  region blocks (Hong Kong / US / Europe) rather than mixed together.
- **Screener** — filter by **region → industry → need**
  (dividend / growth / value / stable / hedge), e.g. Hong Kong bank stocks.
- **Fundamentals** — five years of annual reports, shareholder percentages,
  dividend records with pay dates, and ETF historical performance.
- **Famous portfolios** — 9 well-known investors with photos and allocation donut
  charts, plus 10 model portfolios (including the Brown Permanent Portfolio)
  that can be applied to your account in one click.
- **Portfolio view** — holdings shown as a donut / pie chart.
- **Observe list** — track instruments without buying them.
- **Display currency** — switch the whole UI between HKD and USD; prices are
  converted at the current rate.
- **Bilingual** — Traditional Chinese and English, switchable at runtime.
- **Dark / light theme.**

## Running locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

All data is simulated locally with a seeded generator, so prices stay stable
between reloads. Nothing is fetched from a live market data provider.

## Layout

```
index.html        app shell
css/styles.css    light + dark theming via CSS custom properties
js/config.js      backend public config
js/cloud.js       auth / leaderboard / competition rooms
js/i18n.js        Traditional Chinese + English dictionaries
js/market-data.js asset catalogue, quote engine, fundamentals, screeners
js/store.js       persistence and the trading engine
js/chart.js       canvas price chart (no chart library)
js/app.js         controllers and rendering
```

## Deployment

GitHub Pages, deployed by `.github/workflows/pages.yml` (GitHub Actions) from
the `main` branch. Pushing to `main` redeploys automatically.

## Note on cloud features

Sign-in, the global leaderboard and private competition rooms are backed by a
managed cloud service that enforces an exact Origin match. On a domain other than
the one the backend is bound to, those features are disabled and the UI shows an
explanatory notice — simulation, market data, portfolios and charts keep working.
