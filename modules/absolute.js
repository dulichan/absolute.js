var Handle = require("handlebars").Handlebars;
var absolute = (function () {
	var configs= {
		SERVER_URL: "/",
		ENGINE: "hbs"
	};;
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
	
	function routeAsset(resourceURL){
		//log.info("Resource URL"+resourceURL);
		response.addHeader('Content-Type', mime(resourceURL));
		print(getResource(resourceURL));
	}
	//Register all the partials in the views/partial directory
	function registerPartials(){
		var f = new File("/views/partials");
		var partials = f.listFiles();
		for (var i=0; i<partials.length; i++){
			var partial = partials[i];
			partial.open('r');
			Handle.registerPartial(partial.getName().split('.')[0], partial.readAll());
			log.info("Handle registered template -"+partial.getName().split('.')[0]);
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
	        default :
	            return 'text/plain';
	    }
	}
	// prototype
    module.prototype = {
        constructor: module,
        route: function (req) {
			var reqURL = req.getRequestURI();
			var pageURL = reqURL.replace(configs.SERVER_URL, '');
			for (var i=0; i < configs.IGNORE.length; i++) {
				if(pageURL==configs.IGNORE[i]){
					include(pageURL);
					return;
				} 
			};
			log.info("Request url: "+reqURL);
			log.info("Page url: "+pageURL);
			var pageParams = pageURL.split('/');
			//Send the last part of the uri 
			if(isAsset(pageParams[pageParams.length-1])){
				routeAsset(pageURL);
				return;
			}
			var controller = pageParams[0];
			var view = "index";
			if(pageParams.length>1 && pageParams[1]!=''){
				view = pageParams[1];	
			}
			var appController;
			if(isExists('/controller/app.js')){
				appController =require('/controller/app.js');
			}
			var context = require('/controller/'+controller+".js")[view](appController);
			view = view+"."+configs.ENGINE;
			
			log.info("View "+ view);
			log.info('/views/'+controller+"/"+view);
			log.info(Handle.partials);
			var template = Handle.compile(getResource('/views/'+controller+"/"+view));
			var b = template(context);
			var layout = Handle.compile(getResource("/pages/"+context.layout+".hbs"));
			print(layout({body:b, partials:context.partials}));
        }
    };
// return module
    return module;
})();