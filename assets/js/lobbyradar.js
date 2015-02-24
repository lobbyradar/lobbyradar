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
var winHeight = $(window).height()+150;
var winWidth = screen.width;


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
		$( ".leaflet-control-zoom" ).css( "display",'block' );

		$( ".result-single" ).slideUp( "slow" );

		var req = null;
		var $resultName = id;

		if (req) req.abort();
		req = $.getJSON("/api/autocomplete", {
			q: id
		}, function(data){
			console.log(data);
			if (data === undefined || data.length == 0) { 
				var $ul = $("<div class='message'>Es konnten keine Einträge gefunden werden. Bitte Groß- und Kleinschreibung beachten.</div>");
				$( ".result-list" ).slideDown( "slow" );
				$(".result-list .results .list-group", "#main").remove();
				$(".result-list .results .message", "#main").remove();

				$(".result-list .results ", "#main").append($ul);
				$(".result-list .lead").css("display","none");
				// reset request
				req = null;
			} else {
				data = data.sort(sort_by('name', true, function(a){return a.toUpperCase()}));
				var $ul = $("<ul class='list-group'></ul>");
				if (data instanceof Array && data.length > 0) $(data).each(function(idx,e){
					var $content = '<li class="list-group-item">';
					$content += '<i class="fa fa-user"></i>&nbsp;';
					$content += '<a class="ajax-load entity-detail" href="/entity/'+e.id+'">';
					$content += e.name;
					$content += ' </a><span class="label label-default"><i class="fa fa-share-alt"></i> '+e.relations+'</span><div class="clearfix"></div>'
					$content += '</li>'
					// $ul.append('<li class="list-group-item"> <a class="ajax-load entity-detail" href="/entity/'+e.id+'">'+e.name+' </a><span class="label label-default"><i class="fa fa-share-alt"></i> '+e.relations+'</span><div class="clearfix"></div></li>');
					$ul.append($content);
					
					$(".result-list .result-name", "#main").html($resultName);
					$(".result-list .lead").css("display","block");
				});
				$( ".result-list" ).slideDown( "slow" );
				$(".result-list .results .list-group", "#main").remove();
				$(".result-list .results ", "#main").append($ul);
				$(".result-list .message").remove();

				// reset request
				req = null;
			}
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

	$( ".leaflet-control-zoom" ).css( "display",'block' );

	showShareButton();

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

			// check for the different types of data
			for(var i = 0, data; data = entity.data[i]; i++) {
				if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') 			{ var hasPhotos = true; }
				if (data.desc == 'Quelle') 			{ var hasSource = true; }
				if (data.key == 'address') 		{ var hasAddress = true; }
				if (data.key == 'link') 				{ var hasLinks = true; }
			}
 
			$content += '<div class="row row-results">';

			if (hasPhotos) {
				console.log('Entity has Photos');
				$(entity.data).each(function(idx,data){ 
					if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
						if (isExistant(data.value.url)) {
							$content += '<div class="col-md-3"><div class="entity-img" style="background-image:url('+data.value.url+')" /></div>';
							return false;
						}
					}
				});
			}

			// title 
			$content += '<div class="col-md-9">';
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
			$(entity.data).each(function(idx,data){ 
				if (data.key == 'bundesland') {
					$content += '<p>'+data.value+'</p>'; // PARTEI
				}
			});
			$(entity.tags).each(function(idx,tag){ 
				if (tag == 'mdb') {
					$content += '<p>Mitglied des Bundestag</p>'; 
				}
			});
			$content += '</div>';

			$content += '</div>';

			

			// tags
			// $(data.result.tags).each(function(idx,e){ 
			// 	$content += '<span class="label label-default">'+e+'</span>&nbsp;'; 
			// });
			// $content += '<hr/>';

                               
                                                       
// ________  ___                                          
// `MMMMMMMb.`MM                                          
//  MM    `Mb MM                  /                       
//  MM     MM MM  __     _____   /M      _____     ____   
//  MM     MM MM 6MMb   6MMMMMb /MMMMM  6MMMMMb   6MMMMb\ 
//  MM    .M9 MMM9 `Mb 6M'   `Mb MM    6M'   `Mb MM'    ` 
//  MMMMMMM9' MM'   MM MM     MM MM    MM     MM YM.      
//  MM        MM    MM MM     MM MM    MM     MM  YMMMMb  
//  MM        MM    MM MM     MM MM    MM     MM      `Mb 
//  MM        MM    MM YM.   ,M9 YM.  ,YM.   ,M9 L    ,MM 
// _MM_      _MM_  _MM_ YMMMMM9   YMMM9 YMMMMM9  MYMMMM9  
                                  


                                                          
                                                          
//        _           ___                                    
//       dM.          `MM                                    
//      ,MMb           MM                                    
//      d'YM.      ____MM ___  __   ____     ____     ____   
//     ,P `Mb     6MMMMMM `MM 6MM  6MMMMb   6MMMMb\  6MMMMb\ 
//     d'  YM.   6M'  `MM  MM69 " 6M'  `Mb MM'    ` MM'    ` 
//    ,P   `Mb   MM    MM  MM'    MM    MM YM.      YM.      
//    d'    YM.  MM    MM  MM     MMMMMMMM  YMMMMb   YMMMMb  
//   ,MMMMMMMMb  MM    MM  MM     MM            `Mb      `Mb 
//   d'      YM. YM.  ,MM  MM     YM    d9 L    ,MM L    ,MM 
// _dM_     _dMM_ YMMMMMM__MM_     YMMMM9  MYMMMM9  MYMMMM9  

			// if (hasAddress) { 
			// 	console.log('Entity has Adress');
			// 	$content += '<div class="row">';
			// 	$content += '<div class="col-md-12"><h4>Adressen</h4></div>';

			// 	$(entity.data).each(function(idx,data){ 
			// 		if (data.key == 'address') {
			// 		if (data !== undefined) {
			// 				$content += '<div class="col-md-6">';

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
			// 				$content += '<br/>';

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
			// 				$content += '</div>';
			// 		}
			// 	}
			// 	});
			// 	$content += '</div>';
			// }
                                                               
// ________           ___                                                 
// `MMMMMMMb.         `MM                 68b                             
//  MM    `Mb          MM           /     Y89                             
//  MM     MM   ____   MM    ___   /M     ___   _____  ___  __     ____   
//  MM     MM  6MMMMb  MM  6MMMMb /MMMMM  `MM  6MMMMMb `MM 6MMb   6MMMMb\ 
//  MM    .M9 6M'  `Mb MM 8M'  `Mb MM      MM 6M'   `Mb MMM9 `Mb MM'    ` 
//  MMMMMMM9' MM    MM MM     ,oMM MM      MM MM     MM MM'   MM YM.      
//  MM  \M\   MMMMMMMM MM ,6MM9'MM MM      MM MM     MM MM    MM  YMMMMb  
//  MM   \M\  MM       MM MM'   MM MM      MM MM     MM MM    MM      `Mb 
//  MM    \M\ YM    d9 MM MM.  ,MM YM.  ,  MM YM.   ,M9 MM    MM L    ,MM 
// _MM_    \M\_YMMMM9 _MM_`YMMM9'Yb.YMMM9 _MM_ YMMMMM9 _MM_  _MM_MYMMMM9  
                                                                  
			if (entity.relations.length > 0) {
					// var relations = entity.relations.sort(sort_by('entity[name]', true));
					var relations = entity.relations;

					$content += '<h4>Verbindungen</<h4></h4>';
					$content += '<div class="entity-relations-list">';
					
					$(relations).each(function(idx,e){ 
						$content += '<div class="entity-relations-item">';

// ________                                                             
// `MMMMMMMb.                                    68b                    
//  MM    `Mb                              /     Y89                    
//  MM     MM   _____  ___  __      ___   /M     ___   _____  ___  __   
//  MM     MM  6MMMMMb `MM 6MMb   6MMMMb /MMMMM  `MM  6MMMMMb `MM 6MMb  
//  MM     MM 6M'   `Mb MMM9 `Mb 8M'  `Mb MM      MM 6M'   `Mb MMM9 `Mb 
//  MM     MM MM     MM MM'   MM     ,oMM MM      MM MM     MM MM'   MM 
//  MM     MM MM     MM MM    MM ,6MM9'MM MM      MM MM     MM MM    MM 
//  MM     MM MM     MM MM    MM MM'   MM MM      MM MM     MM MM    MM 
//  MM    .M9 YM.   ,M9 MM    MM MM.  ,MM YM.  ,  MM YM.   ,M9 MM    MM 
// _MMMMMMM9'  YMMMMM9 _MM_  _MM_`YMMM9'Yb.YMMM9 _MM_ YMMMMM9 _MM_  _MM_
                                                                                                                   
						if (e.type == 'donation') {
							$content += '<i class="fa fa-euro"></i>&nbsp;Parteispenden: ';
							if (isExistant(e.entity)) {
								$content += '<a class="ajax-load entity-connections" href="/entity/'
								if (isExistant(e.entity._id)) {
									$content += e.entity._id; 
								}
								$content += '">';
								if (isExistant(e.entity.name)) {
									$content += e.entity.name+'&nbsp;'; 
								}
							}
							$content += '</a><br/>'; 
							if (isExistant(e.data)) {
								$content += '<table class="table-condensed table-bordered table">';
								$(e.data).each(function(idx,data){ 
									if (data.key == 'donation') {	
										$content += '<tr>';
										$content += '<td>';
										$content += data.value.year + ' ';
										$content += '</td>';
										$content += '<td>';
										$content += data.value.amount + '€ ';
										$content += '</td>';
										$content += '</tr>';
									}
								});
								$content += '</table>';
							}                                                       
                                                                
// ________                                                        
// `MMMMMMMb.                   68b         68b                    
//  MM    `Mb                   Y89   /     Y89                    
//  MM     MM   _____     ____  ___  /M     ___   _____  ___  __   
//  MM     MM  6MMMMMb   6MMMMb\`MM /MMMMM  `MM  6MMMMMb `MM 6MMb  
//  MM    .M9 6M'   `Mb MM'    ` MM  MM      MM 6M'   `Mb MMM9 `Mb 
//  MMMMMMM9' MM     MM YM.      MM  MM      MM MM     MM MM'   MM 
//  MM        MM     MM  YMMMMb  MM  MM      MM MM     MM MM    MM 
//  MM        MM     MM      `Mb MM  MM      MM MM     MM MM    MM 
//  MM        YM.   ,M9 L    ,MM MM  YM.  ,  MM YM.   ,M9 MM    MM 
// _MM_        YMMMMM9  MYMMMM9 _MM_  YMMM9 _MM_ YMMMMM9 _MM_  _MM_
                                                                                                                 
						} else if (e.type == 'position') {
							$content += '<i class="fa fa-user"></i>&nbsp;';
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
							$content += '</a><br/>'; 
							if (isExistant(e.data)) {
								$(e.data).each(function(idx,data){ 
									if (data.key == 'position') {
										if (isExistant(data.value.position)) {
											$content += data.value.position + '<br/>';
										}
									}
								});
							}              

// ___       ___                       ___                       
// `MMb     dMM'                        MM                       
//  MMM.   ,PMM                         MM                       
//  M`Mb   d'MM   ____  ___  __    __   MM____     ____  ___  __ 
//  M YM. ,P MM  6MMMMb `MM 6MMb  6MMb  MMMMMMb   6MMMMb `MM 6MM 
//  M `Mb d' MM 6M'  `Mb MM69 `MM69 `Mb MM'  `Mb 6M'  `Mb MM69 " 
//  M  YM.P  MM MM    MM MM'   MM'   MM MM    MM MM    MM MM'    
//  M  `Mb'  MM MMMMMMMM MM    MM    MM MM    MM MMMMMMMM MM     
//  M   YP   MM MM       MM    MM    MM MM    MM MM       MM     
//  M   `'   MM YM    d9 MM    MM    MM MM.  ,M9 YM    d9 MM     
// _M_      _MM_ YMMMM9 _MM_  _MM_  _MM_MYMMMM9   YMMMM9 _MM_    
                                                                                        
						} else if (e.type == 'member') {
							$content += '<i class="fa fa-group"></i>&nbsp;'; 
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
							$content += '</a><br/>Mitglied';           
                                                                   
//        _                                                             
//       dM.                     68b             68b                    
//      ,MMb               /     Y89             Y89   /                
//      d'YM.      ____   /M     ___ ____    ___ ___  /M    ____    ___ 
//     ,P `Mb     6MMMMb./MMMMM  `MM `MM(    )M' `MM /MMMMM `MM(    )M' 
//     d'  YM.   6M'   Mb MM      MM  `Mb    d'   MM  MM     `Mb    d'  
//    ,P   `Mb   MM    `' MM      MM   YM.  ,P    MM  MM      YM.  ,P   
//    d'    YM.  MM       MM      MM    MM  M     MM  MM       MM  M    
//   ,MMMMMMMMb  MM       MM      MM    `Mbd'     MM  MM       `Mbd'    
//   d'      YM. YM.   d9 YM.  ,  MM     YMP      MM  YM.  ,    YMP     
// _dM_     _dMM_ YMMMM9   YMMM9 _MM_     M      _MM_  YMMM9     M      
//                                                              d'      
//                                                          (8),P       
//                                                           YMM        
						} else if (e.type == 'activity') {

							$content += '<i class="fa fa-suitcase"></i>&nbsp;'; 
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

							$content += '</a><br/>';    //"Angaben zur Nebentätigkeit"    
							if (isExistant(e.data)) {
								$(e.data).each(function(idx,data){ 

									if (data.key == 'activity') {
										$content += data.value.position + '<br/>';
										$content += data.value.type + ' ';
									}
								});
							}  

                                                                                
                                                                                
// __________                                                                      
// `MMMMMMMMM                                              68b                     
//  MM      \                                        /     Y89                     
//  MM        ____   ___  ____     ____  ___   ___  /M     ___ ____    ___  ____   
//  MM    ,   `MM(   )P' 6MMMMb   6MMMMb.`MM    MM /MMMMM  `MM `MM(    )M' 6MMMMb  
//  MMMMMMM    `MM` ,P  6M'  `Mb 6M'   Mb MM    MM  MM      MM  `Mb    d' 6M'  `Mb 
//  MM    `     `MM,P   MM    MM MM    `' MM    MM  MM      MM   YM.  ,P  MM    MM 
//  MM           `MM.   MMMMMMMM MM       MM    MM  MM      MM    MM  M   MMMMMMMM 
//  MM           d`MM.  MM       MM       MM    MM  MM      MM    `Mbd'   MM       
//  MM      /   d' `MM. YM    d9 YM.   d9 YM.   MM  YM.  ,  MM     YMP    YM    d9 
// _MMMMMMMMM _d_  _)MM_ YMMMM9   YMMMM9   YMMM9MM_  YMMM9 _MM_     M      YMMMM9  
                                                                                
                                                                                
                                                                                
						} else if (e.type == 'executive') {

							$content += '<i class="fa fa-user"></i>&nbsp;'; 
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

							$content += '</a><br/>';    //"Angaben zur Nebentätigkeit"    
							if (isExistant(e.data)) {
								$(e.data).each(function(idx,data){ 
									if (data.key == 'position') {
										if (isExistant(data.value)) {
											$content += data.value ;
										}
									}
								});
							}                                   
// ________              __               ___         
// `MMMMMMMb.           69MM              `MM         
//  MM    `Mb          6M' `               MM   /     
//  MM     MM   ____  _MM__ ___  ___   ___ MM  /M     
//  MM     MM  6MMMMb MMMM6MMMMb `MM    MM MM /MMMMM  
//  MM     MM 6M'  `Mb MM8M'  `Mb MM    MM MM  MM     
//  MM     MM MM    MM MM    ,oMM MM    MM MM  MM     
//  MM     MM MMMMMMMM MM,6MM9'MM MM    MM MM  MM     
//  MM     MM MM       MMMM'   MM MM    MM MM  MM     
//  MM    .M9 YM    d9 MMMM.  ,MM YM.   MM MM  YM.  , 
// _MMMMMMM9'  YMMMM9 _MM`YMMM9'Yb.YMMM9MM_MM_  YMMM9 
                                               
						} else {
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
						}
						
						$content += '</div>';
					});
					$content += '</div>';
				}



			if (hasLinks) {
				console.log('Entity has Links');
				$content += '<div class="row row-results">';
				$content += '<div class="col-md-12"><h4>Links</h4></div>';

				$(entity.data).each(function(idx,data){ 
					if (data.key == 'link') {
						$content += '<div class="col-md-12">';

						$content += '<div class="entity-link"><i class="fa fa-external-link"></i> <a title="'+data.value.url+'" target="_blank" href="'+data.value.url+'">'+data.value.url+'</a></div>';
						$content += '</div>';
					}
				});
				$content += '</div>';
			}

			if (hasSource) {
				console.log('Entity has Source');
				$content += '<div class="row row-results">';
				$content += '<div class="col-md-12"><h4>Quellen</h4></div>';

				$(entity.data).each(function(idx,data){ 
					if (data.desc == 'Quelle') {
						$content += '<div class="col-md-12">';
						$content += '<div class="entity-source">';
						if (data.value.url !== undefined) {
							$content += '<i class="fa fa-bookmark"></i> <a title="'+data.value.url+'" target="_blank" href="'+data.value.url+'">';
							$content += data.value.url;
							$content += '</a>';
						}
						$content += '</div>';
						$content += '</div>';
					}
				});
				$content += '</div>';

			}


						// alias
			// if (entity.aliases.length > 0) {
			// 	$content += '<h3>Alternative Schreibweisen</h3><p>';
			// 	$(entity.aliases).each(function(idx,e){ 
			// 		$content += e+';&nbsp;'; 
			// 	});
			// 	$content += '</p>';
			// }

			// <div class="list-group">
//   <a href="#" class="list-group-item active">
//     Cras justo odio
//   </a>
//   <a href="#" class="list-group-item">Dapibus ac facilisis in</a>
//   <a href="#" class="list-group-item">Morbi leo risus</a>
//   <a href="#" class="list-group-item">Porta ac consectetur ac</a>
//   <a href="#" class="list-group-item">Vestibulum at eros</a>
// </div>

			$content += '<div class="row"><br/>';
			$content += '<div class="col-sm-6">';
			$content += '<a class="btn btn-block btn-default" href="#" role="button">Verbindung melden</a>';
			$content += '</div>';
			$content += '<div class="col-sm-6">';
			$content += '<a class="btn btn-block btn-default" href="#" role="button">Fehler melden</a>';
			$content += '</div>';
			$content += '</div>';

			$content += '<div class="row"><br/>';
			$content += '<div class="col-sm-12">';
			$content += '<p class="meta">';
			$content += '<span>Erstellt: '+moment(entity.created).format("DD.MM.YYYY hh:mm")+'</span><br/>';
			$content += '<span>Aktualisiert: '+moment(entity.created).format("DD.MM.YYYY hh:mm")+'</span>';
			$content += '</p>';
			$content += '</div>';
			$content += '</div>';



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
	$('.static-page').css({  'width': winWidth, 'height': winHeight });


	if ($('#networkviz').length == 0) {
		// map could not be found
	} else {
		NetworkViz.panToEntity(); // missuse the func to get the viz on index
	}

	$( ".leaflet-control-zoom" ).css( "display",'none' );

	showShareButton();

	// show whatsapp button on iphone
	(navigator.userAgent.match(/(iPhone)/g)) ? $(".entypo-whatsapp").addClass('shown') : null ;

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
		$( "leaflet-control-zoom" ).css( "display",'block' );
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