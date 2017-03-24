$(function() {
	$('.email-toggle').click(function() {
		$.post("/api/toggle-email?level="+$(this).data('level')+"&enabled="+$(this).prop('checked'));
	});
});