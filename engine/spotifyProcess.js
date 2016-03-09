var SpotifyProcess = {}
var mongoose = require('mongoose');
var SpotifyWebApi = require('spotify-web-api-node');
var request = require('request');
var Firebase = require("firebase");
var myFirebaseRef = new Firebase("https://burning-torch-3334.firebaseio.com/");

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

// MongoDB Schema
var tracks = mongoose.Schema({
    track: String,
    livePlaylist: String,
    userId:String,
    date: String
});

// MongoDB Schema
var requests = mongoose.Schema({
    tweetId: String,
    userId: String,
    playlist: String,
    status: String,
    date: String
});
// MongoDB Model
 users = mongoose.model('user', users, 'users');

// MongoDB Model
 tracks = mongoose.model('track', tracks, 'tracks');

// MongoDB Model
 requests = mongoose.model('request', requests, 'requests');


SpotifyProcess.deletePlaylists = function(){

    users.find({}, function(err,obj) {
     
     obj.forEach(function(placeInf){

     	SpotifyProcess.getAccessToken(placeInf,function(){

     		spotifyApi.getPlaylist(placeInf.username, placeInf.playlist)
			  .then(function(data) {
			    console.log('Some information about this playlist2', data.body.tracks.total);

			    for(i = 0 ; i < data.body.tracks.total; i++ ){

			    spotifyApi.removeTracksFromPlaylistByPosition(placeInf.username, placeInf.playlist, [i],data.body.snapshot_id)
				  .then(function(data) {
				    console.log('Tracks removed from playlist!');
				  }, function(err) {
				    console.log('Something went wrong!', err);
				  });

			    }


			  }, function(err) {
			    console.log('Something went wrong!', err);
			  });



     	})


     });	

    });



}


SpotifyProcess.addTrack = function(track,mention,tweetId,userId,placeInf,callback){

	SpotifyProcess.getAccessToken(placeInf,function(){


		SpotifyProcess.addTrackdb(tweetId,track,placeInf.playlist,userId,SpotifyProcess.runDate(),function(res){

		if(res == 'Eklendi'){

			console.log(placeInf.username);
			console.log(placeInf.playlist);

		 spotifyApi.addTracksToPlaylist(placeInf.username, placeInf.playlist, ['spotify:track:'+track] ).then(function(data) {
		    callback('Added tracks to the playlist!');
		  }).catch(function(err) {

		    	return callback('Something went wrong!' + err.message);
		   
		  });


		}else if(res == 'reToken'){

			SpotifyProcess.tokenUpdate(placeInf.spotifyRefresh,placeInf.username,function(res){
				console.log(res);
				return callback(res);
			});
		

		}else if(res == 'Listede yok'){

			SpotifyProcess.addRequest(tweetId,userId,placeInf,track,res,function(res){

				console.log(res);

			});


			return callback(res);


		} else{
			return callback(res);
		}


	});




	});

	

}

SpotifyProcess.getAccessToken = function(placeInf,callback){

spotifyApi.setRefreshToken(placeInf.spotifyRefresh);
spotifyApi.refreshAccessToken()
  .then(function(data) {

  	spotifyApi.setAccessToken(data.body.access_token);
	
	users.update({ username: placeInf.username }, { $set: { spotifyAccess: data.body.access_token }}, function(){

		return callback(true);

	});

  }, function(err) {
    console.log('Could not refresh access token', err);
  });

}


SpotifyProcess.addTrackdb = function(tweetId,track,playlist,userId,date,callback) {

		
	SpotifyProcess.isAvabile(track,function(res){


		if(res == 'Mumkun'){

			tracks.findOne({ $or:[
			{track : track, livePlaylist : playlist},
			{livePlaylist : playlist, userId:userId,date:date}
			 ]}, function(err,obj) {
			     
			      if(obj){
			        return callback('Mevcut');
			      }else{
			   var addTrack = new tracks({
					track : track,
					livePlaylist : playlist,
					userId:userId,
					date : SpotifyProcess.runDate()
					});
			 
					addTrack.save(function (err, data) {

						if (err){ 
							return callback(err);
						}
						else{ 
							return callback('Eklendi');
						}

					});

			      }

			    });




		}else{
			return callback(res);
		}
		
	});

}


// Hastag Informations
SpotifyProcess.getInf = function(hashtag,callback){

  hashtag.forEach(function(hashtag){

    users.findOne({hashtag : hashtag.trim('#')}, function(err,obj) {
     
      if(obj){
        return callback(obj);
      }

    });

  });

  return null;

};

SpotifyProcess.isAvabile = function(track,callback){

spotifyApi.containsMySavedTracks([track])
  .then(function(data) {

    var trackIsInYourMusic = data.body[0];

	    if (trackIsInYourMusic) {
	      callback('Mumkun')
	    }else{
	    	callback('Listede yok');
	    }
    
  },function(err) {
  	if(err == 'WebapiError: The access token expired'){

  		return callback('reToken');
  	}else{

    	return callback('Something went wrong!'+ err);
  	}
  });

}

SpotifyProcess.runDate = function(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
	    dd='0'+dd
	} 

	if(mm<10) {
	    mm='0'+mm
	} 

	today = mm+'/'+dd+'/'+yyyy;
	return today;
}

  SpotifyProcess.tokenUpdate = function(token,username,callback){

    var client_id = '661ffa9bad3c4916a8ba16633ef99765'; // Your client id
	var client_secret = '74e36ce25d944d0696dbab268b71fc50'; // Your client secret
        var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        refresh_token: token,
        grant_type: 'refresh_token'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token

            users.update({ username: username }, { $set: { spotifyAccess: access_token }}, function(){

            	return callback('updatedToken');

            });


      } else {
        return callback('Token Hata');
      }
    });

  };

 SpotifyProcess.addRequest = function(tweetId,userId,placeInf,track,status,callback){

myFirebaseRef.authWithCustomToken("FU14HpeLZvfqWnYCaqiZgeV4erG2qI4ffw79XxRP", function(error, authData) { 

});
var nowStatus;
if(status == 'Listede yok'){
  nowStatus = 0;
}else{
  nowStatus = 1;
}

myFirebaseRef.child('tweets').child(placeInf.uid).push({ 
	      tweetId : tweetId,
          playlist : placeInf.playlist,
          track: track,
          status : status,
          date : SpotifyProcess.runDate()
});

return callback('firebase Eklendi');




};


module.exports = SpotifyProcess;