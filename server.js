// Import des libraires de node_js
const http = require('http');
const fs = require('fs');
const express = require('express');
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

// Modules persos
const utils = require('./res/functions/utils');
const arel = require('./res/functions/requetes');
const notes = require('./res/functions/notes') ;
const absences = require('./res/functions/absences');
const cours = require('./res/functions/cours');
//Definition du PORT à 5000 ou en fonction du serveur
const PORT = process.env.PORT || 5000

// Utilisation de express
var app = express();
// Création d'un serveur http sur express
var server = http.createServer(app);

// Définition de la racine pour servir les .html	
app.use(express.static(__dirname+"/views/"));

// Définition des variables de sessions
var sessionMiddleware = session({
    token: new RedisStore({}),
    query: new RedisStore({}), // variables de sessions
    secret: "keyboard cat",
});
app.use(sessionMiddleware);

// Initioalisation des variables de sessions
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


// Service à l'appel de "/" dans l'url
app.get('/', function(req, res) {
	// Affichage de lapage de login ou du chatbot en fonction du token de connexion
    if (req.session.token == ''){
        fs.readFile('res/templates/login.html',function(err,content){
        	// 'index.ejs' est la page template du site
        	res.render('index.ejs', {content});
        });    
    }
    else{
        fs.readFile('res/templates/chatbot.html',function(err,content){
            res.render('index.ejs', {content});
        });
    }   
});


var io = require('socket.io').listen(server);

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

io.sockets.on('connection', function (socket) {


	socket.on('connexion',function parametres(login,mdp){
		arel.requeteAuth(login,mdp,function(err,res,body){
			if (res.statusCode==200){
				socket.request.session.token = JSON.parse(body).access_token
				console.log(login+' est log en tant que '+socket.request.session.token);
				fs.readFile('res/templates/chatbot.html',function (err,content) {
					socket.emit('connexion',content.toString());
				})
				fs.readFile('res/logique.json',function(err,content){
					logique = JSON.parse(content);
					utils.emptyQuery(socket.request.session.query);
				});
			}
			else{
				socket.request.session.token = JSON.parse(body).access_token
				fs.readFile('res/templates/login.html',function (err,content) {
				var erreur = '<center><b style="color:red;">Identifiant ou mot de passe incorrect.</b></center>'
					socket.emit('connexion',content.toString()+erreur);
				});
			} 
		});

	});

	socket.on('msg',function(content){
		
		console.log(socket.request.session.token+" : "+content);
		utils.analyse(content.toLowerCase(),socket.request.session,function traitement(res) {
			console.log(socket.request.session.token+" : "+JSON.stringify(res));
			socket.request.session.query = res;

			var url = {
				absence:'me/absences',
				cours:'planning/slots/',
				note:'me/marks'
			}
			
			socket.request.session.query = utils.emptyQuery(socket.request.session.query);
			var texte = "";

			switch (socket.request.session.query.objet){
				case 'note':
				arel.requete(url['note'],socket.request.session.token,function(err,res,body) {
					req = JSON.parse(body);
					(socket.request.session.query.matiere != undefined)?texte = notes.get(socket.request.session,req.marks):texte=utils.Err(socket.request.session," sur tes notes ?");
					
					socket.emit('msg',texte);
				});
				break;
				case 'absence':
				arel.requete(url['absence'],socket.request.session.token,function (err,res,body) {
					req = JSON.parse(body);
					absences.getDetails(req.absences,socket.request.session.token,function(listABS){
						(socket.request.session.query.type == "combien" || socket.request.session.query.matiere != undefined)?texte = absences.count(listABS,socket.request.session):texte=utils.Err(socket.request.session," sur tes absences ?");
						socket.emit('msg',texte);
					});
				});
				break;
				case 'cours':
				arel.requete(url['cours'],socket.request.session.token,function(err,res,body){
					req = JSON.parse(body).planningSlots;
					req.sort(utils.byProperty('beginDate'));
					(socket.request.session.query.precision.length!=0)?texte = cours.get(req,socket.request.session):texte=utils.Err(socket.request.session," sur tes cours ?")
					socket.emit('msg',texte);
				});
				break;
				default:
					res = "Je n'ai pas compris votre requête.";
					socket.emit('msg',res)
			}
		});
	});
});

server.listen(PORT, function(){
	console.log('server started on PORT '+PORT);
});
