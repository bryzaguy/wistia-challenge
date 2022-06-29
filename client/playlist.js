'use strict';

var Playlist = {
  getMedias: function() {
    var url = new URL('https://api.wistia.com/v1/medias.json');
    url.searchParams.set('api_password', TOKEN);
    return axios.get(String(url));
  },

  getMediaNode: function(hashedId) {
    return document.getElementById(hashedId);
  },

  hasPlayed: function(hashedId) {
    return this.getMediaNode(hashedId).getAttribute('data-played');
  },

  renderMedia: function(media) {
    var template = document.getElementById('media-template');
    var clone = template.content.cloneNode(true);
    var el = clone.children[0];

    el.setAttribute('id', media.hashed_id);
    el.querySelector('.thumbnail-content').setAttribute('src', media.thumbnail.url);
    el.querySelector('.title').innerText = media.name;
    el.querySelector('.duration').innerText = Utils.formatTime(media.duration);
    el.querySelector('.media-content').setAttribute(
      'href',
      '#wistia_' + media.hashed_id
    );

    document.getElementById('medias').appendChild(el);
  },

  renderPlaying: function(hashedId, isPlaying) {
    const el = this.getMediaNode(hashedId);

    if (isPlaying) {
      el.classList.add('playing');
    } else {
      el.classList.remove('playing');
    }
  },

  renderMediaEnded: function(hashedId) {
    const el = this.getMediaNode(hashedId);

    el.setAttribute('data-played', true);

    document.getElementById('medias').appendChild(el); // Move to end
  }
};

var VideoPlayer = {
  configure: function(video, events) {
    Object.keys(events).forEach(key => {
      video.bind(key, () => {
        events[key](video);
        return video.unbind;
      });
    });
  },

  render: function(media) {
    document
      .querySelector('.wistia_embed')
      .classList.add('wistia_async_' + media.hashed_id);

    document
      .querySelector('.video-title')
      .innerText = media.name;
  }
};

function VideoLoadHandler() {
  const events = {
    'play': video => {
      Playlist.renderPlaying(video.hashedId(), true);
    },
    'end': video => {
      Playlist.renderMediaEnded(video.hashedId());
    },
    'beforereplace': video => {
      Playlist.renderPlaying(video.hashedId(), false);
    }
  };

  return video => {
    VideoPlayer.configure(video, events);

    if (!Playlist.hasPlayed(video.hashedId())) {
      video.play();
    }
  };
}

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

        const handler = VideoLoadHandler();
        window._wq = window._wq || [];
        _wq.push(W => W.api(handler));

        medias.forEach(function(media) {
          Playlist.renderMedia(media);
        });
      });
    },
    false
  );
})();
