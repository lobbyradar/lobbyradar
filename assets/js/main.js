// better cross-browser support

// share facebook button
//function fbShare(url, title, descr, image, winWidth, winHeight) {
//	var winTop = (screen.height / 2) - (winHeight / 2);
//	var winLeft = (screen.width / 2) - (winWidth / 2);
//	window.open('http://www.facebook.com/sharer.php?s=100&p[title]=' + title + '&p[summary]=' + descr + '&p[url]=' + url + '&p[images][0]=' + image, 'sharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
//}

$(document).ready(function () {
	moment.locale('de');

	function getDocHeight() {
		var D = document;
		return Math.max(
			D.body.scrollHeight, D.documentElement.scrollHeight,
			D.body.offsetHeight, D.documentElement.offsetHeight,
			D.body.clientHeight, D.documentElement.clientHeight
		);
	}

	function setWidthHeight() {
		var staticHeight = "";
		var winHeight = $(window).height();
		var winWidth = $(window).width();
		var docHeight = getDocHeight();

		if (docHeight > winHeight) {
			staticHeight = docHeight;
		}
		else {
			staticHeight = winHeight;
		}

		$('.fullscreen').css({'width': winWidth, 'height': winHeight});
		$('.static-page').css({'width': winWidth, 'minHeight': staticHeight});
	}



	// share twitter button
	$('a.tweet').click(function (e) {
		e.preventDefault();
		var loc = $(this).attr('href');
		var title = encodeURIComponent($(this).attr('title'));
		window.open('http://twitter.com/share?url=' + loc + '&text=' + title + '&', 'twitterwindow', 'height=450, width=550, top=' + ($(window).height() / 2 - 225) + ', left=' + $(window).width() / 2 + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
	});

	setWidthHeight();

	// http://stackoverflow.com/questions/16437182/issue-with-a-scrollable-div-on-ipad
	$('body').on('touchmove', '.scrollable', function (e) {
		var tot = 0;
		$(this).children('li:visible').each(function () {
			tot += $(this).height();
		}); // this is not quite right
		if (tot > $(this).innerHeight()) {
			e.stopPropagation();
		}
	});

	//uses body because jquery on events are called off of the element they are
	//added to, so bubbling would not work if we used document instead.
	$('body').on('touchstart', '.scrollable', function (e) {
		if (e.currentTarget.scrollTop === 0) {
			e.currentTarget.scrollTop = 1;
		} else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
			e.currentTarget.scrollTop -= 1;
		}
	});

	//prevents preventDefault from being called on document if it sees a scrollable div
	$('body').on('touchmove', '.scrollable', function (e) {
		e.stopPropagation();
	});

	// make sure div stays full width/height on resize
	$(window).resize(function () {
		setWidthHeight();
	});

	// Makes the back button work
	window.onpopstate = function (event) {
		var url = window.location.href; // get the url
		var id = url.split("/")[4]; // extract ID

		if (window.location.href.indexOf("/entity/") > -1) {
			loadEntity(id);
		}
		else if (window.location.href.indexOf("/search/") > -1) {
			loadList(id);
		}
		if (location.pathname + location.search + location.hash == "/") {
			$(".overlay").fadeIn("slow");
			$(".result-single").slideUp("slow");
			$(".result-list").slideUp("slow");
		}
	};
});
