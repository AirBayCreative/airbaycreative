/**
 * JQ Node JS Holdem
 */

var init_count = 0;
 
var holdem = require('./holdem');
 
var GAME_COUNT = 0;
var BACK_HOME = "CDB Home",
		BACK_HOME_LINK = "http://deathbeeper.com/",
		SUIT_LINK = "http://google.com/";
var START_DATE,
		NUM_ROUNDS,
		STOP_AUTOPLAY = 0,
		RUN_EM = 0,
		STARTING_BANKROLL = 500,
		SMALL_BLIND,
		BIG_BLIND,
		BG_COLOR = "006600",
		BG_HILITE = "EFEF30",
		speed = 1,
		HUMAN_WINS_AGAIN;
// For bot;
var P,
		HCONF,
		ID_CONF,
		CALL_LEVEL,
		BET_LEVEL,
		POT_LEVEL,
		BANKROLL,
		NUM_IN_HAND=0,
		NUM_IN_GAME=0,
		RANKA,
		RANKB,
		FOLD=0,
		CALL,
		SMALL,
		MED,
		BIG,
		ALLIN;
// For judge
var hole_rankings=
	"AA:100,KK:96,QQ:95,JJ:93,AKs:94,"+
	"TT:86,AQs:85,AJs:84,KQs:84,AK:85,"+
	"99:76,JTs:75,QJs:75,KJs:74,ATs:74,AQ:73,"+
	"T9s:66,KQ:66,88:66,QTs:65,98s:64,J9s:65,AJ:65,KTs:65,"+ //THIS & ABOVE: EARLY POSITION
	"77:56,87s:55,Q9s:55,T8s:54,KJ:55,QJ:54,JT:54,76s:53,97s:53,Axs:54,65s:53,"+ //THIS & ABOVE: LATE POSITION
	"66:46,AT:46,55:45,86s:44,KT:45,QT:44,54s:45,K9s:45,J8s:44,75s:43,"+
	"44:36,J9:35,64s:33,T9:34,53s:33,33:35,98:34,43s:34,22:34,Kxs:34,T7s:33,Q8s:33,"+ //THIS & ABOVE: BUTTON
	"87:26,A9:26,Q9:25,76:25,42s:23,32s:23,96s:23,85s:22,J8:22,J7s:22,65:22,54:22,74s:21,K9:22,T8:21,";
	
var LAST_WINNING_HAND_NAME="",
		tests=["straight_flush",
						"four_of_a_kind",
						"full_house",
						"flush",
						"straight",
						"three_of_a_kind",
						"two_pair",
						"one_pair",
						"hi_card"];
				
function player(name, bankroll, carda, cardb, status, total_bet, subtotal_bet) {
	this.name = name;
	this.bankroll = bankroll;
	this.carda = carda;
	this.cardb = cardb;
	this.status = status;
	this.total_bet = total_bet;
	this.subtotal_bet = subtotal_bet
}
				
var logic = function(name, options){
	var self = this;
	self.username = name;
	// Save all actions in this game logic
	self.actions = new Array();
	
	self.cards = new Array(52);
	self.players = null;
	self.board = null;
	self.deck_index = null;
	self.button_index = null;
	self.current_bettor_index = null;
	self.current_bet = null;
	self.current_min_raise = null;
	self.human = false;
	self.options = {
		call: null,
		raise: null,
		fold: null,
	};
	
	for (i in options) self.options[i] = options[i];
}		


