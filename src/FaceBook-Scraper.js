const puppeteerExtra = require("puppeteer-extra");
const Stealth = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(Stealth());
const fs = require("fs").promises;
const XLSX = require("xlsx");

const scrollDelay = 1500 //in milliseconds
const pageLoadDelay = 8000 // in miliseconds



async function facebookScraper(query , cityName) {
  const browser = await puppeteerExtra.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  //load cookies
  const cookiesString = await fs.readFile("./cookies.json");
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  // Intercept and monitor network responses
  await page.setRequestInterception(true);

  page.on("request", (request) => {
    request.continue();
  });

  await page.goto(`https://www.facebook.com/search/pages?q=${query}`);

  //set location
  await page.waitForSelector('input[placeholder="Location"]');
  const locationInput = await page.$('input[placeholder="Location"]');
  await locationInput.type(cityName, { delay: 100 }); // Example text input

  //clicking the first suggestion
  await page.waitForSelector('ul[role="listbox"]');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.click('ul[role="listbox"] li:first-of-type');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Scroll dynamically to load all content
  const scrollPageToBottom = async () => {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((resolve) => setTimeout(resolve, scrollDelay)); // Wait for content to load
  };

  let previousHeight = 0;
  while (true) {
    await scrollPageToBottom();
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break;
    previousHeight = newHeight;
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const anchorLinks = await page.$$eval(
    'div[role="feed"] a[role="presentation"][href]',
    (links) => {
      return links.map((link) => link.href);
    }
  );

  const extractedData = [];

  for (let link of anchorLinks) {
    try {
      const newPage = await browser.newPage();
      await newPage.goto(link, { waitUntil: "domcontentloaded" }); // Wait until page is loaded
      
      await new Promise((resolve) => setTimeout(resolve, pageLoadDelay));
      const data = await newPage.evaluate(() => {
        const extractInfoByIcon = (iconName) => {
          const icon = Array.from(document.querySelectorAll("img")).find(
            (img) => img.src.endsWith(iconName)
          );
          if (icon) {
            const parentDiv = icon.closest("div");
            const nextDiv = parentDiv ? parentDiv.nextElementSibling : null;
            if (nextDiv) {
              const spanElement = nextDiv.querySelector("span");
              if (spanElement) {
                return spanElement.textContent.trim();
              }
            }
          }
          return null;
        };
        //href tags 
        const extractLinkByIcon = (iconName) => {
          const icon = Array.from(document.querySelectorAll("img")).find(
            (img) => img.src.endsWith(iconName)
          );
          if (icon) {
            const parentDiv = icon.closest("div");
            const nextDiv = parentDiv ? parentDiv.nextElementSibling : null;
            if (nextDiv) {
              const anchorElement = nextDiv.querySelector("a");
              if (anchorElement) {
                return anchorElement.href;
              }
            }
          }
          return null;
        };

        const nameElement = document.querySelector("h1");
        const name = nameElement ? nameElement.textContent.trim() : null;

        // Extract phone number, email, and website using their unique file names
        const phone = extractInfoByIcon("Dc7-7AgwkwS.png");
        const email = extractInfoByIcon("2PIcyqpptfD.png");
        const website = extractLinkByIcon("BQdeC67wT9z.png"); //for facebook redirect links
        // const website = extractInfoByIcon("BQdeC67wT9z.png");
        const address = null //helper 
        const category = null //helper
        return {
          name,
          phone,
          email,
          website,
          address,
          category
        };
      });
        //to convert facebook redirects to normal urls 
      async function extractRedirectedURL(facebookLink) {
        try {
          const [response] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }), 
            page.goto(facebookLink), 
          ]);
      
        
          return response.url();
        } catch (error) {
          console.error("Error extracting the redirected link:", error);
          return null;
        }
      }
       //convert
      if(data.website){
        data.website = await extractRedirectedURL(data.website)
      }

      // Push the extracted data to the array
      extractedData.push(data);

      console.log("Extracted data for", link, data);

      // Close the new page after extracting data
      await newPage.close();
    } catch (error) {
      console.error(`Error extracting data from ${link}:`, error);
    }
  }
  // await page.screenshot({ path: "screenshot.png" });
  // saveToExcel(extractedData, `${query}-in-${cityName}-facebook.xlsx`);
  await browser.close();
  console.log(extractedData.length)
  return extractedData;
}

module.exports = facebookScraper;
