/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { isOneOf, buildHash } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';

let appliedBlackList = [];

function nullOrEmpty(val) {
  return val == null || val.length === 0;
}

function normalize(o) {
  const link = nullOrEmpty(o.link)
    ? 'NO LINK'
    : `https://www.neubaukompass.de${o.link.substring(o.link.indexOf('/neubau'))}`;
  const id = buildHash(o.link, o.price);
  return Object.assign(o, { id, link });
}

function applyBlacklist(o) {
  return !isOneOf(o.title, appliedBlackList);
}

const CRAWL_CONTAINER = '.col-12.mb-4';
const WAIT_FOR = 'div[data-live-name-value="SearchList"]';
const CRAWL_FIELDS = {
  id: 'a@href',
  title: 'a@title | removeNewline | trim',
  link: 'a@href',
  address: '.nbk-project-card__description | removeNewline | trim',
  price: '.nbk-project-card__spec-item .nbk-project-card__spec-value | removeNewline | trim',
  image: '.nbk-project-card__image@src',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: WAIT_FOR,
    buildPageUrl: queryParamPaginator('Seite'),
    providerName: 'NeubauKompass',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: 'Sortierung=Id&Richtung=DESC',
  waitForSelector: WAIT_FOR,
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
  name: 'Neubau Kompass',
  baseUrl: 'https://www.neubaukompass.de/',
  id: 'neubauKompass',
};
export { config };
