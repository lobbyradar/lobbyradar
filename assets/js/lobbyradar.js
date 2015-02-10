//    ____   ___          ___                ___ 
//   6MMMMb/ `MM           MM                `MM 
//  8P    YM  MM           MM                 MM 
// 6M      Y  MM   _____   MM____      ___    MM 
// MM         MM  6MMMMMb  MMMMMMb   6MMMMb   MM 
// MM         MM 6M'   `Mb MM'  `Mb 8M'  `Mb  MM 
// MM     ___ MM MM     MM MM    MM     ,oMM  MM 
// MM     `M' MM MM     MM MM    MM ,6MM9'MM  MM 
// YM      M  MM MM     MM MM    MM MM'   MM  MM 
//  8b    d9  MM YM.   ,M9 MM.  ,M9 MM.  ,MM  MM 
//   YMMMM9  _MM_ YMMMMM9 _MYMMMM9  `YMMM9'Yb_MM_
																											
var winWidth = $(window).width();
var winHeight = $(window).height();

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = [-1, 1][+!!reverse];

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}	

// Makes the back button work
window.onpopstate = function(event) {

		var url = window.location.href; // get the url 
		var id = url.split("/")[4]; // extract ID

		if (window.location.href.indexOf("/entity/") > -1) {
			loadEntity(id);
		}
   
		if (window.location.href.indexOf("/search/") > -1) {
			loadList(id);
		}
    
		if(location.pathname + location.search + location.hash == "/") {
			$(".overlay").fadeIn("slow"); 
			$( ".result-single" ).slideUp( "slow" );
			$( ".result-list" ).slideUp( "slow" );
		}
};
               

// ___                         ___       ____                         
// `MM                         `MM       `MM'     68b                 
//  MM                          MM        MM      Y89           /     
//  MM   _____      ___     ____MM        MM      ___   ____   /M     
//  MM  6MMMMMb   6MMMMb   6MMMMMM        MM      `MM  6MMMMb\/MMMMM  
//  MM 6M'   `Mb 8M'  `Mb 6M'  `MM        MM       MM MM'    ` MM     
//  MM MM     MM     ,oMM MM    MM        MM       MM YM.      MM     
//  MM MM     MM ,6MM9'MM MM    MM        MM       MM  YMMMMb  MM     
//  MM MM     MM MM'   MM MM    MM        MM       MM      `Mb MM     
//  MM YM.   ,M9 MM.  ,MM YM.  ,MM        MM    /  MM L    ,MM YM.  , 
// _MM_ YMMMMM9  `YMMM9'Yb.YMMMMMM_      _MMMMMMM _MM_MYMMMM9   YMMM9 

function loadList(id) { 
		$( ".result-single" ).slideUp( "slow" );

		var req = null;
		var $resultName = id;

		if (req) req.abort();
		req = $.getJSON("/api/autocomplete", {
			q: id
		}, function(data){
		console.log(data);
			data = data.sort(sort_by('name', true, function(a){return a.toUpperCase()}));
			var $ul = $("<ul class='list-group'></ul>");
			if (data instanceof Array && data.length > 0) $(data).each(function(idx,e){
				$ul.append('<li class="list-group-item"> <a class="ajax-load entity-detail" href="/entity/'+e.id+'">'+e.name+' </a><span class="label label-default"><i class="fa fa-share-alt"></i> '+e.relations+'</span><div class="clearfix"></div></li>');
				$(".result-list .result-name", "#main").html($resultName);
			});
			$( ".result-list" ).slideDown( "slow" );
			$(".result-list .results .list-group", "#main").remove();
			$(".result-list .results ", "#main").append($ul);
			// reset request
			req = null;
		});
}


// we use this when the loadEntity function is called from within the app
// as opposed to a deep link
// and set the url
function loadEntityAjax(id) {
		loadEntity(id);
		window.history.pushState(null, 'entity', '/entity/'+id);
}


