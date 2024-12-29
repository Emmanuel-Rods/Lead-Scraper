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
const locations = ["lubbock texas"];
//Cleaning in harlingen texas

// Function to merge and deduplicate results
function mergeResults(facebookData = [], gMapsData = [], gBusinessData = []) {
  const consolidated = [...facebookData, ...gMapsData, ...gBusinessData];
  console.log(consolidated);
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
  console.log(
    `Processing config: ${JSON.stringify(config)}, location: ${location}`
  );

  try {
    // Define scraper configurations
    const scraperTypes = [
      { key: "faceBook", scraper: facebookScraper },
      { key: "faceBookAlt", scraper: facebookScraper },
      // { key: "gMaps", scraper: gMaps },
      // { key: "gMapsAlt", scraper: gMaps },
      // { key: "gBusiness", scraper: gBusiness },
      // { key: "gBusinessAlt", scraper: gBusiness },
    ];

    // Prepare scraper promises
    const scraperPromises = scraperTypes
      .filter((type) => config[type.key])
      .map((type) => ({
        key: type.key,
        promise: type.scraper(config[type.key], location),
      }));

    // Run scrapers concurrently
    const results = await Promise.allSettled(
      scraperPromises.map((scraper) => scraper.promise)
    );

    // Process and organize results
    const scraperResults = {};
    scraperPromises.forEach((scraper, index) => {
      const result = results[index];
      scraperResults[scraper.key] =
        result.status === "fulfilled" ? result.value : [];
    });

    // Combine data from different sources
    const facebookData = [
      ...(scraperResults.faceBook || []),
      ...(scraperResults.faceBookAlt || []),
    ];
    const gMapsData = [
      ...(scraperResults.gMaps || []),
      ...(scraperResults.gMapsAlt || []),
    ];
    const gBusinessData = [
      ...(scraperResults.gBusiness || []),
      ...(scraperResults.gBusinessAlt || []),
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
      `Error processing config: ${JSON.stringify(
        config
      )}, location: ${location}`,
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
      const [city , state ] = location.split(/\s+/)
      
      const scraperConfigs = [
        {
          gBusiness: "Aluminium Joinery",
          gBusinessAlt: "PVC Joinery",
          faceBook: "Aluminium Joinery",
          faceBookAlt: "PVC Joinery",
          fileName: `${state} Aluminium and PVC Joinery in ${city}`,
        },
        {
          gBusiness: "Carpet cleaning",
          gBusinessAlt: "Upholstery Cleaning",
          faceBook: "Carpet Cleaning",
          faceBookAlt: "Upholstery Cleaning",
          fileName: `${state} Carpet and Upholstery Cleaning in ${city}`,
        },
        {
          gBusiness: "Cleaning",
          faceBook: "Cleaning",
          fileName: `${state} Cleaning in ${city}`,
        },
        {
          gMaps: "Fencing",
          gMapsAlt: "Decking",
          faceBook: "Fencing",
          faceBookAlt: "Decking",
          fileName: `${state} Fencing and Decking in ${city}`,
        },
        {
          gBusiness: "Custom Blinds",
          gBusinessAlt: "Shutters",
          faceBook: "Custom Blinds",
          faceBookAlt: "Shutters",
          fileName: `${state} Custom Blinds and Shutters in ${city}`,
        },
        {
          gBusiness: "Gardening",
          gBusinessAlt: "Landscape Designers",
          faceBook: "Gardening",
          faceBookAlt: "Landscapers",
          fileName: `${state} Gardening and Landscape Designers in ${city}`,
        },
        {
          gBusiness: "Plastering",
          gBusinessAlt: "Rendering",
          faceBook: "Plastering",
          faceBookAlt: "Rendering",
          fileName: `${state} Plastering and Rendering in ${city}`,
        },
        {
          gBusiness: "Gas Line Installation and Plumbing",
          faceBook: "Gas Line Installation",
          faceBookAlt: "Plumbing",
          fileName: `${state} Gas Line Installation and Plumbing in ${city}`,
        },
        {
          gBusiness: "Painting",
          gMaps: "Painting and Decoration",
          faceBook: "Painting",
          faceBookAlt: "Decoration",
          fileName: `${state} Painting and Decoration in ${city}`,
        },
        {
          gBusiness: "Interior Doors",
          faceBook: "Interior Doors",
          fileName: `${state} Interior Doors in ${city}`,
        },
        {
          gBusiness: "Door Repair",
          faceBook: "Door Repair",
          fileName: `${state} Door Repair in ${city}`,
        },
        {
          gBusiness: "Electrical Services",
          faceBook: "Electrical Services",
          fileName: `${state} Electrical Services in ${city}`,
        },
        {
          gBusiness: "Pool Installation",
          gBusinessAlt: "Pool Repair",
          faceBook: "Pool Installation",
          faceBookAlt: "Pool Repair",
          fileName: `${state} Pool Installation and Repair in ${city}`,
        },
        {
          gMaps: "Floor Installation",
          faceBook: "Floor Installation",
          fileName: `${state} Floor Installation in ${city}`,
        },
        {
          gBusiness: "Furniture Assembly",
          faceBook: "Furniture Assembly",
          fileName: `${state} Furniture Assembly in ${city}`,
        },
        {
          gBusiness: "Paving",
          faceBook: "Paving",
          fileName: `${state} Paving in ${city}`,
        },
        {
          gBusiness: "Locksmith",
          faceBook: "Locksmith",
          fileName: `${state} Locksmith in ${city}`,
        },
        {
          gBusiness: "Man with a Van",
          faceBook: "Man with a Van",
          fileName: `${state} Man with a Van in ${city}`,
        },
        {
          gBusiness: "Pest Control",
          faceBook: "Pest Control",
          fileName: `${state} Pest Control in ${city}`,
        },
        {
          gBusiness: "House Movers",
          faceBook: "House Movers",
          fileName: `${state} House Movers in ${city}`,
        },
        {
          gBusiness: "House Renovation Services",
          faceBook: "House Renovation",
          fileName: `${state} House Renovation in ${city}`,
        },
        {
          gBusiness: "Roof Repair",
          faceBook: "Roof Repair",
          fileName: `${state} Roof Repair in ${city}`,
        },
        {
          gBusiness: "Construction Equipment Hire",
          faceBook: "Construction Equipment Hire",
          fileName: `${state} Construction Equipment Hire in ${city}`,
        },
        {
          gBusiness: "Skip Hire",
          faceBook: "Skip Hire",
          fileName: `${state} Skip Hire in ${city}`,
        },
        {
          gBusiness: "Scaffolding",
          faceBook: "Scaffolding",
          fileName: `${state} Scaffolding in ${city}`,
        },
        {
          gBusiness: "Groundwork Equipment Hire",
          faceBook: "Groundwork Equipment Hire",
          fileName: `${state} Groundwork Equipment Hire in ${city}`,
        },
        {
          gBusiness: "Air Conditioner Repair",
          faceBook: "Air Conditioner Repair",
          fileName: `${state} Air Conditioner Repair in ${city}`,
        },
        {
          gBusiness: "Solar System Installation",
          faceBook: "Solar System Installation",
          fileName: `${state} Solar System Installation in ${city}`,
        },
        {
          gBusiness: "Carpenter",
          faceBook: "Carpenter",
          fileName: `${state} Carpenter in ${city}`,
        },
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
