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
	$('.customizer').on('change', '#platform, .plugin-list input[type=checkbox]', function() {
		updateLinks();
	});

	// select shortcut text for convenience
	$('#direct-link, #bash').click(selectText);

	// Get the information needed to populate this page
	$.get("/api/download-page").done(function(data) {
		var pluginTypes = {};

		pageInfo = data;

		// latest Caddy
		$('#version-value').text(data.latest_caddy.Version);

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
				pt.PluginList.sort(function(a, b) { return a.Name > b.Name });
				var $pt = $('<div class="plugin-type"></div>')
				$pt.append('<div class="plugin-type-header">'
					+ '<b>'+pt.CategoryTitle+'</b>'
					+ '<div class="plugin-type-description">'+pt.Description+"</div>");
				for (var i = 0; i < pt.PluginList.length; i++) {
					var p = pt.PluginList[i];
					$($pt).append('<label class="plugin">'
						+ '<input type="checkbox" data-name="'+p.Name+'"> '+p.Name
						+ '</label>');
				}
				$('#plugin-list').append($pt);
			}
		}



		// platforms
		for (var i = 0; i < data.platforms.length; i++) {
			var p = data.platforms[i];

			// who needs 32-bit builds for macOS?? psh.
			if (p.GOOS == "darwin" && p.GOARCH != "amd64") {
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
			$('#platform').append('<option value="'+platData+'">'+platVisible+'</option>');
		}
		autoPlatform();
	});

	// show donate info when use enters the download area
	$('.download-pane, .download-pane a').mouseenter(function() {
		if (!$('.donate').is(':visible')) {
			$('.donate').slideDown();
		}
	});

	// Stripe Checkout
	var stripeAmount = 0; // stripeAmount is dollar amount * 100
	var checkout = StripeCheckout.configure({
		key: stripePublishableKey,
		image: "/resources/images/caddy-tuff-blue-circle.png",
		name: "Caddy Web Server",
		opened: function() {
			// Report to Analytics
			ga('send', 'event', 'Software', 'Payment', 'Payment Opened', stripeAmount/100);
		},
		closed: function() {
			// This callback is called every time the Checkout popup closes,
			// regardless of whether payment was complete or not.
			
			// Report to Analytics
			ga('send', 'event', 'Software', 'Payment', 'Payment Closed', stripeAmount/100);
		},
		token: function(token) {
			$.post("/stripe/charge", {
				token_id: token.id,
				email: token.email,
				amount: stripeAmount,
				description: "Download Caddy Web Server",
				subscribe_releases: $('#subscribe-releases').prop('checked')
			}).done(function(data) {
				// Report to Analytics
				ga('send', 'event', 'Software', 'Payment', 'Payment Success', stripeAmount/100);

				if (stripeAmount > 2500) {
					$('.result1').show();
					$('.result2').hide();
				} else {
					$('.result1').hide();
					$('.result2').show();
				}
				$('#amount').val("").keyup();
				$('#payment-success').show('medium');
			}).fail(function(jqxhr, status, error) {
				// Report to Analytics
				ga('send', 'event', 'Software', 'Payment', 'Payment Failed', stripeAmount/100);

				swal({
					type: "error",
					title: "Error: " + error,
					html: 'Your card was not charged. You can try again or <a href="/donate">donate</a> using a different payment method.<br><br><small><b>Error message:</b> '+jqxhr.responseText+'</small>',
				});
			});
		}
	});

	var transactionFeeMin = 4; // minimum dollar amount we ask to help cover transaction fees
	$('#amount').keyup(function(event) {
		var val = normalizeAmount($(this).val());
		if (!val) {
			$('#amount-feedback').html('');
			return;
		}
		var amount = parseFloat(val);
		if (monetary(val) && !isNaN(amount)) {
			if (amount <= 0) {
				$('#amount-feedback').html('<span class="clr-red">Aw man. :(</span>');
			} else if (amount < transactionFeeMin) {
				$('#amount-feedback').html('<span class="clr-red">Please go a little higher to cover any transaction fees</span>');
			} else {
				$('#amount-feedback').html('');
			}
			/* else if (amount < 10) {
				$('#amount-feedback').html('<span class="clr-black">Thanks, hope you like it!</span>');
			} else if (amount < 15) {
				$('#amount-feedback').html('<span class="clr-black">Thanks, this buys a lunch!</span>');
			} else if (amount < 25) {
				$('#amount-feedback').html('<span class="clr-black">Thanks, this buys a dinner!</span>');
			} else if (amount < 50) {
				$('#amount-feedback').html('<span class="clr-black">Thank you very much for your support!</span>');
			} else if (amount < 100) {
				$('#amount-feedback').html('<span class="clr-green">Thank you! We\'ll do our best to help you out.</span>');
			} else if (amount < 200) {
				$('#amount-feedback').html('<span class="clr-green">Wow, thank you! This helps us a lot so we can help you. :)</span>');
			} else {
				$('#amount-feedback').html('<span class="clr-green">WOAH, you\'re awesome! :D</span>');
			}*/
		} else {
			$('#amount-feedback').html('<span class="clr-red">Invalid amount</span>');
		}
	});

	// Show Checkout when user clicks Pay
	$('#donate').click(function(event) {
		var input = $('#amount').val();
		var amount = normalizeAmount(input);

		if (!amount) {
			$('#amount-feedback').html('<span class="clr-black">Please type an amount.</span>');
			$('#amount').focus();
			return suppress(event);
		}

		if (!monetary(amount))
		{
			swal({
				type: "error",
				title: "Invalid Amount",
				text: "Please type a simple monetary value only with numbers and maybe a decimal point. (Do not use dollar signs, letters, or symbols.) You typed: "+input,
			});
			return suppress(event);
		}

		amount = parseFloat(amount);
		if (amount < transactionFeeMin) {
			swal({
				type: "warning",
				title: "Transaction Fees",
				text: "We have to cover transaction fees. Can you go just a few dollars higher?",
			});
			return suppress(event);
		}

		stripeAmount = Math.round(amount * 100); // I wish stripe sent the amount into Checkout's token callback

		checkout.open({
			name: "Caddy Web Server",
			amount: stripeAmount,
			locale: "auto",
			bitcoin: true
		});

		return suppress(event);
	});

	// Close Checkout on back button
	$(window).on('popstate', function() {
		checkout.close();
	});

	// download link
	$('#download').click(function(event) {
		$this = $(this);
		if ($this.hasClass('disabled')) {
			return suppress(event);
		}
		disableFields();
		$this.html('<div class="loader"></div> Building...');

		$.ajax($this.attr('href'), { method: "HEAD" }).done(function(data, status, jqxhr) {
			window.location = jqxhr.getResponseHeader("Location");
		}).fail(function(jqxhr, status, error) {
			swal({
				type: "error",
				title: "Error: " + error,
				text: "Sorry about that. You can try again or download Caddy core from our backup site (without any extra features).",
				showCancelButton: true,
				confirmButtonText: "Download Core Now",
				cancelButtonText: "I'll Try Again"
			}).then(function() {
				// showBuildServerDown();
				// window.location = $self.attr('href');
			});
		}).always(function() {
			enableFields();
			$this.html("Download Caddy");
		});

		return suppress(event);
	});

	function disableFields() {
		$('#download, #signature').addClass('disabled');
		$('.plugin-list input, #platform').prop('disabled', true);
	}

	function enableFields() {
		$('#download, #signature').removeClass('disabled');
		$('.plugin-list input, #platform').prop('disabled', false);
	}

	// signature link
	$('#signature').click(function(event) {
		$this = $(this);
		if ($this.hasClass('disabled')) {
			return suppress(event);
		}
		disableFields();
		$this.html('<div class="loader"></div> Building...');

		$.ajax($this.attr('href'), { method: "HEAD" }).done(function(data, status, jqxhr) {
			window.location = jqxhr.getResponseHeader("Location");
		}).fail(function(jqxhr, status, error) {
			swal({
				type: "error",
				title: "Error: " + error,
				text: "Sorry about that. You can try again or download Caddy core from our backup site (without any extra features).",
				showCancelButton: true,
				confirmButtonText: "Download Core Now",
				cancelButtonText: "I'll Try Again"
			}).then(function() {
				// showBuildServerDown();
				// window.location = $self.attr('href');
			});
		}).always(function() {
			enableFields();
			$this.html("Download PGP Signature");
		});

		return suppress(event);
	});

	// Show dialogs explaining mailing list, download link, etc...
	$('#about-emails').click(function(event) {
		swal({
			type: "info",
			title: "Mailing List",
			html: "We don't sell or share your email address, and we only send you email when new Caddy releases are available.<br><br>You can unsubscribe at any time.",
		});
		return suppress(event);
	});
	$('#about-direct-link').click(function(event) {
		swal({
			type: "info",
			title: "Direct Link",
			html: "This is a direct link to download Caddy with the plugins you've selected. By making a GET request to this URL, the latest version of Caddy and the selected plugins will be downloaded. If Caddy must be built first, please wait a few moments before the download begins.",
		});
		return suppress(event);
	});
	$('#about-getcaddy').click(function(event) {
		swal({
			type: "info",
			title: "getcaddy.com Installer",
			html: 'Piping the script at <a href="https://getcaddy.com">https://getcaddy.com</a> into <code>bash</code> will install Caddy for you. It\'s safe to run since the connection is over HTTPS and the script is wrapped in a function. Feel free to inspect its contents for yourself.',
		});
		return suppress(event);
	});
});

