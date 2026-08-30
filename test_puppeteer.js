const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to standard menu page where the modal might appear
  console.log("Navigating to checkout...");
  await page.goto('http://localhost:3002/en/new-user/standard/checkout', { waitUntil: 'networkidle2' });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Add service(s)
  console.log("Clicking Open + Add service(s)...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText && b.innerText.includes('Add service(s)'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot of the Quick Select modal
  await page.screenshot({ path: 'step1_quick_select.png' });
  
  // Click first '+' button
  console.log("Clicking + on a service...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const plusBtn = btns.find(b => b.innerHTML.includes('lucide-plus') && !b.innerText.includes('Add service'));
    if (plusBtn) plusBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if DurationDrawer opens
  const hasDrawer = await page.evaluate(() => document.body.innerText.includes('Select') && document.body.innerText.includes('mins'));
  if (hasDrawer) {
    console.log("Drawer opened, clicking Select...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const selectBtn = btns.find(b => b.innerText && b.innerText.includes('Select'));
      if (selectBtn) selectBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Take screenshot of CustomForYouModal
  await page.screenshot({ path: 'step2_custom_modal.png' });
  console.log("Done testing checkout flow.");
  
  await browser.close();
})();
