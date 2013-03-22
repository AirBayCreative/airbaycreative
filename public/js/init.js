socket = io.connect("http://192.168.137.1:3001");
var step_counter = 0;
var step_game = '';
var step_seed = '';
var players = new Array;
var boards = '';
var board_counter = 0;

socket.emit('connect', {username: "jonny", object: ""});
/**
 * 发牌
	bankroll: 495
	carda: "h6"
	cardb: "h4"
	name: "jonny"
	status: "FOLD"
	subtotal_bet: 0
	total_bet: 5
 */
socket.on("deal", function(data){
	console.log(data);
	var self = this;
	for(var i in data.players){
		players.push(new playHelper("player"+i, data.players[i]));
		if(!$.jStorage.get(data.players[i])){
			$.jStorage.set(data.players[i], 500);
		}
	}
	players[0].deal(cardSplit(data.carda), cardSplit(data.cardb));
	players[0].show();
	
	// 清空board
	boards.length = 0;
	boards = new boardHelper($(".board").children(".card"));
});

/**
 * 显示整个操作过程
 */
socket.on("end", function(data){
	console.log(data);
	step_counter = 0;
	step_game = new gameLogic(players, data.actions);
	step_seed = setInterval("step_game.step()", 0);
});

// ======================= Simple logic ============================
// Start a loop
$(".start-btn").click(function(){
	socket.emit("start");
	step_counter = 0;
	step_game = '';
	players = new Array;
	boards = '';
	board_counter = 0;
	$(".card").removeClass("flipped");
	clearInterval(step_seed);
});

function cardSplit(str){
	var rt_obj = Array();
	rt_obj[0] = str.substring(0, 1);
	rt_obj[1] = str.substring(1, str.length);
	switch(rt_obj[1]){
		case '14':
			rt_obj[1] = 'A';
		case '11':
			rt_obj[1] = 'j';
			break;
		case '12':
			rt_obj[1] = 'q';
			break;
		case '13':
			rt_obj[1] = 'k';
	}
	return rt_obj;
}