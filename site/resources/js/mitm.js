// TODO: Try pushing this?
if (window.location.protocol == "https:") {
	$.get("/resources/mitm.html").done(function(data) {
		var result = JSON.parse(data);
		$('.demo-explanation').hide();

		if (result.mitm_likely) {
			$('.demo-result').text("MITM Likely");
			$('.demo-mitm-likely').show();
			$('.demo').addClass("mitm-likely");
		} else {
			$('.demo-result').text("MITM Unlikely");
			$('.demo-mitm-unlikely').show();
			$('.demo').addClass("mitm-unlikely");
		}
		
	}).fail(function(error) {
		console.log("Error loading MITM check:", error);
		$('.demo-result').text("(Unable to load)");
	});
} else {
	$(function() {
		$('.demo-result').text("Not HTTPS");
		$('.demo-unavailable').show();
	});
}