logic.prototype = {
	init: function(){
		this.result = Array();
		this.make_deck();
		this.new_game();
	},
	make_deck: function(){	
		var i,j = 0;
		for(i = 2;i<15;i++){
			this.cards[j++] = "h"+i;	// Heart
			this.cards[j++] = "d"+i;	// Diamond
			this.cards[j++] = "c"+i; // Club
			this.cards[j++] = "s"+i; // Spade
		}
	},
	new_game: function(){
		START_DATE = new Date();
		NUM_ROUNDS = 0;
		HUMAN_WINS_AGAIN = 0;
		var my_players = [
			new player("Gus Handsome",0,"","","",0,0),
			new player("Karth Kerai",0,"","","",0,0),
			new player("Tonya Bonya",0,"","","",0,0),
			//new player("Stan Deman",0,"","","",0,0)
		];
		this.players = new Array(my_players.length+1);
		this.players[0] = new player(this.username,0,"","","",0,0);
		
		my_players.sort(this.compRan);
		for(var i = 1;i < this.players.length; i++)
			this.players[i] = my_players[i-1];
		this.reset_player_statuses(0);
		this.clear_bets();
		for(var i = 0; i < this.players.length; i++)
			this.players[i].bankroll = STARTING_BANKROLL;
		this.button_index = Math.floor(Math.random()*this.players.length);
		this.new_round();
	},
	new_round: function(){
		RUN_EM = 0;
		NUM_ROUNDS++;
		var num_playing = 0;
		// 这里要关注下，改成无限制的
		for(var i = 0;i<this.players.length;i++) {
			if(this.has_money(i))
				num_playing += 1;
		}
		if(num_playing<2){
			return "play again";
		}
		this.reset_player_statuses(1);
		this.clear_bets();
		this.clear_pot();
		this.current_min_raise = 0;
		this.collect_cards();
		this.button_index = this.get_next_player_position(this.button_index,1);
		this.shuffle();
		this.blinds_and_deal();
	},
	collect_cards: function(){
		this.board = new Array(5);
		for(var i = 0; i < this.players.length; i++){
			this.players[i].carda = "";
			this.players[i].cardb = "";
		}
	},
	shuffle: function(){
		this.deck_index = 0;
		this.cards.sort(this.compRan);
	},
	blinds_and_deal: function(){
		SMALL_BLIND = 5;
		BIG_BLIND = 10;
		var num_playing = 0;
		for(var i = 0;i<this.players.length;i++){
			if(this.has_money(i))
				num_playing += 1;
		}
		if(num_playing == 3){
			SMALL_BLIND = 10;
			BIG_BLIND = 20;
		}
		else if(num_playing<3){
			SMALL_BLIND = 25;
			BIG_BLIND = 50;
		}
		var small_blind = this.get_next_player_position(this.button_index,1);
		this.bet(small_blind,SMALL_BLIND);
		this.write_player(small_blind,0,0,0);
		var big_blind = this.get_next_player_position(small_blind,1);
		this.bet(big_blind,BIG_BLIND);
		this.write_player(big_blind,0,0,0);
		this.players[big_blind].status = "OPTION";
		this.current_bettor_index = this.get_next_player_position(big_blind,1);
		this.deal_and_write_a();
	},
	deal_and_write_a: function(){
		for(var i = 0;i<this.players.length;i++){
			var j = this.get_next_player_position(this.button_index,1+i);
			if(this.players[j].carda)
				break;
			this.players[j].carda = this.cards[this.deck_index++];
			// 发牌操作
			//this.write_player(j, 0, 0, 1);
		}
		this.deal_and_write_b();
	},
	deal_and_write_b: function(){
		for(var i = 0;i<this.players.length;i++){
			var j = this.get_next_player_position(this.button_index,1+i);
			if(this.players[j].cardb)break;
			this.players[j].cardb = this.cards[this.deck_index++];
			// 发牌操作， 用write_player传送数据
			//this.write_player(j, 0, 0, 1);
		}
	},
	
	// Cards operation
	deal_flop: function(){
		for(var i = 0;i<3;i++)
			this.board[i] = this.cards[this.deck_index++];
		// Flop three cards on board
		this.write_board('0');
		this.write_board('1');
		this.write_board('2');
		if(this.get_num_betting()>1)
			this.main();
		else 
			this.ready_for_next_card();
	},
	deal_fourth: function(){
		this.board[3] = this.cards[this.deck_index++];
		this.write_board('3');
		if(this.get_num_betting()>1)
			this.main();
		else 
			this.ready_for_next_card();
	},
	deal_fifth: function(){
		this.board[4] = this.cards[this.deck_index++];
		this.write_board('4');
		if(this.get_num_betting()>1)
			this.main();
		else 
			this.ready_for_next_card();
	},
	ready_for_next_card: function(){
		var num_betting = this.get_num_betting();
		for(var i = 0;i<this.players.length;i++){
			this.players[i].total_bet += this.players[i].subtotal_bet;
		}
		this.clear_bets();
		if(this.board[4]){
			this.handle_end_of_round();
			return;
		}
		this.current_min_raise = BIG_BLIND;
		this.reset_player_statuses(2);
		if(this.players[this.button_index].status == "FOLD")
			this.players[this.get_next_player_position(this.button_index,-1)].status = "OPTION";
		else 
			this.players[this.button_index].status = "OPTION";
		this.current_bettor_index = this.get_next_player_position(this.button_index,1);
		var show_cards = 0;
		if(num_betting<2)
			show_cards = 1;
		
		if(!RUN_EM) {
			for(var i = 0;i< this.players.length; i++) {
				if(this.players[i].status != "BUST" && this.players[i].status != "FOLD")
					this.write_player(i,0,show_cards,1);
			}
		}
		
		if(num_betting<2)
			RUN_EM = 1;
		if(!this.board[0])
			this.deal_flop();
		else if(!this.board[3])
			this.deal_fourth();
		else if(!this.board[4])
			this.deal_fifth();
	},
	bet: function(player_index, bet_amount){
		if(this.players[player_index].status == "FOLD") {}						//FOLD
		else if(bet_amount >= this.players[player_index].bankroll){					//ALL IN
			bet_amount = this.players[player_index].bankroll;
			var old_current_bet = this.current_bet;
			if(this.players[player_index].subtotal_bet + bet_amount>this.current_bet)
				this.current_bet = this.players[player_index].subtotal_bet+bet_amount;
			var new_current_min_raise = this.current_bet-old_current_bet;
			if(new_current_min_raise > this.current_min_raise)
				this.current_min_raise = new_current_min_raise;
			this.players[player_index].status = "CALL";
		}
		else if(bet_amount+this.players[player_index].subtotal_bet == this.current_bet){			//CALL
			this.players[player_index].status = "CALL";
		}
		else if(this.current_bet>this.players[player_index].subtotal_bet+bet_amount){			//2 SMALL
			//COMMENT OUT TO FIND BUGS
			if(player_index == 0)
				console.log("The current bet to match is "+current_bet+"."+
				"\nYou must bet a total of at least "+(current_bet-players[player_index].subtotal_bet)+" or fold.");
			return 0;
		}
		else if(bet_amount+this.players[player_index].subtotal_bet>this.current_bet			//RAISE 2 SMALL
					&&get_pot_size(this.players)>0
					&&bet_amount+this.players[player_index].subtotal_bet-this.current_bet<this.current_min_raise){
			//COMMENT OUT TO FIND BUGS
			if(player_index == 0)
				console.log("Minimum raise is currently "+current_min_raise+".");
			return 0;
		}
	else{											//RAISE
			this.players[player_index].status = "CALL";
			var old_current_bet = this.current_bet;
			this.current_bet = this.players[player_index].subtotal_bet+bet_amount;

			if(get_pot_size(this.players)>0){
				this.current_min_raise = this.current_bet-old_current_bet;
				if(this.current_min_raise<BIG_BLIND)
					this.current_min_raise = BIG_BLIND;
			}
		}
		this.players[player_index].subtotal_bet += bet_amount;
		this.players[player_index].bankroll -= bet_amount;
		return 1;
	},
	clear_bets: function(){
		for(var i = 0;i<this.players.length;i++)
			this.players[i].subtotal_bet = 0;
		this.current_bet = 0;
	},
	clear_pot: function(){
		for(var i = 0;i<this.players.length;i++)
			this.players[i].total_bet = 0;
	},
	reset_player_statuses: function(type){
		for(var i = 0;i<this.players.length;i++){
			if(type == 0)
				this.players[i].status = "";
			else if(type == 1&&this.players[i].status  !=  "BUST")	
				this.players[i].status = "";
			else if(type == 2&&this.players[i].status  !=  "FOLD" && this.players[i].status  !=  "BUST")
				this.players[i].status = "";
		}
	},
	get_num_betting: function(){
		var n = 0;
		for(var i = 0;i<this.players.length;i++)
			if(this.players[i].status  !=  "FOLD"&&this.players[i].status  !=  "BUST"&&this.has_money(i))
				n++;
		return n;
	},
	get_next_player_position: function(i,delta){
		var j = 0, step = 1;
		if(delta<0)
			step = -1;
		while(1){
			i += step;
			if(i >= this.players.length)
				i = 0;
			else if(i<0)
				i = this.players.length-1;
			if(this.players[i].status == "BUST"||this.players[i].status == "FOLD"||++j<delta){
				
			}
			else 
				break;
		}
		return i;
	},
	has_money: function(i){
		if(this.players[i].bankroll >= .01)
			return true;
		return false;
	},
	compRan:function(){
		return .5-Math.random();
	},
	main: function(){
		var increment_bettor_index = 0;
		if(this.players[this.current_bettor_index].status == "BUST" || this.players[this.current_bettor_index].status == "FOLD"){
			increment_bettor_index = 1;
		}
		else if(!this.has_money(this.current_bettor_index)){
			this.players[this.current_bettor_index].status = "CALL";
			increment_bettor_index = 1;
		}
		else if(this.players[this.current_bettor_index].status == "CALL" && this.players[this.current_bettor_index].subtotal_bet == this.current_bet){
			increment_bettor_index = 1;
		}
		else{
			if(this.human && this.current_bettor_index == 0){
				this.human();
			}
			else {
				//this.write_player(this.current_bettor_index,1,0,1);
				this.bot_bet(this.current_bettor_index);
				return;
			}
		}
		var can_break = true;
		for(var j = 0;j<this.players.length;j++){
			var s = this.players[j].status;
			if(s == "OPTION"){
				can_break = false;
				break;
			}
			if(s != "BUST"&&s != "FOLD"){
				if(this.has_money(j)&&this.players[j].subtotal_bet<this.current_bet){
					can_break = false;
					break;
				}
			}
		}
		if(increment_bettor_index)
			this.current_bettor_index = this.get_next_player_position(this.current_bettor_index,1);
		if(can_break)
			this.ready_for_next_card();
		else 
			this.main();
	},
	handle_end_of_round: function(){
		var candidates = new Array(this.players.length);
		var allocations = new Array(this.players.length);
		var my_total_bets_per_player = new Array(this.players.length);
		for(var i = 0;i<candidates.length;i++){
			allocations[i] = 0;
			my_total_bets_per_player[i] = this.players[i].total_bet;
			if(this.players[i].status  !=  "FOLD"&&this.players[i].status  !=  "BUST")
				candidates[i] = this.players[i];
		}

		var my_total_pot_size = get_pot_size(this.players);
		var my_best_hand_name = "";
		var best_hand_players;
		while(1){
			var winners = get_winners(candidates, this.board);
			if(!my_best_hand_name){
				my_best_hand_name = get_last_winning_hand_name();
				best_hand_players = winners;
				if(winners[0])
					HUMAN_WINS_AGAIN++;
				else 
					HUMAN_WINS_AGAIN = 0;
			}
			if(!winners)break;

			var lowest_in_for = my_total_pot_size*2;
			var num_winners = 0;
			for(var i = 0;i<winners.length;i++){
				if(!winners[i])
					continue;
				num_winners++;
				if(my_total_bets_per_player[i]<lowest_in_for)
					lowest_in_for = my_total_bets_per_player[i];
			}

			var my_pot = 0;
			for(var i = 0;i<this.players.length;i++){
				if(lowest_in_for >= my_total_bets_per_player[i]){
					my_pot += my_total_bets_per_player[i];
					my_total_bets_per_player[i] = 0;
				}else{
					my_pot += lowest_in_for;
					my_total_bets_per_player[i] -= lowest_in_for;
				}
			}
			var share = my_pot/num_winners;
			for(var i = 0;i<winners.length;i++){
				if(my_total_bets_per_player[i]<.01)
					candidates[i] = null;
				if(!winners[i])
					continue;
				allocations[i] += share;
				my_total_pot_size -= share;
			}
		}

		var winner_text = "";
		var human_loses = 0;
		for(var i = 0;i<allocations.length;i++){
			if(allocations[i]>0){
				var a_string = ""+allocations[i];
				var dot_index = a_string.indexOf(".");
				if(dot_index>0){
					a_string = ""+a_string+"00";
					allocations[i] = a_string.substring(0,dot_index+3)-0;
				}
				winner_text += allocations[i]+" to "+this.players[i].name+". ";
				this.players[i].bankroll += allocations[i];
				if(best_hand_players[i])
					this.write_player(i,2,1,0);
				else 
					this.write_player(i,1,1,0);
			}
			else{
				if(!this.has_money(i)&&this.players[i].status  !=  "BUST"){
					this.players[i].status = "BUST";
					if(i == 0)
						human_loses = 1;
				}
				if(this.players[i].status  !=  "FOLD")
					this.write_player(i,0,1,0);
			}
		}

		// Detail bet
		var detail = "";
		for(var i = 0;i<this.players.length;i++){
			var credit = {};
			credit.name = this.players[i].name;
			credit.total_bet = this.players[i].total_bet;
			credit.allocations = allocations[i];
			credit.carda = this.split_card(this.players[i].carda);
			credit.cardb = this.split_card(this.players[i].cardb);
			this.result.push(credit);
			//.push(this.players[i].name+" bet "+this.players[i].total_bet+" & got "+allocations[i]);
			detail += this.players[i].name+" bet "+this.players[i].total_bet+" & got "+allocations[i]+".\\n";
		}
		this.write_end();

		if(this.players[0].status == "BUST"&&!human_loses){
			// 输了重新开
			// setTimeout("autoplay_new_round()",1500+1100*speed);
		}
		
		var elapsed_seconds = ((new Date())-START_DATE)/1000;
		var elapsed_minutes = ""+(elapsed_seconds/60);
		var dot_i = elapsed_minutes.indexOf(".");
		if(dot_i>0)
			elapsed_minutes = elapsed_minutes.substring(0,dot_i);
		var and_seconds = ""+(elapsed_seconds-elapsed_minutes*60);
		dot_i = and_seconds.indexOf(".");
		if(dot_i>0)
			and_seconds = and_seconds.substring(0,dot_i);

		var end_msg = "";
		if(human_loses == 1)
			end_msg = ("Sorry, you busted, "+this.players[0].name+".\n\n"+elapsed_minutes+" minutes "+and_seconds+" seconds, "+NUM_ROUNDS+" deals.");
		else{
			var num_playing = 0;
			for(var i = 0;i<this.players.length;i++){
				if(this.has_money(i))
					num_playing += 1;
			}
			if(num_playing<2){
				end_msg = "GAME OVER!";
				if(this.has_money(0))
					end_msg += "\n\nYOU WIN "+this.players[0].name.toUpperCase()+"!!!";
				else 
					end_msg += "\n\nSorry you lost.";
				console.log(end_msg+"\n\nThis game lasted "+elapsed_minutes+" minutes "+and_seconds+" seconds, "+NUM_ROUNDS+" deals.");
			}
		}
	},
	write_player: function(n, hilite, show_cards, mode){
		var tmp_player = {};
		this.cloneAll(this.players[n], tmp_player);
		tmp_player.carda = this.split_card(tmp_player.carda);
		tmp_player.cardb = this.split_card(tmp_player.cardb);
		
		var action = {};
		action.index = n;
		action.code = "player";
		action.content = tmp_player;
		this.actions.push(action);
	},
	write_board: function(n){
		var action = {};
		action.code = "board";
		action.content = this.split_card(this.board[n]);
		this.actions.push(action);
	},
	write_end: function(){
		var action = {};
		action.code = "end";
		action.content = this.result;
		//action.players = this.players;
		this.actions.push(action);
	},
	cloneAll: function(fromObj,toObj){
		for(var i in fromObj){         
			if(typeof fromObj[i] == "object"){            
				toObj[i]={};            
				cloneAll(fromObj[i],toObj[i]);            
				continue;         
			}         
			toObj[i] = fromObj[i];       
		}  
	},
	split_card: function(card){
		var tmp_card = {};
		tmp_card.suit = card.substring(0, 1);
		tmp_card.point = card.substring(1, card.length);
		if(tmp_card.point >= 2 && tmp_card.point <= 10){
		}
		else if(tmp_card.point == 11){
			tmp_card.point = 'J';
		}
		else if(tmp_card.point == 12){
			tmp_card.point = 'Q';
		}
		else if(tmp_card.point == 13){
			tmp_card.point = 'K';
		}
		else if(tmp_card.point == 14){
			tmp_card.point = 'A';
		}
		return tmp_card;
	},
	// Bot logic
	bot_bet: function(x){
		var b = 0;
		var n = this.current_bet-this.players[x].subtotal_bet;
		if(!this.board[0])
			b = get_preflop_bet(this.players, this.current_bettor_index, this.current_bet);
		else 
			b = get_postflop_bet(this.players, this.current_bettor_index, this.current_bet, this.board);
		if(b >= this.players[x].bankroll)	//ALL IN
			this.players[x].status = "";
		else if(b<n){			//BET 2 SMALL
			b = 0;
			this.players[x].status = "FOLD";
		}else if(b == n){		//CALL
			this.players[x].status = "CALL";
		}else if(b>n){
			if(b-n<this.current_min_raise){	//RAISE 2 SMALL
				b = n;
				this.players[x].status = "CALL";
			}else 
				this.players[x].status = "";	//RAISE
		}
		if(this.bet(x,b) == 0){
			this.players[x].status = "FOLD";
			this.bet(x,0);
		}
		this.write_player(this.current_bettor_index,0,0,0);
		this.current_bettor_index = this.get_next_player_position(this.current_bettor_index,1);
		this.main();
	},
	// Game logic
	start: function(){
		this.main();
	},
}

