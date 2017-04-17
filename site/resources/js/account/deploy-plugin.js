$(function() {
	$('form input:visible').first().focus();

	$('form').submit(function(event) {
		$('.submit').prop('disabled', true).html("Initiating...");

		var pluginID = $('input[name=plugin_id]').val();
		var version = $('input[name=plugin_version]').val();

		if (!version) {
			swal({
				type: "error",
				title: "Version required",
				text: "Please type a tag or paste a commit SHA to release."
			}).then(function() {
				$('input[name=plugin_version]').focus();
				$('.submit').prop('disabled', false).html("Deploy");
			});
			return suppress(event);
		}

		$.post({
			url: $(this).prop("action"),
			contentType: "application/json",
			data: JSON.stringify({
				"plugin_id": pluginID,
				"plugin_version": $('input[name=plugin_version]').val()
			})
		}).done(function(data, status, jqxhr) {
			swal({
				type: "success",
				title: "Deploying",
				text: "The deploy has started. It may take several minutes. You will get a notification with the results."
			}).then(function() {
				window.location = "/account/plugin/"+pluginID;
			});
		}).fail(function(jqxhr, msg, error) {
			swal({
				type: "error",
				titleText: "Error",
				text: jqxhr.responseText
			});
		}).always(function() {
			$('.submit').prop('disabled', false).html("Deploy");
		});

		return suppress(event);
	});
});