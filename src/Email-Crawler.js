const cheerio = require("cheerio");
const xlsx = require("xlsx");
const fs = require("fs").promises;
const axios = require("axios");

const MAX_DEPTH = 2;
const CONCURRENT_LIMIT = 5;


const { connect } = require("puppeteer-real-browser");

// const extractEmails = (html) => {
//   const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
//   const matches = html.match(emailRegex);

//   if (!matches) return [];
//   const validEmails = matches.filter((email) => {
//     const excludedExtensions = [
//       ".png",
//       ".jpg",
//       ".jpeg",
//       ".gif",
//       ".svg",
//       ".webp",
//       ".bmp",
//     ];
//     return !excludedExtensions.some((ext) => email.toLowerCase().endsWith(ext));
//   });
//   return Array.from(new Set(validEmails));
// };

const extractEmails = (html) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = html.match(emailRegex);

  if (!matches) return [];

  // List of invalid domains
  const excludedDomains = [
    "domain.com",
    "example.com",
    "email.com",
    "fakemail.org",
    "testing.com",
    "nowhere.com",
    "mysite.com",
    ".example.com",
    "youraddress.com",
    "ebytes.com",
    "sentry-next.wixpress.com" ,
    "address.com"
  ];

  // List of specific fake emails to exclude
  const fakeEmails = ["0@gmail.com", "info@mysite.com" , 'john@doe.com' , 'john@smith.com' , 'impallari@gmail.com' , 'filler@godaddy.com' , 'contact@sansoxygen.com' ,  "micah@michahrich.com"];

  // List of excluded extensions (e.g., image files)
  const excludedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
  ];

  const validEmails = matches.filter((email) => {
    email = email.toLowerCase(); // Normalize for case-insensitivity

    const domain = email.split("@")[1]; // Extract domain
    const isExcludedExtension = excludedExtensions.some((ext) =>
      email.endsWith(ext)
    );

    return (
      !isExcludedExtension && // Exclude emails ending with image extensions
      !excludedDomains.includes(domain) && // Exclude emails with invalid domains
      !fakeEmails.includes(email) // Exclude explicitly fake emails
    );
  });

  return Array.from(new Set(validEmails)); // Deduplicate results
};


const extractLinks = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const links = new Set();
  let facebookLinkCount = 0;

  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href && href.includes("facebook.com") && facebookLinkCount < 3) {
      links.add(href);
      facebookLinkCount++;
    }

    if (href && (href.startsWith("/") || href.startsWith(baseUrl))) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        const baseHomePage = getHomePage(baseUrl);
        if (
          fullUrl === baseUrl || // Home page
          fullUrl.includes("contact") //contact page
        ) {
          links.add(fullUrl);
        }
        //add base link
        links.add(baseHomePage + '/');
      } catch (error) {
        console.warn(`Invalid URL: ${href} on ${baseUrl}`, error.message);
      }
    }
  });

  return Array.from(links);
};

// function excelToArrayJson(filePath) {
//   try {
//     const workbook = xlsx.readFile(filePath);
//     const result = [];
//     workbook.SheetNames.forEach((sheetName) => {
//       const sheet = workbook.Sheets[sheetName];
//       const sheetData = xlsx.utils.sheet_to_json(sheet, { defval: null });
//       result.push(...sheetData);
//     });

//     return result;
//   } catch (error) {
//     console.error("Error reading the Excel file:", error);
//     return [];
//   }
// }


const findEmails = async (url, depth = 0, visited = new Set()) => {
  if (visited.has(url) || depth > MAX_DEPTH) return null;
  visited.add(url);

  try {
    console.log(`Scraping: ${url}`);
    const response = await axios.get(url);
    const html = response.data;

    const emails = extractEmails(html);
    if (emails && emails.length > 0) return emails;

    const links = extractLinks(html, url);
    console.log(`Found ${links.length} links on ${url}`);

    const results = await Promise.all(
      links
        .slice(0, CONCURRENT_LIMIT)
        .map((link) => findEmails(link, depth + 1, visited))
    );

    const allEmails = results.flat().filter(Boolean);
    return allEmails.length > 0 ? allEmails : null;
  } catch (error) {
    console.error(`Error visiting ${url}:`, error.message);
    return null;
  }
};

async function processRowsAndSaveEmails(jsonArray) {
  const updatedJson = []; // Store updated rows

  for (const row of jsonArray) {
    const updatedRow = { ...row };
    const email = Object.values(row)[2]; // 3rd property
    const website = Object.values(row)[3]; // 4th property
    if (!website) {
      console.log(
        `Skipping row: No website available for ${row.name || "unknown name"}`
      );
      updatedJson.push(updatedRow);
      continue;
    }

    if (!email) {
      console.log(
        `No email found for ${
          row.name || "unknown name"
        }. Crawling website: ${website}`
      );
      try {
        const crawledEmail = await startCrawler(website); // Call the crawler function
        if (crawledEmail) {
          console.log(`Email found: ${crawledEmail}`);
          updatedRow[email] = crawledEmail; // Update the email field (need to check if this still works )
        } else {
          console.log(`No email found on the website: ${website}`);
        }
      } catch (error) {
        console.error(`Error crawling website ${website}:`, error);
      }
    } else {
      console.log(
        `Email already exists for ${row.name || "unknown name"}: ${email}`
      );
    }
    updatedJson.push(updatedRow);
  }
  return updatedJson ;
}


