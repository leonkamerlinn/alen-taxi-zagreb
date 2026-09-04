/**
 * Builds the inline <head> boot script for early Fingerprint identification.
 * Must stay in sync with composables/usePageContext.ts (ad gate + fresh nav)
 * and utils/fingerprint-ingest.ts (beacon / keepalive delivery).
 *
 * Two-stage delivery so no ad click is ever lost:
 *  1. postClick() — instant click-ping to ClickShield (~0.2s after HTML,
 *     text/plain sendBeacon → CORS-safelisted, no preflight; survives an
 *     immediate tab close). Registers the click with UA/IP-level device info.
 *  2. Fingerprint identify → postIngest() with the requestId. If the visitor
 *     bounces before the response, the ClickShield webhook still receives the
 *     event server-side and reconciles it with the click-ping.
 */

export interface EarlyFpConfig {
  apiKey: string
  region: string
  endpoint: string
  scriptUrlPattern: string
  ingestUrl: string
}

/** JSON-safe config embedding for the classic inline script. */
export function buildEarlyFingerprintScript(cfg: EarlyFpConfig): string {
  const configJson = JSON.stringify(cfg)
  // Classic IIFE — runs as soon as the parser hits it, before Nuxt hydrates.
  // Dynamic import() starts the agent download immediately.
  return `(function(){
var C=${configJson};
if(!C.apiKey||window.__csFpPromise)return;
var p=new URLSearchParams(location.search);
var CLICK_ID_KEYS=["gclid","wbraid","gbraid"];
var PAID_MEDIUMS=["cpc","ppc","paid","paidsearch","paid-search"];
var isAd=false,clickId=null,i,v,src,med;
for(i=0;i<CLICK_ID_KEYS.length;i++){v=p.get(CLICK_ID_KEYS[i]);if(v){isAd=true;clickId=v;break;}}
if(!isAd&&p.get("gad_source"))isAd=true;
if(!isAd){src=(p.get("utm_source")||"").toLowerCase();med=(p.get("utm_medium")||"").toLowerCase();if(src==="google"&&PAID_MEDIUMS.indexOf(med)>=0)isAd=true;}
if(!isAd)return;
try{var nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(nav&&nav.type!=="navigate")return;}catch(e){}
var TOKEN_KEY="cs_device_token";
function deviceToken(){try{var t=localStorage.getItem(TOKEN_KEY);if(!t){t=crypto.randomUUID();localStorage.setItem(TOKEN_KEY,t);}return t;}catch(e){return crypto.randomUUID();}}
function postIngest(requestId,gclid){if(!C.ingestUrl)return;var url=C.ingestUrl.replace(/\\/$/,"")+"/api/fingerprint/ingest";var body=JSON.stringify(gclid?{requestId:requestId,gclid:gclid}:{requestId:requestId});try{if(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([body],{type:"application/json"})))return;}catch(e){}fetch(url,{method:"POST",headers:{"content-type":"application/json"},credentials:"omit",body:body,keepalive:true}).catch(function(){});}
function postClick(){if(!C.ingestUrl)return;var url=C.ingestUrl.replace(/\\/$/,"")+"/api/fingerprint/click";var body=JSON.stringify({gclid:clickId||undefined,deviceToken:deviceToken(),path:location.pathname+location.search,referrer:document.referrer||undefined,lang:navigator.language||undefined});try{if(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([body],{type:"text/plain"})))return;}catch(e){}fetch(url,{method:"POST",headers:{"content-type":"text/plain"},credentials:"omit",body:body,keepalive:true}).catch(function(){});}
postClick();
var UTM_KEYS=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
var utm={},k,uv;for(i=0;i<UTM_KEYS.length;i++){k=UTM_KEYS[i];uv=p.get(k);if(uv)utm[k.replace("utm_","")]=uv;}
var tag={path:location.pathname+location.search,referrer:document.referrer||null,utm:utm,lang:navigator.language||null,gclid:clickId};
var opts={apiKey:C.apiKey,region:C.region||"eu"};
if(C.endpoint)opts.endpoint=C.endpoint;
if(C.scriptUrlPattern)opts.scriptUrlPattern=C.scriptUrlPattern;
window.__csFpPromise=import("https://fpjscdn.net/v3/"+encodeURIComponent(C.apiKey)).then(function(FP){return FP.load(opts);}).then(function(fp){return fp.get({tag:tag,linkedId:deviceToken()});}).then(function(r){postIngest(r.requestId,clickId);return r;}).catch(function(){return null;});
})();`
}
