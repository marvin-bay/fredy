/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { isOneOf, buildHash } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';
let appliedBlackList = [];

function normalize(o) {
  const originalId = o.id.split('/').pop().replace('.html', '');
  const id = buildHash(originalId, o.price);
  const size = o.size?.replace(' Wohnfläche', '') ?? null;
  const title = o.title || 'No title available';
  const link = o.link != null ? `https://immobilien.sparkasse.de${o.link}` : config.url;
  return Object.assign(o, { id, size, title, link });
}
function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  return titleNotBlacklisted && descNotBlacklisted;
}
const CRAWL_CONTAINER = '.estate-list-item-row';
const CRAWL_FIELDS = {
  id: 'div[data-testid="estate-link"] a@href',
  title: 'h3 | trim',
  price: '.estate-list-price | trim',
  size: '.estate-mainfact:first-child span | trim',
  address: 'h6 | trim',
  image: '.estate-list-item-image-container img@src',
  link: 'div[data-testid="estate-link"] a@href',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: queryParamPaginator('page'),
    providerName: 'Sparkasse',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: 'sortBy=date_desc',
  waitForSelector: 'body',
  crawlFields: CRAWL_FIELDS,
  normalize: normalize,
  filter: applyBlacklist,
  getListings: getListings,
  activeTester: (url) => checkIfListingIsActive(url, 'Angebot nicht gefunden'),
};
export const init = (sourceConfig, blacklist) => {
  config.enabled = sourceConfig.enabled;
  config.url = sourceConfig.url;
  appliedBlackList = blacklist || [];
};
export const metaInformation = {
  name: 'Sparkasse Immobilien',
  baseUrl: 'https://immobilien.sparkasse.de/',
  id: 'sparkasse',
};
export { config };
