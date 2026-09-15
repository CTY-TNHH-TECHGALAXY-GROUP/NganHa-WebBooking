#!/usr/bin/env node
// Runs the actual migration CLI against real PostgreSQL and an explicit loopback Storage/PostgREST fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import pg from 'pg';
import sharp from 'sharp';

const root = process.cwd();
const sha = execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim();
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const evidence = path.resolve(process.argv.find(a=>a.startsWith('--evidence='))?.split('=').slice(1).join('=') || `plans/pagespeed-remediation-20260913/remaining/agent-b/recovery-20260916/${stamp}`);
const backupDir = path.join(os.homedir(), 'Library', 'Application Support', 'NganHa-PageSpeed', 'recovery-fixture-backups', stamp);
const url = new URL(process.env.PAGESPEED_TEST_DATABASE_URL || 'postgresql://postgres:pagespeed-local-only@127.0.0.1:55432/postgres');
assert.equal(url.hostname,'127.0.0.1');
const dbName = `ps_recovery_${crypto.randomBytes(6).toString('hex')}`;
const admin = new pg.Client({connectionString:url.href});
await admin.connect();
await admin.query(`CREATE DATABASE ${dbName}`);
url.pathname = `/${dbName}`;
const db = new pg.Client({connectionString:url.href});
await db.connect();
for (const role of ['service_role','anon','authenticated']) {
 if (!(await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[role])).rowCount) await admin.query(`CREATE ROLE ${role} NOLOGIN`);
}
await db.query('CREATE TABLE public."SystemConfigs" (id BIGSERIAL PRIMARY KEY,key TEXT UNIQUE NOT NULL,value JSONB NOT NULL,updated_at TIMESTAMPTZ DEFAULT now()); GRANT SELECT,INSERT,UPDATE ON public."SystemConfigs" TO service_role; GRANT USAGE,SELECT ON SEQUENCE public."SystemConfigs_id_seq" TO service_role;');
await db.query(fs.readFileSync(path.join(root,'supabase/migrations/20260914_system_configs_jsonb_cas.sql'),'utf8'));
fs.mkdirSync(evidence,{recursive:true});
let fault = null, child, uploads = new Map(), sourceWidth = 1000, casCalls = 0;
const images = new Map();
for (const width of [1000,100]) images.set(width, await sharp({create:{width,height:80,channels:3,background:'#a36943'}}).png().toBuffer());
const server = http.createServer(async(req,res)=>{
  try {
    const reqUrl = new URL(req.url,'http://localhost');
    const body = []; for await (const chunk of req) body.push(chunk);
    const bytes = Buffer.concat(body);
    const json = value=>{res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(value));};
    if(reqUrl.pathname === '/fixture.png') {res.setHeader('Content-Type','image/png');res.end(images.get(sourceWidth));return;}
    if(reqUrl.pathname === '/rest/v1/SystemConfigs') {json((await db.query('SELECT * FROM "SystemConfigs"')).rows);return;}
    if(reqUrl.pathname.startsWith('/rest/v1/rpc/')) {
      casCalls++;
      const p=JSON.parse(bytes);
      if(fault === 'admin-conflict') {await db.query('UPDATE "SystemConfigs" SET value=value || $1::jsonb',[JSON.stringify({adminEdit:'preserved'})]);fault=null;}
      const result = await db.query('SELECT * FROM webbooking_compare_and_swap_system_config($1,$2,$3::jsonb,$4::jsonb)',[p.p_key,p.p_expected_exists,JSON.stringify(p.p_expected_value),JSON.stringify(p.p_next_value)]);
      if(fault === 'crash-after-cas') {fault=null;child.kill('SIGKILL');res.destroy();return;}
      if(fault === 'cas-response-invalid') {fault=null;json(result.rows.map(r=>({...r,value:{unexpected:true}})));return;}
      json(result.rows);return;
    }
    const publicPrefix='/storage/v1/object/public/media-uploads/';
    const writePrefix='/storage/v1/object/media-uploads/';
    if(reqUrl.pathname.startsWith(publicPrefix)) {
      const key=decodeURIComponent(reqUrl.pathname.slice(publicPrefix.length));
      if(fault === 'verify-fail') {res.statusCode=500;res.end('injected verify failure');return;}
      const object=uploads.get(key);if(!object){res.statusCode=404;res.end();return;}
      res.setHeader('Content-Type','image/webp');res.setHeader('Cache-Control','public,max-age=31536000,immutable');res.end(req.method==='HEAD'?undefined:object);return;
    }
    if(reqUrl.pathname.startsWith(writePrefix)) {
      const key=decodeURIComponent(reqUrl.pathname.slice(writePrefix.length));
      if(fault === 'upload-fail') {res.statusCode=500;json({message:'injected upload failure'});return;}
      uploads.set(key,bytes);
      if(fault === 'crash-after-upload') {fault=null;child.kill('SIGKILL');res.destroy();return;}
      json({Key:`media-uploads/${key}`});return;
    }
    res.statusCode=404;json({message:'unknown fixture route'});
  }catch(error){res.statusCode=500;res.end(JSON.stringify({message:error.message}));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const baseline=()=>({chapters:[{scenes:[{image:`${origin}/fixture.png`,title:'keep title'}]}],unrelated:'original'});
async function reset(value=baseline()) {uploads=new Map();fault=null;sourceWidth=1000;await db.query('TRUNCATE "SystemConfigs"');await db.query('INSERT INTO "SystemConfigs" (key,value) VALUES ($1,$2::jsonb)',['brand_history',JSON.stringify(value)]);}
async function read(){return (await db.query('SELECT value FROM "SystemConfigs" WHERE key=$1',['brand_history'])).rows[0].value;}
const runs=[];
async function cli(name,mode='apply',release) {
 const runDir=path.join(evidence,name);
 const args=['scripts/migrate-pagespeed-renditions.mjs',`--mode=${mode}`,'--config=brand_history',`--run-id=recovery-${name}-${stamp}`,`--run-dir=${runDir}`,`--backup-dir=${backupDir}`];
 if(release)args.push(`--release-manifest=${release}`);
 let stdout='',stderr='';
 child=spawn(process.execPath,args,{cwd:root,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:origin,SUPABASE_SERVICE_ROLE_KEY:'fixture-service-role-key'}});
 child.stdout.on('data',data=>stdout+=data);child.stderr.on('data',data=>stderr+=data);
 const result=await new Promise(resolve=>child.on('close',(code,signal)=>resolve({code,signal})));
 fs.mkdirSync(runDir,{recursive:true});fs.writeFileSync(path.join(runDir,'process.json'),JSON.stringify({args,...result,stdout,stderr},null,2));
 const manifest=path.join(runDir,'manifest.json');
 runs.push({name,...result});return {...result,manifest,data:fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest)):null};
}
const checks=[];
async function check(name,fn){try{await fn();checks.push({name,status:'PASS'});}catch(error){checks.push({name,status:'FAIL',message:error.message});}console.log(JSON.stringify(checks.at(-1)));}
try {
 await check('apply-rollback-preserves-unrelated-edits',async()=>{await reset();const a=await cli('success');assert.equal(a.code,0);await db.query('UPDATE "SystemConfigs" SET value=value || $1::jsonb',[JSON.stringify({adminEdit:'preserved'})]);const r=await cli('rollback','rollback',a.manifest);assert.equal(r.code,0);assert.equal((await read()).adminEdit,'preserved');assert.equal((await read()).chapters[0].scenes[0].image,baseline().chapters[0].scenes[0].image);const twice=await cli('rollback-twice','rollback',a.manifest);assert.equal(twice.code,0,'second rollback must reconcile already-restored state');});
 for(const injected of ['upload-fail','verify-fail','admin-conflict']) await check(injected,async()=>{await reset();fault=injected;const a=await cli(injected);assert.notEqual(a.code,0);const v=await read();assert.equal(v.chapters[0].scenes[0].responsiveSources,undefined);if(injected==='admin-conflict')assert.equal(v.adminEdit,'preserved');});
 for(const injected of ['crash-after-upload','crash-after-cas','cas-response-invalid']) await check(`${injected}-recovery`,async()=>{await reset();fault=injected;const a=await cli(injected);assert.notEqual(a.code,0);fault=null;const resumed=await cli(`${injected}-resume`,'resume',a.manifest);assert.equal(resumed.code,0,'new process must resume preserved release');const r=await cli(`${injected}-rollback`,'rollback',resumed.manifest);assert.equal(r.code,0);assert.equal((await read()).chapters[0].scenes[0].responsiveSourceImage,undefined);});
 await check('small-source-deduplicated-width-rollback',async()=>{await reset();sourceWidth=100;const a=await cli('small');assert.equal(a.code,0);assert.equal(a.data.renditionEntries[0].renditions.length,1);const r=await cli('small-rollback','rollback',a.manifest);assert.equal(r.code,0);});
 await check('stale-map-not-relabelled-new-source',async()=>{const b=baseline();b.chapters[0].scenes[0].responsiveSources={'64':'https://fixture.invalid/old.webp'};b.chapters[0].scenes[0].responsiveSourceImage='https://fixture.invalid/old.png';await reset(b);const a=await cli('stale-map');assert.equal(a.code,0);assert.equal((await read()).chapters[0].scenes[0].responsiveSources['64'],undefined);const r=await cli('stale-map-rollback','rollback',a.manifest);assert.equal(r.code,0);assert.deepEqual((await read()).chapters[0].scenes[0],b.chapters[0].scenes[0]);});
 await check('rerun-idempotent-independent-manifest',async()=>{await reset();const a=await cli('rerun-first');assert.equal(a.code,0);const b=await cli('rerun-second');assert.equal(b.code,0);const r=await cli('rerun-second-rollback','rollback',b.manifest);assert.equal(r.code,0);const r1=await cli('rerun-first-rollback','rollback',a.manifest);assert.equal(r1.code,0);});
 await check('private-backup-durable-permissions-readback',async()=>{assert(!backupDir.startsWith('/private/tmp'));const run=fs.readdirSync(backupDir)[0];const file=path.join(backupDir,run,'brand_history-backup.json');assert.equal(fs.statSync(file).mode & 0o777,0o600);assert.equal(fs.statSync(path.dirname(file)).mode & 0o777,0o700);assert.equal(JSON.parse(fs.readFileSync(file)).key,'brand_history');});
} finally {
 const report={testedSha:sha,migrationSha256:crypto.createHash('sha256').update(fs.readFileSync('scripts/migrate-pagespeed-renditions.mjs')).digest('hex'),startedAt:stamp,finishedAt:new Date().toISOString(),database:{type:'real PostgreSQL',version:(await db.query('SELECT version()')).rows[0].version,disposableDatabase:dbName},storage:{type:'explicit loopback HTTP fixture',productionWrites:0},backupDir,casCalls,checks,runs,status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL'};
 fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify(report,null,2));
 await new Promise(resolve=>server.close(resolve));await db.end();await admin.query(`DROP DATABASE ${dbName}`);await admin.end();
 process.exitCode=report.status==='PASS'?0:1;
}
