var runTweet = {}
var request = require('request');


// fetch URL

runTweet.track = function (tweet,callback){

	var urls = this.urls(tweet);

	urls.forEach(function(url){
		runTweet.getTrack(url,function(re){
			if(re){
				return callback(re);
			}
		});

	});

	return null;
}

// fetch Hastags

runTweet.hashtags = function(tweet){

	var hashtags = tweet.entities.hashtags;
	var array = [];

	for(i=0; Object.keys(hashtags).length >i; i++){
		array.push(hashtags[i].text);
	}

return array;

}

runTweet.urls = function(tweet){

	var urls = tweet.entities.urls;
	var array = [];
	
	for(i=0; Object.keys(urls).length >i; i++){
		array.push(urls[i].expanded_url);
	}

	return array; 

}

runTweet.getTrack = function(url,callback){

  	var r = request.get(url, function (err, res, body) {
		var str = res.request.uri.href;
		var id = str.split("/");
		var track = id[4];

		if(track){
			return callback(track);
		}else{
			return callback(null);
		}

	});

}


module.exports = runTweet;