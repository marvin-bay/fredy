/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { buildHash, isOneOf } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape } from '../services/extractor/paginatedScraper.js';

let appliedBlackList = [];
let appliedBlacklistedDistricts = [];

function normalize(o) {
  const size = o.size || '--- m²';
  const id = buildHash(o.id, o.price);
  const link = `https://www.kleinanzeigen.de${o.link}`;
  return Object.assign(o, { id, size, link });
}

function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  const isBlacklistedDistrict =
    appliedBlacklistedDistricts.length === 0 ? false : isOneOf(o.description, appliedBlacklistedDistricts);
  return o.title != null && !isBlacklistedDistrict && titleNotBlacklisted && descNotBlacklisted;
}

const MAX_PAGES = 25;
const CRAWL_CONTAINER = '#srchrslt-adtable .ad-listitem ';
const CRAWL_FIELDS = {
  id: '.aditem@data-adid | int',
  price: '.aditem-main--middle--price-shipping--price | removeNewline | trim',
  size: '.aditem-main .text-module-end | removeNewline | trim',
  title: '.aditem-main .text-module-begin a | removeNewline | trim',
  link: '.aditem-main .text-module-begin a@href | removeNewline | trim',
  description: '.aditem-main .aditem-main--middle--description | removeNewline | trim',
  address: '.aditem-main--top--left | trim | removeNewline',
  image: 'img@src',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: (baseUrl, page) => page === 1 ? baseUrl : baseUrl.replace(/\/s-/, `/seite:${page}/s-`),
    providerName: 'Kleinanzeigen',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: null,
  waitForSelector: 'body',
  crawlFields: CRAWL_FIELDS,
  normalize: normalize,
  filter: applyBlacklist,
  getListings: getListings,
  activeTester: checkIfListingIsActive,
};
export const metaInformation = {
  name: 'Ebay Kleinanzeigen',
  baseUrl: 'https://www.kleinanzeigen.de/',
  id: 'kleinanzeigen',
};
export const init = (sourceConfig, blacklist, blacklistedDistricts) => {
  config.enabled = sourceConfig.enabled;
  config.url = sourceConfig.url;
  appliedBlacklistedDistricts = blacklistedDistricts || [];
  appliedBlackList = blacklist || [];
};
export { config };
