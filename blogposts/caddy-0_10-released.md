---
title: Caddy 0.10 Released
author: Matt Holt
date: 2017-04-20 16:00:00+00:00
type: post
---

We're thrilled to release Caddy 0.10 on the same day as we unveil [the new website](/blog/new-website-and-build-server) and [products for businesses](/blog/options-for-businesess). A lot of work has gone into this release, with contributions from more than 25 developers over the last 3 months.

It was kind of fun to watch people anticipate a version 1.0 release today, but I don't think version 0.10 will disappoint. Caddy 0.10 is the first version to be deployed with the new [automated release system](https://github.com/caddyserver/releaser). Releases now take about 10 minutes instead of 4 hours, and most of that time is spent uploading binaries. This version is built on Go 1.8.1 and sports plenty of new features, dozens of bug fixes, and lots of crypto improvements! Let's take a look, shall we?

## MITM Detection

Caddy can determine, with decent accuracy, if an HTTPS connection is being intercepted by a TLS proxy. This feature is based on [new research presented at NDSS '17](https://jhalderm.com/pub/papers/interception-ndss17.pdf) and Caddy is the first and (to date) only server to employ this technique. Site owners can now choose how to handle the case where it is likely that an HTTPS connection is being intercepted. Typical actions might be showing a warning on the page:

<code class="block">&#123;&#123;if .IsMITM&#125;&#125;
&lt;b&gt;Your HTTPS connection is probably not secure!&lt;/b&gt;
&#123;&#123;end&#125;&#125;</code>

If your site has sensitive information, you could also take more drastic measures and block the content entirely with a [rewrite](/docs/rewrite) in your Caddyfile:

<code class="block"><span class="cf-dir">rewrite</span> {
    <span class="cf-subdir">if</span> {mitm} is true
    <span class="cf-subdir">to</span> /https-intercept-warning.html
}</code>

But a more sensible thing might simply be to log that an HTTPS interception likely happened by using `{mitm}` in the Caddyfile to customize your log format.

Read more about this feature on the [MITM Detection](/docs/mitm-detection) documentation page.

## HTTP/2 Server Push

It's finally here! HTTP/2 server push helps web pages load faster by "pushing" resources to the client the server knows it will need before the client even asks for it. But [server push is hard](/blog/implementing-http2-isnt-trivial). The tricky question is, how to know what the client needs? We had hoped to release server push support in a way that was automatic, similar to how Caddy takes care of TLS certificates for you. Unfortunately, there's more nuances to server push at this point than there are obtaining and renewing certificates (can you believe it?). So, at this time, server push is an opt-in feature.

By specifying the [push](/docs/push) directive in your Caddyfile, Caddy will read any Link headers going downstream to know which resources to push to the client. This is useful if you are proxying to a backend that knows what should be pushed to the client.

Another way to use [push](/docs/push) is to specify the rules in the Caddyfile directly. This is as easy as giving the page for which to push resources, and then the list of resources to push. Note that browsers likely cache resources after the first download, so pushing repeatedly is often futile.

Please note that [server push is NOT a replacement for WebSockets](https://twitter.com/mholt6/status/852208076790919170). Don't try and be clever; it will probably come back to bite you in this case. We recommend sticking to using protocols for that for which they were designed.


## Upgrades to Caddy's TLS Stack

Go 1.8 brought lots of great things for TLS. Curve X25519 and ChaCha20-Poly1305 cipher suites were added. But perhaps the most exciting change is the flexibility introduced in this version.

Before, settings in all `tls` directives were combined for all sites that shared a listener and reduced to a single unified TLS configuration with which to create a tls.Listener. Now, each `tls` directive applies only to its own site. This offers a great deal of flexibility that wasn't present before. For example, HTTP/2 can now be disabled for a single site rather than all sites (the -http2 flag is still available, though). Certain ACME challenges can be disabled for specific sites only.

We strongly recommend using Caddy's default TLS settings unless you know what you're doing. If you rely on all sites having a non-standard TLS config, you can share that config with all sites using the [import](/docs/import) directive in each site.


## Default Timeouts Disabled

A new security feature of 0.9.5 was that HTTP timeouts were set at about 10 seconds. Unfortunately, limitations in the Go standard library and lack of good documentation on the Caddy website confused many Caddy users. In this version, we've disabled default timeouts, but you can still turn them on. We recommend doing so if you understand the implications. However, leaving them off does still pose a risk. (Act according to your threat model!)


## New Plugin Capabilities

There's a new type of plugin in town called Event Hook plugins. These plugins can perform actions when Caddy emits events, like process start. The list of events will grow according to emergent need and practicality. Plugins can also add "listener middleware" which allow you to wrap a net.Listener with your own listener if you need to perform some action or observation on the raw bytes over the wire.

New plugins using these capabilities will be available shortly on the Caddy website. One is a PROXY Protocol plugin and another is a plugin that registers Caddy as a Windows service.


## Other Miscellenous Things

This release also sports lots of minor enhancements, not to mention dozens of bug fixes. For example, QUIC servers now reload with SIGUSR1 properly. A new [index](/docs/index) directive lets you customize the index files. New `-http-port` and `-https-port` CLI options let you customize which ports Caddy uses for HTTP and HTTPS (warning: only use if you know what you're doing!). There's also `-disable-http-challenge` and `-disable-tls-sni-challenge` flags to disable those ACME challenges if you have good reason that you need to do so. We recommend leaving both enabled in most cases.

One notable "miscellaneous" change is that access and error logs are now rolled by default when they get large. We've also changed the syntax of the `log` and `errors` directives to be more similar and flattened the options for log rotation. Log rotation is critical for not expending all the disk space on busy servers. We've already done this with the process log for over a year and it's worked well. Also for access and error logs, you can now write to remote syslogs.

The proxy middleware now has a `max_conns` setting to limit the number of connections to each upstream, as well as a new `first` load balancing policy so you can set other backends as hot-standby instances.

See the [release notes](https://github.com/mholt/caddy/releases/tag/v0.10) for the full list of notable changes.

## Thank You Contributors!

We're very thankful to the many contributors that made this release possible. Over 119 commits and 3 months later we're very pleased with this! There's still a lot of work to do and we invite you to [be a part of it](https://github.com/mholt/caddy).
