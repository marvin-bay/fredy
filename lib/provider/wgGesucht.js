/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { isOneOf, buildHash } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';

let appliedBlackList = [];

function normalize(o) {
  const id = buildHash(o.id, o.price);
  const link = `https://www.wg-gesucht.de${o.link}`;
  const image = o.image != null ? o.image.replace('small', 'large') : null;
  return Object.assign(o, { id, link, image });
}

function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  return o.id != null && titleNotBlacklisted && descNotBlacklisted;
}

const CRAWL_CONTAINER = '#main_column .wgg_card';
const CRAWL_FIELDS = {
  id: '@data-id',
  details: '.row .noprint .col-xs-11 |removeNewline |trim',
  price: '.middle .col-xs-3 |removeNewline |trim',
  size: '.middle .text-right |removeNewline |trim',
  title: '.truncate_title a |removeNewline |trim',
  link: '.truncate_title a@href',
  image: '.img-responsive@src',
};

// wg-gesucht uses path-based pagination: ...Stadt.8.0.1.0.html where the 3rd-to-last segment is the page (0-based)
function wgPageUrl(url, page) {
  return url.replace(/(\.\d+)\.html$/, `.${page - 1}.html`);
}

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: wgPageUrl,
    providerName: 'WgGesucht',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: 'sort_column=0&sort_order=0',
  waitForSelector: 'body',
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
  name: 'Wg gesucht',
  baseUrl: 'https://www.wg-gesucht.de/',
  id: 'wgGesucht',
};
export { config };
