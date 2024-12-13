//https://www.google.com/localservices/prolist?g2lbs=AOHF13m1KjPeJhI_z56ZVj42J-RslIXcDIiZY4TIKk74Ay_4G-ovREB1Iykk8fCUIY8N5bgfuUk7&hl=en-IN&gl=in&ssta=1&q=skip%20hire%20in%20london&oq=skip%20hire%20in%20london&slp=MgBSAggCYACSAZkCCgsvZy8xdjdweHo1MAoML2cvMWpnbHpzeGt5Cg0vZy8xMWYzel8xMzJ3CgsvZy8xdjgzMGx2bAoNL2cvMTFmd2RrbDZzXwoNL2cvMTFnZGw0MTYzYgoLL2cvMXRoODFmNjEKDS9nLzExbDZjcHAzOTYKCy9nLzF0ZHFiMWI0Cg0vZy8xMXdyMTlsN2pwCgsvZy8xdGo3ZGpjZwoLL2cvMXZsNWc3aDUKDS9nLzExcjloN2czNHMKDS9nLzExazd4cjZ0MDIKDS9nLzExcXNxbXBta3MKCy9nLzF0cjdjOHo4Cg0vZy8xMWJ6dDBfem4zCg0vZy8xMWY0bGhmOGM3CgsvZy8xdGN4ajdnaAoLL2cvMXRkcWd6MmeaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwiQmO7S7JWKAxWGzzgGHboyMCMQjGp6BAgsEAE&scp=Ch1nY2lkOndhc3RlX21hbmFnZW1lbnRfc2VydmljZRJMEhIJdd4hrwug2EcRmSrV3Vo6llIaEglv4hqhC6DYRxGL6biE43PxLyIKTG9uZG9uLCBVSyoUDTm4oB4VxV7K_x3oksweJdafFgAwABoJc2tpcCBoaXJlIhNza2lwIGhpcmUgaW4gbG9uZG9uKhhXYXN0ZS1NYW5hZ2VtZW50IFNlcnZpY2U6AjAC
const puppeteerExtra = require("puppeteer-extra");
const Stealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const xlsx = require("xlsx");

puppeteerExtra.use(Stealth());

// const service = ["skip hire"];
// const location = ["London"];

async function gBusiness(service, location) {
  const query = `${service} in ${location}`;
  const browser = await puppeteerExtra.launch({ headless: true });
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
  await page.reload();
  let results = [];

  while (true) {
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
      console.log(results.length);
      break;
    }

    //additional wait
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  let uniqueLinks = [...new Set(results)];

  console.log(`unique links : ${uniqueLinks.length}`);
  console.log(`result : ${results.length}`);

  let data = [];

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

      // data
      const name = await page
        .$eval("div.rgnuSb.tZPcob", (el) => el.textContent)
        .catch(() => null);
      const websiteLink = await page
        .$eval("a.iPF7ob", (el) => el.getAttribute("href"))
        .catch(() => null);
      const phone = await page
        .$eval("div.eigqqc", (el) => el.textContent)
        .catch(() => null);
      const address = await page
        .$eval("div.fccl3c", (el) => el.textContent)
        .catch(() => null);
      const category = await page
        .$eval("div.bg3Wkc", (el) => el.textContent)
        .catch(() => null);
      // Push data into the array
      data.push({
        name: name || null,
        phone: phone || null,
        email: null,
        website: websiteLink || null,
        address: address || null,
        category : category || null
      });

      console.log({
        name: name || null,
        phone: phone || null,
        email: null,
        website: websiteLink || null,
        address: address || null,
        category : category || null
      });
      await page.close();
    } catch (error) {
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
  return data;
}

// gBusiness('electricians' , 'london')
module.exports = gBusiness;