// ___                         ___       __________                                         
// `MM                         `MM       `MMMMMMMMM                  68b                    
//  MM                          MM        MM      \            /     Y89   /                
//  MM   _____      ___     ____MM        MM        ___  __   /M     ___  /M    ____    ___ 
//  MM  6MMMMMb   6MMMMb   6MMMMMM        MM    ,   `MM 6MMb /MMMMM  `MM /MMMMM `MM(    )M' 
//  MM 6M'   `Mb 8M'  `Mb 6M'  `MM        MMMMMMM    MMM9 `Mb MM      MM  MM     `Mb    d'  
//  MM MM     MM     ,oMM MM    MM        MM    `    MM'   MM MM      MM  MM      YM.  ,P   
//  MM MM     MM ,6MM9'MM MM    MM        MM         MM    MM MM      MM  MM       MM  M    
//  MM MM     MM MM'   MM MM    MM        MM         MM    MM MM      MM  MM       `Mbd'    
//  MM YM.   ,M9 MM.  ,MM YM.  ,MM        MM      /  MM    MM YM.  ,  MM  YM.  ,    YMP     
// _MM_ YMMMMM9  `YMMM9'Yb.YMMMMMM_      _MMMMMMMMM _MM_  _MM_ YMMM9 _MM_  YMMM9     M      
//                                                                                  d'      
//                                                                              (8),P       
//                                                                               YMM        

function isExistant(el) { 
	if (el !== undefined) { if (el != 0 || undefined || '' || null) { return true; } }
	// else
	return false;
}

