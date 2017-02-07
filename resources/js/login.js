$(function() {
	$('#email').focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			var destination = caddy.queryString.redir;
			window.location = destination ? destination : "/account/dashboard";
		}).fail(function(jqxhr, msg, error)
		{
			swal({
				type: "error",
				titleText: "Bad credentials",
				text: error + ": " + jqxhr.responseText
			});
			$('#submit').prop('disabled', false);
		});

		return suppress(event);
	});
});