function autoplay_new_round(){
	if(STOP_AUTOPLAY>0){
		STOP_AUTOPLAY = 0;
		new_game();
	}
	else 
		new_round();
}

function human_call(){
	players[0].status = "CALL";
	current_bettor_index = get_next_player_position(0,1);
	bet(0,current_bet-players[0].subtotal_bet);
	write_player(0,0,0,0);
	write_ad();
	main();
}
function human_raise(){
	var to_call = current_bet-players[0].subtotal_bet;
	var prompt_text = "Minimum raise is "+current_min_raise+". How much do you raise? DON'T include the "+to_call+" needed to call.";
	if(to_call == 0)
		prompt_text = "The minimum bet is "+current_min_raise+". How much you wanna bet?";
	var bet_amount = prompt(prompt_text,"");
	if(bet_amount == null)
		return;
	handle_human_bet(bet_amount);
}
function handle_human_bet(bet_amount){
	bet_amount = ""+bet_amount;
	var m = "";
	for(var i = 0;i<bet_amount.length;i++){
		var c = bet_amount.substring(i,i+1);
		if(c == "0"||c>0)
			m += ""+c;
	}
	if(m == "")
		return;
	bet_amount = m-0;
	if(bet_amount<0||isNaN(bet_amount))
		bet_amount = 0;
	var to_call = current_bet-players[0].subtotal_bet;
	bet_amount += to_call;
	var is_ok_bet = bet(0,bet_amount);
	if(is_ok_bet){
		players[0].status = "CALL";
		current_bettor_index = get_next_player_position(0,1);
		write_player(0,0,0,0);
		write_ad();
		main();
	}
}
function human_fold(){
	players[0].status = "FOLD";
	current_bettor_index = get_next_player_position(0,1);
	write_player(0,0,0,0);
	write_ad();
	main();
}

// 准备每个player的个人信息
function write_player(n,hilite,show_cards,mode){
	console.log(n);
	//console.log(players[n]);
}

function write_frame(f,html,n){
	try{
		frames[f].document.open("text/html","replace");
		frames[f].document.write(html);
		frames[f].document.close();
		//var u = navigator.userAgent;
		//if(u.indexOf("Opera")<0&&u.indexOf("Safari")<0&&u.indexOf("MSIE")>-1)
		//	frames[f].location.reload();
	}catch(e){//FF
		if(!n)
			n = 0;
		if(n<9)
			write_frame(f,html,++n);
	}
}

//straight don't check 4 inside draws

function get_winners(my_players, board){
	var winners;
	for(var i=0;i<tests.length;i++){
		winners=winners_helper(my_players, board, tests[i]);
		if(winners){
			//var s="";for(var j=0;j<winners.length;j++){if(winners[j]>0)s+=my_players[j].name+",\n";}alert(tests[i]+"!!!\n\n"+s);
			break;
		}
	}
	return winners;
}
function get_last_winning_hand_name(){
	return LAST_WINNING_HAND_NAME;
}
function winners_helper(my_players, board, test){
	var best="",winners=new Array(my_players.length);
	for(var i=0;i<my_players.length;i++){
		if(!my_players[i])
			continue;
		var a=eval("test_"+test+"(my_players[i], board)");
		var num_needed=get_xml("num_needed",a);
		if(num_needed>0||(num_needed==0&&num_needed!="0"))	
			continue;
		LAST_WINNING_HAND_NAME = get_xml("hand_name",a);
		var comp = eval("compare_"+test+"(a,best)");
		//alert("TESTING "+my_players[i].name+"'s "+test+"\na: "+a+"\nb: "+best+"\n\nwinner: "+comp);
		if(comp=="a"){
			best=a;
			winners=new Array(my_players.length);
			winners[i]=1;
		}else if(comp=="b"){
		
		}else if(comp=="c"){
			winners[i]=1;
		}
	}
	for(var i=0;i<winners.length;i++){
		if(winners[i])
			return winners;
	}
	return null;
}

