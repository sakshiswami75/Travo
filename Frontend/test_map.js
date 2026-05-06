const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER PAGE ERROR:', error.message);
  });

  console.log('Navigating to map...');
  await page.goto('http://localhost:5174/map', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for destination input...');
  await page.waitForSelector('input[placeholder="Choose destination..."]', { timeout: 10000 });
  
  console.log('Typing Pune...');
  await page.type('input[placeholder="Choose destination..."]', 'Pune');
  
  console.log('Waiting for results...');
  await page.waitForTimeout(2000); // wait for debounce and network
  
  console.log('Clicking first result...');
  // Find the result div containing 'location_on' icon
  const results = await page.$$('div.absolute.top-full > div');
  if (results.length > 2) {
    await results[2].click(); // index 0 is Current Location, index 1 is Choose from Map
  } else {
    console.log('No search results appeared.');
  }

  console.log('Waiting for route generation...');
  await page.waitForTimeout(4000);
  
  console.log('Done testing.');
  await browser.close();
})();
