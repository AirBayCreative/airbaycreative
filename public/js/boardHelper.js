/**
 * Board Helper
 */
var boardHelper = function(el, card){
	this.el = el;
}

boardHelper.prototype = {
	deal: function(content, i){
		$(this.el[i]).find(".face.back img")[0].src = Poker.getCardImage(60,content.suit,content.point).src;
		$(this.el[i]).addClass("flipped");
	},
	hide: function(i){
		$(this.el[i]).removeClass("flipped");
	},
}