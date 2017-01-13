$(function() {
	$('#email').focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			var destination = caddy.queryString.redir;
			window.location = destination ? destination : "/account/dashboard";
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