$( document ).ready(function() {
  
  $( ".lobbysearch" ).focus(function() {
    $( ".overlay" ).fadeOut( "slow" );
  });

  $( "#networkviz" ).draggable();

  $( ".logo-name" ).click(function() {
    $( ".result-list" ).slideUp( "slow" );
    $( ".result-single" ).slideUp( "slow" );

    $( ".overlay" ).fadeIn( "slow" ); 
  });

  $('.lobbysearch').keypress(function (e) {
  
    if (e.which === 13) {
      // $( ".result-list" ).slideToggle( "slow" );
      $( ".result-list" ).slideDown( "slow" );
      return false;
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
  $('body').on('touchmove','.scrollable',function(e) {
    e.stopPropagation();
  });

   $("tr a").click(function () {
          // $(".result-list").hide("slide", { direction: "left" }, 1000);
          $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
          $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);

          return false;
    });

      $("#back").click(function () {
          // $(".result-list").hide("slide", { direction: "left" }, 1000);
                    $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);

          $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);

          return false;
    });



  // global vars
  var winWidth = $(window).width();
  var winHeight = $(window).height();
   
  // set initial div height / width
  $('.fullscreen').css({
    'width': winWidth,
    'height': winHeight,
  });


  // make sure div stays full width/height on resize

  $(window).resize(function(){
    $('.fullscreen').css({
      'width': winWidth,
      'height': winHeight,
    });
  });

});