/**
 *  Info DataStructure
 *
		var info = {
			bankroll: "",
			name: "",
			total: "",
			bet: "",
		}
	*/
	
var playHelper = function(el, info){
	this.el = el;
	if(typeof(el) == "object"){
		this.dom = el;
	}
	else {
		this.dom = $("." + el);
	}
	this.bet = 0;
	this.name = "";
	this.carda = "";
	this.cardb = "";
	this.total = 0;
	
	this.carda = $(this.dom.find(".card")[0]);
	this.cardb = $(this.dom.find(".card")[1]);
	this.status = $(this.dom.find(".status"));
}

playHelper.prototype = {
	/*
	var carda = cardSplit(data.carda);
	var cardb = cardSplit(data.cardb);
	
	$(".player .face.back img")[0].src = Poker.getCardImage(60,carda[0],carda[1]).src;
	$(".player .face.back img")[1].src = Poker.getCardImage(60,cardb[0],cardb[1]).src;
	*/
	deal: function(carda, cardb){
		$("."+ this.el +" .face.back img")[0].src = Poker.getCardImage(60,carda[0],carda[1]).src;
		$("."+ this.el +" .face.back img")[1].src = Poker.getCardImage(60,cardb[0],cardb[1]).src;
	},
	hide: function(){
		this.carda.removeClass("flipped");
		this.cardb.removeClass("flipped");
	},
	show: function(){
		this.carda.addClass("flipped");
		this.cardb.addClass("flipped");
	},
	betting: function(status, stake){
		var self = this;
		if(status != 'FOLD' && status != 'BUST'){
			if(status == 'CALL'){
				this.bet = stake;
				this.total += this.bet;
				this.status.html("BET:"+this.bet);
			}
			if(status == 'OPTION'){
				this.status.html("CHECK");
			}
		}
		else if(status == 'FOLD'){
			this.status.html("FOLD");
		}
	},
	log: function(message){
		console.log(message);
	}
}