// load an entity from ID and build up html
// used in Deeplink and Detail from List
function loadEntity(id) {
	var req = null;
	if (req) { req.abort(); }
	$( ".result-list" ).slideUp( "slow" );
  $('.fullscreen').animate({scrollTop: 0});

	NetworkViz.highlightEntity(id);
	$( "#backtolist" ).css( "display",'inline-block' ); // always show the backbutton

	// change the url + history literal object
	// history.pushState(null, null, '/entity/'+id);
	// obj.historyData.id = id;
	// console.log('Object History Data ID: '+obj.historyData.id);
	// 

	req = $.getJSON("/api/entity/get/"+id, {relations:true}, function(data){
		var $content = '<div class="entity">';
	 
		if (data.hasOwnProperty("result")) {
			var entity = data.result;
			console.log(data.result);

			// title 
			$content += '<h1 class="name">';
			if (entity.type == 'person') {
				$content += '<i class="fa fa-user"></i>&nbsp;'; // PERSON
			}
			$(entity.data).each(function(idx,e){ 
				if (entity.type == 'entity' && e.key == 'partei') {
					$content += '<i class="fa fa-pie-chart"></i>&nbsp;'; // PARTEI
				} else if (entity.type == 'entity' && e.key == 'legalform') {
					$content += '<i class="fa fa-building-o"></i>&nbsp;'; // PARTEI
				}
			});
			$content += entity.name;
			$content += '</h1>';

			// tags
			// $(data.result.tags).each(function(idx,e){ 
			// 	$content += '<span class="label label-default">'+e+'</span>&nbsp;'; 
			// });
			// $content += '<hr/>';

			// // check for the different types of data
			// for(var i = 0, data; data = entity.data[i]; i++) {
			// 	if (data.format = 'photo') 			{ var hasPhotos = true; }
			// 	if (data.desc = 'Quelle') 			{ var hasSource = true; }
			// 	if (data.key = 'address') 		{ var hasAddress = true; }
			// 	if (data.key = 'link') 				{ var hasLinks = true; }
			// }

			// if (hasPhotos) {
			// 	$content += '<div class="row">';
			// 	$(entity.data).each(function(idx,data){ 
			// 		if (data.desc == 'Foto') {
			// 			if (isExistant(data.value.url)) {
			// 				$content += '<div class="col-md-3"><div class="thumbnail"><img src="'+data.value.url+'" /></div></div>';
			// 			}
			// 		}
			// 	});
			// 	$content += '</div>';
			// }
			// if (hasSource) {
			// 	$(entity.data).each(function(idx,data){ 
			// 		if (data.desc == 'Quelle') {
			// 			$content += '<p class="entity-source">';
			// 			if (data.value.url !== undefined) {
			// 				$content += '<a  href="'+data.value.url+'">';
			// 				$content += data.value.url;
			// 				$content += '</a>';
			// 			}
			// 			$content += '</p>';
			// 		}
			// 	});
			// }

			// 			if (hasSource) {
			// 	$(entity.data).each(function(idx,data){ 
			// 		if (data.key == 'source') {
			// 			$content += '<p class="entity-source">';
			// 			if (data.value.url !== undefined) {
			// 				$content += '<a  href="'+data.value.url+'">';
			// 				$content += data.value.url;
			// 				$content += '</a>';
			// 			}
			// 			$content += '</p>';
			// 		}
			// 	});
			// }


			// // data
			// if (entity.data.length > 0) {
			// 	// $content += '<h4>Quelle(n)</h4>';
			// 	$(entity.data).each(function(idx,data){ 
			// 		if (data.key == 'source') {
						
			// 		} else if (data.key == 'address') {
			// 			if (data !== undefined) {
			// 				$content += '<h3>Adresse</h3><adress>';

			// 				if (isExistant(data.value.addr)) {
			// 					$content += data.value.addr+'<br/>';
			// 					console.log(data.value.addr);
			// 				}
			// 				if (isExistant(data.value.street)) {
			// 					$content += data.value.street+'<br/>';
			// 				} 
			// 				if (isExistant(data.value.postcode)) {
			// 					$content += data.value.postcode+'&nbsp;';
			// 				}
			// 				if (isExistant(data.value.city)) {
			// 					$content += data.value.city+'<br/>';
			// 				}
			// 				$content += '<h3>Kontakt</h3>';
			// 				if (isExistant(data.value.tel)) {
			// 					$content += '<abbr title="Phone">P:</abbr>&nbsp;'+data.value.tel+'<br/>';
			// 				}
			// 				if (isExistant(data.value.fax)) {
			// 					$content += '<abbr title="Fax">F:</abbr>&nbsp;'+data.value.fax+'<br/>';
			// 				}
			// 				if (isExistant(data.value.email)) {
			// 					$content += '<abbr title="Email">E:</abbr>&nbsp;'+data.value.email+'<br/>';
			// 				}
			// 				if (isExistant(data.value.www)) {
			// 					$content += '<abbr title="Web">W:</abbr>&nbsp;'+data.value.www+'<br/>';
			// 				}
			// 				$content += '</adress>';
			// 			}
			// 		} else if (data.desc == 'Link'){ 
			// 			$content += '<h4>'+data.desc+'</h4>';
			// 			$content += '<p><a href="'+data.value.url+'">'+data.value.url+'</a></p>';

			// 		} else {
			// 			$content += '<h4>'+data.desc+'</h4>';
			// 			$content += '<p>'+data.value+'</p>';

			// 		}
			// 	});
			// }

			// relations
			if (entity.relations.length > 0) {
					$content += '<h3>Verbindungen</h3>';
					$content += '<ul class="list-group">';
					$(entity.relations).each(function(idx,e){ 
						$content += '<li class="list-group-item">';
						if (e.type == 'donation') {
							$content += '<i class="fa fa-money"></i>&nbsp;'; 
						} else if (e.type == 'position') {
							$content += '<i class="fa fa-user"></i>&nbsp;'; 
						} else if (e.type == 'member') {
							$content += '<i class="fa fa-group"></i>&nbsp;'; 
						}
						$content += '<a class="ajax-load entity-connections" href="/entity/'
						if (isExistant(e.entity)) {
							if (isExistant(e.entity._id)) {
								$content += e.entity._id; 
							}
							$content += '">';
							if (isExistant(e.entity.name)) {
								$content += e.entity.name+'&nbsp;'; 
							}
						}
						$content += '</a>';
						$content += '</li>';

					});
					$content += '</ul>';
			}

						// alias
			if (entity.aliases.length > 0) {
				$content += '<h3>Alternative Schreibweisen</h3><p>';
				$(entity.aliases).each(function(idx,e){ 
					$content += e+';&nbsp;'; 
				});
				$content += '</p>';
			}

			$content += '<p class="name">';
			$content += '<span>Erstellt: '+moment(entity.created).format("DD.MM.YYYY hh:mm")+'</span><br/>';
			$content += '<span>Aktualisiert: '+moment(entity.created).format("DD.MM.YYYY hh:mm")+'</span>';
			$content += '</p>';

		}
		$content += '</div>';
		// clear current view
		$(".result-single .content .entity", "#main").remove();
		$(".result-single .content ", "#main").append($content);
		// reset request
		req = null;
		$(document).trigger('load_entity_complete');
		$( ".result-single" ).delay( 400 ).slideDown( "slow" );

	});
}


																																									
// ________                            ________                          ___             
// `MMMMMMMb.                          `MMMMMMMb.                        `MM             
//  MM    `Mb                           MM    `Mb                         MM             
//  MM     MM   _____     ____          MM     MM   ____      ___     ____MM ____    ___ 
//  MM     MM  6MMMMMb   6MMMMb.        MM     MM  6MMMMb   6MMMMb   6MMMMMM `MM(    )M' 
//  MM     MM 6M'   `Mb 6M'   Mb        MM    .M9 6M'  `Mb 8M'  `Mb 6M'  `MM  `Mb    d'  
//  MM     MM MM     MM MM    `'        MMMMMMM9' MM    MM     ,oMM MM    MM   YM.  ,P   
//  MM     MM MM     MM MM              MM  \M\   MMMMMMMM ,6MM9'MM MM    MM    MM  M    
//  MM     MM MM     MM MM              MM   \M\  MM       MM'   MM MM    MM    `Mbd'    
//  MM    .M9 YM.   ,M9 YM.   d9        MM    \M\ YM    d9 MM.  ,MM YM.  ,MM     YMP     
// _MMMMMMM9'  YMMMMM9   YMMMM9        _MM_    \M\_YMMMM9  `YMMM9'Yb.YMMMMMM_     M      
//                                                                               d'      
//                                                                           (8),P       
//                                                                            YMM   

