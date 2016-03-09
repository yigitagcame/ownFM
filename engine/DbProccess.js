var DbProccess = {}
var mongoose = require('mongoose');
var Firebase = require("firebase");
// MongoDB Connection
mongoose.connect('mongodb://localhost/ownfm');

// MongoDB Schema
var users = mongoose.Schema({
	hashtag: String,
	uid: String,
	spotifyAccess: String,
	spotifyRefresh: String,
	twitterAccess: String,
	twitterSecret: String,
	username: String,
	playlist: String
});


// MongoDB Model
users = mongoose.model('user', users, 'users');

DbProccess.controlTokens = function(uid,callback){


	users.findOne({ uid:uid }, function(err,obj) {
		return callback(obj);
	});


};


DbProccess.addStoken = function(uid,access,refresh){

users.update({uid: uid}, {
    spotifyAccess: access,
    spotifyRefresh: refresh
}, function(err, numberAffected, rawResponse) {
   if(err){
   	return false;
   }else{
   	return true;
   }
})
			 

};

DbProccess.addTtoken = function(uid,access,secret){

		users.update({uid: uid}, {
	    twitterAccess: access,
	    twitterSecret: secret
			}, function(err, numberAffected, rawResponse) {
			   if(err){
			   	return false;
			   }else{
			   	return true;
			   }
			})

			 
};


DbProccess.getHashtags = function(callback){

	var hashtags = '';

	hashtags.find({}, function(err,obj) {

		obj.forEach(function(user){
			hashtags = hashtags.concat('#'+user.hashtag);
		});


		return callback(hashtags);

	});


};



DbProccess.addSpotifyInf = function(uid,username,playlist){

		users.update({uid: uid}, {
	    username: username,
	    playlist: playlist
			}, function(err, numberAffected, rawResponse) {
			   if(err){
			   	return false;
			   }else{
			   	return true;
			   }
			})


}

DbProccess.musicAdd = function(auth,track,key,callback){

var	authData = JSON.parse(auth);

var SpotifyWebApi = require('spotify-web-api-node');
	// Spotify Settings

var client_id = '661ffa9bad3c4916a8ba16633ef99765'; // Your client id
var client_secret = '74e36ce25d944d0696dbab268b71fc50'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri


// Spotify Api Connection
var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
  redirectUri : redirect_uri
});



DbProccess.controlTokens(authData.uid,function(placeInf){


	spotifyApi.setAccessToken(placeInf.spotifyAccess);

	spotifyApi.addToMySavedTracks([track])
  .then(function(data) {
    console.log('Added track!');

	var ref = new Firebase("https://burning-torch-3334.firebaseio.com/");
      ref.authWithCustomToken(authData.token, function(error, authData) {

	    var fredRef = new Firebase('https://burning-torch-3334.firebaseio.com/tweets/'+authData.uid+'/'+key);
		fredRef.remove();

	ref.unauth();
      });



    return callback('ok')
  }, function(err) {
  	console.log(err);
    callback('hata');
  });


});


}




module.exports = DbProccess;