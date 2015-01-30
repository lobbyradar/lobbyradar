$( document ).ready(function() {
  

$( ".lobbysearch" ).focus(function() {
    $( ".overlay" ).fadeOut( "slow" );
});


$( "#networkviz" ).draggable();



$( ".logo-name" ).click(function() {
    $( ".result-list" ).slideUp( "slow" );
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
  $(this).children('li:visible').each(function() { tot += $(this).height(); });
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

//    $("#joschka").click(function () {
//           // $(".result-list").hide("slide", { direction: "left" }, 1000);
//           $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);
//           $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);

//           return false;
//     });

//       $("#back").click(function () {
//           // $(".result-list").hide("slide", { direction: "left" }, 1000);
//                     $(".result-single").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},500);

//           $(".result-list").animate({height:"toggle",opacity:"toggle", easing: "easeOutQuint"},1000);

//           return false;
//     });

// $("#change-visual").click(function () {
//           // $(".result-list").hide("slide", { direction: "left" }, 1000);
//           $("#map").animate({opacity:"toggle", easing: "easeOutQuint"},500);
//           $("svg").animate({opacity:"toggle", easing: "easeOutQuint"},1000);
//           $('.fullscreen').css({
//   'width': winWidth,
//   'height': winHeight,
// });
//           return false;
//     });

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




// var w = winWidth,
//     h = winHeight,
//     node,
//     link,
//     root;

// var force = d3.layout.force()
//     .on("tick", tick)
//     .charge(function(d) { return d._children ? -d.size / 1 : -300; })
//     .linkDistance(function(d) { return d.target._children ? 20 : 30; })
//     .size([w-400, h - 60]);

// var vis = d3.select(".fullscreen").append("svg:svg")
//     .attr("width", w)
//     .attr("height", h);

// d3.json("flare.json", function(json) {
//   root = json;
//   root.fixed = true;
//   root.x = w / 2;
//   root.y = h / 2 - 80;
//   update();
// });

// function update() {
//   var nodes = flatten(root),
//       links = d3.layout.tree().links(nodes);

//   // Restart the force layout.
//   force
//       .nodes(nodes)
//       .links(links)
//       .start();

//   // Update the links…
//   link = vis.selectAll("line.link")
//       .data(links, function(d) { return d.target.id; });

//   // Enter any new links.
//   link.enter().insert("svg:line", ".node")
//       .attr("class", "link")
//       .attr("x1", function(d) { return d.source.x; })
//       .attr("y1", function(d) { return d.source.y; })
//       .attr("x2", function(d) { return d.target.x; })
//       .attr("y2", function(d) { return d.target.y; });

//   // Exit any old links.
//   link.exit().remove();

//   // Update the nodes…
//   node = vis.selectAll("circle.node")
//       .data(nodes, function(d) { return d.id; })
//       .style("fill", color);

//   node.transition()
//       .attr("r", function(d) { return d.children ? 4.5 : Math.sqrt(d.size) / 10; });

//   // Enter any new nodes.
//   node.enter().append("svg:circle")
//       .attr("class", "node")
//       .attr("cx", function(d) { return d.x; })
//       .attr("cy", function(d) { return d.y; })
//       .attr("r", function(d) { return d.children ? 4.5 : Math.sqrt(d.size) / 10; })
//       .style("fill", color)
//       .on("click", click)
//       .call(force.drag);

//   // Exit any old nodes.
//   node.exit().remove();
// }

// function tick() {
//   link.attr("x1", function(d) { return d.source.x; })
//       .attr("y1", function(d) { return d.source.y; })
//       .attr("x2", function(d) { return d.target.x; })
//       .attr("y2", function(d) { return d.target.y; });

//   node.attr("cx", function(d) { return d.x; })
//       .attr("cy", function(d) { return d.y; });
// }

// // Color leaf nodes orange, and packages white or blue.
// function color(d) {
//   return d._children ? "#062b3e" : d.children ? "#c6dbef" : "#fd8d3c";
// }

// // Toggle children on click.
// function click(d) {
//   if (d.children) {
//     d._children = d.children;
//     d.children = null;
//   } else {
//     d.children = d._children;
//     d._children = null;
//   }
//   update();
// }

// // Returns a list of all nodes under the root.
// function flatten(root) {
//   var nodes = [], i = 0;

//   function recurse(node) {
//     if (node.children) node.size = node.children.reduce(function(p, v) { return p + recurse(v); }, 0);
//     if (!node.id) node.id = ++i;
//     nodes.push(node);
//     return node.size;
//   }

//   root.size = recurse(root);
//   return nodes;
// }

});