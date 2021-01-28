jQuery(document).ready(function($){
	//■■■■■■■■■■■■■■■■■■■■■■■■
	//■ WindowResizer
	//■■■■■■■■■■■■■■■■■■■■■■■■
	var WindowResizer = function(){
		var lastWidth = -1;
		var lastScale = 0;
		this.autoResize = function(){
			var w = $(window).width();
			if( w == lastWidth ){
				return lastScale;
			}
			var ua = {};
			ua.name = window.navigator.userAgent.toLowerCase();
			ua.isiPhone = ua.name.indexOf('iphone') >= 0;
			ua.isiPod = ua.name.indexOf('ipod') >= 0;
			ua.isiPad = ua.name.indexOf('ipad') >= 0;
			ua.isiOS = (ua.isiPhone || ua.isiPod || ua.isiPad);
			ua.isAndroid = ua.name.indexOf('android') >= 0;
			ua.isAndroid2 = ua.name.indexOf('version') >= 0;
			ua.isTablet = (ua.isiPad || (ua.isAndroid && ua.name.indexOf('mobile') < 0));

			var z = 1;
			if (!ua.isiOS && !ua.isAndroid){ // PC版
				z = 1.875;
				var base = w < 750 ? 320 : 550;
				z = w / base;
				$("html").css({zoom : z});
				lastWidth = w;
				lastScale = z;
				return z;
			}

			if( !ua.isAndroid2 || ua.isiOS ){
				//Android標準ブラウザ以外のUAで画面幅750以下の場合は画面幅いっぱいで表示
				var base = w < 750 ? 320 : 550;
				z = w / base;
				$("html").css({zoom : z});
			}
			lastWidth = w;
			lastScale = z;
			return z;
		};
		this.getScale = function(){
			return lastScale;
		};
	};
	window.resizer = new WindowResizer();

	//■■■■■■■■■■■■■■■■■■■■■■■■
	//■ Class:EcfwCanvas
	//■■■■■■■■■■■■■■■■■■■■■■■■
	var EcfwGameCanvas = function(_conn, setting){
		var _setting = $.extend({
			fieldId : 'content_field',
			canvasId : 'content_canvas',
			baseUrl : '',
			imageUrl : '',
			params : '',
			reloadUrl : '',
			onAction : null,
			onRender : null,
			onInit : null,
			onUpdate : null,
			width  : 320,
			height : 400,
			initData : null
		}, setting);

		var _ver = 0;
		var _cfield = $('#'+_setting.fieldId);
		var _fps = 20;
		var _scale = 1;
		//■■■ scalling ■■■
		var setScale = function( scale ){
			var canvas = document.getElementById(_setting.canvasId);
			_scale = scale;
			canvas.width  = _setting.width * scale;
			canvas.height = _setting.height * scale;
			canvas.style.width  = _setting.width + 'px';
			canvas.style.height = _setting.height + 'px';
			if( console && console.log ){
				console.log("SetScale:" + scale);
			}
		};
		var autoScale = function(){
			var scale = window.devicePixelRatio || 2;
			if( window.resizer ){
				scale *= window.resizer.autoResize();
			}
			setScale(scale);
		};
		this.setScale = setScale;
		this.autoScale = autoScale;
		autoScale();


		var scale = function(sz){
			return Math.round(sz*_scale);
		};
		this.scale = scale;
		
		this.getScale = function(){
			return _scale;
		};

		//■■■ image ■■■
		var _imgstk = {};
		var _imgstkPath = {};
		var _imgloading = 0;
		var createImageUrl = function(url){
			if( url.lastIndexOf('http', 0) == 0 ){
				return url;
			}
			var baseUrl = _setting.imageUrl;
			var joinedUrl = "/img/" + url;
			return baseUrl
			.replace("[path]", joinedUrl)
			.replace("%5Bpath%5D", encodeURIComponent(joinedUrl));
		};
		this.loadImage = function(id, path){
			if( path == null || _imgstk[id] != null ){
				return;
			}
			if( _imgstkPath[path] != null ){
				_imgstk[id] = _imgstkPath[path];
				return;
			}
			_imgloading++;
			var url = createImageUrl(path);
			var img = $('<img src="'+url+'" imgid="'+id+'" path="'+path+'" style="display:none;"></img>');
			img.bind("load", function(){
				var img = $(this)[0];
				var id = img.getAttribute('imgid');
				var path = img.getAttribute('path');
				_imgstk[id] = img;
				_imgstkPath[path] = img;
				_imgloading--;
			});
			var url = createImageUrl(path);
			var img = $('<img src="'+url+'" id="img_'+id+'" style="display:none;"></img>');
			img.bind("load", function(){
				var img = document.getElementById('img_' + id);
				_imgstk[id] = img;
				_imgstkPath[path] = img;
				_imgloading--;
			});
			img.bind("error", function(){
				_imgloading--;
				if( console && console.log ){
					console.log("Error:" + path);
				}
			});
			_cfield.append(img);
			return;
		};
		this.isImageLoading = function(){
			return _imgloading > 0 ;
		};
		this.getImageWidth = function(id){
			var img = _imgstk[id];
			return img == null ? 0 : img.width;
		};
		this.getImageHeight = function(id){
			var img = _imgstk[id];
			return img == null ? 0 : img.height;
		};
		//■■■■■■■■ waitImageLoading ■■■■■■■■
		var waitImageLoading = function(callback){
			if( callback == null ){
				return;
			}
			if( _imgloading > 0 ){
				setTimeout(function(){ waitImageLoading(callback); }, 200);
				return;
			}
			callback();
		};
		this.waitImageLoading = waitImageLoading;

		//■■■■■■■■ drawImage ■■■■■■■■
		this.drawImage = function(ctx, imageName, x, y, w, h){
			var img = _imgstk[imageName];
			if( img != null ){
				if( typeof w === 'undefined' ) w = img.width;
				if( typeof h === 'undefined' ) h = img.height;
				ctx.drawImage(img, scale(x), scale(y), scale(w), scale(h));
			}
		};
		this.drawImageCenter = function(ctx, imageName, cx, cy, szW, szH){
			var image = _imgstk[imageName];
			if( image != null ){
				if( typeof szW === 'undefined' ) szW = 1;
				if( typeof szH === 'undefined' ) szH = szW;
				var w = scale(image.width * szW);
				var h = scale(image.height * szH);
				var x = scale(cx) - w / 2;
				var y = scale(cy) - h / 2;
				ctx.drawImage(image, x, y, w, h);
			}
		};
		this.drawTransformedImage = function(ctx, imageName, x, y, sz, revX, revY, rotate, rx, ry){
			var img = _imgstk[imageName];
			if( img != null ){
				var w = scale(img.width * sz);
				var h = scale(img.height * sz);
				ctx.save();
				ctx.translate(scale(x),  scale(y));
				if( rotate > 0 ){
					if( typeof rx === 'undefined' ) rx = 0;
					if( typeof ry === 'undefined' ) ry = 0;
					var lx = w/2 + rx, ly = h/2 + ry;
					ctx.translate(lx,ly);
					ctx.rotate(rotate);
					ctx.translate(-lx,-ly);
				}
				if( revX || revY ){
					var lx = revX ? w : 0, ly = revY ? h : 0;
					ctx.translate(lx,ly);
					ctx.scale( revX ? -1 : 1, revY ? -1 : 1 );
				}
				ctx.drawImage(img, 0, 0, w, h);

				ctx.restore();
			}
		};

		//■■■ Render ■■■
		this.strokeRect = function(ctx, x, y, w, h){
			ctx.strokeRect(scale(x), scale(y), scale(w), scale(h));
		};
		this.fillRect = function(ctx, x, y, w, h){
			ctx.fillRect(scale(x), scale(y), scale(w), scale(h));
		};
		this.fillText = function(ctx, m, x, y){
			ctx.fillText(m, scale(x), scale(y));
		};
		this.strokeText = function(ctx, m, x, y){
			ctx.strokeText(m, scale(x), scale(y));
		};

		//■■■ Object Control ■■■
		var _objects = new Object();
		var _objArray = null;
		this.containsObject = function(name){
			return name in _objects;
		};
		this.removeObject = function(name){
			if( name in _objects ){
				delete _objects[name];
				_objArray = null;
				return true;
			}
			return false;
		};
		this.putObject = function(name, value, pri){
			var obj = new Object();
			obj.value = value;
			obj.pri = pri;
			_objects[name] = obj;
			_objArray = null;
		};
		this.getObject = function(name){
			return (name in _objects) ? _objects[name].value : null;
		};
		this.changePriority = function(name, pri){
			if( name in _objects && _objects[name].pri != pri ){
				_objects[name].pri = pri;
				_objArray = null;
			}
		};
		var getObjectArray = function(){
			if( _objArray == null ){
				var array = new Array();
				for (var name in _objects) {
					array.push(_objects[name]);
				}
				array.sort(function(o1, o2){
					return o1.pri < o2.pri ? 1 : -1;
				});
				var objArray = new Array();
				for (var i = 0; i < array.length; i ++) {
					objArray.push(array[i].value);
				}
				_objArray = objArray;
			}
			return _objArray;
		};
		this.getObjectArray = getObjectArray;

		//■■■ rendering ■■■
		var _drawing = 0;
		var drawContext = function(ctx) {
			var time =  (new Date()).getTime();
			if( _drawing && _drawing + 1000 > time ){ return; }
			ctx.restore();
			ctx.save();
			_drawing = time;

			var array = getObjectArray();
			for( var i=array.length-1;i>=0;i-- ){
				var o = array[i];
				if( o && o.onRender ){ o.onRender(ctx); }
			}

			if( _setting.onRender ){
				_setting.onRender(ctx);
			}

			//draw
			_drawing = 0;
		};

		var doStartRender = function(){
			var canvas = document.getElementById(_setting.canvasId);
			if ( ! canvas || ! canvas.getContext  ) {
				return false;
			}
			var ctx = canvas.getContext('2d');
			ctx.save();
			var df = function(){ drawContext(ctx); };
			df();
			setInterval(df, Math.round(1000 / _fps));
		};

		//■■■ functions ■■■
		var movePage = function(nextUrl){
			var params = _setting.params;
			var baseUrl = _setting.baseUrl;
			var join = nextUrl.indexOf('?') >= 0 ? '&' : '?';
			var joinedUrl = nextUrl + join + params;
			var changedPath = baseUrl
			.replace("[path]", joinedUrl)
			.replace("%5Bpath%5D", encodeURIComponent(joinedUrl));
			document.location = changedPath;
		};
		this.movePage = movePage;

		var getMousePos = function(e){
			var elem = document.getElementById(_setting.canvasId);
			var cl = elem.offsetLeft;
			var ct = elem.offsetTop;
			while( elem.offsetParent ){
				elem = elem.offsetParent;
				cl += elem.offsetLeft;
				ct += elem.offsetTop;
			}
			var sc = 1;
			if( window.resizer ){
				sc = window.resizer.getScale();
			}
			if( e.originalEvent.touches ){
				var ep = e.originalEvent.touches[0];
				return { 'x' : Math.round(ep.pageX/sc - cl), 'y': Math.round(ep.pageY/sc - ct)};
			}
			return { 'x' : Math.round(e.pageX/sc - cl), 'y': Math.round(e.pageY/sc -ct)};
		};

		//■■■ Action Control ■■■
		var _updating = false;
		var _updateList = new Array();
		var doAction = function(actionList, index, nextUrl, sync){
			return function(){
				if( actionList != undefined && index < actionList.length ){
					var callback = doAction(actionList, index+1, nextUrl, sync);
					var chain = null;
					var action = actionList[index];
					if( action.chain ){
						chain = callback;
						callback = null;
					}
					if( _setting.onAction ){
						_setting.onAction(action, callback);
					}
					if( chain != null ){
						chain();
					}
					return;
				}
				if( nextUrl != undefined ){
					setTimeout(function(){ movePage(nextUrl); }, 100);
					return;
				}
				if( sync ){
					_updating = false;
				}
				updateExecute();
			};
		};
		var updateExecute = function(){
			if( _updateList.length > 0 && !_updating ){
				_updating = true;
				var resp = _updateList.shift();
				var lastVersion = resp['lastVersion'];
				var newVersion = resp['version'];
				if( lastVersion == newVersion ){ //何も発生していない
					doAction(resp['actionList'], 0, resp['nextUrl'], true)();
				}
				else if( lastVersion == _ver ){ //正しい処理
					_ver = newVersion;
					doAction(resp['actionList'], 0, resp['nextUrl'], true)();
				}
				else if( lastVersion > _ver ){ //処理が飛んだ
					movePage(_setting.reloadUrl);
				}
				else{
					doAction(null, 0, null, true)();
				}
				return;
			}
		};
		var initialize = function(resp){
			if( resp['version'] == undefined ){
				movePage(resp['nextUrl']);
			}
			if( _setting.onInit ){
				_setting.onInit(resp);
			}
			_ver = resp['version'];
			doAction(resp['actionList'], 0, resp['nextUrl'], true)();
		};
		var update = function(resp){
			if( _setting.onUpdate ){
				_setting.onUpdate(resp);
			}
			_updateList.push(resp);
			updateExecute();
		};
		var isUpdating = function(){
			return _updating;
		};
		this.isUpdating = isUpdating;

		//■■■ Connection control ■■■

		var isEnableAction = function(){
			return _conn && _conn.isConnecting() == false && isUpdating() == false;
		};
		this.isEnableAction = isEnableAction;
		this.isConnecting = function(){
			return _conn && _conn.isConnecting();
		};
		this.doSendAction = function(action){
			if( isEnableAction() ){
				_conn.doAction(_ver, action, update);
			}
		};
		this.start = function(){
			doStartRender();
			// 初期読み込みデータ
			if( _setting.initData != null ){
				initialize(_setting.initData);
			}
			// ない場合は取りに行く
			else if( _conn ){
				_conn.doInitialize(initialize);
			}
		};

		//■■■ Mouse control ■■■
		var _lastMousePos = null;
		var _lastDown = 0;
		var _lastUp = 0;
		var getMousePosObject = function(pos){
			var array = getObjectArray();
			for( var i=0;i<array.length;i++ ){
				var o = array[i];
				if( o && o.isOver && o.isOver(pos) ){
					return o;
				}
			}
			return null;
		};
		var onMousedown = function(e) {
			var time = (new Date()).getTime();
			if( time < _lastDown + 200 ){
				return true;
			}
			_lastDown = time;
			var pos = getMousePos(e);
			var obj = getMousePosObject(pos);
			_lastMousePos = pos;
			if( obj == null ){
				return true;
			}
			if( obj.onMousedown != null ){
				if( obj.left != null && obj.top != null ){
					return obj.onMousedown({ 'x' : pos.x - obj.left, 'y' : pos.y - obj.top });
				}
				return obj.onMousedown(pos);
			}
			return false;
		};
		var onMousemove = function(e) {
			var pos = getMousePos(e);
			var obj = getMousePosObject(pos);
			_lastMousePos = pos;
			if( obj == null ){
				return true;
			}
			if( obj.onMousemove != null ){
				if( obj.left != null && obj.top != null ){
					return obj.onMousemove({ 'x' : pos.x - obj.left, 'y' : pos.y - obj.top });
				}
				return obj.onMousemove(pos);
			}
			return true;
		};
		var onMouseup = function(e) {
			var time = (new Date()).getTime();
			if( time < _lastUp + 200 ){
				return true;
			}
			_lastUp = time;
			var pos = _lastMousePos;
			var obj = getMousePosObject(pos);
			if( obj == null ){
				return true;
			}
			if( obj.onMouseup != null ){
				if( obj.left != null && obj.top != null ){
					return obj.onMouseup({ 'x' : pos.x - obj.left, 'y' : pos.y - obj.top });
				}
				return obj.onMouseup(pos);
			}
			return false;
		};
		$('#' + _setting.canvasId)
		.on('touchstart', onMousedown)
		.on('touchmove', onMousemove)
		.on('touchend', onMouseup)
		.on('mousedown', onMousedown)
		.on('mousemove', onMousemove)
		.on('mouseup', onMouseup);
	};
	window.EcfwGameCanvas = EcfwGameCanvas;
});