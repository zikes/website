$(function() {
	// Examples
	$('#example-list').on('click', '.add-example', function(event) {
		var $newExample = $('#example-1').clone();
		$('input, textarea', $newExample).val('');
		$('#example-list .add-example').before($newExample);
		updateExampleNums();
		$('input', $('.example').last()).first().focus();
		return suppress(event);
	});
	$('#example-list').on('click', '.delete-example', function(event) {
		var $example = $(this).closest('.example');
		if ($('.example').length == 1) {
			swal({
				type: "error",
				text: "Can't delete the only example, but you can leave it blank."
			});
			return suppress(event);
		}
		$example.remove();
		updateExampleNums();
		return suppress(event);
	});
	function updateExampleNums() {
		$(".example").each(function(index) {
			var id = index + 1;
			$(this).attr('id', 'example-'+id);
			$('.example-num', this).text(id);
		});
	}
	updateExampleNums();
});