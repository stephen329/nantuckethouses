"use client";

import Script from "next/script";

const APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "dmsxc7rs";

/**
 * Intercom’s widget loader expects a <script> node to insert before; on some
 * Next.js/App Router timings that node may not exist yet and the stock npm
 * SDK throws before the widget loads. This mirrors Intercom’s web snippet with
 * a safe fallback to append the widget script to <head>.
 */
const INTERCOM_BOOT_JS = `
(function(){
  var w=window;
  var APP_ID=${JSON.stringify(APP_ID)};
  w.intercomSettings=Object.assign({}, w.intercomSettings||{}, { app_id: APP_ID });
  var ic=w.Intercom;
  if(typeof ic==="function"){
    ic("reattach_activator");
    ic("update", w.intercomSettings);
    return;
  }
  var d=document;
  var i=function(){ i.c(arguments); };
  i.q=[]; i.c=function(args){ i.q.push(args); };
  w.Intercom=i;
  function load(){
    var s=d.createElement("script");
    s.type="text/javascript";
    s.async=true;
    s.src="https://widget.intercom.io/widget/"+APP_ID;
    var x=d.getElementsByTagName("script")[0];
    if(x&&x.parentNode){ x.parentNode.insertBefore(s,x); }
    else { (d.head||d.documentElement).appendChild(s); }
  }
  if(d.readyState==="complete") load();
  else if(w.attachEvent) w.attachEvent("onload", load);
  else w.addEventListener("load", load, false);
})();
`.trim();

export function IntercomBoot() {
  return (
    <Script id="intercom-boot" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: INTERCOM_BOOT_JS }} />
  );
}