// Rebot algorithm
function test_straight_flush(player, board){
	var my_cards=group_cards(player, board);
	var the_suit=get_predominant_suit(my_cards);
	var working_cards=new Array(8);
	var working_index=0;
	for(var i=0;i<7;i++){
		if(get_suit(my_cards[i])==the_suit){
			var my_rank=get_rank(my_cards[i]);
			working_cards[working_index++]=my_rank;
			if(my_rank==14)
				working_cards[7]=1; //ace==1 too
		}
	}
	for(var i=0;i<working_cards.length;i++)
		if(working_cards[i]==null)
			working_cards[i]=-1; //FF
	working_cards.sort(compNum);
	var absolute_longest_stretch=0;
	var absolute_hi_card=0;
	var current_longest_stretch=1;
	var current_hi_card=0;
	for(var i=0;i<8;i++){
		var a=working_cards[i];
		var b=working_cards[i+1];
		if(a&&b&&a-b==1){
			current_longest_stretch++;
		if(current_hi_card<1)
			current_hi_card=a;
		}else if(a){
			if(current_longest_stretch>absolute_longest_stretch){
				absolute_longest_stretch=current_longest_stretch;
				if(current_hi_card<1)
					current_hi_card=a;
				absolute_hi_card=current_hi_card;
			}
			current_longest_stretch=1;
			current_hi_card=0;
		}
	}
	var num_mine=0;
	for(var i=0;i<absolute_longest_stretch;i++){
		if(the_suit+(absolute_hi_card-i)==player.carda||the_suit+(absolute_hi_card-i)==player.cardb)
			num_mine++;  
	}
	return make_xml("straight_hi",absolute_hi_card)+
					make_xml("num_needed",5-absolute_longest_stretch)+
					make_xml("num_mine",num_mine)+
					make_xml("hand_name","Straight Flush");
}

function compare_straight_flush(a,b){
	return compare_straight(a,b);
}

function test_four_of_a_kind(player, board){
	var my_cards=group_cards(player, board);
	var ranks=new Array(13);
	for(var i=0;i<13;i++)
		ranks[i]=0;
	for(var i=0;i<my_cards.length;i++)
		ranks[get_rank(my_cards[i])-2]++;
	var four="",kicker="";
	for(var i=0;i<13;i++){
		if(ranks[i]==4)
			four=i+2;
		else if(ranks[i]>0)
			kicker=i+2;
	}
	var num_mine=0;
	if(get_rank(player.carda)==four)
		num_mine++;
	if(get_rank(player.cardb)==four)
		num_mine++;
	var num_needed=4;
	if(four)
		num_needed=0;
	return make_xml("rank",four)+make_xml("kicker",kicker)+
					make_xml("num_needed",num_needed)+
					make_xml("num_mine",num_mine)+
					make_xml("hand_name","Four of a Kind");
}
function compare_four_of_a_kind(a,b){
	var rank_a=get_xml("rank",a);
	var rank_b=get_xml("rank",b);
	if(rank_a>rank_b)
		return "a";
	else if(rank_b>rank_a)
		return "b";
	else{
		var kicker_a=get_xml("kicker",a);
		var kicker_b=get_xml("kicker",b);
		if(kicker_a>kicker_b)
			return "a";
		else if(kicker_b>kicker_a)
			return "b";
		else 
			return "c";
	}
}

function test_full_house(player, board){
	var my_cards=group_cards(player, board);
	var ranks=new Array(13);
	for(var i=0;i<13;i++)
		ranks[i]=0;
	for(var i=0;i<my_cards.length;i++)
		ranks[get_rank(my_cards[i])-2]++;
	var three="";
	var two="";
	for(var i=0;i<13;i++){
		if(ranks[i]==3){
			if(three>two)
				two=three;
			three=i+2;
		}else if(ranks[i]==2)
			two=i+2;
	}
	var result="";
	var num_needed=5;
	var major_rank="";
	var num_mine_major=0;
	if(three){
		num_needed-=3;
		major_rank=three;
		if(get_rank(player.carda)==three)
			num_mine_major+=1;
		if(get_rank(player.cardb)==three)
			num_mine_major+=1;
	}
	result+=make_xml("major_rank",major_rank);
	result+=make_xml("num_mine_major",num_mine_major);
	var minor_rank="";
	var num_mine_minor=0;
	if(two){
		num_needed-=2;
		minor_rank=two;
		if(get_rank(player.carda)==two)
			num_mine_minor+=1;
		if(get_rank(player.cardb)==two)
			num_mine_minor+=1;
	}
	result+=make_xml("minor_rank",minor_rank)+
	make_xml("num_mine_minor",num_mine_minor)+
	make_xml("num_mine",num_mine_minor+num_mine_major)+
	make_xml("num_needed",num_needed)+
	make_xml("hand_name","Full House");
	return result;
}
function compare_full_house(a,b){
	var major_a=get_xml("major_rank",a);
	var major_b=get_xml("major_rank",b);
	if(major_a>major_b)
		return "a";
	else if(major_b>major_a)
		return "b";
	else{
		var minor_a=get_xml("minor_rank",a);
		var minor_b=get_xml("minor_rank",b);
		if(minor_a>minor_b)
			return "a";
		else if(minor_b>minor_a)
			return "b";
		else 
			return "c";
	}
}

function test_flush(player, board){
	var my_cards=group_cards(player, board);
	var the_suit=get_predominant_suit(my_cards);
	var working_cards=new Array(7);
	var working_index=0;
	var num_in_flush=0;
	for(var i=0;i<my_cards.length;i++){
		if(get_suit(my_cards[i])==the_suit){
			num_in_flush++;
			working_cards[working_index++]=get_rank(my_cards[i]);
		}
	}
	for(var i=0;i<working_cards.length;i++)
		if(working_cards[i]==null)
			working_cards[i]=-1; //FF
	working_cards.sort(compNum);
	var result="";
	var num_mine=0;
	for(var i=0;i<5;i++){
		var s=working_cards[i];
		if(!s)
			s="";
		result+=make_xml("flush_"+i,s);
		if(the_suit+working_cards[i]==player.carda||the_suit+working_cards[i]==player.cardb)
			num_mine++;
	}
	result+=make_xml("num_needed",5-num_in_flush)+
	make_xml("num_mine",num_mine)+
	make_xml("suit",the_suit)+
	make_xml("hand_name","Flush");
	return result;
}
function compare_flush(a,b){
	for(var i=0;i<5;i++){
		var flush_a=get_xml("flush_"+i,a);
		var flush_b=get_xml("flush_"+i,b);
		if(flush_a>flush_b)
			return "a";
		else if(flush_b>flush_a)
			return "b";
	}
	return "c";
}

function test_straight(player, board){
	var my_cards=group_cards(player, board);
	var working_cards=new Array(8);
	var ranks=new Array(13);
	for(var i=0;i<7;i++){
		var my_rank=get_rank(my_cards[i]);
		if(ranks[my_rank-2])
			continue;
		else 
			ranks[my_rank-2]=1;
		working_cards[i]=my_rank;
		if(my_rank==14)
			working_cards[7]=1; //ace==1 too
	}
	for(var i=0;i<working_cards.length;i++)
		if(working_cards[i]==null)
			working_cards[i]=-1; //FF
	working_cards.sort(compNum);
	var absolute_longest_stretch=0;
	var absolute_hi_card=0;
	var current_longest_stretch=1;
	var current_hi_card=0;
	for(var i=0;i<8;i++){
		var a=working_cards[i];
		var b=working_cards[i+1];
		if(a&&b&&a-b==1){
			current_longest_stretch++;
			if(current_hi_card<1)
				current_hi_card=a;
		}else if(a){
			if(current_longest_stretch>absolute_longest_stretch){
				absolute_longest_stretch=current_longest_stretch;
				if(current_hi_card<1)
					current_hi_card=a;
				absolute_hi_card=current_hi_card;
			}
			current_longest_stretch=1;
			current_hi_card=0;
		}
	}
	var num_mine=0;
	for(var i=0;i<absolute_longest_stretch;i++){
		if(absolute_hi_card-i==get_rank(player.carda)||absolute_hi_card-i==get_rank(player.cardb))
			num_mine++;  
	} 
	return make_xml("straight_hi",absolute_hi_card)+
					make_xml("num_needed",5-absolute_longest_stretch)+
					make_xml("num_mine",num_mine)+
					make_xml("hand_name","Straight");
}
function compare_straight(a,b){
	var hi_a=get_xml("straight_hi",a);
	var hi_b=get_xml("straight_hi",b);
	if(hi_a>hi_b)
		return "a";
	else if(hi_b>hi_a)
		return "b";
	else 
		return "c";
}

