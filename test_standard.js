const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3002/en/new-user/standard', { waitUntil: 'networkidle2' });
  
  // Click first service using a more specific selector
  // Let's find any element containing the text and click it
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Aroma coconut oil'));
    if (el) el.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'std_step1.png' });
  
  // Click Add to cart
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addToCartBtn = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('add to cart'));
    if (addToCartBtn) addToCartBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'std_step2.png' });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  if(html.includes("Custom for you") || html.includes("为您定制")) {
     console.log("SUCCESS");
  } else {
     console.log("FAIL");
  }
  
  await browser.close();
})();
