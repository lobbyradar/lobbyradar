// $.ajax({
//     url: 'http://www.zdf.de/api/v2/content/p12:37951336',
//     dataType: 'jsonp',
//     contentType: "text/xml",
//     headers: { 'Access-Control-Allow-Origin': '*' },
//     crossDomain: true,
//     success: function(data){
//         // Extract relevant data from XML
//         console.log(data);
//         // var xml_node = $('treffer',data);
//         // console.log( xml_node.find('Teaser > dachzeile').text() );
//     },
//     error: function(data){
//         console.log('Error loading XML data');
//     }
// });

// function xml2json(xml) {
//   try {
//     var obj = {};
//     if (xml.children.length > 0) {
//       for (var i = 0; i < xml.children.length; i++) {
//         var item = xml.children.item(i);
//         var nodeName = item.nodeName;

//         if (typeof (obj[nodeName]) == "undefined") {
//           obj[nodeName] = xml2json(item);
//         } else {
//           if (typeof (obj[nodeName].push) == "undefined") {
//             var old = obj[nodeName];

//             obj[nodeName] = [];
//             obj[nodeName].push(old);
//           }
//           obj[nodeName].push(xml2json(item));
//         }
//       }
//     } else {
//       obj = xml.textContent;
//     }
//     return obj;
//   } catch (e) {
//       console.log(e.message);
//   }
// }

//  function getZDFArticles(data){
//     alert('hi!');
//     var obj = $.parseJSON(data);
//     console.log(obj);
// }

// $.get( "http://www.zdf.de/api/v2/content/p12:37951336", function( data ) {
//     var jsonObj = $.xml2json(data);
//   console.log(jsonObj)
//   alert( "Load was performed." );
// });


var createCORSRequest = function(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // Most browsers.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // IE8 & IE9
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
};

var url = 'http://module.zdf.de/api/v2/content/p12:37951336';
var method = 'GET';
var xhr = createCORSRequest(method, url);

xhr.onload = function() {
  console.log(xhr);
};

xhr.onerror = function() {
  // Error code goes here.
};

xhr.send();