var Handle = require("/modules/handlebars.js").Handlebars;
var mvc = (function () {
	var configs= {
		SERVER_URL: "/",
		ENGINE: "hbs"
	};
	var log;
	var module = function (cf) {
		mergeRecursive(configs,cf);
		log= new Log();
		registerPartials();
    };
	function mergeRecursive(obj1, obj2) {
	  for (var p in obj2) {
	    try {
	      // Property in destination object set; update its value.
	      if ( obj2[p].constructor==Object ) {
	        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
	      } else {
	        obj1[p] = obj2[p];
	      }
	    } catch(e) {
	      // Property in destination object not set; create it and set its value.
	      obj1[p] = obj2[p];
	    }
	  }
	  return obj1;
	}
	function getResource(name){
		var f = new File(name);
		f.open("r");
		var cont = f.readAll();
		f.close();
		return cont;
	}
	
	function isExists(filename){
		var f = new File(filename);
		return f.isExists();
	}
	function isBinaryResource(mime){
		switch (mime) {
	        case 'image/png':
	            return true;
	        case 'image/gif':
	            return true;
	        case 'image/jpeg':
	            return true;
	        case 'image/jpg':
	            return true;
			case 'application/vnd.android.package-archive':
				return true;
			case 'application/octet-stream':
				return true;
	    }
	}
	function routeAsset(resourceURL){
		//log.info("Resource URL"+resourceURL);
		var m = mime(resourceURL);
		response.addHeader('Content-Type', m);
		if(isBinaryResource(m)){
			var f = new File(resourceURL);
			f.open('r');
		    print(f.getStream());
			f.close();
		}else{
			print(getResource(resourceURL));
		}
	}
	//Register all the partials in the views/partial directory
	function registerPartials(){
		var f = new File("/views/partials");
		var partials = f.listFiles();
		for (var i=0; i<partials.length; i++){
			var partial = partials[i];
			partial.open('r');
			Handle.registerPartial(partial.getName().split('.')[0], partial.readAll());
			log.debug("Handle registered template -"+partial.getName().split('.')[0]);
			partial.close();
		}
	}
	
	//If the path has a . return true
	function isAsset(path){
		return path.indexOf(".")!=-1
	}
	function mime(path){
		var index = path.lastIndexOf('.');
	    var ext = index < path.length ? path.substring(index + 1) : '';
	    switch (ext) {
	        case 'js':
	            return 'application/javascript';
	        case 'css':
	            return 'text/css';
	        case 'html':
	            return 'text/html';
	        case 'png':
	            return 'image/png';
	        case 'gif':
	            return 'image/gif';
	        case 'jpeg':
	            return 'image/jpeg';
	        case 'jpg':
	            return 'image/jpg';
	        case 'apk':
	            return 'application/vnd.android.package-archive';
			case 'ipa':
				return 'application/octet-stream';
			case 'plist':
				return 'text/xml';
			case 'woff':
	            return 'application/octet-stream';    
	        case 'ttf':
	            return 'application/octet-stream'; 
			default:
				return 'text/plain';
	    }
	}
	//Call
	function callAPI(request){
		log.debug("Router process ");
		configs.ROUTER.process(request);
	}
	//Check if API route is provided and 
	//if the current call is for the API
	function isAPI(pageParams){
		if(configs.API==undefined){
			return false;
		}
		log.debug("K "+pageParams[0]);
		return pageParams[0]== configs.API;
	}
	
	function isArrayOverlap(array1, array2){
		for (var i = array1.length - 1; i >= 0; i--){
			var array1Element = array1[i];
			for (var j = array2.length - 1; j >= 0; j--){
				var array2Element = array2[j];
				if(array1Element==array2Element){
					return true;
				}
			};
		};
		return false;
	}
	
	// prototype
    module.prototype = {
        constructor: module,
        route: function (req) {
			var reqURL = req.getRequestURI();
			var pageURL = reqURL.replace(configs.SERVER_URL, '');
			//Ignore the specified URIs
			for (var i=0; i < configs.IGNORE.length; i++) {
				if(pageURL==configs.IGNORE[i]){
					include(pageURL);
					return;
				} 
			};
			
			log.debug("Request url: "+reqURL);
			log.debug("Page url: "+pageURL);
			
			var pageParams = pageURL.split('/');
			
			if(isAPI(pageParams)){
				callAPI(req);
				return;
			}
			//Send the last part of the uri 
			//Routing assets
			if(isAsset(pageParams[pageParams.length-1])){
				routeAsset(pageURL);
				return;
			}
			
			var controller = pageParams[0];
			var view = "index";
			if(pageParams.length>1 && pageParams[1]!=''){
				view = pageParams[1];	
			}
			var viewName = view;
			view = view+"."+configs.ENGINE;
			log.debug("View "+ view);
			
			//App controller
			var appController;
			if(isExists('/controller/app.js')){
				appController =require('/controller/app.js');
			}
			
			//Extracting the template from the view
			var template;
			var templateURI = '/views/'+controller+"/"+view;
			if(isExists(templateURI)){
				template = Handle.compile(getResource(templateURI));
			}
			
			var context;
			//If controller is empty the request is for the app index page
			if(controller==''){
				if(appController.index!=undefined){
					context = appController.index();	
				}
			}
			if(isExists('/controller/'+controller+".js") && require('/controller/'+controller+".js")[viewName] !=undefined){
				context = require('/controller/'+controller+".js")[viewName](appController);
				log.debug("Current context "+context);
			}		
			//Extracting the layout from the controller
			var layout;
			if(context!=undefined && context.layout!=undefined){
				if(configs.AUTH_SUPPORT){
					if(context.auth_roles!=undefined && context.auth_roles.length>0){
						var authState = isArrayOverlap(configs.AUTH_USER_ROLES, context.auth_roles);
						if(!authState){
							 log.debug("--------Goose Auth Error (User roles doesn't match with route roles)--------");
							 response.sendError(403);
							 return;
						}
					}
				}
				layout = Handle.compile(getResource("/pages/"+context.layout+".hbs"));
			}
			//If we can't find a controller as well as a view we are sending a 404 error
			if(template==undefined && context==undefined){
				try{
					response.sendError(404);
				}catch (e) {
					new Log().debug(e);
				}
			}else{
				if(template!=undefined){
						var b = template(context);
						if(layout==undefined){
							//If the controller hasn't specified a layout
							print(b);
						}else{
							//Now mixing the controller context with generated body template
							print(layout(mergeRecursive({body:b}, context)));
						}
				}
			}
        },
		registerHelper: function(helperName, helperFunction){
			Handle.registerHelper(helperName, helperFunction);
		},
		registerPartial: function(partialName, partial){
			Handle.registerPartial(partialName,partial);
		},
		compileTemplate: function(templatePath, context){
			var template = Handle.compile(getResource(templatePath));
			return template(context);
		}
    };
// return module
    return module;
})();