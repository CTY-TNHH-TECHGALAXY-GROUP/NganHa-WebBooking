import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:3460';
const dir = process.env.HERO_EVIDENCE_DIR || 'plans/pagespeed-remediation-20260913/remaining/agent-media-runtime/matched-20260916';
fs.mkdirSync(dir, { recursive: true });
const config = JSON.parse(fs.readFileSync('plans/pagespeed-remediation-20260913/remaining/agent-media-runtime/marketing-config-20260916/candidate.json'))[0];
const html = await (await fetch(base + '/en')).text();
assert.ok(html.includes(config.mobile_url) && html.includes(config.desktop_url), 'HTML must contain published Hero config');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const report = { status: 'RUNNING', testedSha: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), buildId: fs.readFileSync('.next/BUILD_ID','utf8').trim(), configHash:sha(JSON.stringify(config)), htmlHash:sha(html), method:'Same frozen production app HTML; baseline replaces both rendition URLs with canonical original. Real app component attaches source; no rewritten selection algorithm. Cold contexts. 12s from first Hero media request. CDP dataReceived captures unfinished transfer. Direct Storage requests.', runs: [] };
const save=()=>fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true});
report.browser=browser.version();
try {
for(const profile of [{name:'mobile',width:390,height:844,dpr:2,mobile:true},{name:'desktop',width:1440,height:900,dpr:1,mobile:false}]) {
for(let repeat=1;repeat<=3;repeat++) for(const variant of ['baseline','candidate']) {
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,isMobile:profile.mobile,hasTouch:profile.mobile});
 const page=await context.newPage();
 await page.route(base+'/en',route=>route.fulfill({status:200,contentType:'text/html',body:variant==='baseline'?html.replaceAll(config.mobile_url,config.url).replaceAll(config.desktop_url,config.url):html}));
 const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:1250000,uploadThroughput:625000});
 const requests=new Map(); let first=null; let end=null;
 const expected=variant==='baseline'?config.url:profile.mobile?config.mobile_url:config.desktop_url;
 const isHero=url=>[config.url,config.mobile_url,config.desktop_url].includes(url);
 cdp.on('Network.requestWillBeSent',e=>{if(isHero(e.request.url)){first??=performance.now();requests.set(e.requestId,{id:e.requestId,url:e.request.url,range:e.request.headers.Range||null,start:e.timestamp,received:0,finished:false});}});
 cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r){r.status=e.response.status;r.mime=e.response.mimeType;r.contentRange=e.response.headers['content-range']||e.response.headers['Content-Range'];}});
 cdp.on('Network.dataReceived',e=>{const r=requests.get(e.requestId);if(r&&(!end||performance.now()<=end))r.received+=e.encodedDataLength;});
 cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r&&(!end||performance.now()<=end)){r.finished=true;r.total=e.encodedDataLength;}});
 cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)r.failure=e.errorText;});
 try {
 await page.goto(base+'/en',{waitUntil:'domcontentloaded',timeout:45000});
 const deadline=performance.now()+45000;
 while(first===null&&performance.now()<deadline)await new Promise(r=>setTimeout(r,100));
 assert.notEqual(first,null,'No Hero request'); end=first+12000;
 await new Promise(r=>setTimeout(r,Math.max(0,end-performance.now())));
 const ledger=[...requests.values()].map(r=>({...r,transferred:r.finished?r.total:r.received}));
 const state=await page.locator('video').evaluateAll(videos=>videos.map(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,time:v.currentTime,paused:v.paused,error:v.error?.code||null})));
 assert.deepEqual([...new Set(ledger.map(r=>r.url))],[expected]);
 assert.ok(state.some(v=>v.src===expected&&v.width>0&&v.error===null),'Hero decode');
 report.runs.push({profile,repeat,variant,windowMs:12000,cpu:4,latencyMs:40,downloadBytesPerSecond:1250000,ledger,state,transferBytes:ledger.reduce((s,r)=>s+r.transferred,0),status:'PASS_CAPTURE'});
 }catch(error){report.runs.push({profile,repeat,variant,status:'FAIL',error:String(error),ledger:[...requests.values()]});}
 save(); console.log(profile.name,repeat,variant,report.runs.at(-1).status,report.runs.at(-1).transferBytes);
 await context.close();
}}
 const median=a=>a.sort((x,y)=>x-y)[1];
 report.summary=['mobile','desktop'].map(profile=>{const pick=variant=>report.runs.filter(r=>r.profile.name===profile&&r.variant===variant&&r.status==='PASS_CAPTURE').map(r=>r.transferBytes);const b=pick('baseline'),c=pick('candidate');const reduction=b.length===3&&c.length===3?1-median(c)/median(b):null;return {profile,baseline:b,candidate:c,reduction,pass:reduction!==null&&reduction>=0.7};});
 report.status=report.summary.every(r=>r.pass)?'PASS_MATCHED_TRANSFER':'FAIL_MATCHED_TRANSFER';save();if(report.status!=='PASS_MATCHED_TRANSFER')process.exitCode=1;
}finally{await browser.close();}
