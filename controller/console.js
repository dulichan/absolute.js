list = function(appController){
	return {
		layout:'1-column',
		title:'Your Apps',
		partials:{
			header:appController.navigation()
		},
		data:{
			name:"Chan",
			quote:"I was a king I had a gold throne",
			apps:[
				{name:"Bookhub",status:"Published"}
			]
		}
	};
}
manager = function(){
	//response.sendRedirect('/publisher/console/list');
	return {name:"Chan", quote:"I was a king I had a gold throne"};
}
upload = function(){
	return {name:"Chan", quote:"I was a king I had a gold throne"};
}