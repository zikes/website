$(function() {
	var buildServerDown = false;
	var stripePublishableKey = (window.location.hostname == "caddyserver.com") ? "pk_live_PRNBeH2wF2OD9fRO0bZ1Zj6i" : "pk_test_tvnNemXjiZkKVeNwRm0LKtQ1";
	var platformTranslations = {
		"GOOS": {
			"linux": "Linux",
			"darwin": "macOS",
			"windows": "Windows",
			"freebsd": "FreeBSD",
			"openbsd": "OpenBSD",
			"netbsd": "NetBSD",
			"dragonfly": "Dragonfly",
			"solaris": "Solaris",
			"android": "Android"
		},
		"GOARCH": {
			"386": "32-bit",
			"amd64": "64-bit",
			"arm": "ARM"
		}
	};
	var pageInfo = {};

	// update shortcuts when fields are modified
	$('.download-header').on('change', '.platform-list input[type=radio], #plugin-list input[type=checkbox]', function() {
		var numPlugins = $('#plugin-list input[type=checkbox]:checked').length;
		var pluginsText = "Add plugins";
		if (numPlugins > 0) {
			pluginsText = numPlugins+' plugin'+(numPlugins == 1 ? '' : 's');
		}
		$('#plugins').text(pluginsText);
		updateLinks();
	});

	// bold selected platform when changed
	$('.download-header').on('click', '.platform-option', function() {
		$('.platform-option.selected').removeClass('selected');
		$(this).addClass('selected');
		$('#platform').text($(this).text().trim());
	});

	// select shortcut text for convenience
	$('.shortcut').click(function() {
		this.setSelectionRange(0, this.value.length)
	});

	// Get the information needed to populate this page
	$.get("/api/download-page").done(function(data) {
		pageInfo = data;

		var pluginTypes = {};

		// latest Caddy
		$('#version').text(data.latest_caddy.Version);

		// plugins
		if (data.plugins) {
			for (var i = 0; i < data.plugins.length; i++) {
				var p = data.plugins[i];
				if (!pluginTypes[p.Type.ID]) {
					pluginTypes[p.Type.ID] = p.Type;
					pluginTypes[p.Type.ID].PluginList = [];
				}
				pluginTypes[p.Type.ID].PluginList.push(p);
			}
			for (pluginTypeID in pluginTypes) {
				var pt = pluginTypes[pluginTypeID];
				pt.PluginList.sort(function(a, b) { return a.Name > b.Name ? 1 : -1 });
				var $pt = $('<div class="plugin-type"></div>')
				$pt.append('<div class="plugin-type-header">'
					+ '<b>'+pt.CategoryTitle+'</b>'
					+ '<div class="plugin-type-description">'+pt.Description+"</div>");
				for (var i = 0; i < pt.PluginList.length; i++) {
					var p = pt.PluginList[i];
					$($pt).append('<label class="plugin" data-id="'+p.ID+'">'
						+ '<input type="checkbox" data-name="'+p.Name+'"> '+p.Name
						+ '<span class="plugin-info-icon">i</span></label>');
				}
				$('#plugin-list').append($pt);
			}
		}

		// platforms; first group by OS
		var platformsByOS = {};
		for (var i = 0; i < data.platforms.length; i++) {
			var p = data.platforms[i];

			// who needs 32-bit builds for macOS?? psh.
			if (p.GOOS == "darwin" && p.GOARCH == "386") {
				continue;
			}

			var platData = p.GOOS+'-'+p.GOARCH;
			if (p.GOARM) {
				platData += '-'+p.GOARM;
			}
			var platVisible = (platformTranslations["GOOS"][p.GOOS] || p.GOOS)
							+ " " + (platformTranslations["GOARCH"][p.GOARCH] || p.GOARCH);
			if (p.GOARM) {
				platVisible += "v"+p.GOARM;
			}
			if (p.GOOS == "darwin") {
				platVisible = "macOS"; // only 64-bit, so no need for arch
			}

			if (!platformsByOS[p.GOOS])
				platformsByOS[p.GOOS] = [];
			platformsByOS[p.GOOS].push({value: platData, name: platVisible});
		}

		// now render platforms to the page, grouped by OS;
		// we use some logic to ensure each column is approximately
		// the same height
		var counter = 0;
		var $platformList = $('<div class="platform-list"></div>');
		for (var goos in platformsByOS) {
			if (counter + platformsByOS[goos].length > 8) {
				$platformList = $('<div class="platform-list"></div>');
				counter = 0;
			}
			var osCategory = platformTranslations["GOOS"][goos];
			if (goos == "darwin" || goos == "ios")
				osCategory = "Apple";
			$platformList.append('<h3>'+osCategory+'</h3>');
			for (var i = 0; i < platformsByOS[goos].length; i++) {
				counter++;
				var p = platformsByOS[goos][i];
				$platformList.append('<label class="platform-option"><input type="radio" name="platform" value="'+p.value+'"> '+p.name+'</label>');
			}
			$('#platform-lists').append($platformList);
		}
		autoPlatform();
		updateLinks();
	}).fail(function(jqxhr, status, error) {
		$('#instructions, #download-controls, .caddy-extras').hide();
		$('#downloads-unavailable').show();
	});

	// Show or hide the platform chooser
	$('#platform').click(function(event) {
		var show = !$('#platform-chooser-holder').is(':visible')
		$('.download-info .holder').hide(100);
		if (show)
			$('#platform-chooser-holder').show(100);
		return suppress(event);
	});

	// Show or hide the plugin chooser
	$('#plugins').click(function(event) {
		var show = !$('#plugin-chooser-holder').is(':visible')
		$('.download-info .holder').hide(100);
		if (show)
			$('#plugin-chooser-holder').show(100);
		return suppress(event);
	});

	// Hide the platform or plugin choosers when closed
	$('.close, #plugin-done').click(function(event) {
		$('.download-info .holder').hide(100);
		return suppress(event);
	});

	// When plugin info is clicked, show it in the pane
	$('#plugin-list').on('click', '.plugin-info-icon', function(event) {
		var pluginID = $(this).parent('.plugin').data('id');
		var plugin;
		for (var i = 0; i < pageInfo.plugins.length; i++) {
			if (pageInfo.plugins[i].ID == pluginID) {
				plugin = pageInfo.plugins[i];
				break;
			}
		}
		if (!plugin)
			return suppress(event);

		$('#plugin-name').text(plugin.Name);
		// TODO: Show the HTTP server as a plugin, a default required one?
		var pluginType = plugin.Type.Name;
		if (plugin.Type.ID == "generic" && (plugin.Name.indexOf("http.") == 0 || plugin.Name.indexOf("dns.") == 0))
			pluginType = plugin.Name.substr(0, plugin.Name.indexOf(".")).toUpperCase() + " " + pluginType;
		$('#plugin-type').text(pluginType);
		$('#plugin-description').html(marked(plugin.Description));
		$('#plugin-owner').text(plugin.OwnerName);
		$('#plugin-updated').text(plugin.LastUpdate);
		var version = plugin.Releases[0].Version;
		if (version.length == 40)
			version = version.substr(0, 8);
		$('#plugin-version').text(version);
		$('#plugin-docs').attr('href', "/docs/"+plugin.Name);
		$('#plugin-support').attr('href', plugin.Support);
		$('#plugin-website').attr('href', plugin.Website);
		$('#plugin-howto').hide(150);
		$('#plugin-info').show(150);
		return suppress(event);
	});

	function handleBuildError(jqxhr, status, error, isSignature) {
		if (jqxhr.status == 502) {
			swal({
				type: "error",
				title: "Maintenance",
				html: 'Sorry about this, but it seems the build server is undergoing maintenance. You can try again later or <a href="https://github.com/mholt/caddy/releases/latest">download Caddy from GitHub</a> right now!'
			});
		} else if (jqxhr.status == 404 && isSignature) {
			swal({
				type: "error",
				title: "Signature Unavailable",
				text: "Sorry, but there is not a signature available for this build."
			});
		} else {
			swal({
				type: "error",
				title: "Error: " + error,
				html: 'Oops. Maybe one of the plugins is temporarily broken. Try adjusting which plugins you\'ve selected, or <a href="https://github.com/mholt/caddy/releases/latest">download Caddy from GitHub</a> without any plugins (it will always work!).'
			});
		}
	}

	// download link
	$('#download').click(function(event) {
		$this = $(this);
		if ($this.hasClass('disabled')) {
			return suppress(event);
		}
		disableFields();

		var cart = [];
		if ($('#sponsor').is(':checked')) {
			cart.push("sponsor");
		}
		if ($('#engpkg').is(':checked')) {
			cart.push("engpkg");
		}

		function initDownload() {
			var platformLabel = $('input[name=platform]:checked').val() || '';
			ga('send', 'event', 'Software', 'Download', platformLabel);

			$.ajax($this.attr('href'), { method: "HEAD" }).done(function(data, status, jqxhr) {
				window.location = jqxhr.getResponseHeader("Location");
			}).fail(function(jqxhr, status, error) {
				handleBuildError(jqxhr, status, error, false);
			}).always(function() {
				enableFields();
			});
		}

		// doCheckout goes through checkout for any/all products
		// in the cart, one at a time.
		function doCheckout(product) {
			cart.splice(0, 1);
			var cycle = "monthly";
			caddy.showCheckout(product, cycle, {
				opened: function(product, cycle, amount) {
					// checkout window opened
				},
				closed: function(product, cycle, amount) {
					// checkout window closed in any case
					enableFields();
				},
				success: function(product, cycle, amount) {
					// checkout was successful
					if (cart.length > 0) {
						doCheckout(cart[0]);
						return;
					}
					initDownload();
					swal({
						type: "success",
						title: "Thank you for your purchase!",
						text: "Your subscription is now active, and Caddy is downloading. You'll receive an email soon with more information!"
					});
				},
				fail: function(product, cycle, amount) {
					// checkout failed
					enableFields();
				}
			});
		}

		if (cart.length > 0) {
			doCheckout(cart[0]);
			return suppress(event);
		} else {
			initDownload();
		}

		return suppress(event);
	});

	// signature link
	$('#signature').click(function(event) {
		$this = $(this);
		if ($this.hasClass('disabled')) {
			return suppress(event);
		}
		disableFields();

		var platformLabel = $('input[name=platform]:checked').val() || '';
		ga('send', 'event', 'Software', 'Download Signature', platformLabel);

		$.ajax($this.attr('href'), { method: "HEAD" }).done(function(data, status, jqxhr) {
			window.location = jqxhr.getResponseHeader("Location");
		}).fail(function(jqxhr, status, error) {
			handleBuildError(jqxhr, status, error, true);
		}).always(function() {
			enableFields();
		});

		return suppress(event);
	});

	// Show dialogs explaining the download shortcuts (link and bash script)
	$('#about-direct-link').click(function(event) {
		swal({
			type: "info",
			title: "Direct Link",
			html: "This is a direct link to download the Caddy build you've configured. By making a GET request to this URL, the latest version of Caddy and the selected plugins will be downloaded. If Caddy must be built first, please wait a few moments before the download begins.",
		});
		return suppress(event);
	});
	$('#about-getcaddy').click(function(event) {
		swal({
			type: "info",
			title: "Installer Script",
			html: 'Piping the script at <a href="https://getcaddy.com">https://getcaddy.com</a> into <code>bash</code> will install Caddy for you. According to a threat model standard for most users, this script is designed to be safe to pipe. Feel free to inspect its contents!',
		});
		return suppress(event);
	});

	function disableFields() {
		$('#download, #signature').addClass('disabled');
		$('#plugin-list input, #platform').prop('disabled', true);
		$('#download').html('<div class="loader"></div> Building...');
	}
	function enableFields() {
		$('#download, #signature').removeClass('disabled');
		$('#plugin-list input, #platform').prop('disabled', false);
		$('#download').html("Download");
	}
});

