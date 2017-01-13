$(function() {
	$('a.logout').click(function(event) {
		$.post('/api/logout', $(this).serialize()).done(function() {
			window.location = "/";
		}).fail(function(jqxhr, msg, error)
		{
			alert(error);
			// if (jqxhr.status == 404)
			// 	$('#password').notify("Incorrect email/password combination. Please try again!");
			// else
			// 	$.notify("Error: " + jqxhr.status + " " + error + ".");
		});
		return suppress(event);
	});

	$('.row-selectable').on('click', 'tr', function() {
		$('input[type=radio]', this).prop("checked", true);
	});
});