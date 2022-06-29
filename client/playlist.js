'use strict';

var Playlist = {
  getMedias: function() {
    var url = new URL('https://api.wistia.com/v1/medias.json');
    url.searchParams.set('api_password', TOKEN);
    return axios.get(String(url));
  },

  renderMedia: function(media) {
    var template = document.getElementById('media-template');
    var clone = template.content.cloneNode(true);
    var el = clone.children[0];

    el.querySelector('.thumbnail-content').setAttribute('src', media.thumbnail.url);
    el.querySelector('.title').innerText = media.name;
    el.querySelector('.duration').innerText = Utils.formatTime(media.duration);
    el.querySelector('.media-content').setAttribute(
      'href',
      '#wistia_' + media.hashed_id
    );

    document.getElementById('medias').appendChild(el);
  }
};

var VideoPlayer = {
  render: function(media) {
    document
      .querySelector('.wistia_embed')
      .classList.add('wistia_async_' + media.hashed_id);

    document
      .querySelector('.video-title')
      .innerText = media.name;
  }
};

(function() {
  document.addEventListener(
    'DOMContentLoaded',
    function() {
      Playlist.getMedias().then(function(response) {
        var medias = response.data;
        if (!medias) {
          return;
        }

        VideoPlayer.render(medias[0]);

        medias.forEach(function(media) {
          Playlist.renderMedia(media);
        });
      });
    },
    false
  );
})();
