//https://www.google.com/localservices/prolist?g2lbs=AOHF13m1KjPeJhI_z56ZVj42J-RslIXcDIiZY4TIKk74Ay_4G-ovREB1Iykk8fCUIY8N5bgfuUk7&hl=en-IN&gl=in&ssta=1&q=skip%20hire%20in%20london&oq=skip%20hire%20in%20london&slp=MgBSAggCYACSAZkCCgsvZy8xdjdweHo1MAoML2cvMWpnbHpzeGt5Cg0vZy8xMWYzel8xMzJ3CgsvZy8xdjgzMGx2bAoNL2cvMTFmd2RrbDZzXwoNL2cvMTFnZGw0MTYzYgoLL2cvMXRoODFmNjEKDS9nLzExbDZjcHAzOTYKCy9nLzF0ZHFiMWI0Cg0vZy8xMXdyMTlsN2pwCgsvZy8xdGo3ZGpjZwoLL2cvMXZsNWc3aDUKDS9nLzExcjloN2czNHMKDS9nLzExazd4cjZ0MDIKDS9nLzExcXNxbXBta3MKCy9nLzF0cjdjOHo4Cg0vZy8xMWJ6dDBfem4zCg0vZy8xMWY0bGhmOGM3CgsvZy8xdGN4ajdnaAoLL2cvMXRkcWd6MmeaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwiQmO7S7JWKAxWGzzgGHboyMCMQjGp6BAgsEAE&scp=Ch1nY2lkOndhc3RlX21hbmFnZW1lbnRfc2VydmljZRJMEhIJdd4hrwug2EcRmSrV3Vo6llIaEglv4hqhC6DYRxGL6biE43PxLyIKTG9uZG9uLCBVSyoUDTm4oB4VxV7K_x3oksweJdafFgAwABoJc2tpcCBoaXJlIhNza2lwIGhpcmUgaW4gbG9uZG9uKhhXYXN0ZS1NYW5hZ2VtZW50IFNlcnZpY2U6AjAC
const puppeteerExtra = require("puppeteer-extra");
const Stealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const xlsx = require("xlsx");
const logError = require("./logger.js");
const path = require('path');


puppeteerExtra.use(Stealth());

// const service = ["skip hire"];
// const location = ["London"];

