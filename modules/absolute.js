var Handle = require("/modules/handlebars.js").Handlebars;
var mvc = (function () {
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
	
	function registerHelpers(){
		// Handlebars.registerHelper('include', function (contexts) {
		// 		Handle.compile('')
		// 		return new Handlebars.SafeString(html);
		// 	});
		// From Caramel core/caramel/scripts/caramel.handlebars.js
		// Handlebars.registerHelper('include', function (contexts) {
		// 		        var i, type,
		// 		            length = contexts ? contexts.length : 0,
		// 		            html = '';
		// 		        if (log.isDebugEnabled()) {
		// 		            log.debug('Including : ' + stringify(contexts));
		// 		        }
		// 		        if (length == 0) {
		// 		            return html;
		// 		        }
		// 		        type = typeof contexts;
		// 		        if (contexts instanceof Array) {
		// 		            for (i = 0; i < length; i++) {
		// 		                html += renderData(contexts[i]);
		// 		            }
		// 		        } else if (contexts instanceof String || type === 'string' ||
		// 		            contexts instanceof Number || type === 'number' ||
		// 		            contexts instanceof Boolean || type === 'boolean') {
		// 		            html = contexts.toString();
		// 		        } else {
		// 		            html = renderData(contexts);
		// 		        }
		// 		        return new Handlebars.SafeString(html);
		// 		 });
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
			//Ignore the specified URIs
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
			log.info("View "+ view);
			
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
			if(isExists('/controller/'+controller+".js") && require('/controller/'+controller+".js")[viewName] !=undefined){
				context = require('/controller/'+controller+".js")[viewName](appController);
				log.info("Current context "+context);
			}		
			//Extracting the layout from the controller
			var layout;
			if(context!=undefined && context.layout!=undefined){
				layout = Handle.compile(getResource("/pages/"+context.layout+".hbs"));
			}
			//If we can't find a controller as well as a view we are sending a 404 error
			if(template==undefined && context==undefined){
				response.sendError(404);
			}else{
				var b = template(context);
				if(layout==undefined){
					//If the controller hasn't specified a layout
					print(b);
				}else{
					print(layout({body:b, partials: context.partials}));
				}
			}
        }
    };
// return module
    return module;
})();