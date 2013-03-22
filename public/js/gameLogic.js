
var gameLogic = function(players, steps, options){
	var self = this;
	self.players = players;
	self.steps = steps;
	self.length = steps.length;
}


gameLogic.prototype = {
	step: function(){
		var self = this;
		step_counter ++;
		if(step_counter >= self.length-1){
			clearInterval(step_seed);
			console.log(self.length);
		}
		
		var action = self.steps[step_counter];
		if(action.code == "player"){
			self.players[action.index].betting(action.content.status, action.content.subtotal_bet);
		}
		else if(action.code == "board"){
			boards.deal(action.content, board_counter);
			board_counter ++;
		}
		else {
			for(var i in action.content){
				self.players[i].show();
				var carda = new Array;
				var cardb = new Array;
				carda[0] = action.content[i].carda.suit;
				carda[1] = action.content[i].carda.point;
				cardb[0] = action.content[i].cardb.suit;
				cardb[1] = action.content[i].cardb.point;
				self.players[i].deal(carda, cardb);
				if(action.content[i].allocations > 0)
					alert("winer is "+action.content[i].name);
			}
		}
		
	}
}