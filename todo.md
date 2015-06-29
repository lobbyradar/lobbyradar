# Backend
## LR 2.0
* Neue Einträge vorhanden, Anzeige im Frontent, Events darauf anbieten 
	* manuelle Änderungen vom ZDF (einfach zu implementieren) 
* wir sollten uns über die tags gedanken machen, die eher eine Verbindung sein sollten zB mdb -> tagliste und erklärung wäre hübsch für die doku
* ggf sollte man die felder email, adresse sowie www voneinander trennen. damit wird das 


# Todo Donenrstag

* fehlende Verbindungen (SV+KD) - spätestens Donnerstag c-base (einige Verbindungen sind zu undefined eingetragen)
* Backup! (SV)
* alle die Tag 'mdb' haben sollen eine Verb. zum Bundestag haben -> Karte soll danach auf Bundestag zentriert werden (MK)

## Importer
* keine Doppelten Fotos hinzufügen 
* Fraktionsimporter CDU/CSU macht probleme, eindeutige Zuordnung zur Partei geht flöten

---

##TODO CONVERT
* neue relation felder in mongo.fields aufnehmen und alte entfernen (bin/checkfields.js)
* alle importer anpasssen

##TODO FRONTEND
* viele relations sind performance killer
* relations sortieren in tabs? 
* relation-viz wieder in die mitte wenn info feld geschlossen wird

##TODO STATION
Update:
* Suche nicht in modal-dialog sondern inplace (sonst umständlich)
* Relation-Daten bearbeiten (vor allem den typ!)
* api.update_ent_delete - remove _all_ no longer needed entities

Editor:
* Sources-Widget
* Activity.Level-Widget