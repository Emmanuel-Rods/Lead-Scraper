//Import Scrapers
const facebookScraper = require("./src/FaceBook-Scraper.js");
const gBusiness = require("./src/Google-Business-Scraper.js");
const gMaps = require("./src/Google-Maps-Scraper.js");
const emailCrawler = require("./src/Email-Crawler.js");

console.warn(`\n
  *** Disclaimer ***\n
  This program uses Puppeteer with the '--no-sandbox' and '--disable-setuid-sandbox' flags.\n
  Use this program at your own risk, and ensure you fully understand the potential implications before running it.\n
  - Roger 
  `);
  
// console.log(facebookScraper) // @ params service, location @returns jsonarray
// console.log(gBusiness) @ params service, location   @returns jsonarray
// console.log(gMaps) @ params service, location  @returns jsonarray
// console.log(emailCrawler) //  @ params  jsonarray , filename @returns excel file

// Input configurations
const locations = ["mumbai"];

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
        { gMaps: 'Aluminum Joinery', gMapsAlt: 'PVC Joinery', gBusiness: 'Aluminium and PVC Joinery', faceBook: 'Aluminum Joinery', faceBookAlt: 'PVC Joinery', fileName: `Aluminium and PVC Joinery in ${location}` },
        { gMaps: 'Carpet and Upholstery Cleaning', faceBook: 'Carpet Cleaning', faceBookAlt: 'Upholstery Cleaning', gBusiness: 'Carpet and Upholstery Cleaning', fileName: `Carpet and Upholstery Cleaning in ${location}` },
        { gMaps: 'Cleaning', gBusiness: 'Cleaning', faceBook: 'Cleaning', fileName: `Cleaning in ${location}` },
        { gMaps: 'Fencing', gMapsAlt: 'Decking', gBusiness: 'Fencing and Decking', faceBook: 'Fencing', faceBookAlt: 'Decking', fileName: `Fencing and Decking in ${location}` },
        { gMaps: 'Custom Blinds', gMapsAlt: 'Shutters', gBusiness: 'Custom Blinds and Shutters', faceBook: 'Custom Blinds', faceBookAlt: 'Shutters', fileName: `Custom Blinds and Shutters in ${location}` },
        { gMaps: 'Gardening and Landscape Designers', gBusiness: 'Gardening and Landscape Designers', faceBook: 'Gardening', faceBookAlt: 'Landscape Designers', fileName: `Gardening and Landscape Designers in ${location}` },
        { gMaps: 'Plastering and Rendering', gBusiness: 'Plastering and Rendering', faceBook: 'Plastering', faceBookAlt: 'Rendering', fileName: `Plastering and Rendering in ${location}` },
        { gMaps: 'Gas Line Installation and Plumbing', gBusiness: 'Gas Line Installation and Plumbing', faceBook: 'Gas Line Installation', faceBookAlt: 'Plumbing', fileName: `Gas Line Installation and Plumbing in ${location}` },
        { gMaps: 'Painting and Decoration', gBusiness: 'Painting and Decoration', faceBook: 'Painting', faceBookAlt: 'Decoration', fileName: `Painting and Decoration in ${location}` },
        { gMaps: 'Interior Doors', gBusiness: 'Interior Doors', faceBook: 'Interior Doors', fileName: `Interior Doors in ${location}` },
        { gMaps: 'Door Repair', gBusiness: 'Door Repair', faceBook: 'Door Repair', fileName: `Door Repair in ${location}` },
        { gMaps: 'Electrical Services', gBusiness: 'Electrical Services', faceBook: 'Electrician', fileName: `Electrical Services in ${location}` },
        { gMaps: 'Pool Installation and Repair', gBusiness: 'Pool Installation and Repair', faceBook: 'Pool Installation', faceBookAlt: 'Pool Repair', fileName: `Pool Installation and Repair in ${location}` },
        { gMaps: 'Floor Installation', gBusiness: 'Floor Installation', faceBook: 'Floor Installation', fileName: `Floor Installation in ${location}` },
        { gMaps: 'Furniture Assembly', gBusiness: 'Furniture Assembly', faceBook: 'Furniture Assembly', fileName: `Furniture Assembly in ${location}` },
        { gMaps: 'Paving', gBusiness: 'Paving', faceBook: 'Paving', fileName: `Paving in ${location}` },
        { gMaps: 'Locksmith', gBusiness: 'Locksmith', faceBook: 'Locksmith', fileName: `Locksmith in ${location}` },
        { gMaps: 'Man with a Van', gBusiness: 'Man with a Van', faceBook: 'Man with a Van', fileName: `Man with a Van in ${location}` },
        { gMaps: 'Pest Control', gBusiness: 'Pest Control', faceBook: 'Pest Control', fileName: `Pest Control in ${location}` },
        { gMaps: 'House Movers', gBusiness: 'House Movers', faceBook: 'House Movers', fileName: `House Movers in ${location}` },
        { gMaps: 'House Renovation', gBusiness: 'House Renovation', faceBook: 'House Renovation', fileName: `House Renovation in ${location}` },
        { gMaps: 'Roof Repair', gBusiness: 'Roof Repair', faceBook: 'Roof Repair', fileName: `Roof Repair in ${location}` },
        { gMaps: 'Construction Equipment Hire', gBusiness: 'Construction Equipment Hire', faceBook: 'Construction Equipment Hire', fileName: `Construction Equipment Hire in ${location}` },
        { gMaps: 'Skip Hire', gBusiness: 'Skip Equipment Hire', faceBook: 'Skip Hire', fileName: `Skip Hire in ${location}` },
        { gMaps: 'Scaffolding', gBusiness: 'Scaffolding', faceBook: 'Scaffolding', fileName: `Scaffolding in ${location}` },
        { gMaps: 'Home Electrical Inspection', gBusiness: 'Home Electrical Inspection', faceBook: 'Home Electrical Inspection', fileName: `Home Electrical Inspection in ${location}` },
        { gMaps: 'Groundwork Equipment Hire', gBusiness: 'Groundwork Equipment Hire', faceBook: 'Groundwork Equipment Hire', fileName: `Groundwork Equipment Hire in ${location}` },
        { gMaps: 'Air Conditioner Repair', gBusiness: 'Air Conditioner Repair', faceBook: 'Air Conditioner Repair', fileName: `Air Conditioner Repair in ${location}` },
        { gMaps: 'Solar System Installation', gBusiness: 'Solar System Installation', faceBook: 'Solar System Installation', fileName: `Solar System Installation in ${location}` },
        { gMaps: 'Carpenter', gBusiness: 'Carpenter', faceBook: 'Carpenter', fileName: `Carpenter in ${location}` },
        { gMaps: 'Gas Safety Certificate', gBusiness: 'Gas Safety Certificate', faceBook: 'Gas Safety Certificate', fileName: `Gas Safety Certificate in ${location}` }
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
