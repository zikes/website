$(function() {
	var email = caddy.queryString["email"];
	var token = caddy.queryString["token"];
	$('input[name=email]').val(email);
	$('input[name=token]').val(token);
	if (email && token)
		showStep2();

	$('#reset-password-step1').submit(function(event) {
		$('button').prop('disabled', false);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				type: "success",
				titleText: "Check your email",
				text: "If we have an account with that email address, we just sent you some instructions."
			}).then(function() {
				window.location = '/';
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				type: "error",
				titleText: "Error",
				text: "Sorry, something went wrong: "+error
			});
			$('button').prop('disabled', false);
		});

		return suppress(event);
	});

	$('#reset-password-step2').submit(function(event) {
		$('button').prop('disabled', false);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				type: "success",
				titleText: "Reset Complete",
				text: "You may now log in with your new password."
			}).then(function() {
				window.location = '/account/login';
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				type: "error",
				titleText: "Error",
				text: "Sorry, we were unable to reset your password: "+jqxhr.responseText
			});
			$('button').prop('disabled', false);
		});

		return suppress(event);
	});

	$('#goto-step1').click(function(event) {
		$('#reset-password-step2').hide('fast');
		$('#reset-password-step1').show('fast', function() {
			$('input:visible').first().focus();
		});
		return suppress(event);
	});
	$('#goto-step2').click(function(event) {
		showStep2();
		return suppress(event);
	});
});

function showStep2() {
	$('#reset-password-step1').hide('fast');
	$('#reset-password-step2').show('fast', function() {
		if ($('input[name=token]').val() != "")
			$('input[name=password]').focus();
		else
			$('input:visible').first().focus();
	});
}