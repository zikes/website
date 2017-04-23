---
title: New Caddy Website and Build Server
author: Matt Holt
date: 2017-04-20 14:00:00+00:00
type: post
---

After months in the making, today we debut the new Caddy website along with upgraded build infrastructure and release tools. Together, they automate releases of Caddy and its plugins by their respective authors. (We've also released a [new version](/blog/caddy-0_10-released) of Caddy as well as [options for businesses](/blog/options-for-businesses) today!)

Plugin developers can (and should) [create an account](/account/register) and log in to the new Developer Portal where they can add their plugins to the Download page and deploy new versions whenever they're ready. No longer will plugin developers have to wait days or weeks for me to update the build server manually; the whole process is automated. New deployments are guarded with the full suite of tests, vet, and cross-platform compile checks to help ensure that plugins available for download will successfully build and function.

This is a great day for the Caddy project that will benefit its users and contributors. Let me explain a few things that are new and improved.


## Rebranding

In case you didn't notice (or are new here), Caddy has been refreshed with a new look! The new logo is easier to read in a wider variety of backgrounds and contexts than the old one. We dropped the unexplainable tufts of grass for a green padlock icon that, when put in front of a light blue background, looks like a nice, secure landscape with the shackle being a mountain. (Okay, it's a stretch, but I can dream a little. I love mountains.)

I think it's a hit because [sticker pre-orders](https://goo.gl/forms/Q9Sc3gTmxtAwnxXo1) were wildly successful.

<img src="/resources/images/blog/caddy-stickers.jpg" alt="Caddy stickers" width="300">

Don't forget to show off that you use Caddy with any of the images in [our updated brand kit](/brand)!

<a href="/brand" title="Brand kit"><img src="/resources/images/brand/you-got-served-black.png" alt="Caddy stickers" width="300"></a>

## Download Page

The [download page](/download) has been drastically improved with a clean, colorful interface that allows you to customize your build. The old download page was confusing even for seasoned software developers, not to mention unattractive because it was hacked together as Caddy grew faster than anticipated. This new page keeps it simple and has room to grow.

**Caddy builds are now available for 30 different platforms.** This is 3x more than the old download page served.

The plugin chooser now shows more information about each plugin including a brief description with links to its website or GitHub page, documentation, and where to get support for it.

Notably, signed builds are also available. You can download a PGP signature for any custom build by clicking the link below the download button. The archive file is signed by Caddy's private key, which ensures your download isn't tampered with or corrupted before or after downloading.

The bottom of the download page has the direct link to your custom build as well as a copy-and-paste command to install Caddy with our nifty installer script.


## Features Page

The new [features page](/features) lists all of Caddy's features and capabilities. We plan to add a section for plugins so that every plugin that is published on this site can add to the list of Caddy's rich set of features.


## Pricing Page

This new site doesn't have a donation page like the old site, because we now have [options geared toward businesses](/blog/options-for-businesses) to sustain Caddy's development and growth. The [pricing](/pricing) page documents the Sponsorship and Engineering Package which are now available for purchase.

Sponsoring Caddy helps keep Caddy free. It enables the community to grow and, as it does, Caddy can provide privacy to more and more sites and people. We promote your brand in return by linking to it on this website and in release announcements and on social media!

The Engineering Package is more of a private deal for businesses that rely on Caddy. It guarantees continued development and gives businesses the option to receive private technical support. We also give their bug reports and feature requests high priority. The great thing about this is that it's the same price no matter how many instances you're running.

Both sponsors and Engineering Package subscribers are given access to our [exclusive Slack community](https://caddyserver.slack.com).


## New User Guide

The [documentation pages](/docs) have been updated to now include [beginner tutorials](/tutorial) and a [complete technical spec of the Caddyfile](/docs/caddyfile).

Unlike the old site, the new User Guide does _not_ host the full documentation for 3rd-party plugins. Instead, each plugin receives a page in the User Guide with a brief description, examples, and links to the GitHub page or website where full documentation can be viewed. This ends up being much easier to maintain at scale for plugin authors and for us; and still provides useful information to visitors.

We also increased the contrast of text and links. The side navigation is long, but the same for every page, so the experience should be consistent as you return to the docs over and over again.

I admit there's plenty of design improvements I would still like to make to the docs. One thing at a time...


## New Build Server

This is the _really_ exciting stuff because it means that the plugin ecosystem can now scale as far and wide as plugin developers do (that's not a fat joke, I promise). The entire process from building your plugin to making it available for download on the Caddy website and updating it when you have new versions to release is entirely automated. Plugin authors can manage their plugins' deployments entirely in the [Developer Portal](/login).

The backend to the Caddy website is technically called the [devportal](https://github.com/caddyserver/devportal). It keeps the database of plugins, accounts, and Caddy releases. Behind _that_ is a [build worker](https://github.com/caddyserver/buildworker) that does the heavy lifting of producing builds and running tests. Build workers are entirely stateless except for a master GOPATH used as a cache. But build workers can be burned down and restarted without breaking. With just a few tweaks, the devportal can be configured to load balance between build workers if the load starts to get high.

Many of the pages on this site are powered by the devportal: the Developer Portal, obviously, but also the documentation pages. The download page is static, but requires information from the devportal. If the devportal is down, the download page will show a link to the latest release on GitHub.

**Deploying new versions of Caddy used to take half a day. Now it takes 10 minutes.** And most of those minutes are just waiting for builds and uploads to finish. I just push a button. This means Caddy can be released more frequently and with smaller change sets. 

It's important to note, especially for plugin developers, that the build server does not solve dependency management. It's pretty good at producing builds with the desired versions of Caddy and certain plugins, but any packages not listed in the build spec will be used at whatever is on master. The build server performs an intricate dance of `go get` and `git fetch`, `git checkout`, and `go build` to make binaries; this means that standard vendoring techniques _should_ work if desired, but deployments might fail if an upstream dependency makes a breaking change. No worries, failed deployments roll back the whole GOPATH to a working copy. The old build server had this problem too, but everything was manually done, error prone, and took forever. This is way better, trust me.


## And next...

Of course, we're going to keep improving on the site to make sure Caddy is crystal-clear to use and easy to understand. We also especially want plugin developers to have a good experience doing what they do best. Please participate [on GitHub](https://github.com/mholt/caddy) and [on our forums](https://caddy.community) if you have any feedback or would like to contribute! We hope you like the changes.

