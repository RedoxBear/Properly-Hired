import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALPHA_BASE_URL = "https://www.alphavantage.co/query";

const toNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSearchMatches = (matches: any[] = []) =>
  matches.map((item) => ({
    symbol: item["1. symbol"] || "",
    name: item["2. name"] || "",
    type: item["3. type"] || "",
    region: item["4. region"] || "",
    marketOpen: item["5. marketOpen"] || "",
    marketClose: item["6. marketClose"] || "",
    timezone: item["7. timezone"] || "",
    currency: item["8. currency"] || "",
    matchScore: toNumber(item["9. matchScore"]),
  }));

async function alphaFetch(apiKey: string, params: Record<string, string>) {
  const url = new URL(ALPHA_BASE_URL);
  Object.entries({ ...params, apikey: apiKey }).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Alpha Vantage HTTP ${response.status}`);
  }

  if (data?.ErrorMessage) {
    throw new Error(data.ErrorMessage);
  }

  if (data?.Note && /API call frequency|call volume/i.test(data.Note)) {
    throw new Error(`Alpha Vantage rate limit: ${data.Note}`);
  }

  return data;
}

function buildFinancialSnapshot(
  companyName: string,
  resolvedSymbol: string,
  overview: Record<string, any> = {},
  quote: Record<string, any> = {},
  historicalSeries: Record<string, any> = {},
) {
  const quoteBlock = quote["Global Quote"] || {};
  const latestClose = toNumber(quoteBlock["05. price"]);
  const changePercentRaw = quoteBlock["10. change percent"];
  const changePercent = changePercentRaw ? toNumber(String(changePercentRaw).replace("%", "")) : null;
  const dateKeys = Object.keys(historicalSeries || {}).sort((a, b) => (a > b ? -1 : 1));
  const history = dateKeys.slice(0, 12).map((date) => ({
    date,
    close: toNumber(historicalSeries[date]?.["4. close"]),
    volume: toNumber(historicalSeries[date]?.["5. volume"]),
  }));

  return {
    company_name: companyName || overview.Name || "",
    is_public: Boolean(resolvedSymbol),
    ticker: resolvedSymbol || "",
    exchange: overview.Exchange || "",
    currency: overview.Currency || "",
    market_cap: toNumber(overview.MarketCapitalization),
    revenue_ttm: toNumber(overview.RevenueTTM),
    gross_profit_ttm: toNumber(overview.GrossProfitTTM),
    ebitda: toNumber(overview.EBITDA),
    pe_ratio: toNumber(overview.PERatio),
    forward_pe: toNumber(overview.ForwardPE),
    eps: toNumber(overview.EPS),
    beta: toNumber(overview.Beta),
    profit_margin: toNumber(overview.ProfitMargin),
    operating_margin_ttm: toNumber(overview.OperatingMarginTTM),
    return_on_equity_ttm: toNumber(overview.ReturnOnEquityTTM),
    analyst_target_price: toNumber(overview.AnalystTargetPrice),
    latest_close: latestClose,
    latest_trading_day: quoteBlock["07. latest trading day"] || "",
    daily_change_percent: changePercent,
    fifty_two_week_high: toNumber(overview["52WeekHigh"]),
    fifty_two_week_low: toNumber(overview["52WeekLow"]),
    dividend_yield: toNumber(overview.DividendYield),
    summary: [
      resolvedSymbol ? `${resolvedSymbol} appears publicly traded.` : "No public ticker confidently identified.",
      overview.MarketCapitalization ? `Market cap approx ${overview.MarketCapitalization}.` : "Market cap not available.",
      overview.RevenueTTM ? `Revenue TTM approx ${overview.RevenueTTM}.` : "Revenue data not available.",
      changePercent !== null ? `Recent daily move: ${changePercent}%` : "Recent price change unavailable.",
    ].join(" "),
    historical_close_12d: history,
    source: "Alpha Vantage",
    source_timestamp: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      action = "company_financials",
      companyName = "",
      symbol = "",
      keywords = "",
      region = "United States",
      includeHistory = true,
      outputsize = "compact",
    } = body || {};

    const apiKey = Deno.env.get("ALPHAVANTAGE_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "ALPHAVANTAGE_API_KEY not configured" }, { status: 500 });
    }

    if (action === "symbol_search") {
      const lookup = keywords || companyName;
      if (!lookup) {
        return Response.json({ error: "keywords or companyName is required for symbol_search" }, { status: 400 });
      }
      const searchData = await alphaFetch(apiKey, {
        function: "SYMBOL_SEARCH",
        keywords: lookup,
      });
      const matches = normalizeSearchMatches(searchData.bestMatches || []);
      return Response.json({ success: true, matches, source_timestamp: new Date().toISOString() });
    }

    if (action !== "company_financials") {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    let resolvedSymbol = symbol?.trim?.() || "";
    let symbolMatches: any[] = [];

    if (!resolvedSymbol) {
      if (!companyName) {
        return Response.json({ error: "companyName or symbol is required" }, { status: 400 });
      }

      const searchData = await alphaFetch(apiKey, {
        function: "SYMBOL_SEARCH",
        keywords: companyName,
      });
      symbolMatches = normalizeSearchMatches(searchData.bestMatches || []);

      const regionMatch = symbolMatches.find((item) => item.region?.toLowerCase() === region.toLowerCase());
      resolvedSymbol = (regionMatch || symbolMatches[0])?.symbol || "";
    }

    if (!resolvedSymbol) {
      return Response.json({
        success: false,
        error: "No ticker found for company",
        company_name: companyName,
        matches: symbolMatches,
      }, { status: 404 });
    }

    const [overview, quote, daily] = await Promise.all([
      alphaFetch(apiKey, { function: "OVERVIEW", symbol: resolvedSymbol }).catch(() => ({})),
      alphaFetch(apiKey, { function: "GLOBAL_QUOTE", symbol: resolvedSymbol }).catch(() => ({})),
      includeHistory
        ? alphaFetch(apiKey, {
            function: "TIME_SERIES_DAILY_ADJUSTED",
            symbol: resolvedSymbol,
            outputsize: outputsize === "full" ? "full" : "compact",
          }).catch(() => ({}))
        : Promise.resolve({}),
    ]);

    const historicalSeries = daily["Time Series (Daily)"] || {};
    const snapshot = buildFinancialSnapshot(companyName, resolvedSymbol, overview, quote, historicalSeries);

    return Response.json({
      success: true,
      symbol: resolvedSymbol,
      snapshot,
      raw: {
        overview,
        quote,
        historical: includeHistory ? daily : undefined,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
