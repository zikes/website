---
title: Caddy 0.10 Released with MITM Attack Detection
author: Matt Holt
date: 2017-04-14
type: post
---

Caddy 0.10 is released! It can detect tampering with incoming HTTPS connections that is common among TLS proxies.













Caddy 0.9.6 is released! What an exciting time to be alive: the Internet is a more hostile environment than ever; political, social, and corporate tensions are on the rise; and the fight for freedom and privacy rages on in its various forms across the world. We also have the most complex tools in the history of civilization and are advancing faster than any others before us.




Caddy has the ability to detect Man-in-the-Middle (MITM) attacks on HTTPS connections that may otherwise be invisible to the browser and the end user. This means Caddy can determine whether it is "likely" or "unlikely" that a TLS proxy is actively intercepting the HTTPS connection.

Despite benevolent intentions of some TLS proxies, [they actually do more harm than good](https://users.encs.concordia.ca/~mmannan/publications/ssl-interception-ndss2016.pdf). Because of the adverse effects on user privacy and the technical problems of TLS proxies of all kinds, Caddy proactively, carefully inspects all incoming HTTPS connections and 



All incoming HTTPS connections are automatically checked for tampering using techniques described by Durumeric, Halderman, et. al. in their [NDSS '17 paper](https://jhalderm.com/pub/papers/subgroup-ndss16.pdf).
