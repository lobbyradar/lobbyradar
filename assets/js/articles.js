function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null; // CORS not supported.
  }
  return xhr;
}


// Make the actual CORS request.
function makeCorsRequest() {
  var url = 'http://module.zdf.de/api/v2/content/p12:37951336';

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    XMLdata = $(xhr.responseText);
    var Treffer = XMLdata.find("treffer");

    Treffer.find("teaser").each(function () {
      $article = $('<div class="article"></div>');
      $article.append(  "<h2>" + $(this).find("dachzeile").text() + "</h2>" +
                        "<h3>" + $(this).find("teaserTitel").text() + "</h3>" +
                        "<span>" + moment($(this).find("datum").text()).format('LLLL') + "</span>" + 
                        "<p>" + $(this).find("teaserText").text() + "</p>" +
                        "<a role='button' class='hidden-xs btn-ext btn btn-info' href=''>Zum Artikel gehen</a>" );

      $article.append( "<br/>" );
      $(".articles").append($article);
      console.log($(this).find("datum").text());
      console.log($(this).find("teaserText").text());

    });
  };

  xhr.onerror = function() {
    console.log('Woops, there was an error making the request.');
  };

  xhr.send();

}

makeCorsRequest(); 


