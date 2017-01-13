$(function() {
	$('form input').first().focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				type: "success",
				title: "Account Activated",
				text: "Thank you. You may now log in and use your account!"
			}).then(function() {
				window.location = "/account/login";
			});
		}).fail(function(jqxhr, msg, error)
		{
			alert(error);
			// if (jqxhr.status == 404)
			// 	$('#password').notify("Incorrect email/password combination. Please try again!");
			// else
			// 	$.notify("Error: " + jqxhr.status + " " + error + ".");

			$('#submit').prop('disabled', false);
		});

		return suppress(event);
	});

	var email = caddy.queryString["email"];
	var acct = caddy.queryString["id"];
	$('input[name=email]').val(email);
	$('input[name=acct]').val(acct);
	if (email && acct) {
		$('form').submit();
	} else {
		$('form input, form button').prop('disabled', false);
	}
});