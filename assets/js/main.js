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

// var winHeight = $(window).height() + 150,
//     winWidth = screen.width;

// a function to sort arrays
var sort_by = function (field, reverse, primer) {
  var key = primer ?
    function (x) {
      return primer(x[field]);
    } :
    function (x) {
      return x[field];
    };
  reverse = [-1, 1][+!!reverse];

  return function (a, b) {
    return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
  };
};
         
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


function isExistant(el) {
  if (el !== undefined) {
    if (el !== 0 || undefined || '' || null) {
      return true;
    }
  }
  // else
  return false;
}

// Numberformating
function numberThousandSep(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function numberWithCommas(x) {
  var s = x.toString();
  s = s.split('.');
  if (s[1] == undefined) s[1] = '00';
  if (s[1].length == 1 && s[1] != undefined) s[1] += '0';
  if (s[1].length > 2) s[1] = s[1].slice(0, 2);
  var pre = numberThousandSep(s[0]);
  return pre + ',' + s[1];
}

$(document).ready(function () {

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

}); // document.ready end

// make sure div stays full width/height on resize
$(window).resize(function(){ setWidthHeight(); });

$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  if (direction === 'back') {
    // go back
  }
  if (direction === 'forward') {
    // do something else
  }
});

// Makes the back button work
window.onpopstate = function (event) {
  var url = window.location.href; // get the url
  var id = url.split("/")[4]; // extract ID

  if (window.location.href.indexOf("/entity/") > -1) { loadEntity(id); }
  if (window.location.href.indexOf("/search/") > -1) { loadList(id); }
  
  if (location.pathname + location.search + location.hash == "/") {
    $(".overlay").fadeIn("slow");
    $(".result-single").slideUp("slow");
    $(".result-list").slideUp("slow");
  }
};