function loadList(id) {
  $(".leaflet-control-zoom").css("display", 'block');

  $(".result-single").slideUp("slow");

  var req = null;
  var $resultName = id;

  if (req) req.abort();
  req = $.getJSON("/api/autocomplete", {
    q: id
  }, function (data) {
    console.log(data);
    if (data === undefined || data.length == 0) {
      var $ul = $("<div class='message'>Es konnten keine Einträge gefunden werden. Bitte Groß- und Kleinschreibung beachten.</div>");
      $(".result-list").slideDown("slow");
      $(".result-list .results .list-group", "#main").remove();
      $(".result-list .results .message", "#main").remove();

      $(".result-list .results ", "#main").append($ul);
      $(".result-list .lead").css("display", "none");
      // reset request
      req = null;
    } else {
      data = data.sort(sort_by('name', true, function (a) {
        return a.toUpperCase()
      }));
      var $ul = $("<ul class='list-group'></ul>");
      if (data instanceof Array && data.length > 0) $(data).each(function (idx, e) {
        var $content = '<li class="list-group-item">';
        $content += '<i class="fa fa-user"></i>&nbsp;';
        $content += '<a class="ajax-load entity-detail" href="/entity/' + e.id + '">';
        $content += e.name;
        $content += ' </a><span class="label label-default"><i class="fa fa-share-alt"></i> ' + e.relations + '</span><div class="clearfix"></div>'
        $content += '</li>'
        // $ul.append('<li class="list-group-item"> <a class="ajax-load entity-detail" href="/entity/'+e.id+'">'+e.name+' </a><span class="label label-default"><i class="fa fa-share-alt"></i> '+e.relations+'</span><div class="clearfix"></div></li>');
        $ul.append($content);

        $(".result-list .result-name", "#main").html($resultName);
        $(".result-list .lead").css("display", "block");
      });
      $(".result-list").slideDown("slow");
      $(".result-list .results .list-group", "#main").remove();
      $(".result-list .results ", "#main").append($ul);
      $(".result-list .message").remove();

      // reset request
      req = null;
    }
  });
}