async function gBusiness(service, location) {
  const query = `${service} in ${location}`;
  const browser = await puppeteerExtra.launch({ headless: true});
  const page = await browser.newPage();

  await page.setViewport({
    width: 1280, // Set width of the viewport
    height: 800, // Set height of the viewport
    deviceScaleFactor: 0.9,
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );
  console.log(`Running for query: "${query}"`);
  await page.goto(
    "https://www.google.com/localservices/prolist?g2lbs=AOHF13m1KjPeJhI_z56ZVj42J-RslIXcDIiZY4TIKk74Ay_4G-ovREB1Iykk8fCUIY8N5bgfuUk7&hl=en-IN&gl=in&ssta=1&q=skip%20hire%20in%20london&oq=skip%20hire%20in%20london&slp=MgBSAggCYACSAZkCCgsvZy8xdjdweHo1MAoML2cvMWpnbHpzeGt5Cg0vZy8xMWYzel8xMzJ3CgsvZy8xdjgzMGx2bAoNL2cvMTFmd2RrbDZzXwoNL2cvMTFnZGw0MTYzYgoLL2cvMXRoODFmNjEKDS9nLzExbDZjcHAzOTYKCy9nLzF0ZHFiMWI0Cg0vZy8xMXdyMTlsN2pwCgsvZy8xdGo3ZGpjZwoLL2cvMXZsNWc3aDUKDS9nLzExcjloN2czNHMKDS9nLzExazd4cjZ0MDIKDS9nLzExcXNxbXBta3MKCy9nLzF0cjdjOHo4Cg0vZy8xMWJ6dDBfem4zCg0vZy8xMWY0bGhmOGM3CgsvZy8xdGN4ajdnaAoLL2cvMXRkcWd6MmeaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwiQmO7S7JWKAxWGzzgGHboyMCMQjGp6BAgsEAE&scp=Ch1nY2lkOndhc3RlX21hbmFnZW1lbnRfc2VydmljZRJMEhIJdd4hrwug2EcRmSrV3Vo6llIaEglv4hqhC6DYRxGL6biE43PxLyIKTG9uZG9uLCBVSyoUDTm4oB4VxV7K_x3oksweJdafFgAwABoJc2tpcCBoaXJlIhNza2lwIGhpcmUgaW4gbG9uZG9uKhhXYXN0ZS1NYW5hZ2VtZW50IFNlcnZpY2U6AjAC"
  );
  await page.waitForNetworkIdle(); // Wait for network resources to fully load
  await page.waitForSelector("input[name='q']", { visible: true });
  const searchBar = await page.$("input[name='q']");

  if (searchBar) {
    await page.evaluate((inputSelector) => {
      const input = document.querySelector(inputSelector);
      if (input) input.value = "";
    }, "input[name='q']");

    // Type the query
    await searchBar.type(query, { delay: 10 });
    await page.keyboard.press("Enter");
  } else {
    throw new Error("Search bar not found");
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await page.reload({ waitUntil: "networkidle2" });

   const randomMouseMovement = async (page, duration = 5000) => {
    const { width, height } = await page.viewport(); 
    const endTime = Date.now() + duration;

    while (Date.now() < endTime) {
        const x = Math.floor(Math.random() * width); 
        const y = Math.floor(Math.random() * height); 

        await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 1 }); // Move to random coordinates
        await new Promise((r) => setTimeout(r, Math.random() * 300)); // Random pause between movements
    }
};

// Perform random mouse movements for 5 seconds
await randomMouseMovement(page, 2000);

  const isMapLoaded = async (page) => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); //extra
    const isLoaded = await page.evaluate(() => {
      const mapElement = document.querySelector('div.yXg2De[jsname="haAclf"]');
      return mapElement && window.getComputedStyle(mapElement).opacity === '1';
    });
    return isLoaded;
  };

  
  const mapLoaded = await isMapLoaded(page);

  if (!mapLoaded) {
    console.info(`Map reloading...`)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await page.reload();
    console.info(`Map reloaded`)
  }

  async function mapReloader(page, attempts = 10) {
    for (let retries = 0; retries < attempts; retries++) {
      try {
        const mapLoaded = await isMapLoaded(page);
  
        if (mapLoaded) {
          console.info(`Map loaded successfully.`);
          return;
        }
  
        console.info(`Map not loaded. Attempt ${retries + 1}/${attempts}. Reloading...`);

        await new Promise(resolve => setTimeout(resolve, 4000));
        await page.reload();
        if(attempts == 10){
          logMapsError('Error during Map reloading', `${service} in ${location}`)
          break;
        }
      } catch (error) {
        console.error(`Error during map reloading: ${error.message}`);
        logMapsError('Error during Map reloading', `${service} in ${location}` , error )
        return; 
      }
    }
  
    console.warn(`Map failed to load after ${retries} attempts.`);
  }
  
  await mapReloader(page)

  let results = [];

  while (true) {
    await mapReloader(page) //check if the page is fully loaded
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newResults = await page.evaluate(() => {
      const container = document.querySelector(".YhtaGd.aQOEkf");
      if (!container) return [];

      // get profile url
      return new Promise((resolve) => {
        setTimeout(() => {
          const items = Array.from(
            container.querySelectorAll("[data-profile-url-path]")
          );
          return resolve(
            items.map((item) => item.getAttribute("data-profile-url-path"))
          );
        }, 2000);
      });
    });

    results.push(...newResults);
    if(results.length > 500){
      break; // quick fix 
    }

    const clicked = await page.evaluate(() => {
      const nextButtons = Array.from(
        document.querySelectorAll("button span")
      ).filter((span) => span.textContent.trim() === "Next >");

      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0].closest("button");

        // Check if the button is not disabled
        if (nextButton && !nextButton.disabled) {
          console.log("Clicking Next button");
          nextButton.click();
          return true;
        }
      }

      return false;
    });

    // Break the loop
    if (!clicked) {
      console.log("No more pages to navigate");
      console.info(
        `Extracted Data from Google Local Business ${results.length}`
      );
      break;
    }

    //additional wait
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  let uniqueLinks = [...new Set(results)];

  const dataLength = () => {
    return uniqueLinks.length;
  };

  console.log(`unique links : ${uniqueLinks.length}`);
  let dataArray = [];

  for (let link of uniqueLinks) {
    try {
      const page = await browser.newPage();

      // url
      const baseURL = "https://google.com";
      const fullURL = link.startsWith("http")
        ? link
        : `${baseURL}${link.startsWith("/") ? "" : "/"}${link}`;

      console.log(`Visiting: ${fullURL}`);
      await page.goto(fullURL, { waitUntil: "networkidle2" });

      const data = await page.evaluate(() => {
        // Extract text by matching an SVG icon
        const extractInfoBySvgPath = (svgPath, match = 1) => {
          const svgElements = document.querySelectorAll("svg");
          let matchCount = 0; // Counter to track matches

          for (const svg of svgElements) {
            const pathElement = svg.querySelector("path");
            if (pathElement && pathElement.getAttribute("d") === svgPath) {
              matchCount++; // Increment match count

              if (matchCount === match) {
                const parentDiv = svg.parentElement;
                if (parentDiv && parentDiv.nextElementSibling) {
                  return parentDiv.nextElementSibling.textContent.trim();
                }
              }
            }
          }
          return null; // Return null if the second match isn't found
        };

        // Extract href by matching an SVG icon
        const extractLinkBySvgPath = (svgPath) => {
          const svgElements = document.querySelectorAll("svg");

          for (const svg of svgElements) {
            const pathElement = svg.querySelector("path");
            if (pathElement && pathElement.getAttribute("d") === svgPath) {
              // Locate the closest parent anchor tag
              const anchorElement = svg.closest("a");
              if (anchorElement && anchorElement.href) {
                return anchorElement.href.trim();
              }
            }
          }
          return null; // Return null if no matching link is found
        };

        // SVG paths
        // const phoneSvgPath = `M16.02 14.46l-2.62 2.62a16.141 16.141 0 0 1-6.5-6.5l2.62-2.62a.98.98 0 0 0 .27-.9L9.15 3.8c-.1-.46-.51-.8-.98-.8H4.02c-.56 0-1.03.47-1 1.03a17.92 17.92 0 0 0 2.43 8.01 18.08 18.08 0 0 0 6.5 6.5 17.92 17.92 0 0 0 8.01 2.43c.56.03 1.03-.44 1.03-1v-4.15c0-.48-.34-.89-.8-.98l-3.26-.65c-.33-.07-.67.04-.91.27z`;
        const websiteSvgPath = `M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z`;
        const addressSvgPath = `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`;

        const address = extractInfoBySvgPath(addressSvgPath); //textcontent
        const websiteLink = extractLinkBySvgPath(websiteSvgPath, 3); //href

        const phone =
          document.querySelector("div.eigqqc")?.textContent.trim() || null;
        const name =
          document.querySelector("div.rgnuSb.tZPcob")?.textContent.trim() ||
          null;
        const category =
          document.querySelector("div.bg3Wkc")?.textContent.trim() || null;

        // Return collected data
        return {
          name: name || null,
          phone: phone || null,
          email: null,
          website: websiteLink || null,
          address: address || null,
          category: category || null,
        };
      });

      // Push data into the array
      dataArray.push(data);
      await page.close();
    } catch (error) {
      logError(error, 'Google-Business-Scraper');
      console.error(`Error visiting ${link}: ${error.message}`);
    }
  }

  // Save data to Excel file
  // const workbook = xlsx.utils.book_new();
  // const worksheet = xlsx.utils.json_to_sheet(data);
  // xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  // xlsx.writeFile(workbook, `${query}.xlsx`);

  // console.log(`Data saved to ${query}.xlsx`);

  await browser.close();
  return dataArray;
}

// gBusiness('electricians' , 'london')
module.exports = gBusiness;

//map error logger
function logMapsError(info , category , error  ) {
  const logsDir = path.join(__dirname, '../logs'); 
  const logFile = path.join(logsDir, 'reloading-log.json'); 

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }


  const errorLog = {
    timestamp: new Date().toISOString(),
    category: category,
    message: error?.message || null  ,
    info: info ,
    stack: error?.stack || null,
  };

  try {
    let logs = [];
    if (fs.existsSync(logFile)) {
      const existingLogs = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(existingLogs); 
    }
    logs.push(errorLog); 
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2)); 
    console.log('Error logged successfully.');
  } catch (fileError) {
    console.error('Failed to log error:', fileError.message);
  }
}