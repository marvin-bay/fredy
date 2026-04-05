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
  const address = o.address?.replace(/^adresse /i, '') ?? null;
  const title = o.title || 'No title available';
  const link = o.link != null ? decodeURIComponent(o.link) : config.url;

  const urlReg = new RegExp(/url\((.*?)\)/gim);
  const image = o.image != null ? urlReg.exec(o.image)[1] : null;
  return Object.assign(o, { id, address, title, link, image });
}
function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  return titleNotBlacklisted && descNotBlacklisted;
}
const CRAWL_CONTAINER = '.listentry-content';
const CRAWL_FIELDS = {
  id: '.listentry-iconbar-share@data-sid | trim',
  title: 'h2 | trim',
  price: '.listentry-details-price .listentry-details-v | trim',
  size: '.listentry-details-size .listentry-details-v | trim',
  address: '.listentry-adress | trim',
  image: '.listentry-img@style',
  link: '.shariff@data-url',
  description: '.listentry-extras | trim',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: queryParamPaginator('page'),
    providerName: 'Regionalimmobilien24',
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
export const init = (sourceConfig, blacklist) => {
  config.enabled = sourceConfig.enabled;
  config.url = sourceConfig.url;
  appliedBlackList = blacklist || [];
};
export const metaInformation = {
  name: 'Regionalimmobilien24',
  baseUrl: 'https://www.regionalimmobilien24.de/',
  id: 'regionalimmobilien24',
};
export { config };
