/**
 * Builds the inline <head> boot script for early Fingerprint identification.
 * Must stay in sync with composables/usePageContext.ts (ad gate,
 * getNavigationType/shouldIdentify) and utils/fingerprint-ingest.ts (beacon
 * delivery, device token). The generated code is ES5 (old WebViews run it).
 *
 * Order of side effects on an ad-marked document:
 *  1. postClick(navType) — the instant click-ping, FIRST, before any gate and
 *     before the agent import (text/plain sendBeacon → no preflight; survives
 *     an immediate tab close). Every document gets one, tagged with its
 *     navigation type (navigate | prerender | back_forward | reload | unknown);
 *     a later bfcache restore sends another tagged `bfcache` from `pageshow`.
 *     ClickShield counts only the fresh ones as ad clicks.
 *  2. Identification (billed) — only for a genuine new entry (not back/forward
 *     or reload): import the agent, fp.get({ timeout: 5000 }), then
 *     postIngest(requestId). If the visitor bounces first, the ClickShield
 *     webhook still receives the event server-side.
 * A prerendered document (Chrome speculation rules) defers everything to
 * activation — no ping and no billed identify before the actual tap.
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
  // `<` → < so an env value can never close the <script> tag early.
  const configJson = JSON.stringify(cfg).replace(/</g, '\\u003c')
  // Classic IIFE — runs as soon as the parser hits it, before Nuxt hydrates.
  // Dynamic import() starts the agent download immediately.
  return `(function(){
var C=${configJson};
if(!C.apiKey||window.__csFpBoot)return;window.__csFpBoot=1;
var p=new URLSearchParams(location.search);
var CLICK_ID_KEYS=["gclid","wbraid","gbraid"];
var PAID_MEDIUMS=["cpc","ppc","paid","paidsearch","paid-search"];
var isAd=false,clickId=null,i,v,src,med;
for(i=0;i<CLICK_ID_KEYS.length;i++){v=p.get(CLICK_ID_KEYS[i]);if(v){isAd=true;clickId=v;break;}}
if(!isAd&&p.get("gad_source"))isAd=true;
if(!isAd){src=(p.get("utm_source")||"").toLowerCase();med=(p.get("utm_medium")||"").toLowerCase();if(src==="google"&&PAID_MEDIUMS.indexOf(med)>=0)isAd=true;}
if(!isAd)return;
var navType="unknown";
try{var nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(nav&&(nav.type==="navigate"||nav.type==="back_forward"||nav.type==="reload"))navType=nav.type;}catch(e){}
function uuid(){try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}var b=[],j;try{b=Array.prototype.slice.call(crypto.getRandomValues(new Uint8Array(16)));}catch(e){for(j=0;j<16;j++)b[j]=Math.floor(Math.random()*256);}b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var h="";for(j=0;j<16;j++){h+=(b[j]<16?"0":"")+b[j].toString(16);if(j===3||j===5||j===7||j===9)h+="-";}return h;}
var TOKEN_KEY="cs_device_token",tok=null;
function deviceToken(){if(tok)return tok;try{tok=localStorage.getItem(TOKEN_KEY);}catch(e){}if(!tok){tok=uuid();try{localStorage.setItem(TOKEN_KEY,tok);}catch(e){}}return tok;}
function beacon(path,obj,type){if(!C.ingestUrl)return;var url=C.ingestUrl.replace(/\\/$/,"")+path,body=JSON.stringify(obj);try{if(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([body],{type:type})))return;}catch(e){}try{fetch(url,{method:"POST",headers:{"content-type":type},credentials:"omit",body:body,keepalive:true}).catch(function(){});}catch(e){}}
function postClick(t){try{beacon("/api/fingerprint/click",{gclid:clickId||undefined,deviceToken:deviceToken(),path:location.pathname+location.search,referrer:document.referrer||undefined,lang:navigator.language||undefined,navigationType:t},"text/plain");}catch(e){}}
function postIngest(requestId){var b={requestId:requestId,deviceToken:deviceToken()};if(clickId)b.gclid=clickId;beacon("/api/fingerprint/ingest",b,"text/plain");}
function start(){
postClick(navType);window.__csClickPinged=1;
try{addEventListener("pageshow",function(e){if(e.persisted)postClick("bfcache");});}catch(e){}
if(navType==="back_forward"||navType==="reload")return;
var UTM_KEYS=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
var utm={},k,uv,q;for(q=0;q<UTM_KEYS.length;q++){k=UTM_KEYS[q];uv=p.get(k);if(uv)utm[k.replace("utm_","")]=uv;}
var tag={path:location.pathname+location.search,referrer:document.referrer||null,utm:utm,lang:navigator.language||null,gclid:clickId};
var opts={apiKey:C.apiKey,region:C.region||"eu"};
if(C.endpoint)opts.endpoint=C.endpoint;
if(C.scriptUrlPattern)opts.scriptUrlPattern=C.scriptUrlPattern;
window.__csFpPromise=import("https://fpjscdn.net/v3/"+encodeURIComponent(C.apiKey)).then(function(FP){return FP.load(opts);}).then(function(fp){return fp.get({tag:tag,linkedId:deviceToken(),timeout:5000});}).then(function(r){postIngest(r.requestId);return r;}).catch(function(){return null;});
}
if(document.prerendering){navType="prerender";document.addEventListener("prerenderingchange",start,{once:true});}else start();
})();`
}
