The Caddy Website
===============

This is the source of the front of the Caddy website, [caddyserver.com](https://caddyserver.com).

Deploys of the site are automatic with pushes to the `release` branch.


## Running the Site

1. Clone this repository to a folder.

2. `cd` into the root of the repository, which contains a Caddyfile.

3. Run `caddy`.

You can then load [localhost:2015](http://localhost:2015) and click around most of the site. The dynamic parts of the site are powered by the [developer portal](https://github.com/caddyserver/devportal), and the build/deploy functions by a [build worker](https://github.com/caddyserver/buildworker). To work on the site locally, you should have at least the dev portal running so you can access the documentation pages and account area. If you wish to test builds (downloads), you'll need a build worker running.

## Blog

The blog is powered by [hugo](https://github.com/spf13/hugo). Blog posts go in the `blogposts` folder, then run `hugo` to regenerate the blog. Generated pages are not committed to the repository.


## Contributing

Please feel free to make pull requests to improve the website! We welcome contributions to make its content better.

Plugin documentation is not hosted on this site - only documentation for standard Caddy functions and features is in this repository. If you would like to improve a plugin's documentation, please get in touch with the plugin's author instead.

For drastic changes to the site, please open an issue first to discuss it. Thank you!
