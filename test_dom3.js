const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3002/en/new-user/standard/checkout', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText && b.innerText.includes('Add service(s)'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const plusBtn = btns.find(b => b.innerHTML.includes('lucide-plus') && !b.innerText.includes('Add service'));
    if (plusBtn) plusBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click "Select" if duration drawer is open
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const selectBtn = btns.find(b => b.innerText && b.innerText.includes('Select'));
    if (selectBtn) selectBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const html = await page.evaluate(() => document.body.innerHTML);
  if(html.includes("Custom for you")) {
     console.log("SUCCESS");
  } else {
     console.log("FAIL");
  }
  
  await browser.close();
})();
