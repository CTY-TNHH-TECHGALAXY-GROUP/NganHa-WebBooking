const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3002/en/new-user/standard/checkout', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText && b.innerText.includes('Add service(s)'));
    if (addBtn) {
       console.log("FOUND Add service(s) button");
       addBtn.click();
    } else {
       console.log("NOT FOUND Add service(s)");
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const plusBtn = btns.find(b => b.innerHTML.includes('lucide-plus') && !b.innerText.includes('Add service'));
    if (plusBtn) {
       console.log("FOUND plus button, clicking it");
       plusBtn.click();
    } else {
       console.log("NOT FOUND plus button");
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
})();
