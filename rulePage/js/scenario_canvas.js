(function( window ){
	window.getContentWidth = function(){ return 320; };
})( window );

jQuery(document).ready(function($){
	//■■■■■■■■■■■■■■■■■■■■■■■■
	//■ Initialize
	//■■■■■■■■■■■■■■■■■■■■■■■■
	var FONT_FAMILY = "'ヒラギノ角ゴ Pro W3'";
	var VIEW_WIDTH = 320;
	var VIEW_HEIGHT = 440;
	var canvas = new EcfwGameCanvas(
		fieldData.actionUrl ? new EcfwConnection(fieldData.actionUrl, fieldData.code) : null,
		{
			fieldId : 'content_field',
			canvasId : 'main_canvas',
			baseUrl : fieldData.baseUrl,
			imageUrl : fieldData.imageUrl,
			params : fieldData.params,
			reloadUrl : fieldData.reloadUrl,
			onAction : onAction,
			onRender : onRender,
			onInit : onInit,
			onUpdate : onUpdate,
			width  : VIEW_WIDTH,
			height : VIEW_HEIGHT,
			initData : fieldData.initData
		}
	);

	//■■■ Functions ■■■

	//■■■■■■■■■■■■■■■■■■■■■■■■
	//■ Objects
	//■■■■■■■■■■■■■■■■■■■■■■■■
	var bX = 0, bY = 0;

	//■■■■■■■■ BackGround ■■■■■■■■
	var BackGround = function(label, path){
		canvas.loadImage(label, path);
		this.onRender = function(ctx){
			canvas.drawImage(ctx, label, bX, bY, 320, 275);
		};
	};

	function bgChange(action, callback){
		canvas.putObject('background', new BackGround(action.label,action.resource), 0 );
		if( callback != null ){ callback(); };
	}

	//■■■■■■■■ Character ■■■■■■■■
	var Character = function(target, options){
		var _opt = $.extend({
			left : 0,
			top : 0,
			scale : 1,
			reverse : false,
			color : '#000000',
			name : null,
			emotion : 'default'
		}, options);
		var _mst = 0,_mtt = 0;
		var _mopt = null;
		var _meff = null;
		this.animate = function(opt, time){
			_mst = (new Date()).getTime();
			_mtt = time;
			_mopt = $.extend({}, _opt);
			_meff = opt.effect;
			$.extend(_opt, opt);
		};
		this.emotion = function(label){
			_opt['emotion'] = label;
		};
		this.getColor = function(){
			return _opt.color;
		};
		this.getName = function(){
			return _opt.name;
		};
		this.onRender = function(ctx){
			var l = _opt.left;
			var t = _opt.top;
			var rv = _opt.reverse;
			var s = _opt.scale;
			var rtt = 0;
			var time = (new Date()).getTime();
			var rx = 0, ry = 0;
			if( time < _mst + _mtt ){
				var r = (time - _mst) / _mtt;
				rv = _mopt.reverse;
				l = Math.floor((_opt.left - _mopt.left) * r) + _mopt.left;
				t = Math.floor((_opt.top - _mopt.top) * r) + _mopt.top;
				s = (_opt.scale - _mopt.scale) * r + _mopt.scale;
				
				var _eff_name = (!_meff || typeof _meff == "string") ? _meff : _meff.name;
				if( _eff_name == 'rolling' ){
					var _eopt = $.extend({
						roll_num : 5,
						ancher_x : 0,
						ancher_y : 0
					}, _meff);
					
					rtt = r * _eopt.roll_num * Math.PI;
					rx = _eopt.ancher_x;
					ry = _eopt.ancher_y;
				}
				else if( _eff_name == 'tremble' ){
					l += Math.round(Math.sin(r * 20 * Math.PI) * 3);
				}
				else if( _eff_name == 'jump' ){
					t -= Math.round(Math.sin(r * Math.PI) * 15);
				}
			}
			var img = 'e_' + target + '_' + _opt.emotion;
			canvas.drawTransformedImage(ctx, img, bX+l, bY+t, s, rv, false, rtt, rx, ry);
		};
	};

	function charaAdd(action, callback){
		var tgt = action.target;
		var options = action.options;
		var z_index = options.z_index != null ? action.options.z_index : 1;
		var obj = new Character(tgt,options);
		canvas.putObject('c_'+tgt, obj, z_index );
		obj.emotion(action.label);
		if( callback != null ){ callback(); };
	}

	function charaMove(action, callback){
		var options = action.options;
		var time = options.time != null ? options.time : 400;
		var tgt = action.target;
		var obj = canvas.getObject('c_'+tgt);
		if( obj ){
			obj.animate(options, time);
		}
		if( callback ){
			if( time > 0 ) setTimeout(callback, time);
			else callback();
		}
	}
	function charaEmotion(action, callback){
		var tgt = action.target;
		var obj = canvas.getObject('c_'+tgt);
		if( obj ){
			obj.emotion(action.label);
		}
		if( callback != null ){ callback(); };
	}
	function charaEffect(action, callback){
		if( callback != null ){ callback(); };
	}
	function charaRemove(action, callback){
		var tgt = action.target;
		canvas.removeObject('c_'+tgt);
		if( callback != null ){ callback(); };
	}

	//■■■■■■■■ Message ■■■■■■■■
	canvas.loadImage('msg_box', 'parts/msg_box.png');
	canvas.loadImage('btn_next', 'parts/btn_next.png');
	canvas.loadImage('name_bg', 'parts/name_bg.png');
	var Message = function(tgt, msg, callback){
		var _len = 0;
		var _st = (new Date()).getTime();
		var _end = false;

		var _color = '#000000';
		var _name = null;
		var _chara = canvas.getObject('c_'+tgt);
		if( _chara ){
			_name = _chara.getName();
			_color = _chara.getColor();
		}
		var _arr = msg.split('<br/>');
		var _msg = function(){
			var MAX_WIDTH = VIEW_WIDTH - 34;
			var canvasElem = document.getElementById('main_canvas');
			var canvasContext = canvasElem.getContext('2d');
			var calcWidth = function(str){
				var metrics = canvasContext.measureText(str);
				return metrics.width / canvas.getScale();
			};
			canvasContext.textAlign ='left';
			canvasContext.font = "bold "+canvas.scale(16)+"px " + FONT_FAMILY;
			canvasContext.fillStyle = _color;
			
			var msgs = new Array();
			for( var i=0;i<_arr.length;i++ ){
				var m = _arr[i];
				while (calcWidth(m) > MAX_WIDTH){
					var len = m.length - 1;
					while (calcWidth(m.substring(0,len)) > MAX_WIDTH){
						len --;
					}
					msgs.push(m.substring(0,len));
					m = m.substring(len);
				}
				msgs.push(m);
				continue;
			}
			return msgs;
		}();
		
		for(var i=0;i<_msg.length;i++){
			_len += _msg[i].length;
		}
		this.onRender = function(ctx){
			var left = 0, top = 274;
			canvas.drawImage(ctx, 'msg_box', bX+left, bY+top, 320, 166.5);

			if( _name ){
				var l = 19;
				var t = 242;
				var w = 88.5;
				var h = 24;
				canvas.drawImage(ctx, 'name_bg', bX+l, bY+t, w, h);

				ctx.textAlign ='center';
				ctx.font = "bold "+canvas.scale(12)+"px " + FONT_FAMILY;
				ctx.fillStyle = '#FFFFFF';
				canvas.fillText(ctx, _name, bX+l+w/2, bY+t+h/2+5);
			}
			var t = top + 10;
			var l = left + 17;
			ctx.textAlign ='left';
			ctx.font = "bold "+canvas.scale(16)+"px " + FONT_FAMILY;
			ctx.fillStyle = _color;

			var time = (new Date()).getTime();
			var size = Math.floor((time - _st) / 50 );
			if( size >= _len )_end = true;
			if( _end ) size = _len;
			var ml = 0;
			for(var i=0;i<_msg.length;i++){
				t += 22;
				var m = _msg[i];
				if( size < ml + m.length ){
					canvas.fillText(ctx, m.substring(0,size-ml), bX+l, bY+t);
					break;
				}
				ml += m.length;
				canvas.fillText(ctx, m, bX+l, bY+t);
			}
			if( _end ){
				canvas.drawImage(ctx, 'btn_next', bX+282, bY+406, 14.5, 13.5);
			}
		};
		this.isOver = function(pos){
			return 0 <= pos.y && pos.y <= VIEW_HEIGHT && 0 <= pos.x && pos.x <= VIEW_WIDTH;
		};
		this.onMouseup = function(pos){
			if( _end ){
				if( callback != null ){ callback(); callback = null; };
			}
			_end = true;
		};
	};
	function charaMsg(action, callback){
		var tgt = action.target;
		canvas.putObject('msg_window', new Message(tgt, action.message, callback), 99 );
		var obj = canvas.getObject('c_'+tgt);
		if( obj ){
			obj.animate({'effect':'jump'}, 300);
		}
	}

	//■■■■■■■■ LoadEmotion ■■■■■■■■
	function loadEmotion(action, callback){
		var tgt = 'e_' + action.target + '_' + action.label;
		canvas.loadImage(tgt, action.resource);
		if( callback != null ){ callback(); };
	}

	//■■■■■■■■ ScreenEffect ■■■■■■■■
	var ScreenEffect = function(tgt, options, callback){
		var _tt = options && (options.time != null) ? options.time : 1000;
		var _st = (new Date()).getTime();
		if( callback ){
			if( _tt > 0 ) setTimeout(callback, _tt);
			else callback();
		}
		this.onRender = function(ctx){
			var time = (new Date()).getTime();
			var r = Math.min(time - _st, _tt) / _tt;
			if( tgt == 'black_out' ){
				ctx.globalAlpha = r;
				ctx.fillStyle = '#000000';
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'black_in' ){
				ctx.globalAlpha = 1 - r;
				ctx.fillStyle = '#000000';
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'white_out' ){
				ctx.globalAlpha = r;
				ctx.fillStyle = '#FFFFFF';
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'white_in' ){
				ctx.globalAlpha = 1 - r;
				ctx.fillStyle = '#FFFFFF';
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'fade_out' ){
				ctx.globalAlpha = r;
				ctx.fillStyle = options.color;
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'fade_in' ){
				ctx.globalAlpha = 1 - r;
				ctx.fillStyle = options.color;
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'flush' ){
				var count = options && (options.count != null) ? options.count : 1;
				ctx.globalAlpha = 0.5 - 0.5 * Math.cos(2 * Math.PI * r * count );
				ctx.fillStyle = options && (options.color != null) ? options.color : '#FFFFFF';
				canvas.fillRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
				ctx.globalAlpha = 1;
			}
			else if( tgt == 'quake' ){
				if( time < _st + _tt ){
					var x_length = options && (options.x_length != null) ? options.x_length : 0;
					var y_length = options && (options.y_length != null) ? options.y_length : 5;
					var x_count = options && (options.x_count != null) ? options.x_count : 0;
					var y_count = options && (options.y_count != null) ? options.y_count : 5;
					bX = Math.round(Math.sin(r * x_count * Math.PI * 2) * (1 - r) * x_length);
					bY = Math.round(Math.sin(r * y_count * Math.PI * 2) * (1 - r) * y_length);
				}
				else bY=0,bX=0;
				return;
			}
			else{
				return;
			}
		};
	};
	function screen(action, callback){
		canvas.putObject('screen', new ScreenEffect(action.target, action.options, callback), 101 );
	}
	//■■■■■■■■ SkipButton ■■■■■■■■
	var SkipButton = function(nextUrl){
		canvas.loadImage('btn_skip', 'parts/btn_skip.png');
		var left = 0, top = 0, w = 65.5, h = 26;
		this.onRender = function(ctx){
			canvas.drawImage(ctx, 'btn_skip', bX+left, bY+top, w, h);
		};
		this.isOver = function(pos) {
			return top <= pos.y && pos.y <= top + h && left <= pos.x && pos.x <= left + w ;
		};
		this.onMouseup = function(pos) {
			canvas.movePage(nextUrl);
			return false;
		};
	};

	//■■■■■■■■ ObjectGroup ■■■■■■■■
	var ObjectGroup = function(){
		var _objs = [];
		this.push = function(obj){
			_objs.push(obj);
		};
		this.onRender = function(ctx){
			for( var i=0;i<_objs.length;i++ ){
				_objs[i].onRender(ctx);
			}
		};
		this.isOver = function(pos) {
			for( var i=0;i<_objs.length;i++ ){
				if( _objs[i].isOver(pos) ){
					return true;
				}
			}
			return false;
		};
		this.onMouseup = function(pos) {
			for( var i=0;i<_objs.length;i++ ){
				if( _objs[i].isOver(pos) ){
					return _objs[i].onMouseup(pos);
				}
			}
			return false;
		};
	};
	//■■■■■■■■ ChoiceButton ■■■■■■■■
	var ChoiceButton = function(id, text, action, nextUrl){
		var _l = 8, _t = 18 + (id-1) * 84, w=306.5, h=70;
//		X：8px　Y：18px
//		X：8px　Y：102px
//		X：8px　Y：187px
		var MAX_LETTER = 17;
		var _msg = new Array();
		if( text && (text instanceof Array) == false ){
			var _arr = text.split('<br/>');
			for( var i=0;i<_arr.length;i++ ){
				var m = _arr[i];
				while( m.length > MAX_LETTER ){
					_msg.push(m.substring(0,MAX_LETTER));
					m = m.substring(MAX_LETTER);
				}
				_msg.push(m);
			}
		}

		this.onRender = function(ctx){
			canvas.drawImage(ctx, 'btn_choice'+id, bX+_l, bY+_t, w, h);
			if( _msg ){
				var tb = _t + 46 - _msg.length * 8;
				var l = 70;
				ctx.textAlign ='left';
				ctx.font = ""+canvas.scale(14)+"px " + FONT_FAMILY;
				ctx.fillStyle = '#000000';

				for(var i=0;i<_msg.length;i++){
					var t = tb + i * 16;
					canvas.fillText(ctx, _msg[i], l, t);
				}
			}
		};
		this.isOver = function(pos) {
			return _t <= pos.y && pos.y <= _t + h && _l <= pos.x && pos.x <= _l + w ;
		};
		this.onMouseup = function(pos) {
			if (nextUrl){
				canvas.movePage(nextUrl);
			}
			if (action){
				canvas.doSendAction(JSON.stringify(action));
			}
			return false;
		};
	};
	function choices(action, callback){
		canvas.loadImage('btn_choice1', '/scenario/parts/last_q01.png');
		canvas.loadImage('btn_choice2', '/scenario/parts/last_q02.png');
		canvas.loadImage('btn_choice3', '/scenario/parts/last_q03.png');
		var _choices = action.choices;
		var group = new ObjectGroup();
		for( var i=0;i<_choices.length;i++ ){
			var _c = _choices[i];
			group.push(new ChoiceButton(i+1, _c.message, _c.action, _c.nextUrl));
		}
		canvas.putObject('choices', group, 102 );
	}
	//■■■■■■■■ waitForLoading ■■■■■■■■
	function waitLoading(callback){
		if( callback == null ){
			return;
		}
		if( canvas.isImageLoading() ){
			setTimeout(function(){ waitLoading(callback); }, 200);
			return;
		}
		callback();
	}

	//■■■■■■■■■■■■■■■■■■■■■■■■
	//■ Actions
	//■■■■■■■■■■■■■■■■■■■■■■■■
	var _started = false;
	function onAction(action, callback){
		if( action.type == "bgChange" ){
			bgChange(action, callback);
		}
		else if( action.type == "loadEmotion" ){
			loadEmotion(action, callback);
		}
		else if( action.type == "charaAdd" ){
			charaAdd(action, callback);
		}
		else if( action.type == "charaMove" ){
			charaMove(action, callback);
		}
		else if( action.type == "charaEmotion" ){
			charaEmotion(action, callback);
		}
		else if( action.type == "charaEffect" ){
			charaEffect(action, callback);
		}
		else if( action.type == "charaMsg" ){
			if( _started == false ){
				waitLoading(function(){
					_started = true;
					charaMsg(action, callback);
				});
				return;
			}
			charaMsg(action, callback);
		}
		else if( action.type == "charaRemove" ){
			charaRemove(action, callback);
		}
		else if( action.type == "screen" ){
			screen(action, callback);
		}
		else if( action.type == "choices" ){
			choices(action, callback);
		}
		else if( action.type == "wait" ){
			var options = action.options;
			var time = options && (options.time != null) ? options.time : 1000;
			setTimeout(callback, time);
		}
		else if( action.type == "waitLoading" ){
			waitLoading(callback);
		}
		else{
			if( callback != null ){ callback(); };
		}
	}
	function onRender(ctx){

	}
	function onInit(resp){
		if( resp.nextUrl ){
			canvas.putObject('skip', new SkipButton(resp.nextUrl), 100 );
		}
	}
	function onUpdate(resp){

	}
	canvas.start();
});
