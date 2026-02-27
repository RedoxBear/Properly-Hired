import { base44 } from './base44Client';

export async function queryBLS({ seriesIds, startYear, endYear, options } = {}) {
  return base44.functions.invoke('queryBLS', {
    seriesIds,
    startYear,
    endYear,
    options
  });
}

export async function queryDOL({ endpoint, params, baseUrl, useApiKeyQuery } = {}) {
  return base44.functions.invoke('queryDOL', {
    endpoint,
    params,
    baseUrl,
    useApiKeyQuery
  });
}

export async function queryLOC({ searchQuery, endpoint, maxResults, strictFilter } = {}) {
  return base44.functions.invoke('queryLibraryOfCongress', {
    searchQuery,
    endpoint,
    maxResults,
    strictFilter
  });
}

export async function queryONet({ endpoint, params } = {}) {
  return base44.functions.invoke('queryONetAPI', {
    endpoint,
    params
  });
}

export async function queryAlphaVantage({ action, companyName, symbol, keywords, region, includeHistory, outputsize } = {}) {
  return base44.functions.invoke('queryAlphaVantage', {
    action,
    companyName,
    symbol,
    keywords,
    region,
    includeHistory,
    outputsize
  });
}
