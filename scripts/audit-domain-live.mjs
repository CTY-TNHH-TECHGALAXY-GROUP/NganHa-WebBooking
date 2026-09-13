import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const origin = 'https://oria-spa.vercel.app';
const old = /(?:nganha|ngan-ha-web-booking|oriaspa)\.vercel\.app|nganhaspa\.vn/gi;
const get = url => fetch(url, {signal:AbortSignal.timeout(45000)});
const sitemap = await (await get(origin+'/sitemap.xml')).text();
const robots = await (await get(origin+'/robots.txt')).text();
const urls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
for (const file of walk('src/app').filter(f=>f.endsWith('/page.tsx')&&!f.includes('/admin/'))) {
  let path=file.slice('src/app'.length,-'/page.tsx'.length)||'/';
  if(path.includes('[packageSlug]')) continue; // Published package slugs come from sitemap.
  path=path.replace('[menuType]','standard');
  for (const lang of path.includes('[lang]')?['vi','en','cn','jp','kr']:['']) urls.add(origin+path.replace('[lang]',lang));
}
const results=[];
const list=[...urls];
for(let i=0;i<list.length;i+=6) {
  await Promise.all(list.slice(i,i+6).map(async url=>{
    try {
      const r=await get(url); const html=await r.text(); const dom=new JSDOM(html); const d=dom.window.document;
      const canonical=[...d.querySelectorAll('link[rel="canonical"]')].map(x=>x.href);
      const og=[...d.querySelectorAll('meta[property="og:url"]')].map(x=>x.content);
      const languages=[...d.querySelectorAll('link[hreflang]')].map(x=>({lang:x.hreflang,url:x.href}));
      const issues=[];
      if(r.status!==200) issues.push('HTTP '+r.status);
      if(canonical.length!==1) issues.push('canonical count');
      if(canonical.some(x=>new URL(x).origin!==origin)) issues.push('canonical origin');
      if(canonical.length===1 && new URL(canonical[0]).pathname.replace(/\/$/,'')!==new URL(r.url).pathname.replace(/\/$/,'')) issues.push('canonical path differs from final route');
      if(og.length!==1||!canonical[0]||new URL(og[0]).href!==new URL(canonical[0]).href) issues.push('og mismatch');
      if(languages.some(x=>new URL(x.url).origin!==origin)) issues.push('hreflang origin');
      const oldHosts=[...new Set(html.match(old)||[])]; if(oldHosts.length) issues.push('legacy host');
      results.push({url,finalUrl:r.url,status:r.status,canonical,og,languages,robots:d.querySelector('meta[name="robots"]')?.content,oldHosts,issues});
      dom.window.close();
    } catch(e){results.push({url,issues:[e.message]});}
  }));
  console.log(`Audited ${results.length}/${list.length}`);
}
const aliases=[];
for(const host of ['nganha.vercel.app','ngan-ha-web-booking.vercel.app','oriaspa.vercel.app','nganhaspa.vn']) {
  try {const r=await fetch('https://'+host,{redirect:'manual',signal:AbortSignal.timeout(15000)});aliases.push({host,status:r.status,location:r.headers.get('location')});}catch(e){aliases.push({host,error:e.cause?.code||e.message});}
}
const report={at:new Date().toISOString(),count:results.length,robots,sitemapUrls:[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),aliases,failures:results.filter(r=>r.issues.length),results};
fs.writeFileSync('plans/domain-canonical-20260913/final-live-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({count:report.count,aliases,failures:report.failures},null,2));
