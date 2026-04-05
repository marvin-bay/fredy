import Extractor from './extractor.js';
import logger from '../logger.js';

const DEFAULT_MAX_PAGES = 25;

/**
 * Helper: build a page URL by setting a query parameter.
 * Works for most websites (e.g. ?page=2).
 *
 * @param {string} paramName - Query parameter name (e.g. 'page', 'Seite').
 * @returns {(url: string, page: number) => string}
 */
export function queryParamPaginator(paramName = 'page') {
  return (url, page) => {
    const u = new URL(url);
    u.searchParams.set(paramName, String(page));
    return u.toString();
  };
}

/**
 * Scrape multiple pages of a website using Puppeteer.
 * Automatically stops when a page returns no results or only duplicates.
 *
 * @param {Object} opts
 * @param {string} opts.url - Base search URL.
 * @param {string} opts.crawlContainer - CSS selector for listing containers.
 * @param {Object} opts.crawlFields - Field-to-selector mapping.
 * @param {string|null} [opts.waitForSelector='body'] - Selector to wait for before parsing.
 * @param {number} [opts.maxPages=25] - Maximum number of pages to fetch.
 * @param {(url: string, page: number) => string} opts.buildPageUrl - Function to build the URL for a given page number.
 * @param {string} [opts.providerName='unknown'] - Name used in log messages.
 * @returns {Promise<Object[]>} All listings across all pages.
 */
export async function paginatedScrape({
  url,
  crawlContainer,
  crawlFields,
  waitForSelector = 'body',
  maxPages = DEFAULT_MAX_PAGES,
  buildPageUrl,
  providerName = 'unknown',
}) {
  const allListings = [];
  const seenIds = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = buildPageUrl(url, page);
    logger.debug(`${providerName}: fetching page ${page} - ${pageUrl}`);

    const extractor = new Extractor();
    await extractor.execute(pageUrl, waitForSelector);
    const listings = extractor.parseResponseText(crawlContainer, crawlFields, pageUrl);

    if (!listings || listings.length === 0) {
      logger.debug(`${providerName}: no more results on page ${page}, stopping.`);
      break;
    }

    // Detect duplicate pages (pagination param might be ignored by the site)
    let newCount = 0;
    for (const listing of listings) {
      const key = listing.id || listing.link || listing.title;
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        newCount++;
      }
    }

    if (newCount === 0 && page > 1) {
      logger.debug(`${providerName}: page ${page} returned only duplicates, stopping.`);
      break;
    }

    allListings.push(...listings);
    logger.debug(`${providerName}: found ${listings.length} on page ${page} (total: ${allListings.length})`);
  }

  return allListings;
}
