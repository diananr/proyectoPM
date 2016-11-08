(function() {

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile');

  var oauthSource = document.getElementById('oauth-template').innerHTML,
      oauthTemplate = Handlebars.compile(oauthSource),
      oauthPlaceholder = document.getElementById('oauth');

  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
      });

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);

            $("#login").hide();
            $(".loggedin").show();
          }
      });
    } else {
        // render initial screen
        $("#login").show();
        $(".loggedin").hide();
    }
/*
    document.getElementById('obtain-new-token').addEventListener('click', function() {
      $.ajax({
        url: '/refresh_token',
        data: {
          'refresh_token': refresh_token
        }
      }).done(function(data) {
        access_token = data.access_token;
        oauthPlaceholder.innerHTML = oauthTemplate({
          access_token: access_token,
          refresh_token: refresh_token
        });
      });
    }, false);*/
  }
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
          console.log("searchAlbums");
          console.log(response);
            var cantidadMostrados = response.albums.items.length;
            var cantidadTotal = response.albums.total;
            $("#parrafo").text("Mostrando " + cantidadMostrados + " de un total " + cantidadTotal);
            resultadosPlaceholder.innerHTML = template(response);
        }
    });
  };
  resultados.addEventListener('click', function (e) {
    console.log("resultadosclick");
          console.log(e);
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
})();

function buscarLetra(){
  console.log("texto");
  $.ajax({
    type: "GET",
    dataType: "jsonp",
    data: {
      apikey: "af357840f7555def09db452b7c8b0865",
      format: "jsonp",
      q_track: "back to december",
      q_artist: "taylor swift"
    },
    url: "http://api.musixmatch.com/ws/1.1/track.search",
    success: function(response){
      console.log(response);
    },
    error: function(error) {
      console.log(error);
    }
  });
}
