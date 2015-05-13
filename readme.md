# Lobbyradar

Lobbyradar ist ein gemeinsames Projekt von ZDF [heute.de](http://www.heute.de/), dem [Medieninnovationszentrum Babelsberg MIZ](http://www.miz-babelsberg.de/) und [OpenDataCity](https://opendatacity.de/). 

Unternehmen, Verbände und Vereine – alle haben Interessen, die sie durchsetzen wollen. Deshalb stehen sie in stetigem Austausch miteinander und mit der Politik, um ihre Interessen zu vertreten. Damit sind sie ein Teil des politischen Systems. Schwierig wird es, wenn Lobbygruppen mit mehr Geld oder besseren Kontakten mehr Einfluss haben als Lobbys mit weniger Mitarbeitern und finanziellen Möglichkeiten. Und wenn niemand außerhalb etwas davon mitbekommt. Dann besteht die Gefahr, dass Politiker nicht im Sinne der Allgemeinheit entscheiden, sondern sich die Interessen Einzelner durchsetzen. Der ZDF-Lobbyradar zeigt Verbindungen zwischen Politik, Wirtschaft und Interessenvertretern und macht Lobbyismus transparenter. 

## Installation

Stellen Sie sicher, dass [node.js](https://nodejs.org/) oder [io.js](https://nodejs.org/) installiert sind.
Benötigt werden außerdem [MongoDB](https://www.mongodb.org/) und [GraphicsMagick](http://www.graphicsmagick.org/).

```
git clone https://github.com/lobbyradar/lobbyradar.git
cd lobbyradar
npm install
cp config.js.dist config.js
```

Passen Sie nun die Datei `config.js` an.

## Ausführen des Servers

Die Software startet einen Webserver, je nach Konfiguration hört dieser auf einem Socket oder einem TCP-Port. 

```
DEBUG=app,api node ./lobbyradar.js
```

## Anlegen, Bearbeiten und Importieren von Daten

Daten können über mehrere Wege eingegeben werden.

### Datenbank-Import

Die einfachste Möglichkeit ist ein Import der gesamten Datenbank mittels `mongorestore`. 

```
git clone https://github.com/lobbyradar/dumps.git
mongorestore --db lobbyradar --collection entities dumps/entities.bson
mongorestore --db lobbyradar --collection relations dumps/relations.bson
```

Dumps der Datenbank finden sich [in unserem Github-Repository](https://github.com/lobbyradar/dumps).

### Importer

Eine Möglichkeit, Daten automatisiert einzugeben, ist die Benutzung eines Daten-Importers. Diese werden gesondert veröffentlicht.

### Verwaltungs-Oberfläche

Über die Verwaltungs-Oberfläche können Einträge bequem per Webbrowser verwaltet werden. Die URL lautet

`http://<server>:<port>/station`

Vorher die Komponenten mit [Bower](http://bower.io/) installieren

```
cd station/assets
bower install
```


### Software API

Daten können direkt über die Software-API eingegeben werden. Beispiel-Code:

``` javascript
var config = require("config.js")
var mongojs = require("mongojs");
var db = mongojs(config.db, ["entities","relations"]);
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

// create entity
api.ent_create({
	name: "Name",
	type: "person",
	tags: ["tag1","tag2"],
	aliases: [],
	data: [] // see docs
}, function(err, id_1){
	// create another entity
	api.ent_create({
		name: "Firma",
		type: "entity",
		tags: ["tag1","tag2"],
		aliases: [],
		data: []
	}, function(err, id_2){
		// create relation between entities
		api.rel_create({
			entities: [id_1, id_2],
			type: "type", // see doc/types.md
			tags: ["tag1"],
			weight: 1,
			data: []
		}, function(err, rel_id){
			console.log("created relation "+rel_id+" between "+id_1+" and "+id_2+"");
		});
	});
});
```

Eine ausführliche Beschreibung der Schnittstelle findet sich [in der Dokumentation](./doc/api.md);

## Generieren der Netzwerk-Visualisierung

Die Netzwerk-Visualisierung wird aus dem gesamten Datenbestand in Form von Karten-Kacheln gerendert.

```
cd ./lobbynetwork
node ./1_get_data.js
node ./2_update_layout.js
node ./3_export_positions.js
node ./4_generate_tiles.js
```

## Open Source

Die Quellen des Projektes stehen unter der [MIT Lizenz](./license,md) offen.

## Open Data

Die [Daten](https://github.com/lobbyradar/dumps) können unter [Open Data Commons Attribution License](http://opendatacommons.org/licenses/by/1.0/) verwendet werden.




