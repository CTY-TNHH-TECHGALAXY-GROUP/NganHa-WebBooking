import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to checkout page
        print("Navigating...")
        await page.goto('http://localhost:3002/en/new-user/standard/checkout')
        
        print("Wait for load...")
        await page.wait_for_timeout(3000)
        
        # Click "+ Add service(s)"
        print("Clicking Add service...")
        await page.click('button:has-text("Add service(s)")')
        await page.wait_for_timeout(1000)
        
        # Click the first "+" button in the modal
        print("Clicking + button...")
        # Find the first button with plus icon
        await page.evaluate('''() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const plusBtn = btns.find(b => b.innerHTML.includes('lucide-plus'));
            if(plusBtn) plusBtn.click();
        }''')
        await page.wait_for_timeout(1000)
        
        # If DurationDrawer opens, we need to click Select
        drawer_exists = await page.evaluate('''() => {
            return document.body.innerText.includes('Duration & Price');
        }''')
        if drawer_exists:
            print("Drawer exists, clicking select...")
            await page.click('button:has-text("Select")')
            await page.wait_for_timeout(1000)
            
        print("Taking screenshot...")
        await page.screenshot(path='checkout_modal_test.png')
        
        # Check if CustomForYouModal exists (e.g. by checking text)
        has_custom = await page.evaluate('''() => {
            return document.body.innerText.includes('Custom for you') || document.body.innerText.includes('Body parts');
        }''')
        print(f"Has Custom modal? {has_custom}")
        
        await browser.close()

asyncio.run(main())
