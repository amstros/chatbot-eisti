

function emptyQuery(query){
	if(typeof(query)=="undefined" || query.time == 2 || query.objet == undefined){
		query = {objet: undefined,type: undefined,matiere:undefined,precision:[],time:0};
	}
	return query;
}


function Err(session,perso){
	session.query.time += 1;
	res = "Que veux tu savoir "
	if (session.query.time > 1){res="Je n'ai pas compris votre requête !"}
	else{
		res+=perso
	}
	session.query = emptyQuery(session.query);
	return res;
}


var byProperty = function (property) {
   	return function (x, y) {
       	return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
   	};
};


// Fonction calculant le pourcentage de ressemblance entre deux mots
function ressemble(ch1,ch2){
	// Distingue le mot le plus long du plus petit
	if (ch1.length<ch2.length) {
		var grande = ch2;
		var petite = ch1;
	}else{
		var grande = ch1;
		var petite = ch2;
	}
	// Calcule de la différence de taille entre les mots
	var diff = grande.length-petite.length;
	var res = 0;
	for (var i = 0; i <= diff; i++) {
		var match = 0
		// Pour chaque alignement des mots compte les correspondances
		for (var j = 0; j < petite.length; j++) {
			if (grande[i+j]==petite[j]){
				match += 1
			}
		}
		// Garde pour chaque alignement uniquement le plus gand pourcentage de ressemblance
		res = Math.max(res,(match/grande.length))
	}
	// Retourne le resultat
	return(res)
}

// Fonction qui recherches dans des listes de mots des similitudes
function recherche(chaine,liste,init){
	res = init;
	var operation
	operation = (res!=undefined)
	for (var objet in liste) {
		// Pour chaque catégorie de mot
		for (var val in liste[objet]){
			// Pour chaque mots de la catégorie
			for (var i = 0; i < chaine.length; i++) {
				// Pour chaque mot de la phrase uitilisateur
				if (ressemble(liste[objet][val],chaine[i])>0.7) {
					// Si les mots sont à plus de 70% on le considère 
					if (!operation) {res = objet}
					else {res.push(objet)}
					
				}	
			}
		}
	}
	return res;
}

function analyse(message,session,callback) {
		var parsed = message.split(' ');

		session.query = emptyQuery(session.query)
		// Definition des catégories recherchées et recherche
		session.query.objet =  recherche(parsed,logique.objet,undefined) || session.query.objet;
		session.query.matiere = recherche(parsed,logique.matiere,undefined);
		session.query.type = recherche(parsed,logique.types,undefined);
		session.query.precision = recherche(parsed,logique.pres,[]);

		if (session.query.objet == undefined ) {
			//Option pour les raccourcis de langages
			(session.query.matiere != undefined && session.query.type == 'combien')?session.query.objet='note':session.query.objet=undefined;
			(session.query.type == 'quoi')?session.query.objet='cours':session.query.objet=undefined;
		}
		callback(session.query)
}

module.exports = {Err,byProperty,emptyQuery,analyse}