//Import Scrapers
const facebookScraper = require("./src/FaceBook-Scraper.js");
const gBusiness = require("./src/Google-Business-Scraper.js");
const gMaps = require("./src/Google-Maps-Scraper.js");
const emailCrawler = require("./src/Email-Crawler.js");

// console.log(facebookScraper) // @ params service, location @returns jsonarray
// console.log(gBusiness) @ params service, location   @returns jsonarray
// console.log(gMaps) @ params service, location  @returns jsonarray
// console.log(emailCrawler) //  @ params  jsonarray , filename @returns excel file

// Input configurations
const locations = ["tracy , cal"];

// Function to merge and deduplicate results
function mergeResults(facebookData = [], gMapsData = [], gBusinessData = []) {
  const consolidated = [...facebookData, ...gMapsData, ...gBusinessData];
  console.log(consolidated)
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

//claude 
// Main scraper configuration processor
async function processScraperConfig(config, location) {
  console.time(config.fileName);
  console.log(`Processing config: ${JSON.stringify(config)}, location: ${location}`);

  try {
    // Define scraper configurations
    const scraperTypes = [
      { key: 'faceBook', scraper: facebookScraper },
      { key: 'faceBookAlt', scraper: facebookScraper },
      { key: 'gMaps', scraper: gMaps },
      { key: 'gMapsAlt', scraper: gMaps },
      // { key: 'gBusiness', scraper: gBusiness },
      // { key: 'gBusinessAlt', scraper: gBusiness }
    ];

    // Prepare scraper promises
    const scraperPromises = scraperTypes
      .filter(type => config[type.key])
      .map(type => ({
        key: type.key,
        promise: type.scraper(config[type.key], location)
      }));

    // Run scrapers concurrently
    const results = await Promise.allSettled(
      scraperPromises.map(scraper => scraper.promise)
    );

    // Process and organize results
    const scraperResults = {};
    scraperPromises.forEach((scraper, index) => {
      const result = results[index];
      scraperResults[scraper.key] = 
        result.status === 'fulfilled' ? result.value : [];
    });

    // Combine data from different sources
    const facebookData = [
      ...(scraperResults.faceBook || []),
      ...(scraperResults.faceBookAlt || [])
    ];
    const gMapsData = [
      ...(scraperResults.gMaps || []),
      ...(scraperResults.gMapsAlt || [])
    ];
    const gBusinessData = [
      ...(scraperResults.gBusiness || []),
      ...(scraperResults.gBusinessAlt || [])
    ];

    // Merge and deduplicate data
    const deduplicatedData = mergeResults(
      facebookData,
      gMapsData,
      gBusinessData
    );

    console.log("Deduplicated data:", deduplicatedData);

    // Save results to an Excel file
    const filename = `${config.fileName}.xlsx`;
    await emailCrawler(deduplicatedData, filename);
    console.log(`Excel file saved as: ${filename}`);
  } catch (error) {
    console.error(
      `Error processing config: ${JSON.stringify(config)}, location: ${location}`,
      error
    );
  } finally {
    console.timeEnd(config.fileName);
  }
}

// Main execution logic
async function Main() {
  try {
    for (const location of locations) {
          const scraperConfigs = [
        { gMaps: 'Aluminum and PVC joinery',gBusiness:"Aluminium and PVC joinery" ,faceBook: 'Aluminum Joinery',faceBookAlt: "PVC joinery", fileName: `Aluminium and PVC joinery in ${location}` },
        { gMaps: 'Carpet and Upholstery Cleaning', faceBook: 'Carpet Cleaning', faceBookAlt:'Upholstery Cleaning',gBusiness: 'Carpet and upholstery cleaning', fileName: `Carpet and Upholstery Cleaning in ${location}` },
        {gMaps:'cleaning',gBusiness:'cleaning', faceBook: 'cleaning', fileName: `Cleaning in ${location}` },
        {gMaps:'Fencing and Decking',gBusiness:'fencing and decking', faceBook: 'fencing',faceBookAlt:'decking', fileName: `fencing and decking in ${location}` },
        {gMaps:'custom blinds and shutters',gBusiness:'custom blinds and shutters', faceBook: 'custom blinds',faceBookAlt:'shutters', fileName: `Custom blinds and shutters in ${location}` },
        {gMaps:'gardening and landscapes designers',gBusiness:'gardening and landscapes designers', faceBook: 'gardener',faceBookAlt:'landscapes designers', fileName: `gardening and landscapes designers in ${location}` }, {gMaps:'plastering and rendering',gBusiness:'plastering and rendering', faceBook: 'plastering',faceBookAlt:'rendering', fileName: `plastering and redering ${location}` },
        {gMaps:'gas line installation and plumbing',gBusiness:'gas line installation and plumbing', faceBook: 'gas line installation',faceBookAlt:'plumbing', fileName: `gas line installation and plumbing in ${location}` },
        {gMaps:'painting and decoration',gBusiness:'painting and decoration', faceBook: 'painting',faceBookAlt:'decoration', fileName: `painting and decoration in ${location}` },
        {gMaps:'interior doors',gBusiness:'interior doors', faceBook: 'interior doors', fileName: `interior doors in ${location}` },
        {gMaps:'door repair',gBusiness:'door repair', faceBook: 'door repair', fileName: `door repair in ${location}` },
        {gMaps:'electrical services',gBusiness:'electrical services', faceBook: 'electrician', fileName: `electrical servics in ${location}` },
        {gMaps:'pool installation and repair ',gBusiness:'pool installation and repair', faceBook: 'pool installation',faceBookAlt:'pool repair', fileName: `pool installation and repair in ${location}` },
        {gMaps:'floor installation',gBusiness:'floor installation', faceBook: 'floor installation', fileName: `floor installation in ${location}` },
        {gMaps:'furniture assembly',gBusiness:'furniture assembly', faceBook: 'furniture assembly', fileName: `furniture assembly in ${location}` },
        {gMaps:'paving',gBusiness:'paving', faceBook: 'paving', fileName: `gas line installation and plumbing in ${location}` }, 
        {gMaps:'locksmith',gBusiness:'locksmith', faceBook: 'locksmith', fileName: `locksmith in ${location}` },
        {gMaps:'Man with a Van',gBusiness:'man with a Van', faceBook: 'man with a Van', fileName: `man with a van in ${location}` },
        {gMaps:'pest control',gBusiness:'pest control', faceBook: 'pest control', fileName: `pest control in ${location}` },
        {gMaps:'house movers',gBusiness:'house movers', faceBook: 'house movers', fileName: `house movers in ${location}` },
        {gMaps:'house renovation',gBusiness:'house renovation', faceBook: 'house renovation', fileName: `house renovation in ${location}` },
        {gMaps:'roof repair',gBusiness:'roof repair', faceBook: 'roof repair', fileName: `roof repair in ${location}` },
        {gMaps:'construction equipment hire',gBusiness:'construction equipment hire', faceBook: 'construction equipment hire', fileName: `construction equipment in ${location}` },
        {gMaps:'skip hire',gBusiness:'skip equipment hire', faceBook: 'skip hire', fileName: `skip hire in ${location}` },
        {gMaps:'home electrical inspection',gBusiness:'home electrical inspection', faceBook: 'home electrical inspection', fileName: `home electrical inspection in ${location}` },
        {gMaps:'energy performance certificate',gBusiness:'energy performance certificate', faceBook: 'energy performance certificate', fileName: `eneergy performance certificate in ${location}` },
        {gMaps:'gas safety certificate',gBusiness:'gas safety certificate', faceBook: 'gas safety certificate', fileName: `gas safety certificate in ${location}` },
        {gMaps:'air conditioner repairing',gBusiness:'air condition repairing', faceBook: 'air condition repair', fileName: `repair of air conditioners in ${location}` },
        {gMaps:'solar system installation',gBusiness:'solar system installation', faceBook: 'solar system installation', fileName: `solar system installation in ${location}` },
        {gMaps:'carpenter',gBusiness:'carepenter', faceBook: 'carpenter', fileName: `carpenter in ${location}` },
        ];
      for (const config of scraperConfigs) {
        await processScraperConfig(config, location);
      }
    }
    console.log("All scrapers executed successfully.");
  } catch (error) {
    console.error("Error in main execution:", error);
  }
}

Main();
