$(function() {
	$('a.logout').click(function(event) {
		$.post('/api/logout', $(this).serialize()).done(function() {
			window.location = "/";
		}).fail(function(jqxhr, msg, error)
		{
			swal({
				type: "error",
				titleText: error
			});
		});
		return suppress(event);
	});

	$('.row-selectable').on('click', 'tr', function() {
		$('input[type=radio]', this).prop("checked", true);
	});

	$('.notif-body').click(function(event) {
		return suppress(event);
	});
	$('.notification:not(.no-expand) .notif-main').click(function(event) {
		$('.notif-body', this).slideToggle('fast');
	});
	$('.notification .notif-dismiss').click(function() {
		var $notif = $(this).closest('.notification');
		var notifID = $notif.data("id");
		$.post('/account/notification/'+notifID+'/delete').done(function() {
			$notif.fadeOut();
		}).fail(function(jqxhr, msg, error) {
			swal({
				type: "error",
				titleText: error
			});
		});
	});
	$('.notification').click(function() {
		var $notif = $(this).closest('.notification');
		var read = $notif.hasClass('notif-ack');
		if (read) return;
		var notifID = $notif.data("id");
		$.post('/account/notification/'+notifID+'/ack');
		$notif.addClass("notif-ack");
		if ($('.notification').length == $('.notification.notif-ack').length) {
			$('.notif-badge').hide(); // if all are ack'ed, hide the badge showing unread notifications
		}
	});
});