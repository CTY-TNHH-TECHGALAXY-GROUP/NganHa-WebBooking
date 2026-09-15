import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const dir = 'plans/pagespeed-remediation-20260913/remaining/agent-d/final-20260916';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3460';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw Error('loopback only');
await fs.mkdir(dir,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const browser=await chromium.launch({headless:true});
const rows=[];
for(const locale of ['vi','en','cn','jp','kr']) {
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 const page=await context.newPage();
 const cdp=await context.newCDPSession(page); await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto(`${base}/${locale}`,{waitUntil:'domcontentloaded',timeout:60000});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 const consumers=await page.evaluate(()=>[...document.querySelectorAll('h1,h2,h3,button,p')].filter(e=>e.getBoundingClientRect().width>0 && e.textContent.trim()).slice(0,60).map((e,i)=>{e.setAttribute('data-final-font-probe',i);const s=getComputedStyle(e);return {id:i,text:e.textContent.trim().slice(0,120),family:s.fontFamily,weight:s.fontWeight,size:s.fontSize};}));
 const doc=await cdp.send('DOM.getDocument');
 for(const item of consumers){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:`[data-final-font-probe="${item.id}"]`});item.platformFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;}
 const state=await page.evaluate(()=>({dimensions:[innerWidth,innerHeight,devicePixelRatio],faces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),fonts:performance.getEntriesByType('resource').filter(e=>/\.(woff2?|ttf|otf)(\?|$)/.test(e.name)).map(e=>({url:e.name,transferSize:e.transferSize})),viewport:document.querySelector('meta[name=viewport]')?.content}));
 await page.screenshot({path:path.join(dir,`${locale}-390.png`)});
 const reflow=[];
 for(const viewport of [{width:320,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.waitForTimeout(300);reflow.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,visibleControls:[...document.querySelectorAll('button,a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0}).map(e=>({text:(e.getAttribute('aria-label')||e.textContent).trim().slice(0,100),box:JSON.parse(JSON.stringify(e.getBoundingClientRect()))}))})));await page.screenshot({path:path.join(dir,`${locale}-${viewport.width}.png`)});}
 rows.push({locale,http:res.status(),state,consumers,reflow,errors});await context.close();
}
const inventory=[];
for(const name of await fs.readdir('public/fonts')){const data=await fs.readFile(`public/fonts/${name}`);inventory.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),license:'NOT_VERIFIED: no accompanying license file in repository'});}
const report={testedSha:sha,buildId:(await fs.readFile('.next/BUILD_ID','utf8')).trim(),timestamp:new Date().toISOString(),browser:await browser.version(),base,profile:{viewport:[390,844],dpr:2,cache:'new context per locale'},rows,inventory,limitations:{zoom:'Viewport resize is reflow/orientation evidence, not browser zoom or physical pinch.',license:'Embedded copyright metadata does not establish user redistribution/conversion rights.',fouc:'No first-paint filmstrip collected.',contrast:'This font consumer probe does not adjudicate gradient/pseudo-element contrast.'}};
await fs.writeFile(path.join(dir,'font-consumers.json'),JSON.stringify(report,null,2)+'\n');
const files=await fs.readdir(dir);const artifacts=[];for(const file of files){const b=await fs.readFile(path.join(dir,file));artifacts.push({file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await fs.writeFile(path.join(dir,'evidence-index.json'),JSON.stringify({testedSha:sha,artifacts},null,2)+'\n');
await browser.close();console.log(JSON.stringify({sha,routes:rows.map(r=>({locale:r.locale,http:r.http,overflows:r.reflow.map(x=>x.overflow),errors:r.errors}))},null,2));
if(rows.some(r=>r.http!==200||r.errors.length||r.reflow.some(x=>x.overflow)))process.exitCode=1;
