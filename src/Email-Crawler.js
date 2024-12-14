const cheerio = require("cheerio");
const xlsx = require("xlsx");
const fs = require("fs").promises;

const { connect } = require("puppeteer-real-browser");

const extractEmails = (html) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = html.match(emailRegex);

  if (!matches) return [];
  const validEmails = matches.filter((email) => {
    const excludedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".bmp",
    ];
    return !excludedExtensions.some((ext) => email.toLowerCase().endsWith(ext));
  });
  return Array.from(new Set(validEmails));
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

const getHomePage = (url) => {
  try {
    const { origin } = new URL(url); // Extract the origin
    return origin; // This will give the homepage
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error.message);
    return null;
  }
};

async function emailCrawler(jsonArray, fileName) {
  if (jsonArray.length == 0) {
    console.warn(`Json Array has no data`)
    return []
  }
  //loop over the json array
  const rows = [];
  for (const data of jsonArray) {
    const email = data[Object.keys(data)[2]]; //third property
    const website = data[Object.keys(data)[3]]; // fourth propery

    if (website && !email) {
      const [emailArray] = await jsRender(website);
      data[Object.keys(data)[2]] = emailArray;
      rows.push(data); //modified data
      console.log(data);
    } else {
      rows.push(data); // just to compare , remove if neccessary
    }
  }
  // return rows;

  //save data to excel
  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Updated Data");
  xlsx.writeFile(workbook, fileName);

  console.log(`Updated Excel file saved at: ${fileName}`);
}

async function jsRender(url) {
  const { browser, page } = await connect({
    defaultViewport: null,
    headless: true,
    args: [],

    customConfig: {},

    turnstile: true,

    connectOption: {
      defaultViewport: null,
    },
    disableXvfb: false,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
  });
  try {
    try {
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }
      await page.goto(url, { timeout: 30000, waitUntil: "networkidle2" }); // Added timeout option
    } catch (e) {
      console.error(`${url} can't be reached`);
      return [];
    }
    // await page.waitForNetworkIdle()
    const pageHTML = await page.content();
    const emails = extractEmails(pageHTML);

    if (!emails || emails.length === 0) {
      const links = extractLinks(pageHTML, url);
      console.log("Extracted Links:", links);
      if (links.length == 0) {
        return [];
      }
      const cookiesString = await fs.readFile("./cookies.json");
      const cookies = JSON.parse(cookiesString);
      const context = browser.defaultBrowserContext();
      await context.setCookie(...cookies);
      const pageWithCookies = await context.newPage();
      for (const link of links) {
        try {
          await pageWithCookies.goto(link, { timeout: 30000 }); // Visit each link
          await new Promise((res) => setTimeout(res, 4000));
          const subPageHTML = await pageWithCookies.content();
          const subPageEmails = extractEmails(subPageHTML);
          if (subPageEmails && subPageEmails.length > 0) {
            emails.push(...subPageEmails); // Collect emails from the subpage
          }
        } catch (e) {
          console.error(`${link} can't be reached:`, e.message);
        }
      }
    }
    console.log(`EMAILS`);
    console.log(emails);
    return emails.length > 0 ? emails : [];
  } catch (err) {
    console.error(`Error: ${err}`);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
module.exports = emailCrawler;
