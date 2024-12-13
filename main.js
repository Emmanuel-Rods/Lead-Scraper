//Import Scrapers
const facebookScraper = require('./src/FaceBook-Scraper.js');
const gBusiness = require('./src/Google-Business-Scraper.js');
const gMaps = require('./src/Google-Maps-Scraper.js')
const emailCrawler = require('./src/Email-Crawler.js')


// console.log(facebookScraper) // @ params service, location @returns jsonarray
// console.log(gBusiness) @ params service, location   @returns jsonarray
// console.log(gMaps) @ params service, location  @returns jsonarray
// console.log(emailCrawler) //  @ params  jsonarray , filename @returns excel file

const services = ['welding'];
const locations = ['texas'];


function mergeResults(facebookData, gBusinessData, gMapsData) {
  const consolidated = [...facebookData, ...gBusinessData, ...gMapsData];

  const uniqueDataMap = new Map();

  for (const item of consolidated) {
    const identifier = `${item.name}-${item.phone}`;
    if (!uniqueDataMap.has(identifier)) {
      uniqueDataMap.set(identifier, { ...item });
    } else {
      const existingItem = uniqueDataMap.get(identifier);
      const mergedItem = {
        ...existingItem,
        email: existingItem.email || item.email || null,
        website: existingItem.website || item.website || null,
        address: existingItem.address || item.address || null,
        category: existingItem.category || item.category || null,
      };

      uniqueDataMap.set(identifier, mergedItem);
    }
  }

  return Array.from(uniqueDataMap.values());
}


async function processScrapers(service, location) {
  console.time()
  console.log(`Processing service: ${service}, location: ${location}`);

  try {
    // Run all scrapers concurrently
    const results = await Promise.allSettled([
      facebookScraper(service, location),
      gBusiness(service, location), 
      gMaps(service, location), 
    ]);

    // Extract fulfilled results or handle errors
    const facebookData = results[0].status === 'fulfilled' ? results[0].value : [];
    const gBusinessData = results[1].status === 'fulfilled' ? results[1].value : [];
    const gMapsData = results[2].status === 'fulfilled' ? results[2].value : [];

    // Merge and deduplicate data
    const deduplicatedData = mergeResults(facebookData, gBusinessData, gMapsData);
    console.log('Deduplicated data:', deduplicatedData);

    // Save results to an Excel file
    const filename = `${service} in ${location}.xlsx`;
    await emailCrawler(deduplicatedData, filename);
    console.log(`Excel file saved as: ${filename}`);
  } catch (error) {
    console.error(`Error processing service: ${service}, location: ${location}`, error);
  }
 console.timeEnd();
}

// Execute the scrapers for all services and locations
(async () => {
  for (const location of locations) {
    for (const service of services) {
      await processScrapers(service, location);
    }
  }
  console.log('All scrapers executed successfully.');
})();
