/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');
var config = require('./config');
var db = config.db;

var app = express();

var logic = require('./logic');
/**
 * socket io
 */
var io = require('socket.io').listen(3001);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

io.sockets.on('connection', function (socket) {
	var run = null;
	var options = null;
	socket.on('connect', function(data){
		this.options = data;
	});
	
	socket.on('disconnect', function(data){
		console.log("offline");
	});
	
	socket.on("start", function(data){
		this.run = new logic.logic(this.options.username, this.options.method);
		this.run.init();
		this.run.start();
		var players = Array();
		for(var i in this.run.players){
			players[i] = this.run.players[i].name;
		}
		socket.emit("deal", {players: players, carda: this.run.players[0].carda, cardb: this.run.players[0].cardb});
		socket.emit("end", {actions: this.run.actions} );
	});
});

//for(var i = 0; i < 10; i++)
//{
//	run.init();
//	run.start();
//	console.log(run.actions);
//	db.cards.save({result: run.result}); 
//}