const arel = require('./requetes');
// Fonction récupérant les détails des absences
function getDetails(json,token,callback){
	var remainingCalls = json.length
    var liste = []
    for(var i=0; i<json.length;i++){
      arel.requete('planning/slots/'+json[i].slotId,token,function(err2,res2,body2){
        liste.push(JSON.parse(body2));
        remainingCalls -= 1;
        if (remainingCalls <= 0){
        	callback(liste)
        }
      });
    }
}

function count(json,session){
	var texte = 'Tu as '+json.length+' absences';
	if (session.query.matiere != undefined){
		var nbAbs = 0;
		for (var i = 0; i < json.length; i++) {
			if (json[i].label==session.query.matiere) {
				nbAbs+=1;
			}
		}
		(nbAbs == 0) ? texte = "Pas d'absence en "+session.query.matiere:texte="Tu as "+nbAbs+" absence(s) en "+session.query.matiere+".";
	}
	session.query.time = 2;
	return texte;	
}

module.exports = {count, getDetails}