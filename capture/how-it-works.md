# How it works

Deep mode: what the site's JavaScript is made of and what its start page did while we watched.

## Its JavaScript

Analysed 29 script(s) from https://sendflow.com.br/: 24 module(s), 113 endpoint(s), 19 route(s), bundled with vite.

Evidence ev_2470bd5f2d3e401e3c19bb2fb5a598896a17b17b6251476e350aeddd0222e099.

```json
{
  "api_operations": [],
  "app_kind": "web",
  "bundlers": [
    "vite"
  ],
  "edges": [
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#document:visibilitychange",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#document.addEventListener(visibilitychange)@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#n:error",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#r@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#n:load",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#n.onload@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#o:click",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#n@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#o:error",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#o.onerror@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:beforeunload",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window.addEventListener(beforeunload)@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:load",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#e@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:load",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window.addEventListener(load)@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:message",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#o@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:pagehide",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window.addEventListener(pagehide)@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:pageshow",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window.addEventListener(pageshow)@1"
    },
    {
      "from": "event:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#window:popstate",
      "kind": "handled-by",
      "to": "fn:analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js#e@1"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#e:message",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#L@24"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#e:pagehide",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#e.addEventListener(pagehide)@240"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#e:pageshow",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#e.addEventListener(pageshow)@338"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#e:popstate",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#l@24"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#t:visibilitychange",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#t.addEventListener(visibilitychange)@240"
    },
    {
      "from": "event:connect.facebook.net/en_US/fbevents.js#u:load",
      "kind": "handled-by",
      "to": "fn:connect.facebook.net/en_US/fbevents.js#u.onload@420"
    },
    {
      "from": "event:scripts.clarity.ms/0.8.75/clarity.js#i:message",
      "kind": "handled-by",
      "to": "fn:scripts.clarity.ms/0.8.75/clarity.js#i.onmessage@2"
    },
    {
      "from": "event:scripts.clarity.ms/0.8.75/clarity.js#n:error",
      "kind": "handled-by",
      "to": "fn:scripts.clarity.ms/0.8.75/clarity.js#n.onerror@2"
    },
    {
      "from": "event:scripts.clarity.ms/0.8.75/clarity.js#n:load",
      "kind": "handled-by",
      "to": "fn:scripts.clarity.ms/0.8.75/clarity.js#n.onload@2"
    },
    {
      "from": "event:scripts.clarity.ms/0.8.75/clarity.js#o:readystatechange",
      "kind": "handled-by",
      "to": "fn:scripts.clarity.ms/0.8.75/clarity.js#o.onreadystatechange@2"
    },
    {
      "from": "event:scripts.clarity.ms/0.8.75/clarity.js#o:timeout",
      "kind": "handled-by",
      "to": "fn:scripts.clarity.ms/0.8.75/clarity.js#o.ontimeout@2"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:blur",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(blur)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:click",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(click)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#Jr@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(error)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:focus",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(focus)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:hashchange",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(hashchange)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:pagehide",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(pagehide)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:pageshow",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(pageshow)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:pointerdown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(pointerdown)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:popstate",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(popstate)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c:unhandledrejection",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#c.addEventListener(unhandledrejection)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#m:prerenderingchange",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#V@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#m:visibilitychange",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#m.addEventListener(visibilitychange)@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#t:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#t.onerror@1"
    },
    {
      "from": "event:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#t:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/__l5e/events.270c78a44fc53e7b.js#t.onload@1"
    },
    {
      "from": "event:sendflow.com.br/assets/SendFlowLanding-TponC9zD.js#r.useRef().current:scroll",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/SendFlowLanding-TponC9zD.js#o@6"
    },
    {
      "from": "event:sendflow.com.br/assets/SendFlowLanding-TponC9zD.js#window:resize",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/SendFlowLanding-TponC9zD.js#c@6"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#$:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#j@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#$:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#N@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:focusin",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#_@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:focusout",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#B@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:keydown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#T@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:pointerleave",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#P@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:pointermove",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#_@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:resize",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#a@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#A:scroll",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#a@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#E:keydown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#k@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#G.port1:message",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#k@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#M:toast.viewportPause",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#ee@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#M:toast.viewportResume",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#q@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#Y:change",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#k@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#a.trigger:pointerleave",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#E@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#a:abort",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#g@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#b:pointerleave",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#S@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:dismissableLayer.update",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#F@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:dismissableLayer.update",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#R@86"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:focusin",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#S@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:focusout",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#C@86"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#A@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:keydown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#S@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:mousedown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#E@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:pointermove",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#E@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:pointerup",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#y@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:scroll",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#document.addEventListener(scroll)@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:tooltip.open",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#b@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:touchmove",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#g@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:touchstart",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#b@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#document:wheel",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#g@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#f:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#l@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#f:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#l@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#he:click",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#he.addEventListener(click)@86"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#j:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#K@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#j:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#j.addEventListener(error)@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#j:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#U@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#j:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#j.addEventListener(load)@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#n:click",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#Yn@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#navigation:navigate",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#n@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#navigation:navigateerror",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#r@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#navigation:navigatesuccess",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#r@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#o:DOMContentLoaded",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#l@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#r:click",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#Yn@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#r:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#o@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#r:error",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#r.addEventListener(error)@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#r:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#o@9"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#r:load",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#r.addEventListener(load)@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#s:abort",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#a@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t.ownerDocument:pointerdown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#C@86"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:abort",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#s@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationcancel",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#x@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationcancel",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#y@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationend",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#x@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationend",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#y@11"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationstart",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#w@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:animationstart",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#x@10"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:beforeunload",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#B@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:focusin",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#s@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:keydown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#i@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:pointerdown",
      "kind": "handled-by",
      "to": "fn:sendflow.com.br/assets/index-BYxMvkxM.js#c@2"
    },
    {
      "from": "event:sendflow.com.br/assets/index-BYxMvkxM.js#t:popstate",
     
```

