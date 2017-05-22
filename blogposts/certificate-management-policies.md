---
title: Caddy's Certificate Management Policies
author: Matt Holt
date: 2017-05-20 16:00:00+00:00
type: post
---

Caddy stepped into unknown territory when it became the first web server to use HTTPS by default and manage your TLS certificates for you. When [Let's Encrypt suffered a connectivity issue](https://community.letsencrypt.org/t/ocsp-and-issuance-outage-2017-05-19/34506) yesterday, it exposed some grave realities (and misunderstandings) about automated certificate management. I'd like to talk about what happened, clarify a few things, make some recommendations, and raise questions for future consideration.


## The incident

Approximately 1 hour after I went to sleep on Thursday night, Let's Encrypt began having some troubles with issuance. It looks like their team pulled an all-nighter, but it still took the better part of the day for all their systems to return to normal for everyone&mdash;mostly because of far-reaching effects that had to be resolved with an ISP and CDN. During that time, some Caddy users stopped and restarted their Caddy processes or just started new ones.

Most Caddy users who did this during the downtime would not have experienced any problems, but a few of them [reported](https://twitter.com/karnauskas/status/865660132075511809) that, much to their surprise, Caddy refused to start, citing timeout errors. This is understandably jarring to any site owners because Caddy is the first web server to offer this technology, although [many Traefik users expressed similar frustration](https://github.com/containous/traefik/issues/1641) for the same reason.

In the past, this behavior has been [reported](https://caddy.community/t/how-to-have-bad-domain-in-config-skipped/513?u=matt) [multiple times](https://caddy.community/t/behavior-of-automatic-https-on-failure-to-generate-cert/342?u=matt) and even [filed as a bug](https://github.com/mholt/caddy/issues/642), but each time, it was due to faulty DNS configuration (or lacking a registered domain entirely). But this situation is different, and arguably more agitating, since its cause is entirely out of the control of the site owner.


## Behind the scenes

When I woke up and checked my notifications, I saw [an issue reporting that Caddy is unusable when the ACME server is down](https://github.com/mholt/caddy/issues/1680). Thinking little of it, I responded quickly before I left for the lab early in the morning, as I had to focus on a submission to NIPS that was due by 1pm. When I got to the lab a half hour later, notifications flooded in again. Turns out [my response](https://github.com/mholt/caddy/issues/1680#issuecomment-302693543) was not popular. Huh... I even mentioned _a few_ workarounds, so I thought I was being helpful. A few minutes later, I found the [Hacker News thread](https://news.ycombinator.com/item?id=14374933) about Let's Encrypt working an active incident. And sure enough, a top comment in that thread linked to the same Caddy issue. That explains the thunder in my inbox...

It took me a few minutes to read the comments and gather my thoughts. I am grateful for those who kept their cool, which I figure was most people, but it was the loud ones who garnered most of the attention from readers. Unfortunately, those voices (the one with the most positive reactions) were distracting from the task of finding a satisfactory resolution.

I [answered](https://github.com/mholt/caddy/issues/1680#issuecomment-302709258) a few of the crucial points while inside the lab, then checked out for a while to analyze everything carefully and to clear up my head, while munching on a breakfast Kolach. I pinged a few software engineer and security colleagues who are both smarter than me and not invested in the issue themselves, and listened to their genuine feedback. It was then that I decided to commit a change and release a new version immediately.

My coworkers at the lab and my advisor continued cranking away on the NIPS paper while I drafted up a new release. They carried my academic load for about 80 minutes while I worked this issue. I'm thankful my team at the lab is so cooperative and understanding.

With [a code change](https://github.com/mholt/caddy/commit/410ece831f26c61d392e0e8fa41e9b4f90d7fb95) committed, tested, and pushed, [I released version 0.10.3 a few minutes later](https://github.com/mholt/caddy/issues/1680#issuecomment-302719323). Thankfully, the new build system did all the heavy lifting for me and successfully deployed the new version within seconds after running all the tests automatically. [I resumed my lab work for the day.](https://github.com/mholt/caddy/issues/1680#issuecomment-302723299)

Although I was heads-down in the NIPS paper for the next several hours with my lab, I did monitor new comments, and it seems that people were satisfied overall.

Our lab submitted the paper with 10 minutes to spare, and I took the rest of the day off to catch up on everything from the morning.


## Analysis

### What happened?

Depends who you ask!

**How I explained it:** Caddy would not start if it could not renew a site's certificate that was expiring soon.

**How everyone else explained it:** Caddy would not start even though it already had a perfectly good certificate on disk that was still valid for &lt;some amount of time&gt;.

Both are accurate.

When Caddy was run, it tried to obtain new, expired, or expiring certificates. Since it was unable to connect to the CA, an error was raised, and the process terminated. In some cases, this process was initiated because a new site was added to the Caddyfile and Caddy didn't have a certificate on disk already. Stopping the process and restarting it is _not_ the correct way to reload the Caddyfile in a production environment. Send [signal USR1](https://caddyserver.com/docs/cli#usr1) to the Caddy process for a graceful, zero-downtime reload of the Caddyfile; any failures will be logged and the site will continue being served as before.

However, for other users, a certificate already existed on disk from a previous run. It's impossible to tell from the comments (mainly because people skip questions in the [issue template](https://github.com/mholt/caddy/blob/master/.github/ISSUE_TEMPLATE.md)), so I can only guess that their certificates were expiring within 30 days, triggering the connection to the CA for a renewal. When the connection failed, Caddy reported the error and quit, _even though the certificate on disk had not yet expired._


### Who did this affect?

Not as many as the reactions would have you think, although I do acknowlege that a handful of site owners experienced this, and I do not discount that.

Only site owners who started a new Caddy process during the time Let's Encrypt was down _and_ who needed certificates or whose certificates were expiring in less than 30 days would have had trouble starting the server. In fact, I think it's even narrower than this. Let me explain.

Caddy scans loaded certificates in the background every 12 hours to see if they need to be renewed. If so, Caddy will attempt a renewal. If it fails, it tries again a few seconds later. If that fails too, it waits until the next scan. Assuming Caddy was running before the process was (stopped and) started, any certificates it was managing that were in the 30 day window would have been renewed at most 12 hours earlier. If that renewal attempt was before the outage or the certificate was not in the 30 day window, restarting the process would have had no failures, because the certificate would have been recently renewed.

So I think in order for most users (i.e. those who were already running Caddy) to have experienced this, they would have to be unlucky enough to start Caddy in the 30-day window before expiration _and_ the 12 hour window before a scan _but after the outage started_. That seems unlikely at best, and despite the outrage in the discussions, I think only a small fraction of Caddy users felt the impact of the Let's Encrypt outage. Many of the comments (such as "Caddy needs to redownload the certificates every time it starts" or "this makes Caddy impossible to start if the ACME server is down" or "all sites went down since the whole server refused to start") painted false pictures by over-simplifying the issue, which in turn inflated the perceived risk and reach of this behavior. In the future, we would really appreciate such comments be withheld until the maintainers have a chance to respond with more authoritative, correct information. The echo chamber effect doesn't help anyone or get us closer to a solution.

Users who were first starting a new Caddy instance during the outage to serve a new site would also have seen this behavior regardless of renewal windows because in that case, there's no valid certificate on disk already, so Caddy quits because it cannot obtain one and serve your site over HTTPS. In this case, you can get around this quite easily by disabling HTTPS or supplying your own certificates (like the good ol' days).


### Why does Caddy behave this way?

If you had to drive over 1,000 miles through the middle of nowhere in a foreign country and you knew you only had a range of 150 miles left in your vehicle but weren't sure if/where you could refill (or recharge), would you even start the journey? You'd probably want some assurances that you could find a gas or charging station that accepted your card, had fuel that was compatible with your vehicle, and if something went wrong, somebody would be around to help out.

This is where Caddy differs a little bit from other web servers. The question everyone asked isn't about technical possibility, it's about _technical policy_. Sure, chances are, there's a fueling station on the way. And it probably does meet your requirements. And of course there'll be somebody around to respond when something goes wrong. It's all likely. But what if that's not the case? You could certainly start your journey and hope for the best, but it's probably good policy to stay home and figure that out before you get yourself stranded.

This is Caddy's approach to your site's availability. When it starts, it has to make a decision that traditional web servers don't need to: will the site be left stranded if I start this way? If so, stop now and get the user's attention. There's no reason to believe that the error will go away merely by the passing of time. For example, you might have misconfigured the CA URL with the `-ca` flag. Maybe a firewall is interfering or someone is dropping packets between your server and the CA. Or worse, your domain has actually been compromised. You need to fix those, and it's not the server's place to assume it's "just" an outage. I've heard your feedback, believe me, but red flags are flying when a server can't communicate with a CA to serve a site. That's by design of PKI: a trusted third party must verify the authenticity of the site in order to be served securely.



## Caddy does not take your sites offline

One common claim in this situation where Caddy refuses to start is that the server took their site offline. This is simply not the case. Once Caddy starts, it doesn't stop, especially just because a certificate can't be renewed. When the process is first starting, Caddy may refuse to start for a number of reasons: the configuration file has invalid syntax (like with other servers), the port can't be bound (like with other servers), or a needed certificate can't be obtained or renewed (unique to servers like Caddy and Traefik).

But refusing to start is not the same as taking your sites offline, because they were not online to begin with. To first start the Caddy process, it must have been stopped before. If there is a problem with what you're telling Caddy to do when it is starting up, Caddy will notify you and exit so you can fix it.


## The change we made yesterday

When Caddy was started before yesterday's change, it would treat any certificate renewal error on startup as a fatal error, demanding your attention. I still stand behind this, as I'm not convinced enough site owners watch their logs. However, I took the counsel of others who found a middle ground. Now, Caddy will continue to start even if the certificate is expiring and renewal failed as long as the certificate is more than 7 days out from expiration.

This gives about 3 weeks of buffer room. If it takes 3 weeks to cycle your server, you might still be affected by such outages. But if your cycles take a matter of minutes, there is more than enough time to not ever notice a failed start because of this again. If your server hasn't been able to talk to the CA for three weeks, something is seriously wrong and definitely demands your attention.

Basically, this issue is not expected to manifest itself any longer unless there is a sustained outage, attack, or misconfiguration.


## Recommendations for site owners

First, we recommend signaling with USR1 to reload configuration changes, rather than stopping and restarting the process. USR1 reloads are graceful and incur zero downtime. If there is an error, Caddy will log it and continue serving the site as before.

Second, if you somehow find yourself in this situation in the future, you may override Caddy's certificate management policies by specifying certificates manually with the [`tls` directive](/docs/tls). You will be responsible for renewing them and reloading the config when that happens, but Caddy will always accept them without question if you provide them explicitly.

Note again that this scenario was already highly localized, and **with v0.10.3, the need for these workarounds was almost entirely eradicated.** If you still need them, it's probably because your server was down for ~3 weeks or you're bringing a new server instance online at an unfortunate time.

Finally, please get involved in the discussion in positive, constructive ways! Search existing issues to see if it has been reported before, then add your 👍 vote or comment with any additional, helpful information. All your feedback is valuable when it contributes to a solution.


## Caddy is more robust during CA outages than other web servers

What didn't get enough attention during this incident is Caddy's high-quality OCSP implementation that kept your sites green during  Let's Encrypt's OCSP responder outage. You just didn't notice because Caddy's OCSP implementation weathered the storm gracefully (whereas sites like [www.gnu.org reportedly went down](https://www.reddit.com/r/sysadmin/comments/6c3j8e/letsencrypt_is_down/dhvn6t3/?context=3) due to [stapling issues](https://gist.github.com/AGWA/1de6c26be5396f7cbce7ee016302d684)).

Caddy is the only web server with a fully automatic, integrated OCSP implementation that is robust against attacks and network outages. Caddy's is enabled automatically and works for all certificates with OCSP information embedded in them. Specifically, Caddy implements points 1, 2, 3, 5, 7, 8, and 10 of [Ryan Sleevi's unofficial Guide to OCSP Stapling](https://gist.github.com/sleevi/5efe9ef98961ecfb4da8). I'll probably write up more about this in a future post.


## The question of policy

So where do we go from here? Automated certificate mangement policies are kind of new, and only a small handful of software supports them. We're still learning what the optimal policies are. There needs to be a good balance between making errors noticable/actionable and letting users do what they want _as long as they understand the risks_ (and this is the hard part, ask [Adrienne Porter Felt](https://twitter.com/__apf__), who engineers Chrome security UI/UX, or [Jean Camp](http://www.ljean.com) who researches risk communication).

When considering certificate management policy, we must remember that TLS, ACME, and OCSP are security protocols. When faced with errors or uncertainty, we could make decisions as though we weren't under attack, but then why are we using security protocols? For instance, if the CA can't verify the domain to issue a certificate, is the certificate which is expiring soon really still valid? If so, what is the point of renewing it? Why not just extend the validity period. There are a number of reasons that make the answers to these questions variable. If a certificate cannot be renewed, it could be because DNS or the domain itself was compromised. Or it could be an attacker dropping packets. Or it could be an innocent outage. It's often impossible to tell, even if some are more likely than others.

We also have to accept the consequences of these decisions. For example, right now Caddy will continue serving a site over HTTPS even if it cannot ever renew its certificate and it expires. Browsers will start showing security warnings. Is this worse or better than disconnecting the site entirely? The server knows the certificate has expired, and the more we show unsuspecting users (harmless?) security warnings, the more likely they are to click through to bypass them. Do we want security warnings to be treated like car alarms, which are now practically useless?

Should the certificate management policy be configurable? I haven't ruled it out. I know most of you will say yes. But I want to make sure we understand what the needs are, what the risks are and how to communicate them, and that takes time. Will there be certain policies to choose from or would each individual behavior be managed? How much configuration surface do we really need to expose, vs. what works well most of the time and in times of duress?

Caddy's security features, as well as the advent of automated certificate management, challenge some of the assumptions we're used to making or never had to make before. We will continue to seek answers to these and other questions to improve Caddy's certificate management policies over time in the best interest of the Web and its future.


## A thank you to the community

I apologize for the frustration that some site owners experienced. I want to express gratitude for those in the community who contributed to a satisfactory solution and avoided extreme or nonsensical reactions. I am especially grateful for the [cheeky humor](https://github.com/mholt/caddy/issues/1680#issuecomment-302775400) displayed after the turn of events. 😁 Hopefully we will see more of this positive engagement in our community in the future.