// normalizeAmount sanitizes amt by trimming spaces
// replacing "," decimal with ".", if needed,
// and removing thousands separators.
// It does not change the original input value otherwise.
function normalizeAmount(amt) {
	amt = amt.trim(amt);
	var parts = amt.split(",");
	if (parts.length == 2 && parts[1].length == 2) {
		parts[0] = parts[0].replace(".", ""); // strip unneeded thousands sep
		amt = parts.join(".");
	} else {
		amt = amt.replace(",", "");
	}
	return amt;
}

// monetary returns whether val looks like a valid monetary value.
function monetary(val) {
	return /^((\d+(\.*\d{0,2})?)|(\d*\.\d{1,2}))$/.test(val);
}

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

	$('#platform').val(selString).change();
}

function updateLinks() {
	var command = "curl https://getcaddy.com | bash";
	var plugins = getPluginListString();
	if (plugins) {
		command += " -s "+plugins;
	}
	// TODO: Signature link...?
	$('#download').attr('href', getDownloadLink(false, true));
	$('#signature').attr('href', getDownloadLink(true, true));
	$('#direct-link').text(getDownloadLink(false, false));
	$('#bash').text(command);
}

function getPluginListString() {
	var pluginList = "";
	var pluginNames = [];
	var selectedPlugins = $('.plugin-list input[type=checkbox]:checked');
	for (var i = 0; i < selectedPlugins.length; i++) {
		pluginNames.push($(selectedPlugins[i]).data('name'));
	}
	pluginNames.sort();
	return pluginNames.join(",");
}

function getDownloadLink(isSignature, rootRelative) {
	var platformParts = $('#platform').val().split("-");
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