function test_three_of_a_kind(player, board){
	var my_cards=group_cards(player, board);
	var ranks=new Array(13);
	for(var i=0;i<13;i++)
		ranks[i]=0;
	for(var i=0;i<my_cards.length;i++)
		ranks[get_rank(my_cards[i])-2]++;
	var three="",kicker_1="",kicker_2="";
	for(var i=0;i<13;i++){
		if(ranks[i]==3)
			three=i+2;
		else if(ranks[i]==1){
			kicker_2=kicker_1;
			kicker_1=i+2;
		}else if(ranks[i]>1){
			kicker_1=i+2;
			kicker_2=i+2;
		}
	}
	var num_mine=0;
	if(get_rank(player.carda)==three)
		num_mine++;
	if(get_rank(player.cardb)==three)
		num_mine++;
	var num_needed=3;
	if(three)
		num_needed=0;
	return make_xml("rank",three)+
					make_xml("num_needed",num_needed)+
					make_xml("num_mine",num_mine)+
					make_xml("kicker_1",kicker_1)+
					make_xml("kicker_2",kicker_2)+
					make_xml("hand_name","Three of a Kind");
}
function compare_three_of_a_kind(a,b){
	var rank_a=get_xml("rank",a);
	var rank_b=get_xml("rank",b);
	if(rank_a>rank_b)
		return "a";
	else if(rank_b>rank_a)
		return "b";
	else{
		var kicker_a=get_xml("kicker_1",a);
		var kicker_b=get_xml("kicker_1",b);
		if(kicker_a>kicker_b)
			return "a";
		else if(kicker_b>kicker_a)
			return "b";
		else{
			kicker_a=get_xml("kicker_2",a);
			kicker_b=get_xml("kicker_2",b);
			if(kicker_a>kicker_b)
				return "a";
			else if(kicker_b>kicker_a)
				return "b";
			else 
				return "c";
		}
	}
}

function test_two_pair(player, board){
	var my_cards=group_cards(player, board);
	var ranks=new Array(13);
	for(var i=0;i<13;i++)
		ranks[i]=0;
	for(var i=0;i<my_cards.length;i++)
		ranks[get_rank(my_cards[i])-2]++;
	var first="",second="",kicker="";
	for(var i=12;i>-1;i--){
		if(ranks[i]==2){
			if(!first)
				first=i+2;
			else if(!second)
				second=i+2;
			else if(!kicker)
				kicker=i+2;
			else
				break;
		}
		else if(!kicker&&ranks[i]>0)
			kicker=i+2;
	}
	var num_mine=0;
	if(get_rank(player.carda)==first||get_rank(player.carda)==second)
		num_mine++;
	if(get_rank(player.cardb)==first||get_rank(player.cardb)==second)
		num_mine++;
	var num_needed=2;
	if(second)
		num_needed=0;
	else if(first)
		num_needed=1;
	else 
		num_needed=2;
	return make_xml("rank_1",first)+make_xml("rank_2",second)+
					make_xml("num_needed",num_needed)+make_xml("num_mine",num_mine)+
					make_xml("kicker",kicker)+
					make_xml("hand_name","Two Pair");
}
function compare_two_pair(a,b){
	var rank_a=get_xml("rank_1",a);
	var rank_b=get_xml("rank_1",b);
	if(rank_a>rank_b)	
		return "a";
	else if(rank_b>rank_a)
		return "b";
	else{
		rank_a=get_xml("rank_2",a);
		rank_b=get_xml("rank_2",b);
		if(rank_a>rank_b)
			return "a";
		else if(rank_b>rank_a)
			return "b";
		else{
			var kicker_a=get_xml("kicker",a);
			var kicker_b=get_xml("kicker",b);
			if(kicker_a>kicker_b)
				return "a";
			else if(kicker_b>kicker_a)	
				return "b";
			else 
				return "c";
		}
	}
}

function test_one_pair(player, board){
	var my_cards=group_cards(player, board);
	var ranks=new Array(13);
	for(var i=0;i<13;i++)
		ranks[i]=0;
	for(var i=0;i<my_cards.length;i++)
		ranks[get_rank(my_cards[i])-2]++;
	var pair="",kicker_1="",kicker_2="",kicker_3="";
	for(var i=0;i<13;i++){
		if(ranks[i]==2)
			pair=i+2;
		else if(ranks[i]==1){
			kicker_3=kicker_2;
			kicker_2=kicker_1;
			kicker_1=i+2;
		}
		else if(ranks[i]>2){
			kicker_1=i+2;
			kicker_2=i+2;
			kicker_3=i+2;
		}
	}
	var num_mine=0;
	if(get_rank(player.carda)==pair)
		num_mine++;
	if(get_rank(player.cardb)==pair)
		num_mine++;
	var num_needed=1;
	if(pair)
		num_needed=0;
	return make_xml("rank",pair)+
					make_xml("num_needed",num_needed)+
					make_xml("num_mine",num_mine)+
					make_xml("kicker_1",kicker_1)+make_xml("kicker_2",kicker_2)+make_xml("kicker_3",kicker_3)+
					make_xml("hand_name","One Pair");
}
function compare_one_pair(a,b){
	var rank_a=get_xml("rank",a);
	var rank_b=get_xml("rank",b);
	if(rank_a>rank_b)
		return "a";
	else if(rank_b>rank_a)
		return "b";
	else{
		var kicker_a=get_xml("kicker_1",a);
		var kicker_b=get_xml("kicker_1",b);
		if(kicker_a>kicker_b)
			return "a";
		else if(kicker_b>kicker_a)
			return "b";
		else{
			kicker_a=get_xml("kicker_2",a);
			kicker_b=get_xml("kicker_2",b);
			if(kicker_a>kicker_b)
				return "a";
			else if(kicker_b>kicker_a)
				return "b";
			else{
				kicker_a=get_xml("kicker_3",a);
				kicker_b=get_xml("kicker_3",b);
				if(kicker_a>kicker_b)
					return "a";
				else if(kicker_b>kicker_a)
					return "b";
				else 
					return "c";
			}
		}
	}
}

function test_hi_card(player, board){
	var my_cards=group_cards(player, board);
	var working_cards=new Array(my_cards.length);
	for(var i=0;i<working_cards.length;i++)
		working_cards[i]=get_rank(my_cards[i]);
	for(var i=0;i<working_cards.length;i++)
		if(working_cards[i]==null)
			working_cards[i]=-1; //FF
	working_cards.sort(compNum);
	var result="";
	for(var i=0;i<5;i++){
		if(!working_cards[i])working_cards[i]="";
			result+=make_xml("hi_card_"+i,working_cards[i]);
	}
	return result+make_xml("num_needed",0)+make_xml("hand_name","High Card");
}
function compare_hi_card(a,b){
	for(var i=0;i<5;i++){
		var hi_a=get_xml("hi_card_"+i,a);
		var hi_b=get_xml("hi_card_"+i,b);
		if(hi_a>hi_b)
			return "a";
		else if(hi_b>hi_a)
			return "b";
	}
	return "c";
}

function make_xml(tag,dat){
	return "<"+tag+">"+dat+"</"+tag+">";
}
function get_xml(tag,dat){
	var a=dat.indexOf("<"+tag+">");
	if(a<0)
		return "";
	var b=dat.indexOf("</"+tag+">");
	if(b<=a)
		return "";
	var ret=dat.substring(a+tag.length+2,b);
	var r=ret.match(/^(\d+)$/);
	if(r)
		return (ret-0);
	else 
		return ret;
}
function get_suit(card){
	if(card)
		return card.substring(0,1);
	else 
	return "";
}
function get_rank(card){
	if(card)
		return card.substring(1)-0;
	else 
		return "";
}
function get_predominant_suit(my_cards){
	var suit_count=[0,0,0,0];
	for(var i=0;i<my_cards.length;i++){
		var s=get_suit(my_cards[i]);
		if(s=="c")
			suit_count[0]++;
		else if(s=="s")
			suit_count[1]++;
		else if(s=="h")
			suit_count[2]++;
		else if(s=="d")	
			suit_count[3]++;
	}
	var suit_index=0;
	if(suit_count[1]>suit_count[suit_index])
		suit_index=1;
	if(suit_count[2]>suit_count[suit_index])
		suit_index=2;
	if(suit_count[3]>suit_count[suit_index])
		suit_index=3;
	if(suit_index==0)
		return "c";
	else if(suit_index==1)
		return "s";
	else if(suit_index==2)
		return "h";
	else if(suit_index==3)
		return "d";
	return "";
}
function group_cards(player, board){
	var c=new Array(7);
	for(var i=0;i<5;i++)
		c[i]=board[i];
	c[5]=player.carda;
	c[6]=player.cardb;
	return c;
}
function compNum(a,b){
	return b-a;
}

