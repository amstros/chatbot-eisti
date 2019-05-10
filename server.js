var http = require('http');
var fs = require('fs');
var express = require('express');
var session = require("express-session");
var RedisStore = require("connect-redis")(session);
var bodyParser = require('body-parser');
var request = require('request');

const PORT = process.env.PORT || 5000

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var app = express();


var server = http.createServer(app);
 	
app.use(express.static(__dirname+"/views/"));

var sessionMiddleware = session({
    token: new RedisStore({}),
    query: new RedisStore({}), // variables de sessions
    secret: "keyboard cat",
});

app.use(sessionMiddleware);

app.use(function(req, res, next){
    if (typeof(req.session.token) == 'undefined') {
        req.session.token = '';
    }
    next();
});

app.use(function(req, res, next){
    if (typeof(req.session.query) == 'undefined') {
        req.session.query = {objet: undefined,type: undefined,matiere:undefined,precision:undefined,time:0};
    }
    next();
});

app.get('/', function(req, res) {

    if (req.session.token == ''){
        fs.readFile('views/login.html',function(err,content){
           res.render('index.ejs', {content});
        });    
    }
    else{
        fs.readFile('views/chatbot.html',function(err,content){
            res.render('index.ejs', {content});
        });
    }   
});

function requeteAuth(username,password,callback){
	option = {
   		url: 'https://arel.eisti.fr/oauth/token',
   		method: 'POST',
   		auth: {
       		user: 'chatbot-1685',	
       		pass: 'L3c64M0rpwHfNdKme52P'
   		},
   		form: {
       		'grant_type': 'password',
       		'username':username,
       		'password':password,
       		'format' : 'json'
   		}
   	}
   	request(option,callback);
}

function requete(adresse,token,callback) {
	//console.log('https://arel.eisti.fr/api/'+adresse);
    option = {
    url: 'https://arel.eisti.fr/api/'+adresse,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
    	'Authorization': 'bearer '+token
    }}
    
   request(option,callback);
}

function ressemble(ch1,ch2){
	if (ch1.length<ch2.length) {
		var grande = ch2;
		var petite = ch1;
	}else{
		var grande = ch1;
		var petite = ch2;
	}
	var diff = grande.length-petite.length;
	var res = 0;
	for (var i = 0; i <= diff; i++) {
		//console.log(i);
		var match = 0
		for (var j = 0; j < petite.length; j++) {
			if (grande[i+j]==petite[j]){
				match += 1
			}
		}
		res = Math.max(res,(match/grande.length))
	}
	return(res)
}

function recherche(chaine,liste){
	var res = undefined
	for (var objet in liste) {
		for (var val in liste[objet]){
			for (var i = 0; i < chaine.length; i++) {
				if (ressemble(liste[objet][val],chaine[i])>0.69) {
					res = objet;
				}	
			}
		}
	}
	return res;
}



function analyse(message,session,callback) {
	
		var parsed = message.split(' ');

		session.query = emptyQuery(session.query)
	
		session.query.objet =  recherche(parsed,logique.objet) || session.query.objet;
		session.query.matiere = recherche(parsed,logique.matiere);
		session.query.type = recherche(parsed,logique.types);
		session.query.precision = recherche(parsed,logique.pres);

		
		if (session.query.objet == undefined ) {
			(session.query.matiere != undefined && session.query.type == 'combien')?session.query.objet='note':session.query.objet=undefined;
			//(query.matiere != undefined && query.type == 'quand')?query.objet='cours':query.objet=undefined;
		}
		//console.log(session.query);
		callback(session.query)
}

function emptyQuery(query){
	if(typeof(query)=="undefined" || query.time == 2 || query.objet == undefined){
		query = {objet: undefined,type: undefined,matiere:undefined,precision:undefined,time:0};
	}
	return query;
}

function getNote(session,json){
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

function nbAbsence(json,session){
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

function Err(session,perso){
	session.query.time += 1;
	res = "Que veux tu savoir "
	if (session.query.time > 1){res="Je n'ai pas compris votre requete"}
	else{
		res+=perso
	}
	session.query = emptyQuery(session.query);
	return res;
}


function absDetails(json,token,callback){
	var remainingCalls = json.length
    var liste = []
    for(var i=0; i<json.length;i++){
      //console.log('planning/slots/'+json[i].slotId)
      requete('planning/slots/'+json[i].slotId,token,function(err2,res2,body2){
        liste.push(JSON.parse(body2));
        remainingCalls -= 1;
        if (remainingCalls <= 0){
        	//console.log(liste)
        	callback(liste)
        }
      });
    }
}

var io = require('socket.io').listen(server);

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

io.sockets.on('connection', function (socket) {


	socket.on('connexion',function parametres(login,mdp){
		requeteAuth(login,mdp,function(err,res,body){
			if (res.statusCode==200){
				socket.request.session.token = JSON.parse(body).access_token
				fs.readFile('views/chatbot.html',function (err,content) {
					socket.emit('connexion',content.toString());
				})
				fs.readFile('res/objet.json',function(err,content){
					logique = JSON.parse(content);
					emptyQuery(socket.request.session.query);
				});
			}
			else{
				socket.request.session.token = JSON.parse(body).access_token
				fs.readFile('views/login.html',function (err,content) {
				var erreur = '<center><b style="color:red;">Identifiant ou mot de passe incorrect.</b></center>'
					socket.emit('connexion',content.toString()+erreur);
				});
			} 
		});

	});

	socket.on('msg',function(content){

		analyse(content.toLowerCase(),socket.request.session,function traitement(res) {

			socket.request.session.query = res;
			var url = {
				absence:'me/absences',
				planning:'planning/slots/',
				note:'me/marks'
			}
			
			socket.request.session.query = emptyQuery(socket.request.session.query);
			//var query = socket.request.session.query;
			var texte = "";
			//var query = socket.request.session.query;
			switch (socket.request.session.query.objet){
				case 'note':
				requete(url['note'],socket.request.session.token,function(err,res,body) {
					req = JSON.parse(body);
					(socket.request.session.query.matiere != undefined)?texte = getNote(socket.request.session,req.marks):texte=Err(socket.request.session," sur tes notes ?");
					
					socket.emit('msg',texte);
				});
				break;
				case 'absence':
				requete(url['absence'],socket.request.session.token,function (err,res,body) {
					req = JSON.parse(body);
					absDetails(req.absences,socket.request.session.token,function(listABS){
						(socket.request.session.query.type == "combien" || socket.request.session.query.matiere != undefined)?texte = nbAbsence(listABS,socket.request.session):texte=Err(socket.request.session," sur tes absences ?");
						socket.emit('msg',texte);
					});
				});
				break;
				default:
					res = "Je n'ai pas compris votre requete";
					socket.emit('msg',res)
			}
		});
	});
});

server.listen(PORT, function(){
	console.log('server started on PORT '+PORT);
});