const startCrawler = async (websiteUrl) => {
  const emails = await findEmails(websiteUrl);
  if (emails && emails.length > 0) {
    console.log(`Email: ${emails}`);
    return emails;
  } else {
    console.log("No emails found.");
  }
};

const getHomePage = (url) => {
  try {
    const { origin } = new URL(url); // Extract the origin
    return origin; // This will give the homepage
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error.message);
    return null;
  }
};

async function emailCrawler(jsonArray, fileName , location) {
  if (jsonArray.length == 0) {
    console.warn(`Json Array has no data for ${fileName}`)
    return []
  }
  UpdatedjsonArray = await processRowsAndSaveEmails(jsonArray) //using html parsing
  console.log(jsonArray.length)
  //loop over the json array
  const rows = [];
  for (const data of UpdatedjsonArray) {
    const email = data[Object.keys(data)[2]]; //third property
    const website = data[Object.keys(data)[3]]; // fourth propery
    try{
      if (website && !email) {
        const [emailArray] = await jsRender(website);
        data[Object.keys(data)[2]] = emailArray;
        rows.push(data); //modified data
        console.log(data);
      } else {
        rows.push(data); 
      }
    }
    catch(e){
      console.error(`error occured while processing ${data} , ${e}`)
   }
  }
  function filterRowsWithEmail(rows) {
    return rows.filter(row => row[Object.keys(row)[2]]); // Checks if the third property (email) exists
  }

  filteredRows = filterRowsWithEmail(rows)

  if(filteredRows.length == 0){
    console.warn(`No Data Saved for : ${fileName} but file will be Created , Either there were No Emails OR Internet Connectivity Was Lost During Email Crawling`)
  }
  
  //extract categories function 
  function extractCategory(filename, city, state) {
    const normalizedFilename = filename.toLowerCase();
    const normalizedCity = city.toLowerCase();
    const normalizedState = state.toLowerCase();
  
    let modifiedFilename = normalizedFilename
      .replace(normalizedCity, "") // Remove city
      .replace(normalizedState, ""); // Remove state

    modifiedFilename = modifiedFilename.replace(/\bin\b/, ""); // Remove "in"
  

    modifiedFilename = modifiedFilename.trim();
    const words = modifiedFilename.split(/\s+/); 
  
    return words.join(" ") || null; 
  }

  const parts = location.split(/\s+/);
  const state = parts.pop(); 
  const city = parts.join(" ");
  const extractedcategory = extractCategory(fileName, city, state);

  //standerizing the excel rows 
  const standardizedArray = filteredRows.map(item => ({
    [extractedcategory]: item.name || null,
    [city]: item.email ,
    [state]: item.phone || null,
    category: item.category || null,
    address: item.address || null,
  }));

  //save data to excel
  const worksheet = xlsx.utils.json_to_sheet(standardizedArray);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Updated Data");
  xlsx.writeFile(workbook, fileName);

  console.log(`Updated Excel file saved at: ${fileName}`);
}


async function jsRender(url) {
  let browser, page;
  try {
    // Connect to Puppeteer
    const puppeteerContext = await connect({
      defaultViewport: null,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      customConfig: {},
      turnstile: true,
      connectOption: { defaultViewport: null },
      disableXvfb: false,
      ignoreAllFlags: false,
    });

    browser = puppeteerContext.browser;
    page = puppeteerContext.page;

    // Ensure URL format
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // Go to the page
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { timeout: 30000, waitUntil: "domcontentloaded" });

    // Ensure the main frame is ready
    const mainFrame = page.mainFrame();
    if (!mainFrame) {
      console.error("Main frame is not ready!");
      await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    }

    // Wait for the body selector
    await page.waitForSelector("body", { timeout: 10000 });

    // Get page HTML
    const pageHTML = await page.content();
    const emails = extractEmails(pageHTML);

    if (!emails || emails.length === 0) {
      const links = extractLinks(pageHTML, url);
      console.log("Extracted Links:", links);

      if (links.length === 0) {
        return [];
      }

      try {
        const cookiesString = await fs.readFile("./cookies.json");
        const cookies = JSON.parse(cookiesString);
        const context = browser.defaultBrowserContext();
        await context.setCookie(...cookies);
      } catch (cookieError) {
        console.warn("No valid cookies found, continuing without cookies...");
      }

      const pageWithCookies = await browser.newPage();

      for (const link of links) {
        try {
          await pageWithCookies.goto(link, { timeout: 30000, waitUntil: "domcontentloaded" });
          await pageWithCookies.waitForSelector("body", { timeout: 10000 });
          const subPageHTML = await pageWithCookies.content();
          const subPageEmails = extractEmails(subPageHTML);
          if (subPageEmails && subPageEmails.length > 0) {
            emails.push(...subPageEmails);
          }
        } catch (subPageError) {
          console.error(`Failed to process ${link}:`, subPageError.message);
        }
      }
    }

    console.log("Collected Emails:", emails);
    return Array.from(new Set(emails));
  } catch (err) {
    console.error(`Error in jsRender: ${err.message}`);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = emailCrawler;