## Ten seconds of it

Watched https://sendflow.com.br/ for 10000ms: 1 request outline(s), 1 console entr(y/ies).

Evidence ev_4ee251714f39b5fea35caaf525dde3171856ee3bedf88a17dc8f2cc48439ecd2.

```json
{
  "accessibility": null,
  "console": {
    "count": 1,
    "entries": [
      {
        "level": "error",
        "source": "network"
      }
    ],
    "has_text": false
  },
  "dom": {
    "attribute_names": [
      "alt",
      "aria-controls",
      "aria-current",
      "aria-expanded",
      "aria-hidden",
      "aria-label",
      "aria-labelledby",
      "as",
      "async",
      "charset",
      "class",
      "content",
      "cx",
      "cy",
      "d",
      "data-artifact-id",
      "data-artifact-kind",
      "data-autocapture",
      "data-commit-sha",
      "data-consent",
      "data-context-token",
      "data-id",
      "data-orientation",
      "data-precedence",
      "data-proxy-url",
      "data-radix-collection-item",
      "data-state",
      "data-status",
      "defer",
      "draggable",
      "fill",
      "height",
      "hidden",
      "href",
      "id",
      "lang",
      "loading",
      "media",
      "name",
      "playsinline",
      "points",
      "preload",
      "property",
      "r",
      "rel",
      "role",
      "src",
      "srcset",
      "stroke",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-width",
      "style",
      "target",
      "type",
      "viewbox",
      "width",
      "x1",
      "x2",
      "xmlns",
      "y1",
      "y2"
    ],
    "elements_by_name": {
      "a": 22,
      "body": 3,
      "br": 2,
      "button": 13,
      "circle": 5,
      "div": 122,
      "footer": 1,
      "h1": 1,
      "h2": 9,
      "h3": 8,
      "head": 3,
      "header": 1,
      "hr": 3,
      "html": 3,
      "iframe": 2,
      "img": 62,
      "li": 30,
      "line": 2,
      "link": 25,
      "main": 1,
      "meta": 13,
      "nav": 1,
      "noscript": 1,
      "p": 46,
      "path": 69,
      "picture": 1,
      "polygon": 6,
      "script": 19,
      "section": 10,
      "source": 1,
      "span": 67,
      "strong": 3,
      "style": 1,
      "svg": 51,
      "title": 1,
      "ul": 3,
      "video": 3
    },
    "text_nodes": 161,
    "total_nodes": 786,
    "truncated": false
  },
  "dropped_events": 0,
  "frame_origins": [
    "about:blank",
    "https://sendflow.com.br",
    "https://server.sendflow.com.br"
  ],
  "network": {
    "request_count": 1,
    "requests": [
      {
        "initiator": "script",
        "method": "POST",
        "mime_type": "application/json",
        "response_headers": {
          "credentials_present": [],
          "kept": {
            "cf-ray": {
              "value_length": 20
            },
            "content-length": "17",
            "content-type": "application/json",
            "date": {
              "value_length": 29
            },
            "referrer-policy": "strict-origin-when-cross-origin",
            "server": {
              "value_length": 10
            },
            "strict-transport-security": "max-age=31536000; includeSubDomains",
            "x-content-type-options": "nosniff"
          }
        },
        "status": 202,
        "type": "Fetch",
        "url": "https://sendflow.com.br/__l5e/trackevents"
      }
    ]
  },
  "origin": "https://sendflow.com.br/",
  "resources": [
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=D91D62BC77UC5KDVRB20&lib=ttq"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/section-bg-CvEl0inL.png"
    },
    {
      "mime_type": "text/css",
      "type": "Stylesheet",
      "url": "https://sendflow.com.br/assets/styles-BwbO86K7.css"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/guarantee-badge-DcFXblFC.js"
    },
    {
      "mime_type": "text/plain",
      "type": "Image",
      "url": "https://www.googletagmanager.com/td?id=G-04B0JNJZE7&v=3&t=t&pid=1854602580&gtm=45je6b50h2v9228006835za20gzb9227998786zd9227998786xf1&seq=1&exp=115938465~115938469~118897920~118897930~120213116~120385422~120412528~120420414~120469145~120469153~121246026~121246034~121284210~123814185~124013660&dl=sendflow.com.br%2F&tdp=G-04B0JNJZE7;228006835;1;6;0&frm=0&rtg=227998786&slo=2&hlo=2&lst=1&pcid=227998786&bt=0&ct=3&z=0"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "https://api.builder.io/api/v1/image/assets/TEMP/3f2f2e9ee6a8f2084781664790bf04a381384e36?placeholderIfAbsent=true&apiKey=69b0ced8d66a4f4abfcaf3e02e9087a9"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://analytics.tiktok.com/i18n/pixel/static/identify_3fd9fe73.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/hotmart-checkout-HzaecpnM.js"
    },
    {
      "mime_type": "",
      "type": "Script",
      "url": "https://bat.bing.com/bat.js"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/support-phones-sX2i2BHY.png"
    },
    {
      "mime_type": "image/gif",
      "type": "Image",
      "url": "https://www.google.com.br/ads/ga-audiences?v=1&t=sr&slf_rd=1&_r=4&dma=0&npa=0&gcd=13l3l3l3l1l1&tid=G-04B0JNJZE7&cid=s4PeKFOPyDdbAnfswc03uxz4U17fuvXyG%2Bj%2BoqPpnZM%3D.1794070256&gtm=45j91e6b41v9228006835z99228072597za20ozb9227998786zd9227998786xf1&tag_exp=115938465~115938469~118897920~118897930~120213116~120385422~120412528~120420414~120469145~120469153~121246026~121246034~121284210~121410726~121410726~123814185~124013660&_is_sw=f15s0te&_tu=BA&gap.sstd=2&aip=1&z=1160171936"
    },
    {
      "mime_type": "video/mp4",
      "type": "Media",
      "url": "https://sendflow.com.br/__l5e/assets-v1/fcf49b38-8cab-49f8-817e-5db5748d240e/depoimento-lucas-digienge.mp4"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/empiricus-BDdO1DU5.jpg"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/guarantee-badge-XMpdh3nu.png"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/check-B1TY92mU.js"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/priscila-zillo-V40qjWJ9.jpg"
    },
    {
      "mime_type": "text/plain",
      "type": "Image",
      "url": "https://analytics.google.com/g/s/collect?dma=0&npa=0&gcd=13l3l3l3l1l1&gtm=45j91e6b41v9228006835z99228072597za20ozb9227998786zd9227998786xf1&tag_exp=115938465~115938469~118897920~118897930~120213116~120385422~120412528~120420414~120469145~120469153~121246026~121246034~121284210~121410726~121410726~123814185~124013660&_is_sw=f15s0te&_tu=BA&gap.sstd=2&_gsid=04B0JNJZE7MjQCspTXBpIyNMM9nh_fzw"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/Header-CFhMOz8P.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/sendflow-mark-DMP_wO4z.js"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/logo-sendflow-CFfyEAex.svg"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "https://sendflow.com.br/__l5e/assets-v1/c3431269-ceb1-4d9e-9a5b-00a64b9f8bb9/banner-hotmart-fire-mobile.svg"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/section-bg-4-D8GH582z.png"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/flag-spain-F2r2uovA.png"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/corpo-explica-CCR8wgqO.jpg"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/support-bg-Q4w6Mf7U.png"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/features-grid-top-dNx-CxTg.png"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/pedro-sobral-CUqbWEpd.jpg"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/corpo-explica-FcNENg_T.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/SendFlowLanding-TponC9zD.js"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "https://sendflow.com.br/__l5e/assets-v1/c09ffb8d-5e86-44ed-93d8-3c05ecfa6da7/banner-hotmart-fire-desktop.svg"
    },
    {
      "mime_type": "image/gif",
      "type": "Image",
      "url": "https://server.sendflow.com.br/_/set_cookie?val=x2o3QPEst0vHRKZtltDmY8R534rkq7X%2BwoncjrbCPwuOXjt%2F5gnZ%2BMs%2FwJswIo%2Fq1AUypfuf7iDBPZdBIWbpD1vKu30%2BbmaQ1%2FlpSdHXA3RrhvoHE9EvhpBVWlYV1TTLEUzb8IpRTkg8x1%2FydvycOZ7L%2BrlfU2KKtAC7hSElOmr06mGKSAJ89VaXIqhGIJQkReeV%2BrNrNcUUW4ZW3Ro8F9LT9xK3hcDrsJ7hL%2Fb61hDKsAlOqZIEZJQGK7Epv69hdlYf971maK6tIMoyeWM3sR75FtG%2FJa94jEMYbAydUVY8ZZkbRt3kwCLX0CvFHQkZeWQ2UIkrfmgfzP7wZZEW50FEBOmws3cThjdZ6%2FJ5evK8eoMNswRYAI%2B7JVTWjfadVr80YbXQoaGSR4fbOORGrEAdb4%2BggPg%2FrotWI%2B2RSZWSvkKdvNqdpiKHTmBOca38ubuq1iOOvtIfsioMX5a11Ec6q%2FOrPMG8O3kIW545sW%2BNL4ki7BpSalepBpzP8otfnCb45sFGrrmcASZUmM9DzD%2F6QdqSap7K%2FAMw4g7KHkjLsL6HbCotJxQ%2FTkNu5V66WWbEt4nvFFgYOtOCoXC9%2Fo4NRpJk6tg5gsk4zSM%2Bt0jO5Q8dBKvrNyVJWORs4x800%2FcWtfFSEKhTMKyk8ojhwSIDn25ju2NfhSb5hMxPI6Q6FqFZTO6nX7ukeolA%2FwG%2BN7rTTCQjZ9q%2FSw%3D%3D&path=%2F"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://www.googletagmanager.com/gtm.js?id=GTM-NJW88VJC"
    },
    {
      "mime_type": "image/gif",
      "type": "Image",
      "url": "https://googleads.g.doubleclick.net/pagead/viewthroughconversion/16526218923/?random=1790992114&fst=1794070371148&cv=10&fmt=3&bg=ffffff&guid=ON&u_w=800&u_h=600&gtm=45j91e6b41v9228006835z89227998786z99228072597za20gzb9227998786zd9227998786xf1&url=https%3A%2F%2Fsendflow.com.br%2F&tiba=SendFlow%20%7C%20Automa%C3%A7%C3%A3o%20de%20grupos%20e%20comunidades%20WhatsApp&auid=412320504.1794070256&uaa=x86&uab=64&uafvl=Not%253AA-Brand%3B8.0.0.0%7CChromium%3B156.0.8078.74%7CGoogle%2520Chrome%3B156.0.8078.74&uamb=0&uam=&uap=Windows&uapv=19.0.0&uaw=0&rcb=18&dma=0&npa=0&gcd=13l3l3l3l1l1&pscdl=noapi&_is_sw=f15s0t18&tag_exp=115938465~115938469~117215459~117549814~118897920~118897930~119805584~120213116~120385422~120412528~120420414~120469145~120469153~121246026~121246034~121284210~121410726~123814185~124013660~124013903&_tu=BA&gap.sstd=2&evnid=1794070600888_17940705736703"
    },
    {
      "mime_type": "video/mp4",
      "type": "Media",
      "url": "https://sendflow.com.br/__l5e/assets-v1/743e67ac-279b-49b0-82fe-b6aeec255129/depoimento-lucas.mp4"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/index-7ODltjqB.js"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://analytics.tiktok.com/i18n/pixel/static/main.MTljN2I3ZmUxMQ.js"
    },
    {
      "mime_type": "application/x-javascript",
      "type": "Script",
      "url": "https://connect.facebook.net/signals/config/1541142904281932?v=2.9.438&r=stable&domain=sendflow.com.br&hme=4453c87d489b6902031c012cadd2731893cd69feb64fe8a61b339727247a7703&ex_m=118%2C242%2C171%2C27%2C82%2C83%2C162%2C78%2C77%2C11%2C181%2C102%2C20%2C153%2C141%2C46%2C85%2C90%2C149%2C176%2C183%2C8%2C4%2C5%2C7%2C6%2C3%2C103%2C115%2C161%2C72%2C185%2C110%2C184%2C211%2C263%2C37%2C84%2C283%2C282%2C281%2C14%2C25%2C28%2C40%2C62%2C117%2C68%2C10%2C73%2C111%2C112%2C113%2C119%2C144%2C38%2C36%2C146%2C147%2C148%2C143%2C142%2C172%2C86%2C175%2C173%2C174%2C57%2C69%2C67%2C137%2C19%2C179%2C52%2C333%2C334%2C335%2C332%2C32%2C17%2C31%2C18%2C33%2C34%2C35%2C55%2C163%2C87%2C126%2C22%2C24%2C51%2C47%2C49%2C48%2C95%2C104%2C108%2C124%2C160%2C164%2C53%2C125%2C29%2C26%2C133%2C79%2C43%2C166%2C165%2C167%2C157%2C155%2C30%2C42%2C66%2C123%2C178%2C80%2C21%2C128%2C93%2C76%2C23%2C97%2C98%2C130%2C96%2C151%2C150%2C154%2C109%2C177%2C180%2C41%2C349%2C371%2C256%2C238%2C70%2C239%2C237%2C374%2C365%2C59%2C257%2C121%2C145%2C92%2C135%2C61%2C54%2C56%2C127%2C134%2C140%2C139%2C65%2C74%2C168%2C88%2C89%2C129%2C44%2C39%2C60%2C63%2C114%2C182%2C1%2C138%2C16%2C136%2C12%2C2%2C64%2C105%2C15%2C75%2C71%2C132%2C101%2C100%2C187%2C188%2C106%2C107%2C9%2C116%2C186%2C58%2C158%2C99%2C91%2C81%2C131%2C120%2C169%2C50%2C159%2C0%2C94%2C152%2C156%2C170%2C45%2C122%2C13%2C189"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/wrench-BJq9b-db.js"
    },
    {
      "mime_type": "video/mp4",
      "type": "Media",
      "url": "https://sendflow.com.br/__l5e/assets-v1/322bb4bd-3be8-4383-8b05-4fa0108f2e89/depoimento-fabio-calixto.mp4"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/exame-kqtrayH2.jpg"
    },
    {
      "mime_type": "application/x-javascript",
      "type": "Script",
      "url": "https://www.clarity.ms/tag/u8s16nwspw"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "data:image/svg+xml,%3csvg%20width='65'%20height='92'%20viewBox='0%200%2065%2092'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_20_410)'%3e%3cg%20clip-path='url(%23clip1_20_410)'%3e%3cpath%20d='M3.91603%2038.2778L0%2031.2801L49.9058%201.39421C51.4375%200.479693%2053.175%20-0.00119272%2054.9435%202.22153e-06C56.7121%200.00119717%2058.4495%200.484431%2059.9801%201.40102C61.5107%202.3176%2062.7806%203.63516%2063.6607%205.22094C64.542%206.80671%2065.0036%208.60468%2065%2010.4337V32.4587C65%2032.5989%2064.9462%2032.7333%2064.8493%2032.8325C64.7536%2032.9317%2064.6233%2032.9873%2064.4882%2032.9873H57.689C57.5539%2032.9873%2057.4236%2032.9317%2057.3279%2032.8325C57.2323%2032.7333%2057.1784%2032.5989%2057.1784%2032.4587V10.4337C57.1832%2010.021%2057.0804%209.61456%2056.8819%209.25685C56.6822%208.89912%2056.394%208.60327%2056.0472%208.40022C55.7088%208.19469%2055.325%208.08631%2054.9328%208.08631C54.5418%208.08631%2054.1567%208.19469%2053.8195%208.40022L3.91603%2038.2778Z'%20fill='%23474747'/%3e%3cpath%20d='M10.0504%2091.722C7.38577%2091.7101%204.83409%2090.6482%202.95137%2088.7671C1.06877%2086.8871%200.00787002%2084.3401%200%2081.6835V60.5029C0.000715456%2060.3678%200.0550863%2060.2385%200.151077%2060.1432C0.247186%2060.0479%200.377159%2059.9944%200.512618%2059.9944H7.2924C7.42786%2059.9944%207.55783%2060.0479%207.65382%2060.1432C7.74993%2060.2385%207.80419%2060.3678%207.80491%2060.5029V81.6835C7.8055%2082.0779%207.90996%2082.4649%208.10802%2082.8073C8.30596%2083.1486%208.59048%2083.4316%208.93306%2083.629C9.27565%2083.8264%209.66414%2083.9298%2010.0597%2083.931C10.4552%2083.931%2010.8439%2083.8276%2011.1868%2083.6302L61.102%2054.8887L65%2061.6198L15.0784%2090.3617C13.5517%2091.2487%2011.8173%2091.7184%2010.0504%2091.722Z'%20fill='%23474747'/%3e%3c/g%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_20_410'%3e%3crect%20width='65'%20height='92'%20fill='white'/%3e%3c/clipPath%3e%3cclipPath%20id='clip1_20_410'%3e%3crect%20width='65'%20height='92'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e"
    },
    {
      "mime_type": "image/png",
      "type": "Image",
      "url": "https://api.builder.io/api/v1/image/assets/TEMP/7eb94be8b381d1da01fafdf59ff2ede95d84d827?placeholderIfAbsent=true&apiKey=69b0ced8d66a4f4abfcaf3e02e9087a9"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/~flock.js"
    },
    {
      "mime_type": "image/jpeg",
      "type": "Image",
      "url": "https://sendflow.com.br/assets/v4-D6WcgyDU.jpg"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/accordion-n2SqF1-D.js"
    },
    {
      "mime_type": "application/x-javascript",
      "type": "Script",
      "url": "https://www.clarity.ms/tag/u4gmzwiz0g?ref=gtm"
    },
    {
      "mime_type": "image/gif",
      "type": "Image",
      "url": "https://server.sendflow.com.br/_/set_cookie?val=l7nNUwbWEXpRTvWG%2FCgMhBAfTthFtsepZjJS7MT8Xuu3Z0DhuR3w%2B4oSrJ8OEBsVi8KfYzR6kjhYbTgof8rN6Wej%2F8oR46TggSCyfU68Now5SdKRLJF1TKuBeSTSvf3tfC76rlJiAftW9ocYY3t285D4UBsYO%2B4xlyZQEoxEtQkbP0UNSPE2iJ3jzR72xXqZfoLX&path=%2F"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/banner-hotmart-fire-mobile.svg.asset-7GoINVVP.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/logo-sendflow-ZiAJsP-I.js"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/__l5e/events.270c78a44fc53e7b.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/exame-l3uubY4r.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/webhooks-DyNoER6N.js"
    },
    {
      "mime_type": "text/javascript",
      "type": "Script",
      "url": "https://sendflow.com.br/assets/index-BYxMvkxM.js"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://scripts.clarity.ms/0.8.75/clarity.js"
    },
    {
      "mime_type": "application/javascript",
      "type": "Script",
      "url": "https://www.googletagmanager.com/gtag/js?id=G-04B0JNJZE7&cx=c&gtm=4e6b50h2"
    },
    {
      "mime_type": "application/x-javascript",
      "type": "Script",
      "url": "https://connect.facebook.net/en_US/fbevents.js"
    },
    {
      "mime_type": "image/svg+xml",
      "type": "Image",
      "url": "data:image/svg+xml,%3csvg%20width='86'%20height='84'%20viewBox='0%200%2086%2084'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_20_381)'%3e%3cpath%20d='M15.96%2042.2261L12.2671%2035.6272L59.3289%207.44437C60.7734%206.582%2062.4118%206.12852%2064.0796%206.12964C65.7474%206.13077%2067.3858%206.58647%2068.8289%207.45084C70.2728%208.31518%2071.4701%209.55765%2072.3003%2011.0531C73.1312%2012.5485%2073.5664%2014.244%2073.563%2015.9688V36.7386C73.563%2036.8708%2073.5119%2036.9976%2073.4206%2037.0912C73.3307%2037.1847%2073.2075%2037.2372%2073.0801%2037.2372H66.6686C66.5412%2037.2372%2066.4183%2037.1847%2066.3281%2037.0912C66.2379%2036.9976%2066.1872%2036.8708%2066.1872%2036.7386V15.9688C66.1917%2015.5796%2066.0947%2015.1963%2065.9075%2014.859C65.7192%2014.5217%2065.4474%2014.2426%2065.1204%2014.0512C64.8013%2013.8574%2064.4393%2013.7551%2064.0695%2013.7551C63.7008%2013.7551%2063.3376%2013.8574%2063.0196%2014.0512L15.96%2042.2261Z'%20fill='url(%23paint0_linear_20_381)'/%3e%3cpath%20d='M21.7447%2076.2793C19.2319%2076.2684%2016.8257%2075.2665%2015.0503%2073.493C13.2749%2071.7202%2012.2745%2069.3181%2012.2671%2066.8128V46.8392C12.2678%2046.7118%2012.3191%2046.5899%2012.4096%2046.5C12.5002%2046.4102%2012.6227%2046.3597%2012.7505%2046.3597H19.1439C19.2716%2046.3597%2019.3942%2046.4102%2019.4848%2046.5C19.5754%2046.5899%2019.6265%2046.7118%2019.6272%2046.8392V66.8128C19.6278%2067.1848%2019.7263%2067.5496%2019.9131%2067.8726C20.0998%2068.1943%2020.368%2068.4613%2020.6911%2068.6472C21.0142%2068.8339%2021.3805%2068.9312%2021.7535%2068.9319C22.1265%2068.9319%2022.4931%2068.8345%2022.8163%2068.6486L69.8873%2041.5449L73.563%2047.8925L26.4862%2074.9961C25.0465%2075.8332%2023.411%2076.2759%2021.7447%2076.2793Z'%20fill='url(%23paint1_linear_20_381)'/%3e%3c/g%3e%3cdefs%3e%3clinearGradient%20id='paint0_linear_20_381'%20x1='42.915'%20y1='2.72431'%20x2='42.915'%20y2='60.6149'%20gradientUnits='use
```
