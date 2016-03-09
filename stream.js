// Required packages
var Twit = require('twit');
var runTweet = require('./engine/runTweet');
var SpotifyProcess = require('./engine/spotifyProcess');

// Twitter api settings
var T = new Twit({
    consumer_key:         'xz82HwoWEILklOXFYmKUeHJum'
  , consumer_secret:      'm3f1wBR8NwIkrH1jzMwwn59baJw0Z6K8o6kN65kD56hEyOCr1b'
  , access_token:         '4156557209-EL5AqWX2zXmUAwTffiAcDxUP2juJfQh0aieRw2W'
  , access_token_secret:  'iwkepArgc6tj394lpXZTeklvGOXw7zuW1bIpHZ8yYRmjw'
});


// Twitter Stream


  var stream = T.stream('statuses/filter', { track: "#ownfm, #ikinciyenikafe" })


	stream.on('tweet', function (tweet) {

    console.log(tweet);

    runTweet.track(tweet,function(track){

      var userId = tweet.user.id_str;
      var tweetId = tweet.id_str;
      var track = track;
      var hashtags = runTweet.hashtags(tweet);
      var mention = tweet.user.screen_name;

      // Hashtag Sahibinin bilgileri

      SpotifyProcess.getInf(hashtags,function(res){
        var placeInf = res;

        SpotifyProcess.addTrack(track,mention,tweetId,userId,placeInf,function(res){


       if(res == 'updatedToken'){
                SpotifyProcess.addTrack(track,res.livePlaylist,res.username,userId,res.playlist,res.token,res.refreshToken,function(res){
                  console.log(res);
                });
                
          }else if( res == 'Added tracks to the playlist!'){

            postTweet(tweetId,mention,placeInf,' Şarkını listeye ekledik, birazdan çalarız!',function(res){

              console.log(res);

            });



          }else if(res == 'Listede yok'){

            postTweet(tweetId,mention,placeInf,' Bu nemiş böyle, bilmiyorduk bunu. Biz bi dinleyelim, eklicez listeye!',function(res){

              console.log(res);

            });



          }else if( res == 'Mevcut'){

            postTweet(tweetId,mention,placeInf,' Sen ya da başkası önermiş, bu mekan için yeter artık, kardeşler de istek yapsın!',function(res){

              console.log(res);

            });



          }else{
            console.log(res);
          }




        });



      });



  });

});


function postTweet(tweetId,mention,placeInf,tweet,callback){
  // Twitter api settings
var T = new Twit({
    consumer_key:         'xz82HwoWEILklOXFYmKUeHJum'
  , consumer_secret:      'm3f1wBR8NwIkrH1jzMwwn59baJw0Z6K8o6kN65kD56hEyOCr1b'
  , access_token:         placeInf.twitterAccess
  , access_token_secret:  placeInf.twitterSecret
});

  T.post('statuses/update', { status: '@'+mention+' '+tweet, in_reply_to_status_id: tweetId }, function(err, data, response) {
  callback(tweetId);
});



}

var CronJob = require('cron').CronJob;
var job = new CronJob({
  cronTime: '00 00 01 * * *',
  onTick: function() {

  return SpotifyProcess.deletePlaylists();
     
  }
});
job.start();














