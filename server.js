var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = "097be9424127468fb2b74a74272607a5"; // Your client id
var client_secret = "e96a0c40468b46b5b84e1b1bc9a97cee"; // Your secret
var redirect_uri = "http://localhost:8888/callback"; // Your redirect uri

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

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
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

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);

// Buscador
      var templateSource = document.getElementById('resultados-template').innerHTML,
          template = Handlebars.compile(templateSource),
          resultadosPlaceholder = document.getElementById('resultados'),
          playingCssClass = 'playing',
          audioObject = null;
      var fetchTracks = function (albumId, callback) {
          $.ajax({
              url: 'https://api.spotify.com/v1/albums/' + albumId,
              success: function (response) {
                  callback(response);
              }
          });
      };
      var searchAlbums = function (query) {
          $.ajax({
              url: 'https://api.spotify.com/v1/search',
              data: {
                  q: query,
                  type: 'album'
              },
              success: function (response) {
                  resultadosPlaceholder.innerHTML = template(response);
              }
          });
      };
      resultados.addEventListener('click', function (e) {
          var target = e.target;
          if (target !== null && target.classList.contains('cover')) {
              if (target.classList.contains(playingCssClass)) {
                  audioObject.pause();
              } else {
                  if (audioObject) {
                      audioObject.pause();
                  }
                  fetchTracks(target.getAttribute('data-album-id'), function (data) {
                      audioObject = new Audio(data.tracks.items[0].preview_url);
                      audioObject.play();
                      target.classList.add(playingCssClass);
                      audioObject.addEventListener('ended', function () {
                          target.classList.remove(playingCssClass);
                      });
                      audioObject.addEventListener('pause', function () {
                          target.classList.remove(playingCssClass);
                      });
                  });
              }
          }
      });
      document.getElementById('search-form').addEventListener('submit', function (e) {
          e.preventDefault();
          searchAlbums(document.getElementById('query').value);
      }, false);
      // Ocultamos nuestro acces token por seguridad
      if(typeof window.history.pushState == 'function') {
          window.history.pushState({}, "Hide", "http://localhost:8888/callback/");
      }