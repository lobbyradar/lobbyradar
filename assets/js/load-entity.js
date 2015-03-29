
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


// we use this when the loadEntity function is called from within the app
// as opposed to a deep link
// and set the url
function loadEntityAjax(id) {
    loadEntity(id);
    window.history.pushState(null, 'entity', '/entity/'+id);
}


function isExistant(el) { 
  if (el !== undefined) { if (el != 0 || undefined || '' || null) { return true; } }
  // else
  return false;
}

// load an entity from ID and build up html
// used in Deeplink and Detail from List
function loadEntity(id) {

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
        if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto')       { var hasPhotos = true; }
        if (data.desc == 'Quelle')      { var hasSource = true; }
        if (data.key == 'address')    { var hasAddress = true; }
        if (data.key == 'link')         { var hasLinks = true; }
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
      //  $content += '<span class="label label-default">'+e+'</span>&nbsp;'; 
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
      //  console.log('Entity has Adress');
      //  $content += '<div class="row">';
      //  $content += '<div class="col-md-12"><h4>Adressen</h4></div>';

      //  $(entity.data).each(function(idx,data){ 
      //    if (data.key == 'address') {
      //    if (data !== undefined) {
      //        $content += '<div class="col-md-6">';

      //        if (isExistant(data.value.addr)) {
      //          $content += data.value.addr+'<br/>';
      //          console.log(data.value.addr);
      //        }
      //        if (isExistant(data.value.street)) {
      //          $content += data.value.street+'<br/>';
      //        } 
      //        if (isExistant(data.value.postcode)) {
      //          $content += data.value.postcode+'&nbsp;';
      //        }
      //        if (isExistant(data.value.city)) {
      //          $content += data.value.city+'<br/>';
      //        }
      //        $content += '<br/>';

      //        if (isExistant(data.value.tel)) {
      //          $content += '<abbr title="Phone">P:</abbr>&nbsp;'+data.value.tel+'<br/>';
      //        }
      //        if (isExistant(data.value.fax)) {
      //          $content += '<abbr title="Fax">F:</abbr>&nbsp;'+data.value.fax+'<br/>';
      //        }
      //        if (isExistant(data.value.email)) {
      //          $content += '<abbr title="Email">E:</abbr>&nbsp;'+data.value.email+'<br/>';
      //        }
      //        if (isExistant(data.value.www)) {
      //          $content += '<abbr title="Web">W:</abbr>&nbsp;'+data.value.www+'<br/>';
      //        }
      //        $content += '</div>';
      //    }
      //  }
      //  });
      //  $content += '</div>';
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
      //  $content += '<h3>Alternative Schreibweisen</h3><p>';
      //  $(entity.aliases).each(function(idx,e){ 
      //    $content += e+';&nbsp;'; 
      //  });
      //  $content += '</p>';
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
