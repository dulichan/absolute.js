absolute.js
===========

> Simple MVC framework created for [JaggeryJS](https://github.com/wso2/jaggery).

The objective of absolute.js is to handle front-end development work with simplicity and conventions inside jaggeryJS. So let's get to the facts quick.

### Simple Configuration
First we have to redirect all the requests from jaggery configuration file to a jag file.
``` javascript jaggery.conf
{
    "welcomeFiles": ["index.jag"],
    "urlMappings": [
        {
            "url": "/*",
            "path": "/index.jag"
        }
    ],
    "logLevel": "info"
}
```

Inside the index.jag file we will setup absolute.js and give a configuration. Also note that defaults are handled inside absolute.js. 

``` javascript index.jag
<%
var mvc = require ('absolute.js').mvc;
var mvcp = new mvc({
	SERVER_URL:"/publisher/"
});
mvcp.route(request);
%>
```

Now absolute.js is ready for request processing. 

### Conventions
First we have to look into the folder layout -

{% img /images/filestructure.png %}

The concept of mvc is simple. We have a model, a view and a controller. In our example app we haven't followed a model approach to data (Note: This is also very simple since JSON and database library bridge exists in jaggery).

#### A Request procedure 
The request comes to the absolute.js module. If the requst URI is - '/publisher/console/list' 

	*	'/publisher' is the context of the app
	*	'/console' is the controller 
	*	'/list' is the view 

Controllers are contained in the controller folder of the context application. The controller is created with the same name. Inside the controller it will have a function named after the view. absolute.js will execute this function and the return json object will be provided to the template engine.

``` javascript console.js
list = function(){
	return {name:"Chan", quote:"I was a king I had a gold throne"};
}
manager = function(){
	//response.sendRedirect('/publisher/console/list');
	return {name:"Chan", quote:"I was a king I had a gold throne"};
}
upload = function(){
	return {name:"Chan", quote:"I was a king I had a gold throne"};
}
```

I am currently working on the layout and partials handling inside absolute.js. 


Note:- Initial credit of the idea of building a simple mvc framework for jaggery goes to  [Dilan](https://twitter.com/chatu_dil "Dilan")