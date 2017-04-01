$(function() {
	$('form input:visible').first().focus();

	function copyFormValue(fieldName) {
		$('.part2 form input[name='+fieldName+']').val($('.part1 form input[name='+fieldName+']').val());
	}

	// PART 1 SUBMIT
	$('.part1 form').submit(function(event) {
		var $importPathInput = $('.part1 input[name=import_path]');
		if (/https?:\/\//i.test($importPathInput.val())) {
			alert("Import path should be a fully qualified package name, not a URL; use import \"pkg/path\" syntax.");
			$importPathInput.focus();
			return suppress(event);
		}
		var $repoPathInput = $('.part1 input[name=clone_url]');
		if (!/https:\/\//i.test($repoPathInput.val())) {
			swal({
				type: "error",
				text: "Repository must be a git repo in the HTTPS format."
			}).then(function() {
				$repoPathInput.focus();
			});
			return suppress(event);
		}

		$('.part1 .submit').prop('disabled', true).html("Analyzing...");

		$.post($(this).prop("action"), $(this).serialize()).done(function(data, status, jqxhr) {
			// TODO: If data == null or data.length == 0... then what.

			$('#plugin-list .plugin-row').remove();

			for (var i = 0; i < data.length; i++) {
				$('#plugin-list').append('<tr class="plugin-row"><td>'
					+ '<input type="radio" name="plugin_name" value="'+data[i].Name+'" data-plugin-type="'+data[i].Type.ID+'">'
					+ '</td>'
					+ '<td><code>'+data[i].Name+'</code></td>'
					+ '<td>'+data[i].Type.Name+'</td></tr>');
			}

			if (data.length == 1) {
				$('#plugin-list input[type=radio]').first().click();
			}

			copyFormValue("clone_url");
			copyFormValue("version");
			copyFormValue("import_path");
			$('#pkg-name').text($('.part1 input[name=import_path]').val());

			// if we recognize the source control provider, we can pre-fill a few fields
			var repoPath = $('.part1 input[name=clone_url]').val();
			if (repoPath.indexOf("://github.com/") > 0 || repoPath.indexOf("://www.github.com/")) {
				var plainURL = repoPath.substring(0, repoPath.lastIndexOf(".git"))
				$('.part2 input[name=website]').val(plainURL);
				$('.part2 input[name=docs_link]').val(plainURL+"/blob/master/README.md");
				$('.part2 input[name=support_link]').val(plainURL+"/issues");
			}

			$('.part1').slideUp(200);
			$('.part2').slideDown(200);
		}).fail(function(jqxhr, msg, error) {
			swal({
				type: "error",
				titleText: "Error",
				text: jqxhr.responseText
			});
		}).always(function() {
			$('.part1 .submit').prop('disabled', false).html("Next &rsaquo;");
		});

		return suppress(event);
	});

	// PART 2 SUBMIT
	$('.part2 form').submit(function(event) {
		$('.part2 input[name=plugin_type]').val($('#plugin-list input[type=radio]:checked').data("plugin-type"));

		$('.part2 .submit').prop('disabled', true).html("Submitting...");

		$.post($(this).prop("action"), $(this).serialize()).done(function(data, status, jqxhr) {
			$('.part2').slideUp(200);
			$('.part3').slideDown(200);
		}).fail(function(jqxhr, msg, error) {
			swal({
				type: "error",
				titleText: error
			});
		}).always(function() {
			$('.part2 .submit').prop('disabled', false).html("Publish");
		});

		return suppress(event);
	});

	// PART 2 GO BACK
	$('.part2 .goback').click(function(event) {
		$('.part2').slideUp(200);
		$('.part1').slideDown(200);
		$('form input:visible').first().focus();
		return suppress(event);
	});
});