$( document ).ready(function() {
	$('.fullscreen').css({  'width': winWidth, 'height': winHeight });
	$('.faq-page').css({  'width': winWidth, 'height': winHeight });

	NetworkViz.panToEntity(); // missuse the func to get the viz on index

	// set initial div height / width

	// $(".lobbysearch").focus(function(){
	// });
		
	$('.lobbysearch').keypress(function (e) {
		if (e.which === 13) {
			$(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
			$( ".result-list" ).slideDown( "slow" );
			return false;
			event.preventDefault();
		}
	});

	NetworkViz.setClickHandler(loadEntityAjax);

	// bring up the details when an entry is clicked a                                                                                                           
	$('body').on('click', '.ajax-load', function(e) {
		e.preventDefault();
		var str = this.href;
		var entityID = str.split("/")[4];
		loadEntityAjax(entityID);

	});

	// click back arrow -> history
	$('body').on('click', '#backtolist', function(e) {
    e.preventDefault();
    window.history.back();
	});

	// click back arrow -> history
	$('body').on('click', 'button.close', function(e) {
		$( ".result-single" ).slideUp( "slow" );
		$( ".result-list" ).slideUp( "slow" );
    e.preventDefault();
	});

																													 
// ________                                    ____                  ___       
// `MMMMMMMb.                                  `MM'     68b          `MM       
//  MM    `Mb                                   MM      Y89           MM       
//  MM     MM   ____     ____  __ ____          MM      ___ ___  __   MM   __  
//  MM     MM  6MMMMb   6MMMMb `M6MMMMb         MM      `MM `MM 6MMb  MM   d'  
//  MM     MM 6M'  `Mb 6M'  `Mb MM'  `Mb        MM       MM  MMM9 `Mb MM  d'   
//  MM     MM MM    MM MM    MM MM    MM        MM       MM  MM'   MM MM d'    
//  MM     MM MMMMMMMM MMMMMMMM MM    MM        MM       MM  MM    MM MMdM.    
//  MM     MM MM       MM       MM    MM        MM       MM  MM    MM MMPYM.   
//  MM    .M9 YM    d9 YM    d9 MM.  ,M9        MM    /  MM  MM    MM MM  YM.  
// _MMMMMMM9'  YMMMM9   YMMMM9  MMYMMM9        _MMMMMMM _MM__MM_  _MM_MM_  YM._
//                              MM                                             
//                              MM                                             
//                             _MM_                                            

	// this kicks in when we get a deep link to an entity
	// entity/:id
	if (window.location.href.indexOf("/entity/") > -1) {
		$( ".overlay" ).css( "display",'none' ); // we dont need the intro

		var str = window.location.href; // get the url 
		var entityID = str.split("/")[4]; // extract ID
		console.log('entity.entry, ID: '+entityID);

		loadEntity(entityID);
		$( "#backtolist" ).css( "display",'none' ); // explicit hide on deeplinks
		$( ".result-single" ).slideDown( "slow" );  // show me the single panel

	}



		// this kicks in when we get a deep link to an search
		// /search/:id
	if (window.location.href.indexOf("/search/") > -1) {
		// $( "#backtolist" ).css( "display",'none' ); // There is no list to go back to 
		$( ".overlay" ).css( "display",'none' ); // we dont need the intro

		var str = window.location.href; // get the url 
		var searchID = str.split("/")[4]; // extract ID
		console.log('Search for: '+searchID);
		loadList(searchID);
	}



//   ____                                     ___             ________                             ___                  
//  6MMMMb\                                   `MM             `MMMMMMMb.                           `MM                  
// 6M'    `                                    MM              MM    `Mb                            MM   /              
// MM         ____      ___   ___  __   ____   MM  __          MM     MM   ____     ____  ___   ___ MM  /M       ____   
// YM.       6MMMMb   6MMMMb  `MM 6MM  6MMMMb. MM 6MMb         MM     MM  6MMMMb   6MMMMb\`MM    MM MM /MMMMM   6MMMMb\ 
//  YMMMMb  6M'  `Mb 8M'  `Mb  MM69 " 6M'   Mb MMM9 `Mb        MM    .M9 6M'  `Mb MM'    ` MM    MM MM  MM     MM'    ` 
//      `Mb MM    MM     ,oMM  MM'    MM    `' MM'   MM        MMMMMMM9' MM    MM YM.      MM    MM MM  MM     YM.      
//       MM MMMMMMMM ,6MM9'MM  MM     MM       MM    MM        MM  \M\   MMMMMMMM  YMMMMb  MM    MM MM  MM      YMMMMb  
//       MM MM       MM'   MM  MM     MM       MM    MM        MM   \M\  MM            `Mb MM    MM MM  MM          `Mb 
// L    ,M9 YM    d9 MM.  ,MM  MM     YM.   d9 MM    MM        MM    \M\ YM    d9 L    ,MM YM.   MM MM  YM.  , L    ,MM 
// MYMMMM9   YMMMM9  `YMMM9'Yb_MM_     YMMMM9 _MM_  _MM_      _MM_    \M\_YMMMM9  MYMMMM9   YMMM9MM_MM_  YMMM9 MYMMMM9  

	// lazy typeahead
	(function(){
		var req = null;
		$('body').on('keyup', '.lobbysearch', function(e) {
			console.log($(this).val());
			var $resultName = $(this).val();
			// if ($(this).val().length >= 3) // 
			if (e.which === 13) { 
				history.pushState(null, null, '/search/'+$resultName);
				loadList($resultName);
			};
		});
	})();

																																																													
																																																													
// ________                                ___          __                                      ____                         
// `MMMMMMMb.                          68b `MM         69MM                                     `MM'     68b                 
//  MM    `Mb           /              Y89  MM        6M' `                                      MM      Y89           /     
//  MM     MM   ____   /M        ___   ___  MM       _MM____  __   _____  ___  __    __          MM      ___   ____   /M     
//  MM     MM  6MMMMb /MMMMM   6MMMMb  `MM  MM       MMMM`MM 6MM  6MMMMMb `MM 6MMb  6MMb         MM      `MM  6MMMMb\/MMMMM  
//  MM     MM 6M'  `Mb MM     8M'  `Mb  MM  MM        MM  MM69 " 6M'   `Mb MM69 `MM69 `Mb        MM       MM MM'    ` MM     
//  MM     MM MM    MM MM         ,oMM  MM  MM        MM  MM'    MM     MM MM'   MM'   MM        MM       MM YM.      MM     
//  MM     MM MMMMMMMM MM     ,6MM9'MM  MM  MM        MM  MM     MM     MM MM    MM    MM        MM       MM  YMMMMb  MM     
//  MM     MM MM       MM     MM'   MM  MM  MM        MM  MM     MM     MM MM    MM    MM        MM       MM      `Mb MM     
//  MM    .M9 YM    d9 YM.  , MM.  ,MM  MM  MM        MM  MM     YM.   ,M9 MM    MM    MM        MM    /  MM L    ,MM YM.  , 
// _MMMMMMM9'  YMMMM9   YMMM9 `YMMM9'Yb_MM__MM_      _MM__MM_     YMMMMM9 _MM_  _MM_  _MM_      _MMMMMMM _MM_MYMMMM9   YMMM9 
																																																													
																																																													
	// // bring back the list when the button in detail is clicked           
	// $('body').on('click', '#backtolist', function(event) {
	// 	$(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
	// 	$(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);
	// 	window.history.back()
	// 	return false;
	// 	e.preventDefault();
	// });



																																																				
//     ________                 ___         ____                            ___ ___                        
// 68b `MMMMMMMb.               `MM        6MMMMb\                          `MM `MM 68b                    
// Y89  MM    `Mb                MM       6M'    `                           MM  MM Y89                    
// ___  MM     MM    ___     ____MM       MM         ____  ___  __   _____   MM  MM ___ ___  __     __     
// `MM  MM     MM  6MMMMb   6MMMMMM       YM.       6MMMMb.`MM 6MM  6MMMMMb  MM  MM `MM `MM 6MMb   6MMbMMM 
//  MM  MM    .M9 8M'  `Mb 6M'  `MM        YMMMMb  6M'   Mb MM69 " 6M'   `Mb MM  MM  MM  MMM9 `Mb 6M'`Mb   
//  MM  MMMMMMM9'     ,oMM MM    MM            `Mb MM    `' MM'    MM     MM MM  MM  MM  MM'   MM MM  MM   
//  MM  MM        ,6MM9'MM MM    MM             MM MM       MM     MM     MM MM  MM  MM  MM    MM YM.,M9   
//  MM  MM        MM'   MM MM    MM             MM MM       MM     MM     MM MM  MM  MM  MM    MM  YMM9    
//  MM  MM        MM.  ,MM YM.  ,MM       L    ,M9 YM.   d9 MM     YM.   ,M9 MM  MM  MM  MM    MM (M       
// _MM__MM_       `YMMM9'Yb.YMMMMMM_      MYMMMM9   YMMMM9 _MM_     YMMMMM9 _MM__MM__MM__MM_  _MM_ YMMMMb. 
//                                                                                                6M    Yb 
//                                                                                                YM.   d9 
//                                                                                                 YMMMM9  

	// http://stackoverflow.com/questions/16437182/issue-with-a-scrollable-div-on-ipad
	$('body').on('touchmove','.scrollable',function(e) {
		var tot = 0;
		$(this).children('li:visible').each(function() { tot += $(this).height(); }); // this is not quite right
		if(tot > $(this).innerHeight()) {
			e.stopPropagation();
		}
	});
	
	//uses body because jquery on events are called off of the element they are
	//added to, so bubbling would not work if we used document instead.
	$('body').on('touchstart','.scrollable',function(e) {
		if (e.currentTarget.scrollTop === 0) {
			e.currentTarget.scrollTop = 1;
		} else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
			e.currentTarget.scrollTop -= 1;
		}
	});

	//prevents preventDefault from being called on document if it sees a scrollable div
	$('body').on('touchmove','.scrollable',function(e) { e.stopPropagation(); });


}); // document.ready end

