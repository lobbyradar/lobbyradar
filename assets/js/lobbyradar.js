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
																											
// save the browser dimensions
// var winWidth = $(window).width();
// var winHeight = $(window).height();

// better cross-browser support
function getDocHeight() {
    var D = document;
    return Math.max(
        D.body.scrollHeight, D.documentElement.scrollHeight,
        D.body.offsetHeight, D.documentElement.offsetHeight,
        D.body.clientHeight, D.documentElement.clientHeight
    );
}



// a function to sort arrays
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

function showShareButton() { 
	new Share(".site-share", {
		//description: window.location.href,
		ui: {
			flyout: 'bottom center', // change the flyout direction of the shares. chose from `top left`, `top center`, `top right`, `bottom left`, `bottom right`, `bottom center`, `middle left`, or `middle right` [Default: `top center`]
			button_text: 'Teilen',
			button_font: false,
			icon_font: false,
		},
		networks: {
			facebook: {
				enabled: true
			},
			pinterest: {
				enabled: true
			},
			email: {
				enabled: true
			}	
		}
	});
}
         
function setWidthHeight() {
	var staticHeight = "";
	var winHeight = $(window).height();
	var winWidth = $(window).width();
	var docHeight = getDocHeight();

	if (docHeight > winHeight) { staticHeight = docHeight; } 
	else { staticHeight = winHeight; }

	$('.fullscreen').css({  'width': winWidth, 'height': winHeight });
	$('.static-page').css({  'width': winWidth, 'minHeight': staticHeight });
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

	setWidthHeight();

	if ($('#networkviz').length == 0) {
		// map could not be found
	} else {
		if ($(window).width() > 768) {
			NetworkViz.panToEntity(); // missuse the func to get the viz on index
		}
	}


	// showShareButton();

	// show whatsapp button on iphone
	// (navigator.userAgent.match(/(iPhone)/g)) ? $(".entypo-whatsapp").addClass('shown') : null ;

	if ($('#networkviz').length == 0) {
		// map could not be found
	} else {
		NetworkViz.setClickHandler(loadEntityAjax);
	}


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
	// (function(){
	// 	var req = null;
	// 	$('body').on('keyup', '.lobbysearch', function(e) {
	// 		console.log($(this).val());
	// 		var $resultName = $(this).val();
	// 		//if ($(this).val().length >= 3) {// 
	// 		if (e.which === 13) { 
	// 			history.pushState(null, null, '/search/'+$resultName);
	// 			loadList($resultName);
	// 		} 
	// 	});
	// })();

	$('.lobbysearch').keypress(function (e) {
		if (e.which === 13) {
			var $resultName = $(this).val();
			$(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
			$( ".result-list" ).slideDown( "slow" );

			history.pushState(null, null, '/search/'+$resultName);
			loadList($resultName);
			return false;
			event.preventDefault();
		}
	});

	$('.search-form button').click(function () {
			var $resultName = $(this).val();
			$(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
			$( ".result-list" ).slideDown( "slow" );

			history.pushState(null, null, '/search/'+$resultName);
			loadList($resultName);
			return false;
			event.preventDefault();
});

																																																													
																																																													
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
$(window).resize(function(){ setWidthHeight(); });

$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  if (direction == 'back') {
    alert(window.location.href);
  }
  if (direction == 'forward') {
    // do something else
  }
});