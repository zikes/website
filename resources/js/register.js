$(function() {
	$('form input').first().focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				type: "success",
				title: "Check your email",
				text: "We've sent you an email with a link that expires in 48 hours. Please verify your account before you can use it."
			}).then(function() {
				window.location = "/account/verify";
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
});