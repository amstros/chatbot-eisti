function trouverDate(valeur){
	jours = {"dimanche" : 0, "lundi" : 1, "mardi" : 2, "mercredi" : 3, "jeudi" : 4, "vendredi" : 5, "samedi" : 6};
	ajd = new Date()
	date = new Date()
	if (valeur.includes('demain')){
		date.setDate(ajd.getDate()+1)
	}
	else{
		for (variable in jours) {
			if (valeur.includes(variable)){date.setDate(ajd.getDate()+jours[variable]-ajd.getDay())}
		}
	}
	return date;
}

function get(json,session){
	var texte = '';
	var date = trouverDate(session.query.precision);
	for (var i = 0; i < json.length; i++) {
		horaire =  new Date(json[i].beginDate);
		heures = horaire.getHours();
		minutes = horaire.getMinutes();
		if(horaire.getDate()==date.getDate()){
			if(session.query.precision.includes('matin')){
				if ((heures <= 11)){
					texte += heures;
					(minutes>9)?texte+=":"+minutes:texte+="h";
					texte += " - "+json[i].relLabel+" en "+json[i].roomLabel+".<br>";
				}
			}
			if (session.query.precision.includes('après-midi')) {
				if ((heures >= 13)){
					texte += heures;
					(minutes>9)?texte+=":"+minutes:texte+="h";
					texte += "-"+json[i].relLabel+" en "+json[i].roomLabel+".<br>";
				}
			} 
			if (!session.query.precision.includes('matin') && !session.query.precision.includes('après-midi')){
				if ((heures <= 11) || (heures >= 13)){
					texte += heures;
					(minutes>9)?texte+=":"+minutes:texte+="h";
					texte += "-"+json[i].relLabel+" en "+json[i].roomLabel+".<br>";
				}
			}
		}
	}

	(texte=="")?texte="Tu n'as pas cours "+session.query.precision+" ;)":texte = "Voici tes cours "+session.query.precision+" : <br>"+texte;
	session.query.time = 2;
	return texte;

}

module.exports = {get}