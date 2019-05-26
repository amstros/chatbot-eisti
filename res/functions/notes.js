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

module.exports = {get}