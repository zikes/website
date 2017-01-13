// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-86578-24', 'auto');
ga('send', 'pageview');

$(function() {
	$('nav .menu-link').click(function() {
		$('nav').toggleClass('expanded');
	});

	// Report mailing list subscriptions to Analytics
	$('#mc-embedded-subscribe-form').submit(function() {
		ga('send', 'event', 'Mailing List', 'Subscribe', 'Release Announcements');
	});

	// Select commands on click, for convenience
	$('code.cmd').click(selectText);
});


var caddy = {
	queryString: {},
	hash: {}
};

parseQueryString();

// Get values out of the query string and into the caddy global var;
// also gets the hash portion, without the # character.
function parseQueryString()
{
	if (window.location.hash)
		caddy.hash = window.location.hash.substr(1);

	var qs = window.location.search;
	if (!qs)
		return caddy.queryString;
	if (qs.length > 0 && qs[0] == "?")
		qs = qs.substring(1);
	var pairs = qs.split("&");
	for (var i = 0; i < pairs.length; i++)
	{
		var pair = pairs[i];
		keyVal = pair.split("=", 2);
		if (keyVal.length == 1)
			keyVal.push(true);	// empty values default to boolean true so we can know they exist (this is our convention)
		var key = decodeURIComponent(keyVal[0].replace(/\+/g, " "));
		var val = typeof keyVal[1] === 'string'
					? decodeURIComponent(keyVal[1].replace(/\+/g, " "))
					: keyVal[1];
		caddy.queryString[key] = val;
	}

	return caddy.queryString;
}

function selectText() {
	if (document.selection) {
		var range = document.body.createTextRange();
		range.moveToElementText(this);
		range.select();
	} else if (window.getSelection) {
		var range = document.createRange();
		range.selectNode(this);
		window.getSelection().addRange(range);
	}
}

// Completely suppresses an event in all browsers
function suppress(event)
{
	if (!event)
		return false;
	if (event.preventDefault)
		event.preventDefault();
	if (event.stopPropagation)
		event.stopPropagation();
	event.cancelBubble = true;
	return false;
}