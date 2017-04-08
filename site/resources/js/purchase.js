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
					$.post("/tx/purchase", {
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
							text: "Sorry. Your card was not charged. We'll look into this. In the meantime, try a different card? Error message: "+jqxhr.responseText
						});

						if (callbacks && typeof callbacks.fail === 'function') {
							callbacks.fail(product, cycle, dollars);
						}
					});
				}
			});
		}

		// Show Checkout when user clicks Pay for any of the products
		$('.buy-button-container button').click(function(event) {
			var inputName = $(this).data('input-name');
			var period = $('input[name='+inputName+']:checked').val();
			var product = inputName.indexOf("sponsor") != -1 ? "sponsor" : "engpkg";
			cycle = period;
			caddy.showCheckout(product, cycle, {
				success: function(product, cycle, dollars) {
					swal({
							type: "success",
							title: "Thank You",
							text: "Great news - your subscription was successful! We've dispatched a welcome email to you. If you have any questions, you can reply to the welcome email; otherwise, we'll personally send you a greeting very soon."
						});
				}
			});
			return suppress(event);
		});

		// Show invoicing dialogs when user requests an invoice
		$('.request-invoice a').click(function(event) {
			// if invoicing is disabled, make sure the click doesn't do anything
			if ($(this).parent().hasClass('disabled')) {
				return suppress(event);
			}

			var product = $(this).data('product');

			swal.setDefaults({
				title: "Request an Invoice",
				input: 'text',
				animation: false,
				confirmButtonText: 'Next &rarr;',
				showCancelButton: true,
				progressSteps: ['1', '2', '3', '4']
			});
			swal.queue([
				{ html: "Hi! We'll email you an invoice. First, what is <b>your name</b>?" },
				{ html: "What is the <b>email address</b> we should send the invoice to?", input: "email" },
				{ html: "What is the <b>name</b> to whom the invoice should be addressed?" },
				{
					html: "What is the <b>physical mailing address</b> to put on the invoice?",
					input: "textarea",
					confirmButtonText: "Submit"
				}
			]).then(function(result) {
				swal.resetDefaults();

				// collect results
				var name = result[0],
					email = result[1],
					recip = result[2],
					addr = result[3];

				// submit invoice request to backend
				$.post({
					url: "/tx/invoice",
					contentType: "application/json",
					data: JSON.stringify({
						"product": product,
						"cycle": "yearly",
						"person_name": name,
						"invoice_email": email,
						"invoice_name": recip,
						"invoice_addr": addr
					})
				}).done(function(data, status, jqxhr) {
					swal({
						type: "success",
						title: "Invoice Requested",
						text: "We got your request, thanks! You'll hear back from us shortly. We look forward to doing business with you!"
					});
				}).fail(function(jqxhr, msg, error) {
					swal({
						type: "error",
						titleText: "Oops",
						text: jqxhr.responseText
					});
				});
			}, function() {
				swal.resetDefaults();
			});

			return suppress(event);
		});
	});
}