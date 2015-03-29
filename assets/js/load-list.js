
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