// load an entity from ID and build up html
// used in Deeplink and Detail from List
function loadEntity(id) {

  $(".leaflet-control-zoom").css("display", 'block');

  var req = null;
  if (req) {
    req.abort();
  }
  $(".result-list").slideUp("slow");
  $('.fullscreen').animate({scrollTop: 0});

  NetworkViz.highlightEntity(id);
  $("#backtolist").css("display", 'inline-block'); // always show the backbutton

  // change the url + history literal object
  // history.pushState(null, null, '/entity/'+id);
  // obj.historyData.id = id;
  // console.log('Object History Data ID: '+obj.historyData.id);
  // 

  req = $.getJSON("/api/entity/get/" + id, {relations: true}, function (data) {
    var $content = '<div class="entity">';

    if (data.hasOwnProperty("result")) {
      var entity = data.result;
      console.log(data.result);
      var hasAddIncome = false;
      var isCommittee = false;
      var hasPartyDonation = false;
      var donationArray = [];

      // check for the different types of data
      for (var i = 0, data; data = entity.data[i]; i++) {
        if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
          var hasPhotos = true;
        }
        if (data.desc == 'Quelle') {
          var hasSource = true;
        }
        if (data.key == 'address') {
          var hasAddress = true;
        }
        if (data.key == 'link') {
          var hasLinks = true;
        }
      }

      $content += '<div class="row row-results">';

      if (hasPhotos) {
        console.log('Entity has Photos');
        $(entity.data).each(function (idx, data) {
          if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
            if (isExistant(data.value.url)) {
              $content += '<div class="col-md-3"><div class="entity-img" style="background-image:url(' + data.value.url + ')" /></div>';
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
      $(entity.data).each(function (idx, e) {
        if (entity.type == 'entity' && e.key == 'partei') {
          $content += '<i class="fa fa-pie-chart"></i>&nbsp;'; // PARTEI
        } else if (entity.type == 'entity' && e.key == 'legalform') {
          $content += '<i class="fa fa-building-o"></i>&nbsp;'; // PARTEI
        }
      });
      $content += entity.name;
      $content += '</h1>';
      // Bundesland herausgenommen
      //$(entity.data).each(function (idx, data) {
      //  if (data.key == 'bundesland') {
      //    $content += '<p>' + data.value + '</p>'; // PARTEI
      //  }
      //});
      $(entity.tags).each(function (idx, tag) {
        if (tag == 'mdb') {
          $content += '<p>Mitglied des Bundestages</p>';
        } else if (tag == 'lobbyist') {
          $content += '<p>LobbyistIn / InteressensvertreterIn</p>'
        } else if (tag == 'committee') {
          $content += '<p>Ausschuss des Bundestags</p>'
        } else if (tag == 'lobbyorganisation') {
          $content += '<p>Lobbyismus-Organisation registriert beim Deutschen Bundestag</p>'
        } else if (tag == 'thinktank') {
          $content += '<p>Think Tank</p>'
        } else if (tag == 'dax') {
          $content += '<p>Dax-Konzern</p>'
        } else if (tag == 'pr-und-lobbyagentur') {
          $content += '<p>Lobbyismus-Agentur</p>'
        }
      });
      $content += '</div>';

      $content += '</div>';


      // tags
      // $(data.result.tags).each(function(idx,e){ 
      //  $content += '<span class="label label-default">'+e+'</span>&nbsp;'; 
      // });
      // $content += '<hr/>';

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

      if (entity.relations.length > 0) {
        // var relations = entity.relations.sort(sort_by('entity[name]', true));
        var relations = entity.relations;
        $content += '<h4>Verbindungen</<h4></h4>';
        $content += '<div class="entity-relations-list">';

        $(relations).each(function (idx, e) {

          if (e.tags[0] !== 'nebentaetigkeit' && e.tags[0] !== 'committee' && e.type !== 'donation') {
            $content += '<div class="entity-relations-item">';

            if (e.type == 'position' || e.type == 'government') {

              $content += '<i class="fa fa-user"></i>&nbsp;';
              $content += '<a class="ajax-load entity-connections" href="/entity/'
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name + '&nbsp;';
                }
              }
              $content += '</a><br/>';
              if (isExistant(e.data)) {
                $(e.data).each(function (idx, data) {
                  if (data.key == 'position') {
                    $content += data.value + '<br/>';
                    // wtf? muss das da bleiben?
                    if (isExistant(data.value.position)) {
                      $content += data.value.position + '<br/>';
                    }
                  }
                });
              }


            }else if(e.type == 'Hausausweise'){
              $content += 'Hausausweis für: ';
              $content += '<a class="ajax-load entity-connections" href="/entity/';
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name;
                }
              }
              $content += '</a>';
              $content += ', ausgestellt von '+ e.data[0].value+' <br />';
            } else if (e.type == 'member') {
              $content += '<i class="fa fa-group"></i>&nbsp;';
              $content += '<a class="ajax-load entity-connections" href="/entity/'
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name + '&nbsp;';
                }
              }
              $content += '</a><br/>Mitglied';

            } else if (e.type == 'activity') {

              $content += '<i class="fa fa-suitcase"></i>&nbsp;';
              $content += '<a class="ajax-load entity-connections" href="/entity/'
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name + '&nbsp;';
                }
              }

              $content += '</a><br/>';    //"Angaben zur Nebentätigkeit"
              if (isExistant(e.data)) {
                $(e.data).each(function (idx, data) {
                  if (data.key == 'activity') {
                    $content += data.value.position + '<br/>';
                    $content += data.value.type + ' ';
                  }
                });
              }

            // oder GOVERNMENT
            } else if (e.type == 'executive') {

              $content += '<i class="fa fa-user"></i>&nbsp;';
              $content += '<a class="ajax-load entity-connections" href="/entity/'
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name + '&nbsp;';
                }
              }

              $content += '</a><br/>';    //"Angaben zur Nebentätigkeit"
              if (isExistant(e.data)) {
                $(e.data).each(function (idx, data) {
                  if (data.key == 'position') {
                    if (isExistant(data.value)) {
                      $content += data.value;
                    }
                  }
                });
              }
            } else {
              $content += '<a class="ajax-load entity-connections" href="/entity/'
              if (isExistant(e.entity)) {
                if (isExistant(e.entity._id)) {
                  $content += e.entity._id;
                }
                $content += '">';
                if (isExistant(e.entity.name)) {
                  $content += e.entity.name + '&nbsp;';
                }
              }
              $content += '</a>';
            }
            $content += '</div>';
          } else if (e.tags[0] == 'nebentaetigkeit' && e.type == 'activity' && entity.type == 'person') {
            hasAddIncome = true;
          }else if (e.tags[0] == 'nebentaetigkeit' && e.type == 'activity' && entity.type == 'entity'){
            $content += '<div class="entity-relations-item">';
            $content += '<a class="ajax-load entity-connections" href="/entity/'
            if (isExistant(e.entity)) {
              if (isExistant(e.entity._id)) {
                $content += e.entity._id;
              }
              $content += '">';
              if (isExistant(e.entity.name)) {
                $content += e.entity.name + '&nbsp;';
              }
            }
            $content += '</a>';
            $content += '</div>';
          } else if (e.tags[0] == 'committee') {
            isCommittee = true;
          } else if(e.type == 'donation'){
            hasPartyDonation = true;
            donationArray.push(e);
            //var hash = {};
            //list.forEach(function(obj,index){
            //  hash[obj.id]=obj;
            //});
          }
        });
        $content += '</div>';
      }

      if(hasPartyDonation){
        console.log('Entity has party donation');
        $content += '<div class="row row-results">';
        var parteiString = 'Parteispende';

        if (entity.type == 'person') {
          parteiString += ' an '
        } else if (entity.type == 'entity') {
          parteiString += ' von '
        }

        $content += '<div class="col-md-12"><h4><i class="fa fa-euro"></i>&nbsp;'+parteiString+'</h4></div>';
        $content += '<div class="entity-relations-item">';

        donationArray.forEach(function (d) {
          if (isExistant(d.entity)) {
            $content += '<a class="ajax-load entity-connections" href="/entity/'
            if (isExistant(d.entity._id)) {
              $content += d.entity._id;
            }
            $content += '">';
            if (isExistant(d.entity.name)) {
              $content += d.entity.name + '&nbsp;';
            }
          }
          $content += '</a><br/>';
          if (isExistant(d.data)) {
            $content += '<table class="table-condensed table-bordered table">';
            $(d.data).each(function (idx, data) {
              if (data.key == 'donation') {
                $content += '<tr>';
                $content += '<td>';
                $content += data.value.year + ' ';
                $content += '</td>';
                $content += '<td>';
                $content += numberWithCommas(data.value.amount) + ' € ';
                $content += '</td>';
                $content += '</tr>';
              }
            });
            $content += '</table>';
          }
        });
        $content += '</div>';
        $content += '</div>';
      }

      //if a person is a part of a committee
      if (isCommittee) {
        console.log('Entity is a part of a committee');
        $content += '<div class="row row-results">';
        $content += '<div class="col-md-12"><h4><i class="fa fa-group"></i>&nbsp;Ausschüsse des Bundestags</h4></div>';
        $content += '<div class="entity-relations-item">';

        var e = entity.relations;

        e.forEach(function (r) {
          var tags = r.tags;
          tags.forEach(function (t) {
            if (t == 'committee') {
              $content += '<a class="ajax-load entity-connections" href="/entity/';
              if (isExistant(r.entity)) {
                if (isExistant(r.entity._id)) {
                  $content += r.entity._id;
                }
                $content += '">';
                if (isExistant(r.entity.name)) {
                  $content += r.entity.name + '&nbsp;';
                }
              }
              $content += '</a><br/>';
            }
          });
        });
        $content += '</div>';
        $content += '</div>';
      }

      // if a person has additional income
      //
      if (hasAddIncome) {
        if(entity.type == 'person'){
          console.log('Entity has additional income');
          $content += '<div class="row row-results">';
          $content += '<div class="col-md-12"><h4><i class="fa fa-suitcase"></i>&nbsp;Tätigkeit neben dem Bundestagsmandat</h4></div>';
          $content += '<div class="entity-relations-item">';
          var e = entity.relations;

          /*
           a ["Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag",
           b "Funktionen in Vereinen, Verbänden und Stiftungen" ,
           c "Funktionen in Unternehmen" ,
           d "Funktionen in Körperschaften und Anstalten des öffentlichen Rechts" ,
           e "Entgeltliche Tätigkeiten neben dem Mandat" ,
           f "Beteiligungen an Kapital- oder Personengesellschaften" ,
           g "Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile"]
           */

          var _a = '';
          var _b = '';
          var _c = '';
          var _d = '';
          var _e = '';
          var _f = '';
          var _g = '';

          var ob = [];

          e.forEach(function (r) {
            var tags = r.tags;
            tags.forEach(function (t) {
              var zuordnung = '';
              if (t == 'nebentaetigkeit') {
                zuordnung += '<a class="ajax-load entity-connections" href="/entity/';
                if (isExistant(r.entity)) {
                  if (isExistant(r.entity._id)) {
                    zuordnung += r.entity._id;
                  }
                  zuordnung += '">';
                  if (isExistant(r.entity.name)) {
                    zuordnung += r.entity.name + '&nbsp;';
                  }
                }
                zuordnung += '</a><br/>';

                if (isExistant(r.data)) {
                  r.data.forEach(function (d) {
                    if (d.value.type == 'Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag') {
                      _a += zuordnung;
                      _a += d.value.year + ' ' + data.value.position + ' ' + d.value.activity + ' ' + d.value.periodical + '<br>';
                    } else if (d.value.type == 'Funktionen in Vereinen, Verbänden und Stiftungen') {
                      _b += zuordnung;
                      _b += d.value.position + '<br>';
                    } else if (d.value.type == 'Funktionen in Unternehmen') {
                      _c += zuordnung;
                      _c += d.value.position + '<br>';
                    } else if (d.value.type == 'Funktionen in Körperschaften und Anstalten des öffentlichen Rechts') {
                      _d += zuordnung;
                      _d += d.value.position + '<br>';
                    } else if (d.value.type == 'Entgeltliche Tätigkeiten neben dem Mandat') {
                      ob.push(r);
                    } else if (d.value.type == 'Beteiligungen an Kapital- oder Personengesellschaften') {
                      _f += zuordnung;
                      //_f += data.value.position + '<br>';
                    } else if (d.value.type == 'Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile') {
                      _g += zuordnung;
                      _g += d.value.activity + ' ' + d.value.periodical + '<br>';
                    }
                  })
                  zuordnung = '';
                }
              }
            });

          });

          var i = 0,
            j = 1;
          for(; j < ob.length; ){
            if(ob[i]._id == ob[j]._id){
              ob.splice(i,1);
            }else{
              i++;
              j++;
            }
          }

          ob.forEach(function (d) {
            var zuordnung = '';
            zuordnung += '<a class="ajax-load entity-connections" href="/entity/';
            if (isExistant(d.entity)) {
              if (isExistant(d.entity._id)) {
                zuordnung += d.entity._id;
              }
              zuordnung += '">';
              if (isExistant(d.entity.name)) {
                zuordnung += d.entity.name + '&nbsp;';
              }
            }
            zuordnung += '</a><br/>';

            _e += zuordnung;
            d.data.forEach(function (da) {
              if (da.value.year != null) {
                _e += da.value.year + ' ';
              }
              if (da.value.position != null) {
                _e += da.value.position + ' ';
              }
              if (da.value.activity != null) {
                _e += da.value.activity + ' ';
              }
              _e += da.value.periodical + ' Stufe: ' + formatStagesAddIncome(da.value.level) + '<br>';
            })
          });

          if (_a.length != 0) {
            _a = '<br /><h5>Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag</h5>' + _a;
          }
          if (_b.length != 0) {
            _b = '<br /><h5>Funktionen in Vereinen, Verbänden und Stiftungen</h5>' + _b;
          }
          if (_c.length != 0) {
            _c = '<br /><h5>Funktionen in Unternehmen</h5>' + _c;
          }
          if (_d.length != 0) {
            _d = '<br /><h5>Funktionen in Körperschaften und Anstalten des öffentlichen Rechts</h5>' + _d;
          }
          if (_e.length != 0) {
            _e = '<br /><h5>Entgeltliche Tätigkeiten neben dem Mandat</h5>' + _e;
          }
          if (_f.length != 0) {
            _f = '<br /><h5>Beteiligungen an Kapital- oder Personengesellschaften</h5>' + _f;
          }
          if (_g.length != 0) {
            _g = '<br /><h5>Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile</h5>' + _g;
          }
          $content = $content + _a + _b + _c + _d + _e + _f + _g;
          $content += '</div>';
          $content += '</div>';
        }
      }


      if (hasLinks) {
        console.log('Entity has Links');
        $content += '<div class="row row-results">';
        $content += '<div class="col-md-12"><h4>Links</h4></div>';

        $(entity.data).each(function (idx, data) {
          if (data.key == 'link') {
            $content += '<div class="col-md-12">';
            $content += '<div class="entity-link"><i class="fa fa-external-link"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">' + data.value.url + '</a></div>';
            $content += '</div>';
          }
        });
        $content += '</div>';
      }

      if (hasSource) {
        console.log('Entity has Source');
        $content += '<div class="row row-results">';
        $content += '<div class="col-md-12"><h4>Quellen</h4></div>';

        $(entity.data).each(function (idx, data) {
          if (data.desc == 'Quelle') {
            $content += '<div class="col-md-12">';
            $content += '<div class="entity-source">';
            if (data.value.url !== undefined) {
              $content += '<i class="fa fa-bookmark"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">';
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
      $content += '<span>Erstellt: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span><br/>';
      $content += '<span>Aktualisiert: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span>';
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
    $(".result-single").delay(400).slideDown("slow");

  });
}

function formatStagesAddIncome(val) {
  switch (val) {
    case 1:
      return " 1 (über 1.000€)";
      break;
    case 2:
      return " 2 (über 3.500€)";
      break;
    case 3:
      return " 3 (über 7.000€)";
      break;
    case 4:
      return " 4 (über 15.000€)";
      break;
    case 5:
      return " 5 (über 30.000€)";
      break;
    case 6:
      return " 6 (über 50.000€)";
      break;
    case 7:
      return " 7 (über 75.000€)";
      break;
    case 8:
      return " 8 (über 100.000€)";
      break;
    case 9:
      return " 9 (über 150.000€)";
      break;
    case 10:
      return " 10 (über 250.000€)";
      break;
    default:
      return " 0 ";
      break;
  }
}

// we use this when the loadEntity function is called from within the app
// as opposed to a deep link
// and set the url
function loadEntityAjax(id) {
  loadEntity(id);
  window.history.pushState(null, 'entity', '/entity/' + id);
}


$(document).ready(function () {
  if ($(window).width() > 768) {
    NetworkViz.panToEntity(); // missuse the func to get the viz on index  
    NetworkViz.setClickHandler(loadEntityAjax);
  }

  $(".leaflet-control-zoom").css("display", 'none');

  // bring up the details when an entry is clicked a                                                                                                           
  $('body').on('click', '.ajax-load', function (e) {
    e.preventDefault();
    var str = this.href;
    var entityID = str.split("/")[4];
    loadEntityAjax(entityID);
  });

  // click back arrow -> history
  $('body').on('click', '#backtolist', function (e) {
    e.preventDefault();
    window.history.back();
  });

  // click back arrow -> history
  $('body').on('click', 'button.close', function (e) {
    $(".result-single").slideUp("slow");
    $(".result-list").slideUp("slow");
    e.preventDefault();
  });

  // this kicks in when we get a deep link to an entity
  // entity/:id
  if (window.location.href.indexOf("/entity/") > -1) {
    $(".overlay").css("display",'none'); // we dont need the intro
    $("leaflet-control-zoom").css("display", 'block');
    var str = window.location.href; // get the url 
    var entityID = str.split("/")[4]; // extract ID
    console.log('entity.entry, ID: ' + entityID);
    loadEntity(entityID);
    $("#backtolist").css("display", 'none'); // explicit hide on deeplinks
    $(".result-single").slideDown("slow");  // show me the single panel
  }

  // this kicks in when we get a deep link to an search
  // /search/:id
  if (window.location.href.indexOf("/search/") > -1) {
    // $( "#backtolist" ).css( "display",'none' ); // There is no list to go back to 
    $(".overlay").css("display", 'none'); // we dont need the intro
    var str = window.location.href; // get the url 
    var searchID = str.split("/")[4]; // extract ID
    console.log('Search for: ' + searchID);
    loadList(searchID);
  }

  // When someone presses enter inside lobbysearch
  $('.lobbysearch').keypress(function (e) {
    if (e.which === 13) {
      var $resultName = $(this).val();
      $(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
      $(".result-list").slideDown("slow");
      history.pushState(null, null, '/search/' + $resultName);
      loadList($resultName);
      return false;
      event.preventDefault();
    }
  });

  // Or when he or she clicks the search button
  $('.search-form button').click(function () {
    var $resultName = $(this).val();
    $(".overlay").fadeOut("slow"); // fade out the overlay, when search gets into focus
    $(".result-list").slideDown("slow");
    history.pushState(null, null, '/search/' + $resultName);
    loadList($resultName);
    return false;
    event.preventDefault();
  });

});