//==================================bot
//PREFLOP
function get_preflop_bet(players, current_bettor_index, current_bet){
	setup(players, current_bettor_index, current_bet);

	if(HUMAN_WINS_AGAIN>2&&(HCONF>60||RANKA==RANKB||RANKA>13||RANKB>13)){
		var other_making_stand=0;
		for(var i=1;i<players.length;i++){
			if(players[i].bankroll<1&&players[i].status!="BUST")
				other_making_stand=1;
			break;
		}
		if(other_making_stand<1){//should really check to see if bet_level is big and anyone has called...that's taking a stand too...
			if(BET_LEVEL>70)
				return eval(whatdo("40:CALL,60:ALLIN"));
			else 
				return eval(whatdo("15:MED,40:SMALL,45:CALL"));
		}
	}

	if(HCONF>99){
		if(POT_LEVEL>75)
			return eval(whatdo("60:ALLIN,10:BIG,20:MED,5:SMALL,5:CALL"));
		if(NUM_IN_HAND<4)
			return eval(whatdo("2:BIG,15:MED,33:SMALL,50:CALL"));
		return eval(whatdo("2:ALLIN,8:BIG,40:MED,40:SMALL,10:CALL"));
	}
	if(HCONF>90){
		if(POT_LEVEL>50)	
			return eval(whatdo("15:ALLIN,35:BIG,30:MED,15:SMALL,5:CALL"));
		if(NUM_IN_HAND>3)
			return eval(whatdo("5:ALLIN,15:BIG,35:MED,35:SMALL,10:CALL"));
		return eval(whatdo("2:ALLIN,6:BIG,15:MED,55:SMALL,22:CALL"));
	}
	if(HCONF>80){
		if(POT_LEVEL>50){
			if(ID_CONF=="LO")
				return eval(whatdo("100:ALLIN"));
			return eval(whatdo("100:CALL"));
		}
		return eval(whatdo("5:ALLIN,15:BIG,15:MED,30:SMALL,35:CALL"));
	}

	if(P.subtotal_bet>0&&CALL_LEVEL<40){
		if(HCONF>20||RANKA>10||RANKB>10)
			return eval(whatdo("5:SMALL,95:CALL"));
	}

	if(HCONF>70){
		if(POT_LEVEL>75){
			if(ID_CONF=="LO")
				return eval(whatdo("100:ALLIN"));
			return eval(whatdo("100:CALL"));
		}
		if(POT_LEVEL>50){
			if(ID_CONF=="LO")
				return eval(whatdo("50:ALLIN,50:BIG"));
			return eval(whatdo("100:CALL"));
		}
		if(NUM_IN_HAND>3)
			return eval(whatdo("5:ALLIN,15:BIG,30:MED,30:SMALL,20:CALL"));
		return eval(whatdo("2:ALLIN,7:BIG,35:MED,36:SMALL,20:CALL"));
	}
	if(HCONF>60){
		if(POT_LEVEL>75){
			if(ID_CONF=="LO")
				return eval(whatdo("100:ALLIN"));
			if(CALL_LEVEL<70)
				return CALL;
			if(ID_CONF=="HI")	
				return eval(whatdo("25:CALL"));
			return eval(whatdo("34:CALL"));
		}
		if(POT_LEVEL>50){
			if(ID_CONF=="LO")
				return eval(whatdo("75:ALLIN,25:BIG"));
			if(CALL_LEVEL<70)
				return CALL;
			return eval(whatdo("65:CALL"));
		}
		if(NUM_IN_HAND>3)
			return eval(whatdo("3:ALLIN,17:BIG,30:MED,30:SMALL,20:CALL"));
		return eval(whatdo("1:ALLIN,2:BIG,7:MED,40:SMALL,50:CALL"));
	}
	if(HCONF>50){
		if(POT_LEVEL>75){
			if(CALL_LEVEL<40)
				return CALL;
			return FOLD;
		}
		if(POT_LEVEL>50){
			if(CALL_LEVEL<40)
				return CALL;
			return eval(whatdo("1:ALLIN,8:CALL"));
		}
		return eval(whatdo("1:ALLIN,1:BIG,5:MED,20:SMALL,73:CALL"));
	}
	if(HCONF>40){
		if(BET_LEVEL>40){
			if(CALL_LEVEL<40)
				return CALL;
			return FOLD;
		}
		if(BET_LEVEL>30){
			if(CALL_LEVEL<30)
				return CALL;
			if(ID_CONF=="LO")
				return eval(whatdo("24:CALL"));
			return eval(whatdo("37:CALL"));
		}
		return eval(whatdo("1:ALLIN,1:BIG,19:SMALL,79:CALL"));
	}
	if(HCONF>30){
		if(BET_LEVEL>40){
			if(CALL_LEVEL<30)
				return CALL;
			return FOLD;
		}
		if(BET_LEVEL>30){
			if(CALL_LEVEL<30)
				return evel(whatdo("15:SMALL,85:CALL"));
			if(ID_CONF=="LO")
				return eval(whatdo("1:CALL"));
			return eval(whatdo("20:CALL"));
		}
		return eval(whatdo("1:ALLIN,1:BIG,9:SMALL,89:CALL"));
	}
	if(HCONF>20){
		if(BET_LEVEL>30){
			if(CALL_LEVEL<30)
				return CALL;
			return FOLD;
		}
		if(BET_LEVEL>20){
			if(CALL_LEVEL<20)
				return CALL;
			if(ID_CONF=="LO")
				return eval(whatdo("1:CALL"));
			return eval(whatdo("20:CALL"));
		}
		return eval(whatdo("1:ALLIN,99:CALL"));
	}
	if(CALL_LEVEL>20)
		return FOLD;
	if(CALL_LEVEL>10){
		if(ID_CONF=="LO")
			return eval(whatdo("20:CALL"));
		return eval(whatdo("1:MED,40:CALL"));
	}
	if(CALL_LEVEL>5){
		if(ID_CONF=="LO")
			return eval(whatdo("1:BIG,15:CALL"));
		return eval(whatdo("35:CALL"));
	}
	if(ID_CONF=="LO")
		return eval(whatdo("1:ALLIN,79:CALL"));
	return CALL;
}
function get_hole_ranking(players, current_bettor_index){
	var player=players[current_bettor_index];
	var a=player.carda;
	var b=player.cardb;
	var n_rank_a=get_rank(a);
	var n_rank_b=get_rank(b);
	if(n_rank_b>n_rank_a){
		a=player.cardb;
		b=player.carda;
		n_rank_a=get_rank(a);
		n_rank_b=get_rank(b);
	}
	var r_rank_a=my_make_readable_rank(n_rank_a);
	var r_rank_b=my_make_readable_rank(n_rank_b);
	var suited="";
	if(get_suit(a)==get_suit(b))	
		suited="s";
	var h="";
	if(n_rank_a==n_rank_b)
		h=""+r_rank_a+""+r_rank_b;
	else 
		h=""+r_rank_a+""+r_rank_b+suited;
	var q=lookup_hole_ranking(h);
	if(!q){
		h=""+r_rank_a+"x"+suited;
		q=lookup_hole_ranking(h);
	}
	return q;
}
function my_make_readable_rank(r){
	var rank=make_readable_rank(r);
	if(rank==10)
		rank="T";
	return rank;
}
function make_readable_rank(r){
	if(r<11)return r;
	else if(r == 11)return "J";
	else if(r == 12)return "Q";
	else if(r == 13)return "K";
	else if(r == 14)return "A";
}

function lookup_hole_ranking(h){
	var i=hole_rankings.indexOf(h+":");
	if(i<0)
		return 0;
	var j=hole_rankings.indexOf(",",i);
	var r=hole_rankings.substring(i+h.length+1,j);
	return r-0;
}

