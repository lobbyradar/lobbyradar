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

// load an entity from ID and build up html
// used in Deeplink and Detail from List
function loadEntity(id) {
  var req = null;
  if (req) { req.abort(); }

  req = $.getJSON("/api/entity/get/"+id, {relations:true}, function(data){
    var $content = '<div class="entity">';
   
    if (data.hasOwnProperty("result")) {
      var entity = data.result;
      console.log(data.result);
      
      // title 
      $content += '<h1 class="name">'+entity.name+'</h1>';

      // icon
      if (entity.type == 'person') {
        $content += '<i class="fa fa-user"></i>Person';
      }

      // tags
      $(data.result.tags).each(function(idx,e){ 
        $content += '<span class="label label-default">'+e+'</span>&nbsp;'; 
      });

      // alias
      if (entity.aliases.length > 0) {
        $content += '<h3>Alternative Schreibweisen</h3><p>';
        $(entity.aliases).each(function(idx,e){ 
          $content += e+';&nbsp;'; 
        });
        $content += '</p>';
      }

      // adress
      if (entity.data.length > 0) {
        if (entity.data[2] !== undefined) {
          $content += '<h3>Adresse</h3><adress>';
          var entityAdress = entity.data[2];
          console.log(entityAdress);
          $content += entityAdress.value.addr+'<br/>';
          $content += entityAdress.value.street+'<br/>';
  
          $content += entityAdress.value.postcode+'&nbsp;';
          $content += entityAdress.value.city+'<br/>';
          $content += '<abbr title="Phone">P:</abbr>&nbsp;'+entityAdress.value.tel+'<br/>';
          $content += '<abbr title="Fax">F:</abbr>&nbsp;'+entityAdress.value.fax+'<br/>';
          $content += '<abbr title="Email">E:</abbr>&nbsp;'+entityAdress.value.email+'<br/>';
          $content += '<abbr title="Web">W:</abbr>&nbsp;'+entityAdress.value.www+'<br/>';
  
          $content += '</adress>';
        }
      }

      // TODO get connections @yetzt

    }
    $content += '</div>';
    // clear current view
    console.log('append new results');
    $(".result-single .content .entity", "#main").remove();
    $(".result-single .content ", "#main").append($content);
    // reset request
    req = null;
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

  // set initial div height / width
  $('.fullscreen').css({  'width': winWidth, 'height': winHeight });
  $('.faq-page  ').css({  'width': winWidth, 'height': winHeight });


  $(".lobbysearch").focus(function(){
    $(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
  });

  $('.lobbysearch').keypress(function (e) {
    if (e.which === 13) {
      $( ".result-list" ).slideDown( "slow" );
      return false;
      event.preventDefault();
    }
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
    $( "#backtolist" ).css( "display",'none' ); // There is no list to go back to 
    $( ".overlay" ).css( "display",'none' ); // we dont need the intro

    var str = window.location.href; // get the url 
    var entityID = str.split("/")[4]; // extract ID
    console.log('entity.entry, ID: '+entityID);

    loadEntity(entityID);

    $( ".result-single" ).slideDown( "slow" );  // show me the single panel
  }



    // this kicks in when we get a deep link to an search
    // /search/:id
  if (window.location.href.indexOf("/search/") > -1) {
    $( "#backtolist" ).css( "display",'none' ); // There is no list to go back to 
    $( ".overlay" ).css( "display",'none' ); // we dont need the intro

    var str = window.location.href; // get the url 
    var entityID = str.split("/")[4]; // extract ID
    console.log('entity.entry, ID: '+entityID);
    var $resultName = entityID;
    var req = null;

    // loadEntity(entityID);
    if (req) req.abort();
        req = $.getJSON("/api/autocomplete", {
          q: entityID
        }, function(data){
        console.log(data);

          var $tb = $("<tbody></tbody>");

          if (data instanceof Array && data.length > 0) $(data).each(function(idx,e){
            $tb.append('<tr><td><i class="fa fa-'+((e.type==="person")?"":"")+'"></i> <a class="entity-detail" href="/entity/'+e.id+'">'+e.name+'</a></td><td><a href="/entity/'+e._id+'">'+e.connections+'</a></td></tr>');
            $(".result-list p .result-name", "#main").html($resultName);
          });

          $( ".result-list" ).slideDown( "slow" );
          history.pushState(null, null, '/search/'+$resultName);

          $(".result-list table tbody", "#main").remove();
          $(".result-list table ", "#main").append($tb);

          // reset request
          req = null;
        });
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
    $('body').on('keyup', '.lobbysearch', function(evt) {

      console.log($(this).val());
      var $resultName = $(this).val();
      if ($(this).val().length >= 3) { // autocomplete after 3 letters

        $( ".result-single" ).slideUp( "slow" );

        $(".result-list table tbody", "#main").html("<i class='fa-cog text-center fa-5x fa fa-spin'></i>");

        if (req) req.abort();
        req = $.getJSON("/api/autocomplete", {
          q: $(this).val()
        }, function(data){
        console.log(data);

          var $tb = $("<tbody></tbody>");

          if (data instanceof Array && data.length > 0) $(data).each(function(idx,e){
            $tb.append('<tr><td><i class="fa fa-'+((e.type==="person")?"":"")+'"></i> <a class="entity-detail" href="/entity/'+e.id+'">'+e.name+'</a></td><td><a href="/entity/'+e._id+'">'+e.connections+'</a></td></tr>');
            $(".result-list p .result-name", "#main").html($resultName);
          });

          $( ".result-list" ).slideDown( "slow" );
          history.pushState(null, null, '/search/'+$resultName);

          $(".result-list table tbody", "#main").remove();
          $(".result-list table ", "#main").append($tb);

          // reset request
          req = null;
        });

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
                                                                                                                          
                                                                                                                          
  // bring back the list when the button in detail is clicked           
  $('body').on('click', '#backtolist', function(event) {
    $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
    $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);
    window.history.back()
    return false;
    e.preventDefault();
  });

  // bring up the details when an entry is clicked from list                                                                                                               
  $('body').on('click', '.entity-detail', function(e) {
    e.preventDefault();
    var req = null;
    console.log('loading an entity from the list');
    var str = this.href;
    var entityID = str.split("/")[4];
    console.log('entity.entry, ID: '+entityID);
    loadEntity(entityID);
    //history.pushState('data', '', 'http://localhost:9000/entity/'+entityID);
    history.pushState(null, null, this.href);

    $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
    $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);
  });


                                                                                                        
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