// autoPlatform choooses the platform in the list that best
// matches the user's browser, if it's available.
function autoPlatform() {
	// assume 32-bit linux, then change OS and architecture if justified
	var os = "linux", arch = "386", arm = "";

	// change os
	if (/Macintosh/i.test(navigator.userAgent)) {
		os = "darwin";
	} else if (/Windows/i.test(navigator.userAgent)) {
		os = "windows";
	} else if (/FreeBSD/i.test(navigator.userAgent)) {
		os = "freebsd";
	} else if (/OpenBSD/i.test(navigator.userAgent)) {
		os = "openbsd";
	}

	// change architecture
	if (os == "darwin" || /amd64|x64|x86_64|Win64|WOW64|i686|64-bit/i.test(navigator.userAgent)) {
		arch = "amd64";
	} else if (/arm64/.test(navigator.userAgent)) {
		arch = "arm64";
	} else if (/ ARM| armv/.test(navigator.userAgent)) {
		arch = "arm";
	}

	// change arm version
	if (arch == "arm") {
		arm = "7"; // assume version 7 by default
		if (/armv6/.test(navigator.userAgent)) {
			arm = "6";
		} else if (/armv5/.test(navigator.userAgent)) {
			arm = "5";
		}
	}

	var selString = os+"-"+arch;
	if (arm != "") {
		selString += "-"+arm;
	}

	$('input[value='+selString+']').click();
}

