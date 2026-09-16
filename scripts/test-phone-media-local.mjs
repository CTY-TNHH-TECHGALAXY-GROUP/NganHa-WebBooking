import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3462';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/*',route=>route.request().resourceType()==='image' ? route.abort() : route.continue());
 await page.goto(base+'/en/oriafarm-retreat',{waitUntil:'networkidle'});
 const images=page.locator('img[data-retreat-loaded]');
 assert.ok(await images.count()>0);
 const states=await images.evaluateAll(nodes=>nodes.map(n=>({state:n.dataset.retreatLoaded,watermark:n.parentElement.querySelector('.media-watermark') ? getComputedStyle(n.parentElement.querySelector('.media-watermark')).visibility : null})));
 assert.ok(states.every(s=>s.state==='false' && (!s.watermark || s.watermark==='hidden')));
 console.log('PASS Farm Retreat: failed/pending image does not show watermark',states.length);
 await page.close();
 const ready=await browser.newPage({viewport:{width:390,height:844}});
 await ready.goto(base+'/en/oriafarm-retreat',{waitUntil:'networkidle'});
 await ready.locator('img[data-retreat-loaded]').first().scrollIntoViewIfNeeded();
 await ready.waitForFunction(()=>document.querySelector('img[data-retreat-loaded]')?.dataset.retreatLoaded==='true');
 const visible=await ready.locator('img[data-retreat-loaded]').first().evaluate(n=>getComputedStyle(n.parentElement.querySelector('.media-watermark')).visibility);
 assert.equal(visible,'visible');
 console.log('PASS Farm Retreat: decoded image restores watermark');
}finally{await browser.close();}
