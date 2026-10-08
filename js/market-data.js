/* =====================================================================
 * market-data.js — Asset catalog, FX, quotes, history, fundamentals,
 *                  dividends, ETF profiles & famous-investor data.
 * Paper Trading Simulator
 * ===================================================================== */
(function (global) {
  'use strict';

  /* ----------------------------- FX --------------------------------- */
  const FX = {
    HKDUSD: 7.80, // 1 USD = 7.80 HKD
    EURUSD: 1.082, // 1 EUR = 1.082 USD
  };

  function toUSD(amount, currency) {
    if (currency === 'USD') return amount;
    if (currency === 'HKD') return amount / FX.HKDUSD;
    if (currency === 'EUR') return amount * FX.EURUSD;
    return amount;
  }

  /* ------------------------- Asset catalog -------------------------- */
  const ASSETS = [
    /* ---------- US STOCKS ---------- */
    { symbol: 'AAPL',   name: 'Apple Inc.',               nameZh: '蘋果',        market: 'US', type: 'stock', currency: 'USD', basePrice: 232.45, decimals: 2 },
    { symbol: 'MSFT',   name: 'Microsoft Corp.',          nameZh: '微軟',        market: 'US', type: 'stock', currency: 'USD', basePrice: 420.31, decimals: 2 },
    { symbol: 'GOOGL',  name: 'Alphabet Inc.',            nameZh: '谷歌',        market: 'US', type: 'stock', currency: 'USD', basePrice: 175.82, decimals: 2 },
    { symbol: 'AMZN',   name: 'Amazon.com Inc.',          nameZh: '亞馬遜',      market: 'US', type: 'stock', currency: 'USD', basePrice: 186.25, decimals: 2 },
    { symbol: 'NVDA',   name: 'NVIDIA Corp.',             nameZh: '英偉達',      market: 'US', type: 'stock', currency: 'USD', basePrice: 128.44, decimals: 2 },
    { symbol: 'TSLA',   name: 'Tesla Inc.',               nameZh: '特斯拉',      market: 'US', type: 'stock', currency: 'USD', basePrice: 248.91, decimals: 2 },
    { symbol: 'META',   name: 'Meta Platforms Inc.',      nameZh: 'Meta',        market: 'US', type: 'stock', currency: 'USD', basePrice: 512.64, decimals: 2 },
    { symbol: 'JPM',    name: 'JPMorgan Chase & Co.',     nameZh: '摩根大通',    market: 'US', type: 'stock', currency: 'USD', basePrice: 205.12, decimals: 2 },
    { symbol: 'V',      name: 'Visa Inc.',                nameZh: '維薩',        market: 'US', type: 'stock', currency: 'USD', basePrice: 275.38, decimals: 2 },
    { symbol: 'KO',     name: 'Coca-Cola Co.',            nameZh: '可口可樂',    market: 'US', type: 'stock', currency: 'USD', basePrice: 62.84,  decimals: 2 },
    { symbol: 'DIS',    name: 'Walt Disney Co.',          nameZh: '迪士尼',      market: 'US', type: 'stock', currency: 'USD', basePrice: 95.31,  decimals: 2 },
    { symbol: 'NKE',    name: 'Nike Inc.',                nameZh: '耐克',        market: 'US', type: 'stock', currency: 'USD', basePrice: 78.62,  decimals: 2 },
    { symbol: 'BAC',    name: 'Bank of America Corp.',    nameZh: '美國銀行',    market: 'US', type: 'stock', currency: 'USD', basePrice: 39.45,  decimals: 2 },
    { symbol: 'CVX',    name: 'Chevron Corp.',            nameZh: '雪佛龍',      market: 'US', type: 'stock', currency: 'USD', basePrice: 156.20, decimals: 2 },
    { symbol: 'AXP',    name: 'American Express Co.',     nameZh: '美國運通',    market: 'US', type: 'stock', currency: 'USD', basePrice: 241.60, decimals: 2 },
    { symbol: 'OXY',    name: 'Occidental Petroleum',     nameZh: '西方石油',    market: 'US', type: 'stock', currency: 'USD', basePrice: 52.10,  decimals: 2 },
    { symbol: 'BRK.B',  name: 'Berkshire Hathaway B',     nameZh: '伯克希爾B',   market: 'US', type: 'stock', currency: 'USD', basePrice: 462.40, decimals: 2 },
    { symbol: 'AMD',    name: 'Advanced Micro Devices',   nameZh: '超威半導體',  market: 'US', type: 'stock', currency: 'USD', basePrice: 160.35, decimals: 2 },
    { symbol: 'NFLX',   name: 'Netflix Inc.',             nameZh: '奈飛',        market: 'US', type: 'stock', currency: 'USD', basePrice: 681.20, decimals: 2 },
    { symbol: 'XOM',    name: 'Exxon Mobil Corp.',        nameZh: '埃克森美孚',  market: 'US', type: 'stock', currency: 'USD', basePrice: 118.70, decimals: 2 },
    { symbol: 'UNH',    name: 'UnitedHealth Group',       nameZh: '聯合健康',    market: 'US', type: 'stock', currency: 'USD', basePrice: 541.30, decimals: 2 },

    /* ---------- US ETFs ---------- */
    { symbol: 'SPY',    name: 'SPDR S&P 500 ETF',         nameZh: '標普500 ETF', market: 'US', type: 'etf', currency: 'USD', basePrice: 552.10, decimals: 2 },
    { symbol: 'QQQ',    name: 'Invesco QQQ Trust',        nameZh: '納斯達克100', market: 'US', type: 'etf', currency: 'USD', basePrice: 472.82, decimals: 2 },
    { symbol: 'DIA',    name: 'SPDR Dow Jones ETF',       nameZh: '道瓊斯 ETF',  market: 'US', type: 'etf', currency: 'USD', basePrice: 402.55, decimals: 2 },
    { symbol: 'IWM',    name: 'iShares Russell 2000 ETF', nameZh: '羅素2000',    market: 'US', type: 'etf', currency: 'USD', basePrice: 208.74, decimals: 2 },
    { symbol: 'VOO',    name: 'Vanguard S&P 500 ETF',     nameZh: '先鋒標普500', market: 'US', type: 'etf', currency: 'USD', basePrice: 508.91, decimals: 2 },
    { symbol: 'GLD',    name: 'SPDR Gold Shares',         nameZh: '黃金 ETF',    market: 'US', type: 'etf', currency: 'USD', basePrice: 235.44, decimals: 2 },
    { symbol: 'BND',    name: 'Vanguard Total Bond ETF',  nameZh: '全債 ETF',    market: 'US', type: 'etf', currency: 'USD', basePrice: 72.91,  decimals: 2 },
    { symbol: 'TLT',    name: 'iShares 20+ Year Treasury',nameZh: '長債 ETF',    market: 'US', type: 'etf', currency: 'USD', basePrice: 92.40,  decimals: 2 },
    { symbol: 'XLK',    name: 'Technology Select SPDR',   nameZh: '科技板塊ETF', market: 'US', type: 'etf', currency: 'USD', basePrice: 215.60, decimals: 2 },

    /* ---------- US BONDS (par 100) ---------- */
    { symbol: 'US10Y',  name: 'US 10Y Treasury Note',     nameZh: '美國10年期國債', market: 'US', type: 'bond', currency: 'USD', basePrice: 98.75, decimals: 3 },
    { symbol: 'US2Y',   name: 'US 2Y Treasury Note',      nameZh: '美國2年期國債',  market: 'US', type: 'bond', currency: 'USD', basePrice: 99.62, decimals: 3 },
    { symbol: 'US30Y',  name: 'US 30Y Treasury Bond',     nameZh: '美國30年期國債', market: 'US', type: 'bond', currency: 'USD', basePrice: 96.40, decimals: 3 },

    /* ---------- HK STOCKS ---------- */
    { symbol: '0700.HK', name: 'Tencent Holdings',        nameZh: '騰訊控股',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 385.20, decimals: 2 },
    { symbol: '9988.HK', name: 'Alibaba Group',           nameZh: '阿里巴巴',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 85.60,  decimals: 2 },
    { symbol: '0941.HK', name: 'China Mobile',            nameZh: '中國移動',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 74.30,  decimals: 2 },
    { symbol: '0005.HK', name: 'HSBC Holdings',           nameZh: '滙豐控股',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 68.95,  decimals: 2 },
    { symbol: '3690.HK', name: 'Meituan',                 nameZh: '美團',       market: 'HK', type: 'stock', currency: 'HKD', basePrice: 128.50, decimals: 2 },
    { symbol: '1299.HK', name: 'AIA Group',               nameZh: '友邦保險',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 58.20,  decimals: 2 },
    { symbol: '1810.HK', name: 'Xiaomi Corp.',            nameZh: '小米集團',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 21.85,  decimals: 2 },
    { symbol: '0388.HK', name: 'HKEX',                    nameZh: '香港交易所', market: 'HK', type: 'stock', currency: 'HKD', basePrice: 292.40, decimals: 2 },
    { symbol: '2318.HK', name: 'Ping An Insurance',       nameZh: '中國平安',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 36.70,  decimals: 2 },
    { symbol: '0939.HK', name: 'CCB',                     nameZh: '建設銀行',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 5.72,   decimals: 2 },

    /* ---------- HK ETFs ---------- */
    { symbol: '2800.HK', name: 'Tracker Fund of Hong Kong', nameZh: '盈富基金',    market: 'HK', type: 'etf', currency: 'HKD', basePrice: 19.50, decimals: 2 },
    { symbol: '2828.HK', name: 'Hang Seng China Enterprises ETF', nameZh: '恒生中國企業', market: 'HK', type: 'etf', currency: 'HKD', basePrice: 68.92, decimals: 2 },
    { symbol: '2823.HK', name: 'iShares FTSE A50 China ETF', nameZh: 'A50中國指數', market: 'HK', type: 'etf', currency: 'HKD', basePrice: 12.60, decimals: 2 },
    { symbol: '3033.HK', name: 'CSOP Hang Seng TECH ETF', nameZh: '恒生科技ETF', market: 'HK', type: 'etf', currency: 'HKD', basePrice: 3.85, decimals: 3 },
    { symbol: '3086.HK', name: 'CSOP NASDAQ 100 ETF',     nameZh: '納指100ETF', market: 'HK', type: 'etf', currency: 'HKD', basePrice: 458.20, decimals: 2 },

    /* ---------- HK BONDS (par 100) ---------- */
    { symbol: 'HKG2031', name: 'HK Government Bond 2031', nameZh: '香港政府債券2031', market: 'HK', type: 'bond', currency: 'HKD', basePrice: 100.20, decimals: 3 },
    { symbol: 'HKI2026', name: 'HK iBond 2026',           nameZh: '香港通脹掛鈎債券', market: 'HK', type: 'bond', currency: 'HKD', basePrice: 100.40, decimals: 3 },

    /* ---------- FOREX ---------- */
    { symbol: 'EUR/USD', name: 'Euro / US Dollar',       nameZh: '歐元/美元',     market: 'FX', type: 'forex', currency: 'USD', basePrice: 1.0820, decimals: 4 },
    { symbol: 'GBP/USD', name: 'British Pound / USD',    nameZh: '英鎊/美元',     market: 'FX', type: 'forex', currency: 'USD', basePrice: 1.2710, decimals: 4 },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', nameZh: '美元/日元',   market: 'FX', type: 'forex', currency: 'USD', basePrice: 149.85, decimals: 2 },
    { symbol: 'USD/CNY', name: 'US Dollar / Chinese Yuan', nameZh: '美元/人民幣', market: 'FX', type: 'forex', currency: 'USD', basePrice: 7.1850, decimals: 4 },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', nameZh: '美元/瑞郎',    market: 'FX', type: 'forex', currency: 'USD', basePrice: 0.8660, decimals: 4 },
    { symbol: 'AUD/USD', name: 'Australian Dollar / USD', nameZh: '澳元/美元',    market: 'FX', type: 'forex', currency: 'USD', basePrice: 0.6580, decimals: 4 },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', nameZh: '美元/加元', market: 'FX', type: 'forex', currency: 'USD', basePrice: 1.3640, decimals: 4 },
    { symbol: 'USD/HKD', name: 'US Dollar / Hong Kong Dollar', nameZh: '美元/港元', market: 'FX', type: 'forex', currency: 'USD', basePrice: 7.8000, decimals: 4 },

    /* ---------- CRYPTO ---------- */
    { symbol: 'BTC',  name: 'Bitcoin',    nameZh: '比特幣',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 64000.00, decimals: 0 },
    { symbol: 'ETH',  name: 'Ethereum',   nameZh: '以太坊',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 2500.00,  decimals: 2 },
    { symbol: 'SOL',  name: 'Solana',     nameZh: 'Solana',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 148.00,   decimals: 2 },
    { symbol: 'BNB',  name: 'BNB',        nameZh: '幣安幣',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 580.00,   decimals: 2 },
    { symbol: 'XRP',  name: 'XRP',        nameZh: '瑞波幣',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 0.5300,   decimals: 4 },
    { symbol: 'DOGE', name: 'Dogecoin',   nameZh: '狗狗幣',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 0.1200,   decimals: 5 },
    { symbol: 'ADA',  name: 'Cardano',    nameZh: '艾達幣',   market: 'CRYPTO', type: 'crypto', currency: 'USD', basePrice: 0.3500,   decimals: 4 },

    /* ---------- EUROPE STOCKS ---------- */
    { symbol: 'SAP.DE',  name: 'SAP SE',            nameZh: '思愛普',       market: 'EU', type: 'stock', currency: 'EUR', basePrice: 182.40, decimals: 2 },
    { symbol: 'ASML.AS', name: 'ASML Holding',      nameZh: '艾司摩爾',     market: 'EU', type: 'stock', currency: 'EUR', basePrice: 712.50, decimals: 2 },
    { symbol: 'LVMH.PA', name: 'LVMH',              nameZh: '路威酩軒',     market: 'EU', type: 'stock', currency: 'EUR', basePrice: 625.80, decimals: 2 },
    { symbol: 'SIE.DE',  name: 'Siemens AG',        nameZh: '西門子',       market: 'EU', type: 'stock', currency: 'EUR', basePrice: 172.30, decimals: 2 },
    { symbol: 'ALV.DE',  name: 'Allianz SE',        nameZh: '安聯保險',     market: 'EU', type: 'stock', currency: 'EUR', basePrice: 265.60, decimals: 2 },
    { symbol: 'TTE.PA',  name: 'TotalEnergies',     nameZh: '道達爾能源',   market: 'EU', type: 'stock', currency: 'EUR', basePrice: 62.40,  decimals: 2 },
    { symbol: 'AIR.PA',  name: 'Airbus SE',         nameZh: '空中巴士',     market: 'EU', type: 'stock', currency: 'EUR', basePrice: 155.20, decimals: 2 },
    { symbol: 'SAN.PA',  name: 'Sanofi',            nameZh: '賽諾菲',       market: 'EU', type: 'stock', currency: 'EUR', basePrice: 92.80,  decimals: 2 },
    { symbol: 'BAYN.DE', name: 'Bayer AG',          nameZh: '拜耳',         market: 'EU', type: 'stock', currency: 'EUR', basePrice: 28.60,  decimals: 2 },
    { symbol: 'BN.PA',   name: 'Danone SA',         nameZh: '達能',         market: 'EU', type: 'stock', currency: 'EUR', basePrice: 59.30,  decimals: 2 },

    /* ---------- EUROPE ETFs ---------- */
    { symbol: 'SX5E.DE', name: 'iShares Euro Stoxx 50',      nameZh: '歐元區50指數',   market: 'EU', type: 'etf', currency: 'EUR', basePrice: 48.20,  decimals: 2 },
    { symbol: 'EXS1.DE', name: 'iShares Core DAX',           nameZh: '德國DAX指數',    market: 'EU', type: 'etf', currency: 'EUR', basePrice: 168.50, decimals: 2 },
    { symbol: 'IWDA.AS', name: 'iShares MSCI World',         nameZh: '全球股票指數',   market: 'EU', type: 'etf', currency: 'EUR', basePrice: 95.60,  decimals: 2 },
    { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World',    nameZh: '全球全市場',     market: 'EU', type: 'etf', currency: 'EUR', basePrice: 124.80, decimals: 2 },

    /* ---------- EUROPE BONDS (par 100) ---------- */
    { symbol: 'DE10Y', name: 'German Bund 10Y',  nameZh: '德國10年期國債', market: 'EU', type: 'bond', currency: 'EUR', basePrice: 99.40, decimals: 3 },
    { symbol: 'FR10Y', name: 'French OAT 10Y',   nameZh: '法國10年期國債', market: 'EU', type: 'bond', currency: 'EUR', basePrice: 98.70, decimals: 3 },

    /* ---------- MORE US ETFs ---------- */
    { symbol: 'VTI',  name: 'Vanguard Total Stock Market', nameZh: '美國全市場',   market: 'US', type: 'etf', currency: 'USD', basePrice: 272.40, decimals: 2 },
    { symbol: 'SCHD', name: 'Schwab US Dividend Equity',   nameZh: '美國高股息',   market: 'US', type: 'etf', currency: 'USD', basePrice: 79.20,  decimals: 2 },
    { symbol: 'XLF',  name: 'Financial Select SPDR',       nameZh: '金融板塊ETF',  market: 'US', type: 'etf', currency: 'USD', basePrice: 43.60,  decimals: 2 },
    { symbol: 'VXUS', name: 'Vanguard Total International', nameZh: '全球非美市場', market: 'US', type: 'etf', currency: 'USD', basePrice: 62.80,  decimals: 2 },

    /* ---------- MORE HK ETFs ---------- */
    { symbol: '3067.HK', name: 'iShares Hang Seng ETF', nameZh: '恒指ETF',    market: 'HK', type: 'etf', currency: 'HKD', basePrice: 19.80, decimals: 2 },
    { symbol: '2822.HK', name: 'CSOP CSI 300 ETF',     nameZh: '滬深300ETF', market: 'HK', type: 'etf', currency: 'HKD', basePrice: 42.50, decimals: 2 },

    /* ---------- MORE US STOCKS ---------- */
    { symbol: 'WMT',   name: 'Walmart Inc.',           nameZh: '沃爾瑪',     market: 'US', type: 'stock', currency: 'USD', basePrice: 75.20,  decimals: 2 },
    { symbol: 'COST',  name: 'Costco Wholesale',       nameZh: '好市多',     market: 'US', type: 'stock', currency: 'USD', basePrice: 880.40, decimals: 2 },
    { symbol: 'ORCL',  name: 'Oracle Corp.',           nameZh: '甲骨文',     market: 'US', type: 'stock', currency: 'USD', basePrice: 140.30, decimals: 2 },
    { symbol: 'INTC',  name: 'Intel Corp.',            nameZh: '英特爾',     market: 'US', type: 'stock', currency: 'USD', basePrice: 32.10,  decimals: 2 },
    { symbol: 'CSCO',  name: 'Cisco Systems',          nameZh: '思科',       market: 'US', type: 'stock', currency: 'USD', basePrice: 50.60,  decimals: 2 },
    { symbol: 'ADBE',  name: 'Adobe Inc.',             nameZh: '奧多比',     market: 'US', type: 'stock', currency: 'USD', basePrice: 540.20, decimals: 2 },
    { symbol: 'CRM',   name: 'Salesforce Inc.',        nameZh: '賽富時',     market: 'US', type: 'stock', currency: 'USD', basePrice: 275.80, decimals: 2 },
    { symbol: 'QCOM',  name: 'Qualcomm Inc.',          nameZh: '高通',       market: 'US', type: 'stock', currency: 'USD', basePrice: 165.30, decimals: 2 },
    { symbol: 'PEP',   name: 'PepsiCo Inc.',           nameZh: '百事可樂',   market: 'US', type: 'stock', currency: 'USD', basePrice: 170.50, decimals: 2 },
    { symbol: 'MCD',   name: 'McDonald\'s Corp.',      nameZh: '麥當勞',     market: 'US', type: 'stock', currency: 'USD', basePrice: 295.40, decimals: 2 },
    { symbol: 'ABBV',  name: 'AbbVie Inc.',            nameZh: '艾伯維',     market: 'US', type: 'stock', currency: 'USD', basePrice: 180.60, decimals: 2 },
    { symbol: 'PFE',   name: 'Pfizer Inc.',            nameZh: '輝瑞',       market: 'US', type: 'stock', currency: 'USD', basePrice: 28.40,  decimals: 2 },
    { symbol: 'GS',    name: 'Goldman Sachs Group',    nameZh: '高盛',       market: 'US', type: 'stock', currency: 'USD', basePrice: 470.20, decimals: 2 },
    { symbol: 'MS',    name: 'Morgan Stanley',         nameZh: '摩根士丹利', market: 'US', type: 'stock', currency: 'USD', basePrice: 100.30, decimals: 2 },
    { symbol: 'UBER',  name: 'Uber Technologies',      nameZh: '優步',       market: 'US', type: 'stock', currency: 'USD', basePrice: 72.40,  decimals: 2 },
    { symbol: 'PLTR',  name: 'Palantir Technologies',  nameZh: '帕蘭泰爾',   market: 'US', type: 'stock', currency: 'USD', basePrice: 35.20,  decimals: 2 },

    /* ---------- MORE HK STOCKS ---------- */
    { symbol: '0001.HK', name: 'CK Hutchison Holdings',  nameZh: '長和',       market: 'HK', type: 'stock', currency: 'HKD', basePrice: 42.00, decimals: 2 },
    { symbol: '0002.HK', name: 'CLP Holdings',           nameZh: '中電控股',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 66.20, decimals: 2 },
    { symbol: '0003.HK', name: 'HK & China Gas',         nameZh: '中華煤氣',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 6.20,  decimals: 2 },
    { symbol: '0011.HK', name: 'Hang Seng Bank',         nameZh: '恒生銀行',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 95.30, decimals: 2 },
    { symbol: '0016.HK', name: 'Sun Hung Kai Properties', nameZh: '新鴻基地產', market: 'HK', type: 'stock', currency: 'HKD', basePrice: 78.40, decimals: 2 },
    { symbol: '0066.HK', name: 'MTR Corporation',        nameZh: '港鐵公司',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 27.10, decimals: 2 },
    { symbol: '0175.HK', name: 'Geely Automobile',       nameZh: '吉利汽車',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 9.50,  decimals: 2 },
    { symbol: '0386.HK', name: 'Sinopec Corp.',          nameZh: '中國石油化工', market: 'HK', type: 'stock', currency: 'HKD', basePrice: 4.60,  decimals: 2 },
    { symbol: '0857.HK', name: 'PetroChina',             nameZh: '中國石油',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 6.80,  decimals: 2 },
    { symbol: '1088.HK', name: 'China Shenhua Energy',   nameZh: '中國神華',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 32.40, decimals: 2 },
    { symbol: '2628.HK', name: 'China Life Insurance',   nameZh: '中國人壽',   market: 'HK', type: 'stock', currency: 'HKD', basePrice: 11.50, decimals: 2 },
    { symbol: '0823.HK', name: 'Link REIT',              nameZh: '領展房產基金', market: 'HK', type: 'stock', currency: 'HKD', basePrice: 36.20, decimals: 2 },

    /* ---------- MORE US ETFs ---------- */
    { symbol: 'XLE',  name: 'Energy Select SPDR',      nameZh: '能源板塊ETF', market: 'US', type: 'etf', currency: 'USD', basePrice: 88.30,  decimals: 2 },
    { symbol: 'XLV',  name: 'Health Care Select SPDR', nameZh: '醫療板塊ETF', market: 'US', type: 'etf', currency: 'USD', basePrice: 148.20, decimals: 2 },
    { symbol: 'SMH',  name: 'VanEck Semiconductor ETF', nameZh: '半導體ETF',   market: 'US', type: 'etf', currency: 'USD', basePrice: 240.60, decimals: 2 },
    { symbol: 'ARKK', name: 'ARK Innovation ETF',       nameZh: 'ARK創新ETF',  market: 'US', type: 'etf', currency: 'USD', basePrice: 45.30,  decimals: 2 },
  ];

  /* ----------------------- Deposit products ------------------------ */
  const DEPOSITS = [
    { id: 'HKD3M',  currency: 'HKD', term: 3,  termDays: 90,  rate: 0.030, name: 'HKD Time Deposit',   nameZh: '港元定期存款',   market: 'HK' },
    { id: 'HKD6M',  currency: 'HKD', term: 6,  termDays: 180, rate: 0.034, name: 'HKD Time Deposit',   nameZh: '港元定期存款',   market: 'HK' },
    { id: 'HKD12M', currency: 'HKD', term: 12, termDays: 365, rate: 0.039, name: 'HKD Time Deposit',   nameZh: '港元定期存款',   market: 'HK' },
    { id: 'USD3M',  currency: 'USD', term: 3,  termDays: 90,  rate: 0.042, name: 'USD Time Deposit',   nameZh: '美元定期存款',   market: 'US' },
    { id: 'USD6M',  currency: 'USD', term: 6,  termDays: 180, rate: 0.044, name: 'USD Time Deposit',   nameZh: '美元定期存款',   market: 'US' },
    { id: 'USD12M', currency: 'USD', term: 12, termDays: 365, rate: 0.047, name: 'USD Time Deposit',   nameZh: '美元定期存款',   market: 'US' },
  ];

  const ASSET_MAP = {};
  ASSETS.forEach(function (a) { ASSET_MAP[a.symbol] = a; });

  function getAsset(symbol) { return ASSET_MAP[symbol] || null; }
  function getDeposit(id) { return DEPOSITS.find(function (d) { return d.id === id; }) || null; }
  function getDeposits() { return DEPOSITS; }

  /* -------------------- Seeded RNG (stable history) ---------------- */
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rand) {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /* ------------------- Historical series generation ---------------- */
  const DAILY_5Y = 1260;

  function generateDaily(symbol, basePrice) {
    const rand = mulberry32(hashStr(symbol + ':daily'));
    const vol = 0.013;
    const prices = new Array(DAILY_5Y);
    prices[DAILY_5Y - 1] = basePrice;
    let p = basePrice;
    for (let i = DAILY_5Y - 2; i >= 0; i--) {
      const r = gaussian(rand) * vol + 0.0003;
      p = p / (1 + r);
      prices[i] = p;
    }
    return prices;
  }

  function generateIntraday(symbol, prevClose, current, minutes) {
    const rand = mulberry32(hashStr(symbol + ':intraday:' + Math.floor(Date.now() / 60000)));
    const prices = new Array(minutes);
    const vol = 0.0009;
    let p = prevClose;
    for (let i = 0; i < minutes; i++) {
      p = p * (1 + gaussian(rand) * vol);
      prices[i] = p;
    }
    for (let i = 0; i < minutes; i++) {
      const w = (i + 1) / minutes;
      prices[i] = prices[i] * (1 - w) + current * w;
    }
    prices[minutes - 1] = current;
    return prices;
  }

  /* --------------------- Current price state ----------------------- */
  const current = {};
  const prevCloseMap = {};
  let lastUpdated = null;
  let tickTimer = null;
  let tickListeners = [];

  function initPrices() {
    ASSETS.forEach(function (a) {
      const rand = mulberry32(hashStr(a.symbol + ':prev'));
      const drift = (rand() - 0.5) * 0.02;
      prevCloseMap[a.symbol] = a.basePrice * (1 - drift);
      current[a.symbol] = a.basePrice * (1 + (rand() - 0.5) * 0.006);
    });
  }

  function onTick(fn) { tickListeners.push(fn); }

  function startTick(intervalMs) {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, intervalMs || 2200);
  }

  function tick() {
    ASSETS.forEach(function (a) {
      const p = current[a.symbol];
      const r = (Math.random() - 0.5) * 2 * 0.0012;
      const np = p * (1 + r);
      current[a.symbol] = Math.max(0.01, np);
    });
    lastUpdated = Date.now();
    tickListeners.forEach(function (fn) { fn(); });
  }

  function getPrice(symbol) { return current[symbol]; }
  function getPrevClose(symbol) { return prevCloseMap[symbol]; }
  function getLastUpdated() { return lastUpdated; }

  /* --------------------- Live provider (adapter) ------------------- */
  const LIVE_ENDPOINT = null;
  let providerState = 'simulated';

  function tryLiveFetch() {
    if (!LIVE_ENDPOINT) { providerState = 'simulated'; return; }
    const symbols = ASSETS.map(function (a) { return a.symbol; }).join(',');
    fetch(LIVE_ENDPOINT + encodeURIComponent(symbols), { signal: AbortSignal.timeout(3500) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        let updated = 0;
        ASSETS.forEach(function (a) {
          if (data && typeof data[a.symbol] === 'number') {
            current[a.symbol] = data[a.symbol];
            updated++;
          }
        });
        if (updated > 0) {
          providerState = 'live';
          lastUpdated = Date.now();
          tickListeners.forEach(function (fn) { fn(); });
        }
      })
      .catch(function () { providerState = 'simulated'; });
  }

  function getProviderState() { return providerState; }

  /* --------------------------- History API ------------------------- */
  function getHistory(symbol, range) {
    const a = getAsset(symbol);
    if (!a) return { points: [], prevClose: 0 };
    const daily = generateDaily(symbol, a.basePrice);
    const cur = current[symbol] || a.basePrice;
    const pc = prevCloseMap[symbol] || a.basePrice;

    let points = [];
    const now = Date.now();
    const DAY = 86400000;

    if (range === '1D') {
      const mins = 240;
      const intra = generateIntraday(symbol, pc, cur, mins);
      const start = now - mins * 60000;
      for (let i = 0; i < mins; i++) points.push({ t: start + i * 60000, price: intra[i] });
    } else if (range === '5D') {
      for (let i = 5; i >= 1; i--) points.push({ t: now - i * DAY, price: daily[DAILY_5Y - 1 - i] });
      const mins = 48;
      const intra = generateIntraday(symbol, pc, cur, mins);
      const start = now - mins * 60000;
      for (let i = 0; i < mins; i++) points.push({ t: start + i * 60000, price: intra[i] });
    } else {
      const n = { '1M': 22, '3M': 66, '1Y': 252, '5Y': 1260 }[range] || 66;
      for (let i = 0; i < n; i++) {
        const idx = DAILY_5Y - n + i;
        points.push({ t: now - (n - 1 - i) * DAY, price: daily[idx] });
      }
      points[points.length - 1].price = cur;
    }
    return { points: points, prevClose: pc };
  }

  /* ----------------------- Performance metrics --------------------- */
  function getTodayChangePct(symbol) {
    const p = current[symbol]; const pc = prevCloseMap[symbol];
    if (!p || !pc) return 0;
    return (p - pc) / pc * 100;
  }

  function getYtdReturnPct(symbol) {
    const a = getAsset(symbol);
    if (!a) return 0;
    const daily = generateDaily(symbol, a.basePrice);
    const yearAgo = daily[DAILY_5Y - 252] || a.basePrice;
    const p = current[symbol] || a.basePrice;
    return (p - yearAgo) / yearAgo * 100;
  }

  function getTopMovers() {
    const stocks = ASSETS.filter(function (a) { return a.type === 'stock'; });
    const etfs = ASSETS.filter(function (a) { return a.type === 'etf'; });

    const today = stocks.map(function (a) {
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, chgPct: getTodayChangePct(a.symbol), price: current[a.symbol] };
    }).sort(function (x, y) { return y.chgPct - x.chgPct; });

    const etfYtd = etfs.map(function (a) {
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, chgPct: getYtdReturnPct(a.symbol), price: current[a.symbol] };
    }).sort(function (x, y) { return y.chgPct - x.chgPct; });

    return {
      todayGainers: today.slice(0, 8),
      todayLosers: today.slice(-8).reverse(),
      ytdEtfGainers: etfYtd.slice(0, 8),
      ytdEtfLosers: etfYtd.slice(-8).reverse(),
    };
  }

  // Market-split movers (stocks) — keeps HK / US / EU separate.
  function getMarketMovers(market) {
    const stocks = ASSETS.filter(function (a) { return a.market === market && a.type === 'stock'; });
    const list = stocks.map(function (a) {
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, chgPct: getTodayChangePct(a.symbol), price: current[a.symbol] };
    }).sort(function (x, y) { return y.chgPct - x.chgPct; });
    return { gainers: list.slice(0, 8), losers: list.slice(-8).reverse() };
  }

  // Market-split YTD ETF movers.
  function getMarketEtfYtd(market) {
    const etfs = ASSETS.filter(function (a) { return a.market === market && a.type === 'etf'; });
    const list = etfs.map(function (a) {
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, chgPct: getYtdReturnPct(a.symbol), price: current[a.symbol] };
    }).sort(function (x, y) { return y.chgPct - x.chgPct; });
    return { gainers: list.slice(0, 8), losers: list.slice(-8).reverse() };
  }

  /* ------------------------ Fundamentals --------------------------- */
  const DIVIDEND_STOCKS = ['AAPL', 'KO', 'JPM', 'V', 'DIS', 'NKE', 'BAC', 'CVX', 'AXP', 'OXY', 'BRK.B', 'XOM', 'UNH', 'MSFT', '0700.HK', '0941.HK', '0005.HK', '1299.HK', '2318.HK', '0939.HK', '0388.HK'];

  function getFundamentals(symbol) {
    const a = getAsset(symbol);
    if (!a) return null;
    const rand = mulberry32(hashStr(symbol + ':fund'));
    const price = current[symbol] || a.basePrice;

    const sharesM = 800 + rand() * 9000;
    const marketCap = price * sharesM * 1e6;
    const pe = 12 + rand() * 28;
    const eps = price / pe;
    const pb = 1.2 + rand() * 7;
    const bookPerShare = price / pb;
    const ps = 1.5 + rand() * 8;
    const revenuePerShare = price / ps;
    const revenue = revenuePerShare * sharesM * 1e6;
    const netMargin = 0.04 + rand() * 0.22;
    const netIncome = revenue * netMargin;
    const grossMargin = 0.22 + rand() * 0.45;
    const roe = 0.06 + rand() * 0.28;
    const debtToEquity = 0.1 + rand() * 1.8;
    const equity = bookPerShare * sharesM * 1e6;
    const totalLiabilities = equity * debtToEquity;
    const totalAssets = equity + totalLiabilities;
    const fcfMargin = 0.05 + rand() * 0.2;
    const freeCashFlow = revenue * fcfMargin;
    const opCashFlow = freeCashFlow * (1.3 + rand() * 0.7);
    const beta = 0.6 + rand() * 1.4;

    const years = ['2021', '2022', '2023', '2024', '2025'];
    const rev = new Array(5);
    rev[4] = revenue;
    for (let i = 3; i >= 0; i--) {
      const g = (rand() - 0.15) * 0.35;
      rev[i] = rev[i + 1] / (1 + g);
    }
    const ni = rev.map(function (r, i) { return r * netMargin * (1 + (i - 4) * 0.03); });
    const epsArr = ni.map(function (n) { return n / (sharesM * 1e6); });

    // Top shareholders
    const holders = [
      { name: 'Vanguard Group', nameZh: '先鋒集團', pct: 6.0 + rand() * 3.0 },
      { name: 'BlackRock', nameZh: '貝萊德', pct: 5.0 + rand() * 3.0 },
      { name: 'State Street', nameZh: '道富', pct: 3.0 + rand() * 2.0 },
      { name: 'Fidelity Investments', nameZh: '富達投資', pct: 2.0 + rand() * 2.0 },
      { name: 'Insiders & Management', nameZh: '管理層及內部人', pct: 0.8 + rand() * 5.0 },
    ].sort(function (a, b) { return b.pct - a.pct; });

    const daily = generateDaily(symbol, a.basePrice);
    const last252 = daily.slice(-252);
    const high52 = Math.max.apply(null, last252);
    const low52 = Math.min.apply(null, last252);

    const pays = DIVIDEND_STOCKS.indexOf(symbol) >= 0 || a.type === 'bond';
    const divYield = pays ? (a.type === 'bond' ? 0.035 : 0.01 + rand() * 0.045) : 0;

    const sec = sectorOf(symbol, a.type);
    const desc = DESC_TEMPLATES[sec[0]] || ['', ''];

    return {
      marketCap: marketCap, sharesOutstanding: sharesM * 1e6,
      eps: eps, pe: pe, pb: pb, ps: ps, roe: roe,
      grossMargin: grossMargin, netMargin: netMargin, beta: beta,
      dividendYield: divYield, pays: pays,
      high52: high52, low52: low52,
      revenue: revenue, netIncome: netIncome,
      totalAssets: totalAssets, totalLiabilities: totalLiabilities, equity: equity,
      debtToEquity: debtToEquity, freeCashFlow: freeCashFlow, operatingCashFlow: opCashFlow,
      sector: sec[0], sectorZh: sec[1],
      description: desc[0], descriptionZh: desc[1],
      income: { revenue: rev, netIncome: ni, eps: epsArr, years: years },
      shareholders: holders,
    };
  }

  function getDividends(symbol) {
    const a = getAsset(symbol);
    if (!a) return null;
    const rand = mulberry32(hashStr(symbol + ':div'));
    if (a.type === 'bond') {
      const coupon = (a.basePrice >= 99 ? 0.03 : 0.04) + rand() * 0.005;
      const rows = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(Date.now() - i * 182 * 86400000);
        rows.push({ exDate: fmtDate(d), payDate: fmtDate(new Date(d.getTime() + 21 * 86400000)), amount: +(coupon * 100 / 2).toFixed(3), note: 'Coupon' });
      }
      return { pays: true, annualized: coupon * 100, freq: 'Semi-annual', rows: rows };
    }
    if (DIVIDEND_STOCKS.indexOf(symbol) < 0) {
      return { pays: false, annualized: 0, freq: '-', rows: [] };
    }
    const base = a.basePrice;
    const yieldPct = 0.01 + rand() * 0.045;
    const annual = base * yieldPct;
    const perQ = annual / 4;
    const rows = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.now() - i * 91 * 86400000);
      rows.push({ exDate: fmtDate(d), payDate: fmtDate(new Date(d.getTime() + 25 * 86400000)), amount: +(perQ * (0.92 + rand() * 0.16)).toFixed(3), note: 'Cash' });
    }
    return { pays: true, annualized: yieldPct * 100, freq: 'Quarterly', rows: rows };
  }

  function getEtfProfile(symbol) {
    const a = getAsset(symbol);
    if (!a || a.type !== 'etf') return null;
    const rand = mulberry32(hashStr(symbol + ':etf'));
    const perf = {
      '1M': getHistReturn(symbol, 22),
      '3M': getHistReturn(symbol, 66),
      '1Y': getHistReturn(symbol, 252),
      '3Y': getHistReturn(symbol, 756),
      '5Y': getHistReturn(symbol, 1260),
      YTD: getYtdReturnPct(symbol),
    };
    const expense = 0.03 + rand() * 0.55;
    const aum = (0.5 + rand() * 120) * 1e9;
    const holdings = ['Apple Inc.', 'Microsoft', 'NVIDIA', 'Amazon', 'Alphabet', 'Meta', 'Broadcom', 'Tesla', 'JPMorgan', 'UnitedHealth'];
    return {
      expenseRatio: expense, aum: aum, inception: 1998 + Math.floor(rand() * 20),
      index: (a.nameZh || a.name).replace(/ ETF.*/, ''),
      provider: ['BlackRock', 'Vanguard', 'State Street', 'Invesco', 'CSOP'][Math.floor(rand() * 5)],
      performance: perf,
      topHoldings: holdings,
      dividendYield: 0.3 + rand() * 2.8,
    };
  }

  function getHistReturn(symbol, days) {
    const a = getAsset(symbol);
    if (!a) return 0;
    const daily = generateDaily(symbol, a.basePrice);
    const past = daily[Math.max(0, DAILY_5Y - days)] || a.basePrice;
    const p = current[symbol] || a.basePrice;
    return (p - past) / past * 100;
  }

  function getPerformance(symbol) {
    if (!getAsset(symbol)) return null;
    return {
      '1M': getHistReturn(symbol, 22),
      '3M': getHistReturn(symbol, 66),
      '1Y': getHistReturn(symbol, 252),
      '3Y': getHistReturn(symbol, 756),
      '5Y': getHistReturn(symbol, 1260),
      YTD: getYtdReturnPct(symbol),
    };
  }

  function fmtDate(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------------------- Famous investors ------------------------- */
  const INVESTORS = [
    {
      id: 'buffett', name: 'Warren Buffett', nameZh: '沃倫·巴菲特',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg/200px-Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg',
      firm: 'Berkshire Hathaway', firmZh: '伯克希爾·哈撒韋',
      strategyEn: 'Value investing · Long-term holding', strategyZh: '價值投資 · 長期持有',
      holdings: [
        { symbol: 'AAPL', weight: 0.44 }, { symbol: 'AXP', weight: 0.13 }, { symbol: 'KO', weight: 0.10 },
        { symbol: 'CVX', weight: 0.08 }, { symbol: 'OXY', weight: 0.07 }, { symbol: 'BAC', weight: 0.06 },
        { symbol: 'XOM', weight: 0.04 }, { symbol: 'V', weight: 0.03 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.60 }, { label: 'Cash', labelZh: '現金', pct: 0.30 },
        { label: 'Bonds', labelZh: '債券', pct: 0.05 }, { label: 'Other', labelZh: '其他', pct: 0.05 },
      ],
      noteEn: 'The Oracle of Omaha — concentrated bets on high-quality businesses held for decades.',
      noteZh: '「股神」——集中持有優質企業並長期持有數十年。',
    },
    {
      id: 'musk', name: 'Elon Musk', nameZh: '埃隆·馬斯克',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/200px-Elon_Musk_-_54820081119_%28cropped%29.jpg',
      firm: 'Tesla / SpaceX', firmZh: '特斯拉 / SpaceX',
      strategyEn: 'Concentrated · High conviction', strategyZh: '集中持倉 · 高度確信',
      holdings: [
        { symbol: 'TSLA', weight: 0.62 }, { symbol: 'NFLX', weight: 0.05 }, { symbol: 'AMD', weight: 0.03 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.65 }, { label: 'Private', labelZh: '未上市', pct: 0.28 }, { label: 'Cash', labelZh: '現金', pct: 0.07 },
      ],
      noteEn: 'A large share of wealth tied to Tesla and private ventures (SpaceX, xAI). Extremely concentrated.',
      noteZh: '財富絕大部分集中於特斯拉及私人公司（SpaceX、xAI），高度集中。',
    },
    {
      id: 'dalio', name: 'Ray Dalio', nameZh: '瑞·達利歐',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Web_Summit_2018_-_Forum_-_Day_2%2C_November_7_HM1_7481_%2844858045925%29.jpg/200px-Web_Summit_2018_-_Forum_-_Day_2%2C_November_7_HM1_7481_%2844858045925%29.jpg',
      firm: 'Bridgewater Associates', firmZh: '橋水基金',
      strategyEn: 'Risk parity · All Weather', strategyZh: '風險平價 · 全天候',
      holdings: [
        { symbol: 'SPY', weight: 0.18 }, { symbol: 'QQQ', weight: 0.12 }, { symbol: 'GLD', weight: 0.10 },
        { symbol: 'TLT', weight: 0.08 }, { symbol: 'MSFT', weight: 0.07 }, { symbol: 'NVDA', weight: 0.06 },
        { symbol: 'GOOGL', weight: 0.05 }, { symbol: 'VOO', weight: 0.05 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.30 }, { label: 'Bonds', labelZh: '債券', pct: 0.40 },
        { label: 'Commodities', labelZh: '商品', pct: 0.15 }, { label: 'Cash', labelZh: '現金', pct: 0.15 },
      ],
      noteEn: 'The All Weather portfolio — diversified across asset classes for any economic regime.',
      noteZh: '「全天候」組合——跨資產類別分散，應對任何經濟環境。',
    },
    {
      id: 'burry', name: 'Michael Burry', nameZh: '邁克爾·伯裏',
      photo: '',
      firm: 'Scion Asset Management', firmZh: 'Scion 資管',
      strategyEn: 'Deep value · Contrarian', strategyZh: '深度價值 · 逆向',
      holdings: [
        { symbol: 'NVDA', weight: 0.15 }, { symbol: 'AAPL', weight: 0.10 }, { symbol: 'CVX', weight: 0.09 },
        { symbol: 'OXY', weight: 0.08 }, { symbol: 'JPM', weight: 0.07 }, { symbol: 'BRK.B', weight: 0.06 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.70 }, { label: 'Cash', labelZh: '現金', pct: 0.20 }, { label: 'Bonds', labelZh: '債券', pct: 0.10 },
      ],
      noteEn: 'Famous for predicting the 2008 crash; runs concentrated contrarian value positions.',
      noteZh: '因預判 2008 年危機聞名；集中持有逆向價值倉位。',
    },
    {
      id: 'ackman', name: 'Bill Ackman', nameZh: '比爾·阿克曼',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Valeant_Pharmaceuticals%27_Business_Model_%28headshot%29.jpg',
      firm: 'Pershing Square', firmZh: '潘興廣場',
      strategyEn: 'Activist · Concentrated value', strategyZh: '積極股東 · 集中價值',
      holdings: [
        { symbol: 'GOOGL', weight: 0.16 }, { symbol: 'DIS', weight: 0.10 }, { symbol: 'V', weight: 0.08 },
        { symbol: 'NFLX', weight: 0.07 }, { symbol: 'MSFT', weight: 0.06 }, { symbol: 'JPM', weight: 0.05 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.80 }, { label: 'Cash', labelZh: '現金', pct: 0.15 }, { label: 'Bonds', labelZh: '債券', pct: 0.05 },
      ],
      noteEn: 'Activist investor taking concentrated stakes in a small number of quality companies.',
      noteZh: '積極投資者，集中持有少數優質公司股份。',
    },
    {
      id: 'soros', name: 'George Soros', nameZh: '喬治·索羅斯',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/George_Soros%2C_Founder_and_Chairman_of_the_Open_Society_Foundations%2C_visits_the_EC_%283x4_cropped%29.jpg/200px-George_Soros%2C_Founder_and_Chairman_of_the_Open_Society_Foundations%2C_visits_the_EC_%283x4_cropped%29.jpg',
      firm: 'Soros Fund Management', firmZh: '索羅斯基金管理',
      strategyEn: 'Global macro · Reflexivity', strategyZh: '全球宏觀 · 反身性',
      holdings: [
        { symbol: 'SPY', weight: 0.14 }, { symbol: 'QQQ', weight: 0.12 }, { symbol: 'GOOGL', weight: 0.09 },
        { symbol: 'NVDA', weight: 0.07 }, { symbol: 'AMZN', weight: 0.06 }, { symbol: 'MSFT', weight: 0.06 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.55 }, { label: 'Bonds', labelZh: '債券', pct: 0.25 }, { label: 'Cash', labelZh: '現金', pct: 0.20 },
      ],
      noteEn: 'Legendary global macro investor known for currency bets and market timing.',
      noteZh: '傳奇全球宏觀投資者，以外匯押注與市場擇時聞名。',
    },
    {
      id: 'cwood', name: 'Cathie Wood', nameZh: '凱瑟琳·伍德',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Cathie_Wood_ARK_Invest_Photo.jpg/200px-Cathie_Wood_ARK_Invest_Photo.jpg',
      firm: 'ARK Invest', firmZh: '方舟投資',
      strategyEn: 'Disruptive innovation · Growth', strategyZh: '顛覆性創新 · 成長',
      holdings: [
        { symbol: 'TSLA', weight: 0.12 }, { symbol: 'NVDA', weight: 0.10 }, { symbol: 'AMD', weight: 0.08 },
        { symbol: 'BTC', weight: 0.08 }, { symbol: 'NFLX', weight: 0.06 }, { symbol: 'META', weight: 0.05 },
      ],
      allocation: [
        { label: 'Growth equities', labelZh: '成長股', pct: 0.70 }, { label: 'Crypto', labelZh: '加密貨幣', pct: 0.15 }, { label: 'Cash', labelZh: '現金', pct: 0.15 },
      ],
      noteEn: 'Innovation-focused investor betting on disruptive technologies and digital assets.',
      noteZh: '聚焦顛覆性科技與數字資產的創新投資者。',
    },
    {
      id: 'munger', name: 'Charlie Munger', nameZh: '查理·芒格',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Charlie_Munger_%28cropped%29.jpg/200px-Charlie_Munger_%28cropped%29.jpg',
      firm: 'Berkshire Hathaway', firmZh: '伯克希爾·哈撒韋',
      strategyEn: 'Value investing · Mental models', strategyZh: '價值投資 · 思維模型',
      holdings: [
        { symbol: 'BRK.B', weight: 0.25 }, { symbol: 'AAPL', weight: 0.15 }, { symbol: 'KO', weight: 0.10 },
        { symbol: 'BAC', weight: 0.08 }, { symbol: 'AXP', weight: 0.07 }, { symbol: 'V', weight: 0.05 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.65 }, { label: 'Cash', labelZh: '現金', pct: 0.25 }, { label: 'Bonds', labelZh: '債券', pct: 0.10 },
      ],
      noteEn: 'Buffett\'s long-time partner and a master of multidisciplinary thinking.',
      noteZh: '巴菲特長期搭檔，精通多學科思維的價值投資大師。',
    },
    {
      id: 'icahn', name: 'Carl Icahn', nameZh: '卡爾·伊坎',
      photo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Carl_Icahn%2C_1980s.jpg/200px-Carl_Icahn%2C_1980s.jpg',
      firm: 'Icahn Enterprises', firmZh: '伊坎企業',
      strategyEn: 'Activist · Value', strategyZh: '積極股東 · 價值',
      holdings: [
        { symbol: 'XOM', weight: 0.12 }, { symbol: 'CVX', weight: 0.10 }, { symbol: 'JPM', weight: 0.08 },
        { symbol: 'V', weight: 0.07 }, { symbol: 'DIS', weight: 0.06 }, { symbol: 'NFLX', weight: 0.05 },
      ],
      allocation: [
        { label: 'Equities', labelZh: '股票', pct: 0.75 }, { label: 'Cash', labelZh: '現金', pct: 0.15 }, { label: 'Bonds', labelZh: '債券', pct: 0.10 },
      ],
      noteEn: 'Veteran activist investor known for pushing corporate change.',
      noteZh: '資深積極投資者，以推動企業變革著稱。',
    },
  ];

  function getInvestors() { return INVESTORS; }

  /* --------------------- 10-year stability ------------------------- */
  const DAILY_10Y = 2520;
  function generateDaily10Y(symbol, basePrice) {
    const rand = mulberry32(hashStr(symbol + ':daily10y'));
    const vol = 0.013;
    const prices = new Array(DAILY_10Y);
    prices[DAILY_10Y - 1] = basePrice;
    let p = basePrice;
    for (let i = DAILY_10Y - 2; i >= 0; i--) {
      const r = gaussian(rand) * vol + 0.0003;
      p = p / (1 + r);
      prices[i] = p;
    }
    return prices;
  }

  function getStabilityRanking() {
    const etfs = ASSETS.filter(function (a) { return a.type === 'etf'; });
    return etfs.map(function (a) {
      const series = generateDaily10Y(a.symbol, a.basePrice);
      let sum = 0, sumSq = 0;
      for (let i = 1; i < series.length; i++) {
        const r = (series[i] - series[i - 1]) / series[i - 1];
        sum += r; sumSq += r * r;
      }
      const n = series.length - 1;
      const mean = sum / n;
      const variance = Math.max(0, sumSq / n - mean * mean);
      const volAnnual = Math.sqrt(variance) * Math.sqrt(252) * 100; // %
      const start = series[0];
      const cur = current[a.symbol] || a.basePrice;
      const totalReturn = (cur - start) / start * 100;
      const cagr = (Math.pow(cur / start, 1 / 10) - 1) * 100;
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, volatility: volAnnual, cagr: cagr, totalReturn: totalReturn, price: cur };
    }).sort(function (x, y) { return x.volatility - y.volatility; });
  }

  /* ----------------------- Hot ranking (volume) -------------------- */
  function dailyTurnover(symbol) {
    const h = hashStr(symbol + ':vol');
    const base = 5e6 + (h % 200) * 1e6;
    const a = getAsset(symbol);
    const price = current[symbol] || a.basePrice;
    return base * price;
  }

  function getHotRanking(period) {
    const days = { today: 1, week: 5, month: 22, '3month': 66 }[period] || 22;
    const items = ASSETS.filter(function (a) { return a.type === 'stock' || a.type === 'etf' || a.type === 'crypto'; });
    return items.map(function (a) {
      const turnover = dailyTurnover(a.symbol) * days;
      return { symbol: a.symbol, name: a.name, nameZh: a.nameZh, market: a.market, currency: a.currency, decimals: a.decimals, type: a.type, turnover: turnover, price: current[a.symbol] || a.basePrice };
    }).sort(function (x, y) { return y.turnover - x.turnover; }).slice(0, 20);
  }

  /* ----------------------- Famous portfolios ----------------------- */
  const PORTFOLIOS = [
    {
      id: 'permanent', name: 'Permanent Portfolio', nameZh: '布朗永久組合',
      author: 'Harry Browne', authorZh: '哈裏·布朗',
      tag: '全天候 · 低波動',
      risk: '低', ret: 6.5,
      allocation: [
        { label: 'Stocks', labelZh: '股票', pct: 0.25, symbol: 'SPY' },
        { label: 'Long-term bonds', labelZh: '長期國債', pct: 0.25, symbol: 'TLT' },
        { label: 'Gold', labelZh: '黃金', pct: 0.25, symbol: 'GLD' },
        { label: 'Cash', labelZh: '現金', pct: 0.25, symbol: 'BND' },
      ],
      noteEn: 'A classic all-weather portfolio: 25% each in stocks, long bonds, gold and cash. Designed to perform steadily in any economic environment.',
      noteZh: '經典全天候組合：股票、長期國債、黃金、現金各 25%，旨在任何經濟環境下都保持穩定表現。',
    },
    {
      id: '6040', name: '60/40 Portfolio', nameZh: '60/40 組合',
      author: 'Classic', authorZh: '經典配置',
      tag: '股債平衡',
      risk: '中低', ret: 7.5,
      allocation: [
        { label: 'Stocks', labelZh: '股票', pct: 0.60, symbol: 'SPY' },
        { label: 'Bonds', labelZh: '債券', pct: 0.40, symbol: 'BND' },
      ],
      noteEn: 'The traditional balanced portfolio: 60% stocks and 40% bonds, balancing growth with stability.',
      noteZh: '傳統平衡配置：60% 股票 + 40% 債券，在增長與穩定之間取得平衡。',
    },
    {
      id: 'allweather', name: 'All Weather Portfolio', nameZh: '全天候組合',
      author: 'Ray Dalio', authorZh: '瑞·達利歐',
      tag: '風險平價',
      risk: '中', ret: 7.0,
      allocation: [
        { label: 'Stocks', labelZh: '股票', pct: 0.30, symbol: 'SPY' },
        { label: 'Long bonds', labelZh: '長期國債', pct: 0.40, symbol: 'TLT' },
        { label: 'Interm. bonds', labelZh: '中期國債', pct: 0.15, symbol: 'BND' },
        { label: 'Gold', labelZh: '黃金', pct: 0.075, symbol: 'GLD' },
        { label: 'Commodities', labelZh: '商品', pct: 0.075, symbol: 'DIA' },
      ],
      noteEn: 'Bridgewater\'s risk-parity portfolio, spread across asset classes to weather any economic regime.',
      noteZh: '橋水的風險平價組合，跨資產類別分散，以應對任何經濟周期。',
    },
    {
      id: 'threefund', name: 'Three-Fund Portfolio', nameZh: '三基金組合',
      author: 'Bogleheads', authorZh: '博格信徒',
      tag: '極簡指數',
      risk: '中', ret: 8.0,
      allocation: [
        { label: 'US stocks', labelZh: '美股', pct: 0.50, symbol: 'VOO' },
        { label: 'Intl stocks', labelZh: '國際股票', pct: 0.30, symbol: 'QQQ' },
        { label: 'Bonds', labelZh: '債券', pct: 0.20, symbol: 'BND' },
      ],
      noteEn: 'A simple low-cost index strategy with just three funds covering the entire market.',
      noteZh: '僅用三隻指數基金覆蓋全市場的極簡低成本策略。',
    },
    {
      id: 'dividend', name: 'Dividend Growth', nameZh: '股息增長組合',
      author: 'Income strategy', authorZh: '收益策略',
      tag: '現金流',
      risk: '中低', ret: 7.0,
      allocation: [
        { label: 'Consumer staples', labelZh: '消費', pct: 0.25, symbol: 'KO' },
        { label: 'Financials', labelZh: '金融', pct: 0.25, symbol: 'JPM' },
        { label: 'Energy', labelZh: '能源', pct: 0.20, symbol: 'XOM' },
        { label: 'Tech (dividend)', labelZh: '科技(派息)', pct: 0.15, symbol: 'AAPL' },
        { label: 'Healthcare', labelZh: '醫療', pct: 0.15, symbol: 'UNH' },
      ],
      noteEn: 'A portfolio of high-quality dividend growers for steady and rising cash flow.',
      noteZh: '由優質派息增長股構成，追求穩定且持續增長的現金流。',
    },
    {
      id: 'core', name: 'Core-Satellite', nameZh: '核心-衛星組合',
      author: 'Hybrid', authorZh: '混合策略',
      tag: '核心+增強',
      risk: '中', ret: 8.5,
      allocation: [
        { label: 'Core index', labelZh: '核心指數', pct: 0.70, symbol: 'SPY' },
        { label: 'Growth', labelZh: '成長', pct: 0.15, symbol: 'QQQ' },
        { label: 'Gold hedge', labelZh: '黃金對衝', pct: 0.15, symbol: 'GLD' },
      ],
      noteEn: 'A large passive core plus small "satellite" bets for a boost in returns.',
      noteZh: '以被動指數爲核心，輔以小比例衛星倉位增強收益。',
    },
    {
      id: 'beardef', name: 'Bear-Market Defense', nameZh: '熊市防禦組合',
      author: 'Defensive', authorZh: '防守策略',
      tag: '避險',
      risk: '低', ret: 4.5,
      allocation: [
        { label: 'Stocks', labelZh: '股票', pct: 0.20, symbol: 'SPY' },
        { label: 'Long bonds', labelZh: '長期國債', pct: 0.40, symbol: 'TLT' },
        { label: 'Gold', labelZh: '黃金', pct: 0.30, symbol: 'GLD' },
        { label: 'Cash', labelZh: '現金', pct: 0.10, symbol: 'BND' },
      ],
      noteEn: 'A defensive mix weighted to long bonds and gold to cushion market downturns.',
      noteZh: '偏重長期國債與黃金的防守型配置，用以緩衝市場下跌。',
    },
    {
      id: 'global', name: 'Global Allocation', nameZh: '全球配置組合',
      author: 'Market-cap', authorZh: '市值加權',
      tag: '全球化',
      risk: '中', ret: 7.5,
      allocation: [
        { label: 'US stocks', labelZh: '美股', pct: 0.50, symbol: 'VTI' },
        { label: 'Intl stocks', labelZh: '國際股票', pct: 0.30, symbol: 'VXUS' },
        { label: 'Bonds', labelZh: '債券', pct: 0.20, symbol: 'BND' },
      ],
      noteEn: 'A globally diversified market-cap weighted portfolio across regions.',
      noteZh: '跨區域的全球市值加權分散配置。',
    },
    {
      id: 'techgrowth', name: 'Tech Growth', nameZh: '科技成長組合',
      author: 'Growth', authorZh: '成長策略',
      tag: '高成長',
      risk: '高', ret: 11.0,
      allocation: [
        { label: 'Nasdaq 100', labelZh: '納斯達克100', pct: 0.40, symbol: 'QQQ' },
        { label: 'Tech sector', labelZh: '科技板塊', pct: 0.30, symbol: 'XLK' },
        { label: 'Semiconductors', labelZh: '半導體', pct: 0.20, symbol: 'NVDA' },
        { label: 'Chips', labelZh: '芯片', pct: 0.10, symbol: 'AMD' },
      ],
      noteEn: 'A concentrated high-growth technology portfolio for aggressive investors.',
      noteZh: '面向進取型投資者的集中式高成長科技配置。',
    },
    {
      id: 'divreinvest', name: 'Dividend Reinvest', nameZh: '紅利再投資組合',
      author: 'Income', authorZh: '收益策略',
      tag: '現金流',
      risk: '中低', ret: 7.0,
      allocation: [
        { label: 'High dividend', labelZh: '高股息', pct: 0.30, symbol: 'SCHD' },
        { label: 'Consumer', labelZh: '消費', pct: 0.20, symbol: 'KO' },
        { label: 'Energy', labelZh: '能源', pct: 0.20, symbol: 'XOM' },
        { label: 'Financials', labelZh: '金融', pct: 0.15, symbol: 'JPM' },
        { label: 'Payments', labelZh: '支付', pct: 0.15, symbol: 'V' },
      ],
      noteEn: 'High-yield dividend stocks built for long-term reinvestment of cash flow.',
      noteZh: '由高股息股票構成，適合長期紅利再投資。',
    },
  ];

  function getPortfolios() { return PORTFOLIOS; }

  /* ------------------------- ETF suggestions ----------------------- */
  const ETF_PICKS = [
    { symbol: 'SPY', tag: '核心配置', tagEn: 'Core', reasonZh: '低費率跟蹤標普500，覆蓋美股大盤，適合作爲長期底倉。', reasonEn: 'Low-cost S&P 500 tracker covering the broad US market.' },
    { symbol: 'QQQ', tag: '成長', tagEn: 'Growth', reasonZh: '聚焦納斯達克100科技龍頭，長期成長動能強勁。', reasonEn: 'Concentrated exposure to Nasdaq-100 tech leaders.' },
    { symbol: 'VOO', tag: '長期定投', tagEn: 'DCA', reasonZh: '與SPY同跟蹤標普500，費率更低，適合定投。', reasonEn: 'Same S&P 500 exposure as SPY with an even lower fee.' },
    { symbol: 'GLD', tag: '避險', tagEn: 'Hedge', reasonZh: '黃金ETF，通脹與地緣風險時期的對衝工具。', reasonEn: 'Gold ETF for hedging inflation and geopolitical risk.' },
    { symbol: 'BND', tag: '穩健', tagEn: 'Income', reasonZh: '全債ETF，提供穩定票息並降低組合波動。', reasonEn: 'Total bond ETF providing stable income and lower volatility.' },
    { symbol: '2800.HK', tag: '港股', tagEn: 'HK', reasonZh: '盈富基金跟蹤恒生指數，一鍵布局港股大盤。', reasonEn: 'Tracker Fund of HK tracking the Hang Seng Index.' },
    { symbol: 'VTI', tag: '全市場', tagEn: 'Total market', reasonZh: '覆蓋美國全部上市公司的全市場指數，分散極佳。', reasonEn: 'Total US stock market coverage with excellent diversification.' },
    { symbol: 'SCHD', tag: '高股息', tagEn: 'Dividend', reasonZh: '聚焦持續派息的美國優質股息股，適合收息。', reasonEn: 'Quality US dividend payers, ideal for income investors.' },
    { symbol: 'XLF', tag: '金融', tagEn: 'Financials', reasonZh: '銀行、保險、券商等金融板塊的一攬子配置。', reasonEn: 'Basket exposure to banks, insurers and financials.' },
    { symbol: 'VXUS', tag: '國際', tagEn: 'International', reasonZh: '布局美國以外全球市場，分散單一市場風險。', reasonEn: 'Non-US global exposure to diversify away from a single market.' },
    { symbol: 'IWDA.AS', tag: '全球', tagEn: 'Global', reasonZh: '追蹤 MSCI 全球指數，一次投資發達市場龍頭。', reasonEn: 'Tracks the MSCI World index of developed-market leaders.' },
    { symbol: 'SX5E.DE', tag: '歐洲', tagEn: 'Europe', reasonZh: '歐元區 50 藍籌指數，把握歐洲核心資產。', reasonEn: 'Euro Stoxx 50 blue chips for core European exposure.' },
    { symbol: '3067.HK', tag: '恒指', tagEn: 'HSI', reasonZh: '追蹤恒生指數，緊貼港股大市表現。', reasonEn: 'Tracks the Hang Seng Index for HK market exposure.' },
  ];

  function getEtfPicks() { return ETF_PICKS; }

  /* ------------------------ Sector & description ------------------- */
  const SECTOR_MAP = {
    'AAPL': ['Technology', '科技'], 'MSFT': ['Technology', '科技'], 'GOOGL': ['Technology', '科技'],
    'META': ['Technology', '科技'], 'NVDA': ['Technology', '科技'], 'AMD': ['Technology', '科技'],
    'NFLX': ['Technology', '科技'], 'AMZN': ['Consumer', '消費'], 'KO': ['Consumer', '消費'],
    'DIS': ['Consumer', '消費'], 'NKE': ['Consumer', '消費'], 'TSLA': ['Automotive', '汽車'],
    'JPM': ['Financials', '金融'], 'V': ['Financials', '金融'], 'BAC': ['Financials', '金融'],
    'AXP': ['Financials', '金融'], 'BRK.B': ['Financials', '金融'], 'UNH': ['Healthcare', '醫療'],
    'CVX': ['Energy', '能源'], 'XOM': ['Energy', '能源'], 'OXY': ['Energy', '能源'],
    '0700.HK': ['Technology', '科技'], '9988.HK': ['Consumer', '消費'], '3690.HK': ['Consumer', '消費'],
    '1810.HK': ['Technology', '科技'], '0388.HK': ['Financials', '金融'], '0941.HK': ['Telecom', '電訊'],
    '0005.HK': ['Financials', '金融'], '1299.HK': ['Financials', '金融'], '2318.HK': ['Financials', '金融'],
    '0939.HK': ['Financials', '金融'],
    'WMT': ['Consumer', '消費'], 'COST': ['Consumer', '消費'], 'ORCL': ['Technology', '科技'],
    'INTC': ['Technology', '科技'], 'CSCO': ['Technology', '科技'], 'ADBE': ['Technology', '科技'],
    'CRM': ['Technology', '科技'], 'QCOM': ['Technology', '科技'], 'PEP': ['Consumer', '消費'],
    'MCD': ['Consumer', '消費'], 'ABBV': ['Healthcare', '醫療'], 'PFE': ['Healthcare', '醫療'],
    'GS': ['Financials', '金融'], 'MS': ['Financials', '金融'], 'UBER': ['Technology', '科技'],
    'PLTR': ['Technology', '科技'],
    '0001.HK': ['Conglomerate', '綜合'], '0002.HK': ['Utilities', '公用事業'], '0003.HK': ['Utilities', '公用事業'],
    '0011.HK': ['Financials', '金融'], '0016.HK': ['Real estate', '地產'], '0066.HK': ['Transport', '交通'],
    '0175.HK': ['Automotive', '汽車'], '0386.HK': ['Energy', '能源'], '0857.HK': ['Energy', '能源'],
    '1088.HK': ['Energy', '能源'], '2628.HK': ['Financials', '金融'], '0823.HK': ['Real estate', '地產'],
    'SAP.DE': ['Technology', '科技'], 'ASML.AS': ['Technology', '科技'], 'LVMH.PA': ['Consumer', '消費'],
    'SIE.DE': ['Conglomerate', '綜合'], 'ALV.DE': ['Financials', '金融'], 'TTE.PA': ['Energy', '能源'],
    'AIR.PA': ['Transport', '交通'], 'SAN.PA': ['Healthcare', '醫療'], 'BAYN.DE': ['Healthcare', '醫療'],
    'BN.PA': ['Consumer', '消費'],
  };

  const DESC_TEMPLATES = {
    'Technology': ['Global technology leader providing software, hardware and digital services.', '全球科技龍頭企業，提供軟件、硬件及數碼服務。'],
    'Consumer': ['A consumer brand with a broad product portfolio sold worldwide.', '消費品牌，產品組合多元，行銷全球。'],
    'Financials': ['A diversified financial group serving retail and corporate clients.', '多元化金融集團，服務零售與企業客戶。'],
    'Energy': ['An integrated energy company across exploration, production and refining.', '綜合能源企業，涵蓋勘探、生產與煉化。'],
    'Healthcare': ['A leading healthcare company delivering insurance and health services.', '領先的醫療企業，提供保險與健康服務。'],
    'Automotive': ['A maker of electric vehicles and clean-energy products.', '電動車與清潔能源產品製造商。'],
    'Telecom': ['A telecom operator providing mobile and fixed-line services.', '電訊營運商，提供流動及固網服務。'],
    'Utilities': ['A regulated utility providing essential public services.', '受監管的公用事業，提供基礎公共服務。'],
    'Real estate': ['A property developer or REIT owning income-producing assets.', '地產發展商或持有收租物業的房託。'],
    'Transport': ['A transport operator moving people and goods.', '運輸營運商，運送人員與貨物。'],
    'Conglomerate': ['A diversified conglomerate across multiple businesses.', '橫跨多項業務的綜合企業集團。'],
  };

  function sectorOf(symbol, type) {
    if (type === 'bond') return ['Fixed income', '固定收益'];
    if (type === 'etf') return ['Index fund', '指數基金'];
    if (type === 'forex') return ['Currency', '外匯'];
    if (type === 'crypto') return ['Digital asset', '數字資產'];
    return SECTOR_MAP[symbol] || ['Diversified', '綜合'];
  }

  /* ------------------- Classification (region > industry > need) ----- */
  const INDUSTRIES = [
    { key: 'Technology', zh: '科技', en: 'Technology' },
    { key: 'Financials', zh: '金融／銀行', en: 'Financials' },
    { key: 'Consumer', zh: '消費', en: 'Consumer' },
    { key: 'Energy', zh: '能源', en: 'Energy' },
    { key: 'Healthcare', zh: '醫療', en: 'Healthcare' },
    { key: 'Automotive', zh: '汽車', en: 'Automotive' },
    { key: 'Telecom', zh: '電訊', en: 'Telecom' },
    { key: 'Utilities', zh: '公用事業', en: 'Utilities' },
    { key: 'Real estate', zh: '地產', en: 'Real estate' },
    { key: 'Transport', zh: '交通', en: 'Transport' },
    { key: 'Conglomerate', zh: '綜合', en: 'Conglomerate' },
  ];

  const NEEDS = [
    { key: 'dividend', zh: '派息', en: 'Dividend' },
    { key: 'growth', zh: '增長', en: 'Growth' },
    { key: 'value', zh: '價值', en: 'Value' },
    { key: 'stable', zh: '穩健', en: 'Stable' },
    { key: 'hedge', zh: '避險', en: 'Hedge' },
  ];

  function needsOf(symbol, type) {
    if (type === 'bond') return ['stable', '穩健'];
    if (type === 'forex') return ['hedge', '避險'];
    if (type === 'crypto') return ['growth', '增長'];
    if (type === 'etf') {
      if (symbol === 'GLD') return ['hedge', '避險'];
      if (symbol === 'SCHD') return ['dividend', '派息'];
      if (['BND', 'TLT', 'VTI', 'VXUS', 'VOO', 'IWDA.AS', 'VWCE.DE', 'SX5E.DE', 'EXS1.DE', '2800.HK', '2828.HK', '2823.HK', '3067.HK', '2822.HK', '3033.HK'].indexOf(symbol) >= 0) return ['stable', '穩健'];
      return ['growth', '增長'];
    }
    // stocks
    const sec = sectorOf(symbol, 'stock')[0];
    if (DIVIDEND_STOCKS.indexOf(symbol) >= 0) {
      if (sec === 'Financials' || sec === 'Energy' || sec === 'Telecom' || sec === 'Utilities' || sec === 'Real estate') return ['value', '價值'];
      return ['dividend', '派息'];
    }
    if (sec === 'Technology' || sec === 'Consumer' || sec === 'Automotive') return ['growth', '增長'];
    return ['value', '價值'];
  }

  function screenAssets(region, industry, need) {
    return ASSETS.filter(function (a) {
      if (a.type !== 'stock' && a.type !== 'etf') return false;
      if (region && a.market !== region) return false;
      if (industry && sectorOf(a.symbol, a.type)[0] !== industry) return false;
      if (need && needsOf(a.symbol, a.type)[0] !== need) return false;
      return true;
    });
  }

  /* --------------------------- Market indices ---------------------- */
  const INDEX_DEFS = [
    { id: 'HSI', name: 'Hang Seng Index', nameZh: '恒生指數', symbol: '2800.HK', scale: 1000, decimals: 0 },
    { id: 'SPX', name: 'S&P 500', nameZh: '標普500', symbol: 'SPY', scale: 10, decimals: 0 },
    { id: 'NDX', name: 'Nasdaq 100', nameZh: '納斯達克100', symbol: 'QQQ', scale: 40, decimals: 0 },
    { id: 'DJI', name: 'Dow Jones', nameZh: '道瓊斯工業', symbol: 'DIA', scale: 100, decimals: 0 },
    { id: 'GOLD', name: 'Gold', nameZh: '黃金', symbol: 'GLD', scale: 1, decimals: 2 },
    { id: 'BTC', name: 'Bitcoin', nameZh: '比特幣', symbol: 'BTC', scale: 1, decimals: 0 },
  ];

  function getIndices() {
    return INDEX_DEFS.map(function (d) {
      const p = current[d.symbol] || 0;
      const pc = prevCloseMap[d.symbol] || p;
      return { id: d.id, name: d.name, nameZh: d.nameZh, value: p * d.scale, chgPct: pc ? (p - pc) / pc * 100 : 0, decimals: d.decimals };
    });
  }

  /* --------------------------- Helpers ----------------------------- */
  function convertToBase(amount, currency, baseCurrency) {
    const usd = toUSD(amount, currency);
    if (baseCurrency === 'USD') return usd;
    if (baseCurrency === 'HKD') return usd * FX.HKDUSD;
    return usd;
  }

  // Inverse of convertToBase: convert a base-currency amount to a native currency.
  function baseToNative(amountBase, nativeCurrency, baseCurrency) {
    const usd = baseCurrency === 'USD' ? amountBase : amountBase / FX.HKDUSD;
    if (nativeCurrency === 'USD') return usd;
    if (nativeCurrency === 'HKD') return usd * FX.HKDUSD;
    if (nativeCurrency === 'EUR') return usd / FX.EURUSD;
    return usd;
  }

  function fmtMoney(value, currency, lang) {
    const loc = lang === 'zh-TW' ? 'zh-HK' : 'en-US';
    const cur = currency === 'HKD' ? 'HKD' : (currency === 'EUR' ? 'EUR' : 'USD');
    try {
      return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    } catch (e) {
      const sym = currency === 'HKD' ? 'HK$' : (currency === 'EUR' ? '€' : 'US$');
      return sym + value.toFixed(2);
    }
  }

  function fmtPercent(value, lang) {
    return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
  }

  initPrices();
  tryLiveFetch();

  global.MarketData = {
    ASSETS: ASSETS,
    DEPOSITS: DEPOSITS,
    FX: FX,
    getAsset: getAsset,
    getDeposit: getDeposit,
    getDeposits: getDeposits,
    getPrice: getPrice,
    getPrevClose: getPrevClose,
    getLastUpdated: getLastUpdated,
    getHistory: getHistory,
    getProviderState: getProviderState,
    onTick: onTick,
    startTick: startTick,
    tryLiveFetch: tryLiveFetch,
    getTodayChangePct: getTodayChangePct,
    getYtdReturnPct: getYtdReturnPct,
    getTopMovers: getTopMovers,
    getFundamentals: getFundamentals,
    getDividends: getDividends,
    getEtfProfile: getEtfProfile,
    getPerformance: getPerformance,
    getInvestors: getInvestors,
    getStabilityRanking: getStabilityRanking,
    getHotRanking: getHotRanking,
    getPortfolios: getPortfolios,
    getEtfPicks: getEtfPicks,
    getIndices: getIndices,
    getMarketMovers: getMarketMovers,
    getMarketEtfYtd: getMarketEtfYtd,
    baseToNative: baseToNative,
    needsOf: needsOf,
    screenAssets: screenAssets,
    INDUSTRIES: INDUSTRIES,
    NEEDS: NEEDS,
    convertToBase: convertToBase,
    fmtMoney: fmtMoney,
    fmtPercent: fmtPercent,
  };
})(window);
