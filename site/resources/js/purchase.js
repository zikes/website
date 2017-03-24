//
// NOTE: This file depends on Stripe's Checkout.js.
//

var purchaseIncludedOnce = purchaseIncludedOnce;
if (!purchaseIncludedOnce) {
	purchaseIncludedOnce = true;

	// because of the guard above, this closure will only execute once
	$(function() {
		var stripePublishableKey = (window.location.hostname == "caddyserver.com") ? "pk_live_PRNBeH2wF2OD9fRO0bZ1Zj6i" : "pk_test_tvnNemXjiZkKVeNwRm0LKtQ1";

		// make each instance of a purchase form unique
		$('.purchase').each(function(idx) {
			var $radio = $('input[type=radio]', this);
			var nameBase = $radio.attr('name');
			var uniqueName = nameBase + '-' + idx;
			$radio.attr('name', uniqueName);
			if ($radio.closest('.yearly').length > 0) {
				$radio.prop('checked', true);
			}
			$('.buy-button-container button', this).data('input-name', uniqueName);
		});

		// when a price option is selected, bold the text and enable/disable the invoice option
		$('.purchase input[type=radio]').click(function() {
			var name = $(this).attr('name');
			var $purchase = $(this).closest('.purchase')
			var $invoice = $('.request-invoice', $purchase);
			var $label = $(this).closest('label');

			// enable/disable invoicing depending if yearly or monthly is selected,
			// also be sure to toggle the tooltip depending on the option.
			if ($label.hasClass("yearly"))
				$invoice.removeClass('disabled')
						.attr('data-tooltip-stored', $invoice.attr('data-tooltip'))
						.removeAttr('data-tooltip');
			else
				$invoice.addClass('disabled')
						.attr('data-tooltip', $invoice.attr('data-tooltip-stored'))
						.removeAttr('data-tooltip-stored');

			// remove the checked class from others in this 
			$('input[type=radio]', $purchase).closest('label').removeClass('checked');
			$label.addClass('checked');
		});

		// Stripe Checkout
		var product, cycle;
		var stripeCheckout = StripeCheckout.configure({
			key: stripePublishableKey,
			image: "/resources/images/favicon.png",
			bitcoin: false, // TODO (3/2017): bitcoin is not a reusable resource, cannot be used for subscriptions
			locale: "auto"
			// the rest of the fields are configured with the call to open()
		});

		// getPrice gets the price of the product in US DOLLARS.
		// product: sponsor, engpkg
		// cycle: monthly, yearly
		caddy.getPrice = function(product, cycle) {
			if (product == "sponsor") {
				return cycle == "monthly" ? 500 : 5000;
			} else if (product == "engpkg") {
				return cycle == "monthly" ? 900 : 9900;
			}
			return -1;
		}

		// showCheckout shows the checkout for the given product and cycle.
		// product: sponsor, engpkg
		// cycle: monthly, yearly
		// callbacks are optional: opened, closed, success, fail.
		caddy.showCheckout = function(product, cycle, callbacks) {
			var dollars = caddy.getPrice(product, cycle);
			if (dollars < 0) {
				swal({
					type: "error",
					title: "Invalid price",
					text: "Whoops, we had a problem getting the price in preparation for payment. Can you let us know so we can fix it?"
				});
				return;
			}
			var cents = Math.round(dollars * 100);
			stripeCheckout.open({
				amount: cents,
				name: product == "sponsor" ? "Caddy Sponsorship" : "Caddy Engineering",
				description: cycle == "monthly" ? "Auto-Billed Monthly" : "Auto-Billed Yearly",
				opened: function() {
					// Checkout popup opened.
					ga('send', 'event', 'Payment', 'Checkout Opened', product+'-'+cycle, dollars);

					if (callbacks && typeof callbacks.opened === 'function') {
						callbacks.opened(product, cycle, dollars);
					}
				},
				closed: function() {
					// This callback is called every time the Checkout popup closes,
					// regardless of whether payment was complete or not.
					ga('send', 'event', 'Payment', 'Checkout Closed', product+'-'+cycle, dollars);

					if (callbacks && typeof callbacks.closed === 'function') {
						callbacks.closed(product, cycle, dollars);
					}
				},
				token: function(token) {
					$.post("/stripe/purchase", {
						token_id: token.id,
						email: token.email,
						product: product,
						cycle: cycle,
						//subscribe_releases: $('#subscribe-releases').prop('checked') // TODO?
					}).done(function(data) {
						ga('send', 'event', 'Payment', 'Checkout Success', product+'-'+cycle, dollars);

						if (callbacks && typeof callbacks.success === 'function') {
							callbacks.success(product, cycle, dollars);
						}
					}).fail(function(jqxhr, status, error) {
						ga('send', 'event', 'Payment', 'Checkout Failed', product+'-'+cycle, dollars);

						swal({
							type: "error",
							title: "Error: " + error,
							html: 'Sorry. Your card was not charged. We\'ll look into this. In the meantime, try a different card?<br><br><small><b>Error message:</b> '+jqxhr.responseText+'</small>'
						});

						if (callbacks && typeof callbacks.fail === 'function') {
							callbacks.fail(product, cycle, dollars);
						}
					});
				}
			});
		}

		// Show Checkout when user clicks Pay
		$('.buy-button-container button').click(function(event) {
			var inputName = $(this).data('input-name');
			var period = $('input[name='+inputName+']:checked').val();
			product = inputName.indexOf("sponsor") != -1 ? "sponsor" : "engpkg";
			cycle = period;
			caddy.showCheckout(product, cycle);
			return suppress(event);
		});

		// Show invoicing dialogs when user requests an invoice
		$('.request-invoice a').click(function(event) {
			// if invoicing is disabled, make sure the click doesn't do anything
			if ($(this).parent().hasClass('disabled')) {
				return suppress(event);
			}

			swal.setDefaults({
				input: 'text',
				animation: false,
				confirmButtonText: 'Next &rarr;',
				showCancelButton: true,
				progressSteps: ['1', '2', '3', '4']
			});

			var steps = [
				{
					title: "Request an Invoice",
					text: "First we just need your name, email address, and company name and address.",
					input: false
				},
				"Your Name",
				"Email Address",
				{
					title: "Company Name and Address",
					text: "Last step! Please provide the name and address of the company or individual being invoiced:",
					input: 'textarea',
					confirmButtonText: "Request Invoice"
				}
			];

			swal.queue(steps).then(function(result) {
				swal.resetDefaults();

				// TODO. post to backend, including product & cycle information

				swal({
					title: 'All done!',
					html: 'Your answers: <pre>' +
							JSON.stringify(result) +
							'</pre>',
					confirmButtonText: 'Lovely!',
					showCancelButton: false
				});
			}, function() {
				swal.resetDefaults();
			});

			return suppress(event);
		});
	});
}