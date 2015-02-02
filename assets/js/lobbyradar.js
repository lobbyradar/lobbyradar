  // global vars
  var winWidth = $(window).width();
  var winHeight = $(window).height();

$( document ).ready(function() {

  $(".lobbysearch").focus(function(){
    $(".overlay").fadeOut("slow");
  });

  $( "#networkviz" ).draggable();

  $( ".logo-name" ).click(function() {
    $( ".result-list" ).slideUp( "slow" );
    $( ".result-single" ).slideUp( "slow" );
    $( ".overlay" ).fadeIn( "slow" ); 
  });

  $( ".navbar-brand .zdf-logo-lobbyradar" ).click(function() {
    $( ".result-list" ).slideUp( "slow" );
    $( ".result-single" ).slideUp( "slow" );
    $( ".overlay" ).fadeIn( "slow" ); 
  });

  $('.lobbysearch').keypress(function (e) {
    if (e.which === 13) {
      // $( ".result-list" ).slideToggle( "slow" );
      $( ".result-list" ).slideDown( "slow" );
      console.log('pressed enter');
      return false;
      event.preventDefault();
    }
  });

  // http://stackoverflow.com/questions/16437182/issue-with-a-scrollable-div-on-ipad
  $('body').on('touchmove','.scrollable',function(e) {
    var tot = 0;
    $(this).children('li:visible').each(function() { tot += $(this).height(); }); // this is not quite right
    if(tot > $(this).innerHeight()) {
      e.stopPropagation();
    }
  });
                                                                                  
//   ____                        ___                __________                                         
//  6MMMMb\68b                   `MM                `MMMMMMMMM                  68b                    
// 6M'    `Y89                    MM                 MM      \            /     Y89   /                
// MM      ___ ___  __     __     MM   ____          MM        ___  __   /M     ___  /M    ____    ___ 
// YM.     `MM `MM 6MMb   6MMbMMM MM  6MMMMb         MM    ,   `MM 6MMb /MMMMM  `MM /MMMMM `MM(    )M' 
//  YMMMMb  MM  MMM9 `Mb 6M'`Mb   MM 6M'  `Mb        MMMMMMM    MMM9 `Mb MM      MM  MM     `Mb    d'  
//      `Mb MM  MM'   MM MM  MM   MM MM    MM        MM    `    MM'   MM MM      MM  MM      YM.  ,P   
//       MM MM  MM    MM YM.,M9   MM MMMMMMMM        MM         MM    MM MM      MM  MM       MM  M    
//       MM MM  MM    MM  YMM9    MM MM              MM         MM    MM MM      MM  MM       `Mbd'    
// L    ,M9 MM  MM    MM (M       MM YM    d9        MM      /  MM    MM YM.  ,  MM  YM.  ,    YMP     
// MYMMMM9 _MM__MM_  _MM_ YMMMMb._MM_ YMMMM9        _MMMMMMMMM _MM_  _MM_ YMMM9 _MM_  YMMM9     M      
//                       6M    Yb                                                              d'      
//                       YM.   d9                                                          (8),P       
//                        YMMMM9                                                            YMM      

  if (window.location.href.indexOf("/entity/") > -1) {

        var req = null;

    console.log('entity.page');
    var str = window.location.href;
    var entityID = str.split("/")[4];
    console.log('entity.page, ID: '+entityID);
    $( ".result-single" ).slideDown( "slow" );
    $( ".overlay" ).css( "display",'none' ); 

      if (req) req.abort();
      req = $.getJSON("/api/entity/get/"+entityID, {
      }, function(data){
          // build new result
          // console.log(data);
          var $content = $('<div class="entity"></div>');
          if (data.hasOwnProperty("result")) {
            console.log(data.result);

            // $content.append('<tr><td><i class="fa fa-'+((e.type==="person")?"":"")+'"></i> <a class="entity-detail" href="/entity/'+e._id+'">'+e.name+'</a></td><td><a href="/entity/'+e._id+'">'+e.connections+'</a></td></tr>');
            console.log('build up content');
            if (data.result.type == 'person') $content.append('<iv class="fa fa-user"></i>');
            $content.append('<div class="name">'+data.result.name+'</div>');
          
                $(data.result.tags).each(function(idx,e){
                  $content.append('<div class="tags">'+e+'</div>');
                });
            
          }
          // clear current view

          console.log('append new results');
          $(".result-single .content ", "#main").append($content);

          // reset request
          req = null;
      });
  }





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

  // set initial div height / width
  $('.fullscreen').css({ 'width': winWidth, 'height': winHeight });

  // lazy typeahead
  (function(){
    var req = null;
    $('body').on('keyup', '.lobbysearch', function(evt) {
      console.log($(this).val());
      var $resultName = $(this).val();
      // if ($(this).val().length >= 3) {
      if (evt.which === 13) { // only send request when enter is pressed. TODO: search button
        // abort previous request
        $(".result-list table tbody", "#main").html("<i class='fa-cog text-center fa-5x fa fa-spin'></i>");

        if (req) req.abort();
        req = $.getJSON("/api/entity/list", {
          words: $(this).val()
        }, function(data){
          // build new result
          console.log('build new result');
          var $tb = $("<tbody></tbody>");
          if (data.hasOwnProperty("result") && data.result instanceof Array) $(data.result).each(function(idx,e){
            $tb.append('<tr><td><i class="fa fa-'+((e.type==="person")?"":"")+'"></i> <a class="entity-detail" href="/entity/'+e._id+'">'+e.name+'</a></td><td><a href="/entity/'+e._id+'">'+e.connections+'</a></td></tr>');
            $(".result-list p .result-name", "#main").html($resultName);
          });
          
          $( ".result-list" ).slideDown( "slow" );
          console.log('pressed enter');
  
          // clear current view
          console.log('clear current view');
          $(".result-list table tbody", "#main").remove();
          console.log('append new results');
          $(".result-list table ", "#main").append($tb);

          // reset request
          req = null;
        });
      };
    });
  })();
 
$('body').on('click', '#backtolist', function(event) {
  // $(".result-list").hide("slide", { direction: "left" }, 1000);
  $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
  $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);
  return false;
  e.preventDefault();
});

// $('body').on('click', '.entity-detail', function(e) {
//   $(".result-single", "#main").html("<i class='fa-cog text-center fa-5x fa fa-spin'></i>");

//   e.preventDefault();
//   var link = $(this).attr("href");
//   $('.result-single').load(link, function(){

//   });
//   $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
//   $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);
//   return false;
// });

  // set initial div height / width
  $('.fullscreen').css({
    'width': winWidth,
    'height': winHeight
  });
  $('.faq-page').css({ 'width': winWidth, 'height': winHeight });

});


// make sure div stays full width/height on resize
$(window).resize(function(){
  $('.fullscreen').css({
    'width': winWidth,
    'height': winHeight,
  });
});