//POSTFLOP
function get_postflop_bet(players, current_bettor_index, current_bet, board){
	setup(players, current_bettor_index, current_bet);
	var ROUND=3;
	if(board[4])
		ROUND=5;
	else 
		if(board[3])
			ROUND=4;

	if(P.subtotal_bet>0){ //so no check-raising!!!!!!!!
		if(HCONF>20||RANKA>10||RANKB>10){
			if((CALL_LEVEL<40&&ROUND<4)||(CALL_LEVEL<30&&ROUND<5))
				return CALL;
		}
	}

	var VERDICT="";
	var STRAIGHT_FLUSH=test_straight_flush(P, board);
	var FOUR_OF_A_KIND=test_four_of_a_kind(P, board);
	var FULL_HOUSE=test_full_house(P, board);
	var FLUSH=test_flush(P, board);
	var STRAIGHT=test_straight(P, board);
	var THREE_OF_A_KIND=test_three_of_a_kind(P, board);
	var TWO_PAIR=test_two_pair(P, board);
	var ONE_PAIR=test_one_pair(P, board);
	var HI_CARD=test_hi_card(P, board);
	var FLUSH_DRAW=0,STRAIGHT_DRAW=0;

	if(ROUND<5){
		if(get_xml("num_needed",FLUSH)==1){
			var suit=get_xml("suit",FLUSH);
			if(P.carda.substring(0,1)==suit||P.cardb.substring(0,1)==suit)
				FLUSH_DRAW=1;
		}
		if(get_xml("num_needed",STRAIGHT)==1){ // of course, it might be on the board...
			STRAIGHT_DRAW=1; //.....bottom ended & top ended straight draws? 1 point for each?!!....
		}
	}

	if(get_xml("num_needed",STRAIGHT_FLUSH)<1){
		if(get_xml("num_mine",STRAIGHT_FLUSH)>0)
			VERDICT="GREAT";
		else 
			VERDICT="PLAY BOARD";
	}
	if(VERDICT==""&&get_xml("num_needed",FOUR_OF_A_KIND)<1){
		if(get_xml("num_mine",FOUR_OF_A_KIND)>0)
			VERDICT="GREAT";
		else{
			VERDICT="PLAY BOARD"; //SHOULD CHECK MY KICKER!!!!!!!................
		}
	}
	if(VERDICT==""&&get_xml("num_needed",FULL_HOUSE)<1){ //consider 2 or 3 on the board, (higher full house, 4 of a kind)
		if(get_xml("num_mine",FULL_HOUSE)>0)
			VERDICT="GREAT";
		else 
			VERDICT="PLAY BOARD";
	}
	if(VERDICT==""&&get_xml("num_needed",FLUSH)<1){ //look for full house, etc.
		var num_mine=get_xml("num_mine",FLUSH);
		if(num_mine>1)
			VERDICT="GREAT";
		else if(num_mine>0){
			var rank=0;
			if(P.carda.substring(0,1)==get_xml("suit",FLUSH))
				rank=RANKA;
			else rank=RANKB;
			if(rank<11)
				VERDICT="GOOD"; //12???????
			else 
				VERDICT="GREAT";
		}
		else VERDICT="MAYBE"; //could look @ board & decide if person was tryin' for flush...FACTOR: ANALYZE BETTING PATTERNS!...
	}
	if(VERDICT==""&&get_xml("num_needed",STRAIGHT)<1){ //look for flush, etc.
		if(get_xml("num_mine",STRAIGHT)>0)
			VERDICT="GREAT";
		else 
			VERDICT="PLAY BOARD";
		if(exists_flush_potential(board)<3)
			VERDICT="MAYBE"; ////////////POTENTIALLY BAD!!!!!!unless i can get it...!!!!!!!!!!!!!!!!!!
	}
	if(VERDICT==""&&get_xml("num_needed",THREE_OF_A_KIND)<1){ //look for straight, etc.
		if(get_xml("num_mine",THREE_OF_A_KIND)>0)
			VERDICT="GREAT";
		else{
			var k1=get_xml("kicker_1",THREE_OF_A_KIND);
			var k2=get_xml("kicker_2",THREE_OF_A_KIND);
			if((k1==RANKA&&k2==RANKB)||(k1==RANKB&&k2==RANKA))
				VERDICT="GREAT";
			else if(k1==RANKA||k1==RANKB)
				VERDICT="GOOD";
			else if(k1>11&&k2>9)
				VERDICT="GOOD";
			else 
				VERDICT="MAYBE"; //should really bet "POTENTIALLY BAD".............but can i get it?...............!!!!!!!!!!!!!
		}
		if(exists_flush_potential(board)<3)
			VERDICT="MAYBE"; ////////////POTENTIALLY BAD!!!!!!!!!unless i can get it...!!!!!!!!!!
		if(exists_straight_potential(board)<2)
			VERDICT="MAYBE"; ////////////"POTENTIALLY BAD!!!!!!!unless i can get it...!!!!!!!!!!!!
	}
	if(VERDICT==""&&get_xml("num_needed",TWO_PAIR)<1){
		var num_mine=get_xml("num_mine",TWO_PAIR);
		if(num_mine>1){
			if(RANKA==RANKB)
				VERDICT="GOOD";
			else 
				VERDICT="GREAT";
		}
		else if(num_mine>0){
			if(ROUND<4)
				VERDICT="GREAT"; //hmmmmmmmm........
			else{
				var rank=get_xml("rank_1",TWO_PAIR);
				if(rank!=RANKA&&rank!=RANKB)
					var rank=get_xml("rank_2",TWO_PAIR);
				if(rank<10)	
					VERDICT="MAYBE"; //11??????
				else 
					VERDICT="GOOD";
			}
		}
		else{
			var kick=get_xml("kicker",TWO_PAIR);
			if(kick==RANKA||kick==RANKB||kick>10)
				VERDICT="PLAY BOARD";
			else 
				VERDICT="MAYBE"; //"POTENTIALLY BAD"????????................................!!!!unless i can get it...!!!!
		}
		if(exists_flush_potential(board)<3)
			VERDICT="MAYBE"; /////////////"POTENTIALLY BAD!!!!!!!!unless i can get it...!!!!!!!!!!!!!!!!
		if(exists_straight_potential(board)<2)
			VERDICT="MAYBE"; ////////////"POTENTIALLY BAD!!!!!!unless i can get it...!!!!!!!!!!!!!
	}
	if(VERDICT==""&&get_xml("num_needed",ONE_PAIR)<1){
		if(get_xml("num_mine",ONE_PAIR)>0){
			var my_rank=get_xml("rank",ONE_PAIR);
			var num_overcards=0;
			for(var i=0;i<board.length;i++){
				if(board[i]&&get_rank(board[i])>my_rank)
					num_overcards++;
			}
			if(num_overcards<1){
				if(my_rank>11)
					VERDICT="GREAT";
				VERDICT="GOOD";
			}
			else if(num_overcards<2){
				if(my_rank>7)
					VERDICT="GOOD";
				VERDICT="MAYBE";
			}
			else 
				VERDICT="MAYBE";
			if(exists_flush_potential(board)<3)
				VERDICT="MAYBE"; /////////////"POTENTIALLY BAD!!!!!!!!!unless i can get it...!!!!!!!!!!!!!!!
			if(exists_straight_potential(board)<2)
				VERDICT="MAYBE"; ////////////"POTENTIALLY BAD!!!!!!!unless i can get it...!!!!!!!!!!!!
		}
	}

//add verdict "POTENTIALLY BAD" here, for example, for when the board looks dangerous?
//but what if i can get it!?!?!!!!!!!!!!!!!!!!!!!!!!!!!


//special case if verdict is MAYBE AND i have a draw...tend not to fold
//special case where verdict is good & i have a draw...tend not to fold

	if(HUMAN_WINS_AGAIN>2&&(VERDICT=="GREAT"||VERDICT=="GOOD"||VERDICT=="MAYBE"||RANKA==RANKB)){
		var other_making_stand=0;
		for(var i=1;i<players.length;i++){
			if(players[i].bankroll<1&&players[i].status!="BUST")
				other_making_stand=1;
			break;
		}
		if(other_making_stand<1){//should really check to see if bet_level is big and anyone has called...that's taking a stand too...
			if(BET_LEVEL>70)
				return eval(whatdo("40:CALL,60:ALLIN"));
			else 
				return eval(whatdo("10:MED,40:SMALL,50:CALL"));
		}
	}

	if(VERDICT=="GREAT"){
		if(ROUND<5)
			return eval(whatdo("5:ALLIN,5:BIG,25:MED,45:SMALL,20:CALL"));
		return eval(whatdo("30:ALLIN,40:BIG,30:MED"));
	}
	if(VERDICT=="GOOD"){
		if(ROUND<4){
			if(BET_LEVEL>79){
				if(CALL_LEVEL<70||FLUSH_DRAW)
					return CALL;
				return eval(whatdo("59:CALL"));
			}
			if(P.subtotal_bet>0)
				return eval(whatdo("1:ALLIN,2:BIG,5:MED,20:SMALL,72:CALL"));
			return eval(whatdo("3:ALLIN,40:BIG,42:MED,10:SMALL,5:CALL"));
		}
		if(BET_LEVEL<50){
			if(P.subtotal_bet>0)
				return eval(whatdo("1:BIG,3:MED,21:SMALL,75:CALL"));
			return eval(whatdo("10:BIG,20:MED,50:SMALL,20:CALL"));
		}
		if(BET_LEVEL<80){
			if(CALL_LEVEL<50)
				return CALL;
			return eval(whatdo("65:CALL")); //SOME THINGS DEPEND ON THE BOARD,POT ODDS,CONFIDENCE!!!!!!!!!!!!!!!!!!!!!!!!
		}
		if(CALL_LEVEL<70)
			return CALL;
		if(ROUND<5)
			return eval(whatdo("35:CALL"));
		return eval(whatdo("25:CALL"));
	}
	if(VERDICT=="MAYBE"){
		if(BET_LEVEL<50){
			if(CALL>0)
				return eval(whatdo("5:MED,15:SMALL,80:CALL"));
			return eval(whatdo("5:BIG,20:MED,50:SMALL,25:CALL"));
		}
		if(BET_LEVEL<70){
			if(ROUND<4&&FLUSH_DRAW)
				return CALL;
			if(CALL_LEVEL<40)
				return CALL;
			if(ID_CONF=="LO"){
				if(ROUND<4)
					return eval(whatdo("35:CALL"));
				if(ROUND<5)
					return eval(whatdo("65:CALL"));
				return eval(whatdo("89:CALL"));
			}
			if(ROUND<4)
				return eval(whatdo("61:CALL"));
			if(ROUND<5)
				return eval(whatdo("31:CALL"));
			return eval(whatdo("19:CALL"));
		}
		if(CALL_LEVEL<40)
			return CALL;
		if(ROUND<4){
			if(CALL_LEVEL<50)
				return CALL;
			return eval(whatdo("50:CALL"));
		}
		return eval(whatdo("11:CALL"));
	}
	if(FLUSH_DRAW){
		if(ROUND<4)
			return eval(whatdo("20:MED,40:SMALL,40:CALL"));
		if(ROUND<5){
			if(CALL<1)
				return eval(whatdo("10:MED,90:SMALL"));
			if(CALL_LEVEL<40)
				return CALL;
			return eval(whatdo("33:CALL")); //depends on how good my cards are!!!!!
		}
		else if(STRAIGH_DRAW){
			if(BET_LEVEL<50){
				if(ROUND<4)
					return eval(whatdo("20:MED,40:SMALL,40:CALL"));
				if(ROUND<5)
					return eval(whatdo("5:MED,40:SMALL,55:CALL"));
			}
			else{
				if(CALL_LEVEL<40)
					return CALL;
				if(ROUND<4)
					return eval(whatdo("29:CALL")); //depends on how good my cards are!!!!!!!!!
				if(ROUND<5)
					return eval(whatdo("9:CALL"));
			}
		}
	//otherwise, cleanup process handles it
	}
	if(VERDICT=="PLAY BOARD")
		return CALL;


	//perhaps use the ranking to come up w/ a preliminary strategy & then modify that strategy:
	//bluff
	//slow play
	//take a stand...human wins 4 in a row & human still playing & num players is 2 & i have good/maybe cards then call!
	//play straight


	var hi_rank=RANKA,lo_rank=RANKB;
	if(RANKA<RANKB){
		hi_rank=RANKB;
		lo_rank=RANKA;
	}
	if(HCONF>80){
		if(CALL<1){
			if(ROUND<5)
				return eval(whatdo("10:MED,80:SMALL,10:CALL"));
			return eval(whatdo("20:MED,70:SMALL,10:CALL"));
		}
		if(CALL_LEVEL<50)
			return CALL;
		if(CALL_LEVEL<70&&ROUND<5)
			return CALL;
		if(CALL_LEVEL<80&&ROUND<4)
			return CALL;
		return FOLD;
	}
	if(HCONF>70){
		if(CALL<1){
			if(ROUND<5)
				return eval(whatdo("10:MED,75:SMALL,15:CALL"));
			return eval(whatdo("10:MED,80:SMALL,10:CALL"));
		}
		if(CALL_LEVEL<40)
			return CALL;
		if(CALL_LEVEL<50)
			return eval(whatdo("50:CALL"));
		return FOLD;
	}
	if(hi_rank>13||HCONF>50){
		if(CALL<1){
			if(ROUND<5)
				return eval(whatdo("5:MED,75:SMALL,20:CALL"));
			return eval(whatdo("5:MED,75:SMALL,20:CALL"));
		}
		if(CALL_LEVEL<30)
			return CALL;
		if(CALL_LEVEL<40&&ROUND<4)
			return CALL;
		return FOLD;
	}
	if(CALL<1){
		if(ROUND<5)
			return eval(whatdo("20:SMALL,80:CALL"));
		return eval(whatdo("5:MED,70:SMALL,25:CALL"));
	}
	if(CALL_LEVEL<20)
		return CALL;
	if(CALL_LEVEL<30)
		return eval(whatdo("10:SMALL,20:CALL"));
	return FOLD;
}

