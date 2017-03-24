---
title: What is OCSP and Why Do We Care?
author: Matt Holt
date: 2016-08-20 22:00:00+00:00
type: post
---

There's that [age-old interview question](https://github.com/alex/what-happens-when), "What happens when you type google.com into your browser and hit Enter?" The full answer could fill a book, but in this post we'll look at it only from a network security perspective. We'll present a series of uncertainties and how they are resolved them using modern (and proposed) protocols to keep you safe online.















OCSP is the Online Certificate Status Protocol. 


OCSP (Online Certificate Status Protocol) isn't something people think about much, but it plays a critical role in your security online.




## Persisting OCSP Staples

Caddy already staples OCSP responses for all qualifying certificates by default. However, in preparation for [OCSP Must-Staple](https://www.grc.com/revocation/ocsp-must-staple.htm), Caddy now persists OCSP responses to disk; these files are fully maintained and no action is required by you.

OCSP is one of those things you don't think about much. Remember, TLS certificates rely on a private key, and if that key is compromised, the certificates should be revoked. But revocation itself does not invalidate a certificate. Thus, clients which are deciding whether to trust a certificate need to check if a certificate has been revoked. OCSP automates this process, but it's hairy.

The most common way OCSP is used today is for the browser to query an OCSP responder when it is deciding whether to trust a new certificate. Usually all is well and the only side-effect is a slower page load. But what if the OCSP responder is down? (It happens.) What if your network or an attacker blocks access to the responder? Now you have to decide: trust that the certificate has not been revoked 

Browsers have to query the OCSP responder for a certificate to ask if it has been revoked. This slows down the page load, but worse things happen if the OCSP responder is down or unreachable. 

Must-Staple is a proposed x509 extension (and maybe HTTP header) which notifies clients that the certificate being served must have a valid, signed OCSP response stapled to it. 
 web servers must consider OCSP as a vital component of uptime. Clients 
