function loadList(id) {
	$(".leaflet-control-zoom").css("display", 'block');

	$(".result-single").slideUp("slow");

	var req = null;
	var $resultName = id;

	if (req) req.abort();
	req = $.getJSON("/api/autocomplete", {
		q: id
	}, function (data) {
		//console.log(data);
		if (data === undefined || data.length == 0) {
			var $ul = $("<div class='message'>Es konnten leider keine Einträge gefunden werden.</div>");
			$(".result-list").slideDown("slow");
			$(".result-list .results .list-group", "#main").remove();
			$(".result-list .results .message", "#main").remove();

			$(".result-list .results ", "#main").append($ul);
			$(".result-list .lead").css("display", "none");
			// reset request
			req = null;
		} else {
			data = data.sort(sort_by('name', true, function (a) {
				return a.toUpperCase()
			}));
			var $ul = $("<ul class='list-group'></ul>");
			if (data instanceof Array && data.length > 0) $(data).each(function (idx, e) {
				var $content = '<li class="list-group-item">';
				$content += '<i class="fa fa-user"></i>&nbsp;';
				$content += '<a class="ajax-load entity-detail" href="/entity/' + e.id + '">';
				$content += e.name;
				$content += ' </a><span class="label label-default"><i class="fa fa-share-alt"></i> ' + e.relations + '</span><div class="clearfix"></div>'
				$content += '</li>'
				// $ul.append('<li class="list-group-item"> <a class="ajax-load entity-detail" href="/entity/'+e.id+'">'+e.name+' </a><span class="label label-default"><i class="fa fa-share-alt"></i> '+e.relations+'</span><div class="clearfix"></div></li>');
				$ul.append($content);

				$(".result-list .result-name", "#main").html($resultName);
				$(".result-list .lead").css("display", "block");
			});
			$(".result-list").slideDown("slow");
			$(".result-list .results .list-group", "#main").remove();
			$(".result-list .results ", "#main").append($ul);
			$(".result-list .message").remove();

			// reset request
			req = null;
		}
	});
}

// load an entity from ID and build up html
// used in Deeplink and Detail from List

var vis_req = null;

function loadEntity(id) {

	if (vis_req) {
		vis_req.abort();
	}

	$(".leaflet-control-zoom").css("display", 'block');

	$(".result-list").slideUp("slow");
	$('.fullscreen').animate({scrollTop: 0});

	NetworkViz.highlightEntity(id);

	$("#backtolist").css("display", 'inline-block'); // always show the backbutton

	vis_req = $.getJSON("/api/entity/get/" + id, {relations: true}, function (data) {
		vis_req = null;
		var $content = utils.displayEntity(data.result);
		// clear current view
		$(".result-single .content .entity", "#main").remove();
		$(".result-single .content ", "#main").append($content);
		$(document).trigger('load_entity_complete');
		$(".result-single").delay(400).slideDown("slow");

	});
}

// we use this when the loadEntity function is called from within the app
// as opposed to a deep link
// and set the url
function loadEntityAjax(id) {
	loadEntity(id);
	window.history.pushState(null, 'entity', '/entity/' + id);
}

$(document).ready(function () {

	NetworkViz.panToEntity(); // missuse the func to get the viz on index
	NetworkViz.setClickHandler(loadEntityAjax);

	$(".leaflet-control-zoom").css("display", 'none');

	// bring up the details when an entry is clicked a
	$('body').on('click', '.ajax-load', function (e) {
		e.preventDefault();
		var str = this.href;
		var entityID = str.split("/")[4];
		loadEntityAjax(entityID);
	});

	// click back arrow -> history
	$('body').on('click', '#backtolist', function (e) {
		e.preventDefault();
		window.history.back();
	});

	// click back arrow -> history
	$('body').on('click', 'button.close', function (e) {
		$(".result-single").slideUp("slow");
		$(".result-list").slideUp("slow");
		e.preventDefault();
	});

	// this kicks in when we get a deep link to an entity
	// entity/:id
	if (window.location.href.indexOf("/entity/") > -1) {
		$(".overlay").css("display", 'none'); // we dont need the intro
		$("leaflet-control-zoom").css("display", 'block');
		var str = window.location.href; // get the url
		var entityID = str.split("/")[4]; // extract ID
		//console.log('entity.entry, ID: ' + entityID);
		loadEntity(entityID);
		$("#backtolist").css("display", 'none'); // explicit hide on deeplinks
		$(".result-single").slideDown("slow");  // show me the single panel
	}

	// this kicks in when we get a deep link to an search
	// /search/:id
	if (window.location.href.indexOf("/search/") > -1) {
		// $( "#backtolist" ).css( "display",'none' ); // There is no list to go back to
		$(".overlay").css("display", 'none'); // we dont need the intro
		var str = window.location.href; // get the url
		var searchID = str.split("/")[4]; // extract ID
		//console.log('Search for: ' + searchID);
		loadList(searchID);
	}

	// When someone presses enter inside lobbysearch
	$('.lobbysearch').keypress(function (e) {
		if (e.which === 13) {
			var $resultName = $(this).val();
			$(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
			$(".result-list").slideDown("slow");
			history.pushState(null, null, '/search/' + $resultName);
			loadList($resultName);
			return false;
			event.preventDefault();
		}
	});

	// Or when he or she clicks the search button
	$('.search-form button').click(function () {
		var $resultName = $('.lobbysearch').val();
		$(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
		$(".result-list").slideDown("slow");
		history.pushState(null, null, '/search/' + $resultName);
		loadList($resultName);
		return false;
		event.preventDefault();
	});

});