function exists_flush_potential(board){	
	return get_xml("num_needed",test_flush(new player(),board));
}
function exists_straight_potential(board){
	return get_xml("num_needed",test_straight(new player(), board));
} //BUT inside draws!!!!!!!!!!!!!!!!!!!

//ETC.
function setup(players, current_bettor_index, current_bet){
	P=players[current_bettor_index];
	CALL=current_bet-P.subtotal_bet;
	RANKA=get_rank(P.carda);
	RANKB=get_rank(P.cardb);
	HCONF=get_hole_ranking(players, current_bettor_index);
	CALL_LEVEL=get_bet_level(CALL);
	BET_LEVEL=get_bet_level(current_bet); //feed function data we calc here so we don't gotta doubl do it!..
	POT_LEVEL=get_pot_level(players, current_bettor_index);
	BANKROLL=P.bankroll;
	var total_bankrolls=get_pot_size(players);
	for(var i=0;i<players.length;i++){
		total_bankrolls+=players[i].bankroll;
		if(players[i].status!="BUST"){
			NUM_IN_GAME++;
			if(players[i].status!="FOLD")
				NUM_IN_HAND++;
		}
	}
	ID_CONF="MID";
	var avg_bankroll=total_bankrolls/NUM_IN_GAME;
	if(BANKROLL<avg_bankroll/2)
		ID_CONF="LO";
	if(BANKROLL>avg_bankroll*1.5)
		ID_CONF="HI";
	SMALL=CALL+BIG_BLIND*2; //consider MINIMUM RAISE here & below!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	if(POT_LEVEL>40)
		SMALL+=5;
	if(NUM_IN_GAME>3){
		MED=CALL+BIG_BLIND*4;
		BIG=CALL+BIG_BLIND*10;
	}else{
		SMALL+=5;
		MED=round5(CALL+.1*BANKROLL); //consider minimum raise!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		BIG=round5(CALL+.2*BANKROLL); //consider minimum raise!
	}
	ALLIN=BANKROLL;
}

function whatdo(q,r){
	q+=",";
	if(!r)
		r=Math.random();
	var p=0;
	while(1){
		var a=q.indexOf(":");
		var b=q.indexOf(",",a);
		if(a<0||b<0)
			return "FOLD";
		var probability=(q.substring(0,a)-0)/100;
		var action=q.substring(a+1,b);
		q=q.substring(b+1);
		p+=probability;
		if(r<=p)
			return action;
	}
	return "FOLD";
}
function round5(n){
	if(n<5)
		return 5;
	var s=""+n;
	var i=s.indexOf(".");
	if(i>0)
		s=s.substring(0,i);
	n=s-0;
	while(n%5!=0)
		n++;
	return n;
}
function get_bet_level(b){
	var size=b/P.bankroll;
	if(size<=.015||b<=5)
		return 5;
	if(size<=.02||b<=10)
		return 10;
	if(size<=.03||b<=15)
		return 20;
	if(size<=.06||b<=30)
		return 30;
	if(size<=.12||b<=60)
		return 40;
	if(size<=.21||b<=100)
		return 50;
	if(size<=.35||b<=150)
		return 70;
	if(size<=.41||b<=200)
		return 80;
	return 100;
}
function get_pot_size(players){
	var p = 0;
	for(var i = 0;i<players.length;i++)
		p += players[i].total_bet+players[i].subtotal_bet;
	return p;
};
function get_pot_level(players, current_bettor_index){
	var p=get_pot_size(players);
	var b=players[current_bettor_index].bankroll;
	if(p>.5*b)
		return 100;
	else if(p>.25*b)
		return 51;
	else 
		return 1;
}

// Human relative ==================================

function exhaustive() {
	
	holdem.handArray();
	var obj = holdem.exhaustive(playersNumber);
	console.log(obj);
}

function oddsmonte() {
	cards = [0, 20];
	playersNumber = 2;
	phase = 0;
	holdem.handValue(0,20);
	var obj = holdem.monteCarloSimulation(playersNumber, phase);
	console.log(obj);
}

/*
function human(){
	var status, bet_amount;
	if(true){
		players[0].status = "FOLD";
		current_bettor_index = get_next_player_position(0,1);
	}
	else if(status == "CALL"){
		players[0].status = "CALL";
		current_bettor_index = get_next_player_position(0,1);
		bet(0,current_bet-players[0].subtotal_bet);
	}
	else if(status == "FOLD"){
		players[0].status = "FOLD";
		current_bettor_index = get_next_player_position(0,1);
	}
	else if(status = "BET"){
		bet_amount = ""+bet_amount;
		var m = "";
		for(var i = 0;i<bet_amount.length;i++){
			var c = bet_amount.substring(i,i+1);
			if(c == "0"||c>0)
				m += ""+c;
		}
		if(m == "")
			return;
		bet_amount = m-0;
		if(bet_amount<0||isNaN(bet_amount))
			bet_amount = 0;
		var to_call = current_bet-players[0].subtotal_bet;
		bet_amount += to_call;
		var is_ok_bet = bet(0,bet_amount);
		if(is_ok_bet){
			players[0].status = "CALL";
			current_bettor_index = get_next_player_position(0,1);
		}
	}
	write_player(0,0,0,0);
	console.log(players);
	main();
}
*/

exports.logic = logic;