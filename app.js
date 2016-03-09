/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var Firebase = require("firebase");
var ref = new Firebase("https://burning-torch-3334.firebaseio.com/");
var bodyParser = require('body-parser');
var DbProccess = require('./engine/DbProccess');
var twitterAPI = require('node-twitter-api');
var cron = require('cron');


var client_id = '661ffa9bad3c4916a8ba16633ef99765'; // Your client id
var client_secret = '74e36ce25d944d0696dbab268b71fc50'; // Your client secret
var redirect_uri = 'http://ownfm.com/callback'; // Your redirect uri

var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
  redirectUri : redirect_uri
});



var twitter = new twitterAPI({
    consumerKey: 'xz82HwoWEILklOXFYmKUeHJum',
    consumerSecret: 'm3f1wBR8NwIkrH1jzMwwn59baJw0Z6K8o6kN65kD56hEyOCr1b',
    callback: 'http://ownfm.com/twitter/callback'
});



requests = {}

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */




var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
app.use(cookieParser());
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/spotifyLogin', function(req, res) {

    var authData = ref.getAuth();
if (authData) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'playlist-modify-private playlist-modify-public user-read-email user-library-read user-library-modify';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
}else{

  res.redirect('/login');


}


});

app.get('/callback', function(req, res) {
  
  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
            refresh_token = body.refresh_token;


          DbProccess.addStoken(ref.getAuth().uid,access_token,refresh_token);

spotifyApi.setAccessToken(access_token);
spotifyApi.getMe()
  .then(function(data) {
    console.log('Username: ', data.body.id);

        // Create a private playlist
    spotifyApi.createPlaylist(data.body.id, 'ownFM', { 'public' : true })
      .then(function(data2) {
        console.log('Created playlist!');
          
          DbProccess.addSpotifyInf(ref.getAuth().uid,data.body.id,data2.body.id);

          res.redirect('/dashboard');

      });
  
  });


            //res.redirect('/');

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  
  } else {
    res.redirect('/login');
  }

});


app.get('/',function(req,res){

  res.render('base.ejs');

});

app.get('/dashboard',function(req,res){

  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

console.log(authData);

 DbProccess.controlTokens(authData.uid,function(obj){

  if(obj == null){
    res.send('Hesabınız henüz aktiflesmemis, lutfen yonetici ile iletisime gecin, yönlendiriliyorsunuz');
  }else{

    if(obj.spotifyAccess){
      var spotifyAccess = obj.spotifyAccess;
    }else{
      var spotifyAccess  = null;
    }


    if(obj.twitterAccess){
      var twitterAccess = obj.twitterAccess;
    }else{
      var twitterAccess  = null;
    }


    res.render('dashboard.ejs',{ authData: authData, spotifyToken: spotifyAccess, twitterToken: twitterAccess });
 
  }

});

} else {
  res.redirect('/login');
}


});

app.get('/offer/add',function(req,res){
  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

  uid = req.param("uid");
  track = req.param("track");
  key = req.param("key");

  DbProccess.musicAdd(req.cookies.authData,track,key,function(d){
    if(d == 'hata'){
      res.redirect('/spotifyLogin');
    }else{
      res.redirect('/dashboard');
    }
  });


  } else {
  res.redirect('/login');
}


});


app.get('/offer/delete',function(req,res){

  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

  uid = req.param("uid");
  track = req.param("track");
  key = req.param("key");

  ref.authWithCustomToken(authData.token, function(error, authData) {

var fredRef = new Firebase('https://burning-torch-3334.firebaseio.com/tweets/'+uid+'/'+key);
fredRef.remove();
ref.unauth();
  });



  res.redirect('/dashboard');

  } else {
  res.redirect('/login');
}


});

app.get('/login',function(req,res){
  
  res.render('login.ejs');

});

app.post('/login',function(req,res){


  var email = req.body.email;
  var password = req.body.password;


  ref.authWithPassword({
    email    : email,
    password : password
  }, function(error, authData) {

    if (error) {
      res.redirect('/login');
    } else {

    res.cookie('authData', JSON.stringify(authData));

      res.redirect('/dashboard');
  }  
  });


});


app.get('/twitterLogin', function (req, res) {
  
  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

  twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
      if (error) {
          console.log("Error getting OAuth request token : " + error);
      } else {
        requests.token = requestToken;
        requests.secret = requestTokenSecret;
         res.redirect(twitter.getAuthUrl(requestToken));
      }
  });
  } else {
    res.redirect('/login');
  }
});

app.get('/twitter/callback', function (req, res) {
  if(req.cookies.authData){

  authData = JSON.parse(req.cookies.authData);

    oauth_verifier = req.param('oauth_verifier');
    requestToken = requests.token;
    requestTokenSecret = requests.secret;

    console.log(oauth_verifier);
    console.log(requests.token);
    
    twitter.getAccessToken(requestToken, requestTokenSecret, oauth_verifier, function(error, accessToken, accessTokenSecret, results) {
      if (error) {
          console.log(error);
      } else {
              DbProccess.addTtoken(ref.getAuth().uid,accessToken,accessTokenSecret);
              res.redirect('/dashboard');
      }
  });
} else {
  res.redirect('/login');
}
});

app.get('/logout', function (req,res){

res.clearCookie('authData');
res.redirect('/');

});

console.log('Listening on 8888');
app.listen(80);
