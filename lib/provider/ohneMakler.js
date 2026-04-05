/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { isOneOf, buildHash } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';
let appliedBlackList = [];

function normalize(o) {
  const link = metaInformation.baseUrl + o.link;
  const id = buildHash(o.title, o.link, o.price);
  return Object.assign(o, { link, id });
}
function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  return titleNotBlacklisted && descNotBlacklisted;
}
const CRAWL_CONTAINER = 'div[data-livecomponent-id*="search/property_list"] .grid > div';
const CRAWL_FIELDS = {
  id: 'a@href',
  title: 'h4 | removeNewline | trim',
  price: '.text-xl | trim',
  size: 'div[title="Wohnfläche"] | trim',
  address: '.text-slate-800 | removeNewline | trim',
  image: 'img@src',
  link: 'a@href',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: null,
    buildPageUrl: queryParamPaginator('page'),
    providerName: 'OhneMakler',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: null,
  waitForSelector: null,
  crawlFields: CRAWL_FIELDS,
  normalize: normalize,
  filter: applyBlacklist,
  getListings: getListings,
  activeTester: checkIfListingIsActive,
};

export const init = (sourceConfig, blacklist) => {
  config.enabled = sourceConfig.enabled;
  config.url = sourceConfig.url;
  appliedBlackList = blacklist || [];
};

export const metaInformation = {
  name: 'OhneMakler',
  baseUrl: 'https://www.ohne-makler.net',
  id: 'ohneMakler',
};
export { config };
