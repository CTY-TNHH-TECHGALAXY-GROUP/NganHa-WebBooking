import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const {default:lighthouse}=await import('/private/tmp/pagespeed-postgres.TExjLR/node_modules/lighthouse/core/index.js');
const {default:desktopConfig}=await import('/private/tmp/pagespeed-postgres.TExjLR/node_modules/lighthouse/core/config/desktop-config.js');
const dir='plans/pagespeed-remediation-20260913/remaining/agent-q/lighthouse-final-20260916';
fs.mkdirSync(dir,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const profile='/private/tmp/pagespeed-lighthouse-browser';
const browser=await chromium.launchPersistentContext(profile,{headless:true,args:['--remote-debugging-port=9224']});
const results=[];
try {for(const name of ['mobile','desktop']) for(let i=1;i<=3;i++) {
 const result=await lighthouse('http://127.0.0.1:3460/en',{port:9224,output:'json',logLevel:'error',onlyCategories:['performance']},name==='desktop'?desktopConfig:undefined);
 fs.writeFileSync(`${dir}/${name}-${i}.json`,JSON.stringify(result.lhr,null,2));
 const a=result.lhr.audits;
 results.push({name,run:i,TBT:a['total-blocking-time'].numericValue,LCP:a['largest-contentful-paint'].numericValue,CLS:a['cumulative-layout-shift'].numericValue,score:result.lhr.categories.performance.score,error:result.lhr.runtimeError||null});
 console.log(JSON.stringify(results.at(-1)));
 fs.writeFileSync(`${dir}/summary.json`,JSON.stringify({testedSha:sha,buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),results},null,2));
}}finally{await browser.close();}
