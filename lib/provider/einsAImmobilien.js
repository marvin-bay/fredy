/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { buildHash, isOneOf } from '../utils.js';
import checkIfListingIsActive from '../services/listings/listingActiveTester.js';
import { paginatedScrape, queryParamPaginator } from '../services/extractor/paginatedScraper.js';
let appliedBlackList = [];

function normalize(o) {
  const baseUrl = 'https://www.1a-immobilienmarkt.de';
  const link = `${baseUrl}/expose/${o.id}.html`;
  const price = normalizePrice(o.price);
  const id = buildHash(o.id, price);
  const image = baseUrl + o.image;
  const address = o.address == null ? null : o.address.trim().replaceAll('/', ',');
  return Object.assign(o, { id, price, link, image, address });
}

/**
 * einsAImmobilien sometimes use a weird pricing label such as `775.700,00 EUR Kaufpreis ab 2.475 € mtl`.
 * Make sure to extract only the actual price out of the string.
 * @param price
 * @returns {*}
 */
function normalizePrice(price) {
  if (price == null) {
    return null;
  }
  const regex = /(\d{1,3}(?:\.\d{3})*,\d{2})\s?(EUR|€)/g;
  const result = price.match(regex);
  if (result == null || result.length === 0) {
    return price;
  }
  return result[0];
}
function applyBlacklist(o) {
  const titleNotBlacklisted = !isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !isOneOf(o.description, appliedBlackList);
  return titleNotBlacklisted && descNotBlacklisted;
}

const CRAWL_CONTAINER = '.tabelle';
const CRAWL_FIELDS = {
  id: '.inner_object_data input[name="marker_objekt_id"]@value | int',
  price: '.inner_object_data .single_data_price | removeNewline | trim',
  size: '.tabelle .tabelle_inhalt_infos .single_data_box  | removeNewline | trim',
  title: '.inner_object_data .tabelle_inhalt_titel_black | removeNewline | trim',
  image: '.inner_object_pic img@src',
  address: '.tabelle .tabelle_inhalt_infos .left_information > div:nth-child(2) | removeNewline | trim',
};

async function getListings(url) {
  return paginatedScrape({
    url,
    crawlContainer: CRAWL_CONTAINER,
    crawlFields: CRAWL_FIELDS,
    waitForSelector: 'body',
    buildPageUrl: queryParamPaginator('page'),
    providerName: '1aImmobilien',
  });
}

const config = {
  url: null,
  crawlContainer: CRAWL_CONTAINER,
  sortByDateParam: 'sort_type=newest',
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
  name: '1a Immobilien',
  baseUrl: 'https://www.1a-immobilienmarkt.de/',
  id: 'einsAImmobilien',
};
export { config };
