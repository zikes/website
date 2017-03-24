---
title: Caddy 0.9.4 Released
author: Matt Holt
date: 2016-12-21 16:00:00+00:00
type: post
---

Just in time for Christmas, Caddy 0.9.4 adds the maxrequestbody directive, support for statically-compressed .gz or .br files, multiple backends to fastcgi, TLS curve and Must-Staple preferences, passing arguments to included files with templates, and a lot of little bug fixes.

Caddy 0.9.4 is built on Go 1.7.4. [Download Caddy 0.9.4](/download) or [see full change log](https://github.com/mholt/caddy/releases/tag/v0.9.4).

## New Features

The [maxrequestbody](/docs/maxrequestbody) directive sets a limit on the size of request bodies. You can set multiple different limits based on request path.

There is a new [placeholder](/docs/placeholders), `{latency_ms}`, you may find useful in your logging if you wish to always log the latency in milliseconds, even if another unit may be easier for a human to read.

Caddy will, by default, look for .gz (gzip) and .br (brotli) files on disk if the request headers indicate support for those encodings. This means you can statically-compile your assets and Caddy will serve them up automatically.

If you use `.Include` in [templates](/docs/template-actions), you'll be pleased to know that you can now pass arguments to the included file, which can be accessed by `.Args`. Any arguments to `.Include` after the filepath are passed as arguments.

You can specify multiple backends for a single [FastCGI](/docs/fastcgi) proxy, and basic load balancing will be performed. You can also customize connect, read, and send timeouts.

[TLS](/docs/tls) curve preferences are customizable (although the defaults are sensible!) and you can request Must-Staple on new certificates managed by Caddy.


## New Website Progress

There haven't been huge changes in Caddy recently due to lots of concentrated effort on Caddy's build infrastructure and plugin ecosystem. We're making a significant investment in this to help make Caddy easier to get and extend. Right now, all the plugins are manually managed and deployed, and Caddy releases are entirely manual, and it's frankly quite tedious.

New programs will allow Caddy maintainers to [deploy new Caddy releases](https://github.com/caddyserver/releaser) automatically with the push of a button. The new website will be powered by a Go backend that manages the deployment and building of Caddy plugins. Developers will be able to create an account on the site and get an API key, with which they can publish and update their plugins automatically. The build server will run checks to ensure plugins pass all tests and build cross-platform. Each custom download will even be cryptographically signed by the Caddy build server, which you can verify using [Caddy's public key](https://keybase.io/caddy).

Most of this behind-the-scenes work can be seen in repositories at [github.com/caddyserver](https://github.com/caddyserver).

## Thank You to Contributors

I want to thank all who have contributed hours and hours of their time to this release. Thank you for making Caddy better! And thank you to all who help on our [forums](https://forum.caddyserver.com). &lt;3 And of course, this wouldn't be possible without the sponsorship of DigitalOcean, Arroyo Networks, DNSimple, or the award from Mozilla. Be sure to support them!

