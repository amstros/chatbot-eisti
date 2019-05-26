function get(session,json){
	var texte = '';
	for (var i = 0; i < json.length; i++) {
		if (json[i].id.semestreId == 684 && json[i].label==session.query.matiere) {
			texte+=json[i].testName+' : '+json[i].mark+'<br>';
		}
	}
	(texte == '') ? texte = "Pas de note trouvée en "+session.query.matiere:texte="Voici tes notes en "+session.query.matiere+" :<br>"+texte;
	session.query.time = 2;
	return texte;
}

function moyenne(session,json){
	var texte = '';
	var Scoef = 0;
	var Snote = 0;
	for (var i = 0; i < json.length; i++) {
		if (json[i].id.semestreId == 684 && json[i].label==session.query.matiere) {
			Scoef+=json[i].coefficient;
			Snote+=json[i].mark*json[i].coefficient;
			texte = 'ok'
		}
	}
	var moyenne = Snote / Scoef;
	(texte == '') ? texte = "Pas de note trouvée en "+session.query.matiere:texte="Tu as "+moyenne+" en "+session.query.matiere+" :<br>";
	session.query.time = 2;
	return texte;
}

module.exports = {get,moyenne}