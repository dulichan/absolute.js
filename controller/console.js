index = function(appController){
	return {
		layout:'1-column',
		auth_roles: ['everyone'],
		title:'Absolute.js - MVC on Steroids',
		partials:{
			header:appController.navigation()
		},
		data:{
			quote:"Millions of Expressions"
		}
	};
}