function updateLinks() {
	var command = "curl https://getcaddy.com | bash";
	var plugins = getPluginListString();
	if (plugins) {
		command += " -s "+plugins;
	}
	$('#download').attr('href', getDownloadLink(false, true));
	$('#signature').attr('href', getDownloadLink(true, true));
	$('#direct-link').val(getDownloadLink(false, false));
	$('#getcaddy-bash').val(command);
}

function getPluginListString() {
	var pluginList = "";
	var pluginNames = [];
	var selectedPlugins = $('#plugin-list input[type=checkbox]:checked');
	for (var i = 0; i < selectedPlugins.length; i++) {
		pluginNames.push($(selectedPlugins[i]).data('name'));
	}
	pluginNames.sort();
	return pluginNames.join(",");
}

function getDownloadLink(isSignature, rootRelative) {
	var platformParts = $('input[name=platform]:checked').val().split("-");
	var os = platformParts[0];
	var arch = platformParts[1];
	var arm = platformParts.length > 2 ? platformParts[2] : "";

	var link = rootRelative ? "" : "https://caddyserver.com";
	link += "/download/"+os+"/"+arch+arm;
	if (isSignature) {
		link += "/signature"
	}
	var plugins = getPluginListString();
	if (plugins) {
		link += "?plugins="+plugins
	}

	return link
}
