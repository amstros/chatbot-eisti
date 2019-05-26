var request = require('request');

// Fonction permmetant de se connecter à l'api de arel
function requeteAuth(username,password,callback){
	// Header neccessaire  pour la connexion
	option = {
   		url: 'https://arel.eisti.fr/oauth/token',
   		method: 'POST',
   		auth: {
   			// Identifiants de l'application
       		user: 'chatbot-1685',	
       		pass: 'L3c64M0rpwHfNdKme52P'
   		},
   		form: {
   			// Indentifiants de l'utilisateur
       		'grant_type': 'password',
       		'username':username,
       		'password':password,
       		'format' : 'json'
   		}
   	}
   	// Envoie de la requête
   	request(option,callback);
}

// Fonction permmettant une demande à l'api d'arel
function requete(adresse,token,callback) {
	// Header concernant le service demandé 
    option = {
    	// adresse pour obtenir les infos sur l'api
    	url: 'https://arel.eisti.fr/api/'+adresse,
    	method: 'GET',
    	headers: {
	        'Accept': 'application/json',
	        // ajout du token de connexion
    		'Authorization': 'bearer '+token
    	}
    }
    // Envoie de la requête
    request(option,callback);
}


module.exports = {requete,requeteAuth}