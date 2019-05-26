//var socket = io.connect('http://localhost:37763');
var socket = io();
var el = document.getElementById('server-time');

socket.on('time', function(timeString) {
	el.innerHTML = 'Server time: ' + timeString;
 });

function connexion(){
		var user = document.getElementById('login');
		var pass = document.getElementById('pass');

		document.getElementById('send').disabled=true;
		user.disabled = true;
		pass.disabled = true;
		
		socket.emit('connexion',user.value,pass.value);
		}
	
	socket.on('connexion',function(contenu){
		document.getElementById('chatbox').innerHTML = contenu;
	});

function envoyer(){

	var txt = document.getElementById('textbox').value;
	var chat = document.getElementById('chat');
	document.getElementById('textbox').value = "";
	txt= txt.replace(/</g, "&lt;").replace(/>/g, "&gt;");

	if (txt != "") {
		socket.emit('msg',txt)
		chat.innerHTML += "<span class='msguser'><p>"+txt+"</p></span>";
		chat.scrollTop=10000000000000;
	}
}

function check(event) {
	if (event.keyCode==13) {
		envoyer()
	}

}

socket.on("msg",function(newText){
	var chat = document.getElementById('chat');
	chat.innerHTML += '<span class="msgbot"><p>'+newText+'</p></span>';
	chat.scrollTop=10000000000000;
})