// ____              ___                     ________                                          
// `Mb(      db      )d' 68b                 `MMMMMMMb.                  68b                   
//  YM.     ,PM.     ,P  Y89                  MM    `Mb                  Y89                   
//  `Mb     d'Mb     d'  ___ ___  __          MM     MM   ____     ____  ___ _________  ____   
//   YM.   ,P YM.   ,P   `MM `MM 6MMb         MM     MM  6MMMMb   6MMMMb\`MM MMMMMMMMP 6MMMMb  
//   `Mb   d' `Mb   d'    MM  MMM9 `Mb        MM    .M9 6M'  `Mb MM'    ` MM /    dMP 6M'  `Mb 
//    YM. ,P   YM. ,P     MM  MM'   MM        MMMMMMM9' MM    MM YM.      MM     dMP  MM    MM 
//    `Mb d'   `Mb d'     MM  MM    MM        MM  \M\   MMMMMMMM  YMMMMb  MM    dMP   MMMMMMMM 
//     YM,P     YM,P      MM  MM    MM        MM   \M\  MM            `Mb MM   dMP    MM       
//     `MM'     `MM'      MM  MM    MM        MM    \M\ YM    d9 L    ,MM MM  dMP    /YM    d9 
//      YP       YP      _MM__MM_  _MM_      _MM_    \M\_YMMMM9  MYMMMM9 _MM_dMMMMMMMM YMMMM9  

// make sure div stays full width/height on resize
$(window).resize(function(){
	$('.fullscreen').css({
		'width': winWidth,
		'height': winHeight,
	});
});

$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  if (direction == 'back') {
    alert(window.location.href);
  }
  if (direction == 'forward') {
    // do something else
  }
});