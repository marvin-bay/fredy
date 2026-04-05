/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import * as utils from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';

let appliedBlackList = [];

function normalize(o) {
  const id = o.link.split('/').pop();
  const price = o.price;
  const size = o.size;
  const rooms = o.rooms;
  const [city = '', part = ''] = (o.description || '').split('-').map((v) => v.trim());
  const address = `${part}, ${city}`;
  return Object.assign(o, { id, price, size, rooms, address });
}

function applyBlacklist(o) {
  const titleNotBlacklisted = !utils.isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !utils.isOneOf(o.description, appliedBlackList);
  return o.id != null && o.title != null && titleNotBlacklisted && descNotBlacklisted && o.link.startsWith(o.link);
}

const CRAWL_CONTAINER = '.search_result_container > a';
const CRAWL_FIELDS = {
  id: '*',
  title: 'h3 | trim',
  price: 'dl:nth-of-type(1) dd | removeNewline | trim',
  rooms: 'dl:nth-of-type(2) dd | removeNewline | trim',
  size: 'dl:nth-of-type(3) dd | removeNewline | trim',
  description: 'div.before\\:icon-location_marker | trim',
  link: '@href',
  imageUrl: 'img@src',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: queryParamPaginator('page'),
    providerName: 'Wohnungsboerse',
  });
}

const config = {
  url: null,
  sortByDateParam: null,
  waitForSelector: 'body',
  crawlContainer: CRAWL_CONTAINER,
  crawlFields: CRAWL_FIELDS,
  normalize: normalize,
  filter: applyBlacklist,
  getListings: getListings,
  activeTester: checkIfListingIsActive,
};

export const init = (sourceConfig, blacklistTerms) => {
  config.url = sourceConfig.url;
  appliedBlackList = blacklistTerms || [];
};

export const metaInformation = {
  name: 'Wohnungsboerse',
  baseUrl: 'https://www.wohnungsboerse.net',
  id: 'wohnungsboerse',
};

export { config };
