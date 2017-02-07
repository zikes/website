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
			swal({
				type: "error",
				titleText: error,
				text: jqxhr.responseText
			});
			$('#submit').prop('disabled', false);
		});

		return suppress(event);
	});
});