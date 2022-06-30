'use strict';

var Playlist = {
  getMedias: function() {
    var url = new URL('https://api.wistia.com/v1/medias.json');
    url.searchParams.set('api_password', TOKEN);
    return axios.get(String(url));
  },

  getHiddenMedias: function() {
    var url = new URL(`http://localhost:3000/hidden-medias`);
    return axios.get(String(url)).then(response => (response.data || []));
  },

  getMediaNode: function(hashedId) {
    return document.getElementById(hashedId);
  },

  getNextHashedId: function() {
    const notPlaying = '.media:not(.playing)';
    return document.getElementById('medias').querySelector(notPlaying).id;
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

    const medias = document.getElementById('medias');

    var foundElement = false
    for (const media of medias.children) {
      foundElement = foundElement || media === el;
      if (foundElement) {
        media.classList.add('shift-up');
      }
    }

    medias.appendChild(el); // Move to end
    setTimeout(() => {
      for (const media of medias.children) {
        media.classList.remove('shift-up');
      }
    }, 0);
  }
};

var VideoPlayer = {
  COUNTDOWN_SECONDS: 5,

  renderCountdown: function(media, onComplete, cancellable) {
    const resizedThumbnail = new URL(media.thumbnail.url);
    resizedThumbnail.searchParams.set('image_crop_resized', '300x160');

    document
      .querySelector('.countdown-media-thumbnail')
      .setAttribute('src', String(resizedThumbnail));

    document
      .querySelector('.countdown-media-title')
      .innerText = media.name;

    const countdown = document.querySelector('.countdown');
    const seconds = document.querySelector('.countdown-seconds');

    // display countdown timer.
    countdown.style.display = null;

    cancellable.onCancel(() => {
      seconds.innerText = null;
      countdown.style.display = 'none';
    });

    Utils.timer(this.COUNTDOWN_SECONDS, remaining => {
      if (remaining > 0) {
        seconds.innerText = remaining;
      } else {
        seconds.innerText = null;
        countdown.style.display = 'none';
        onComplete();
      }
    }, cancellable);
  },

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

function VideoLoadHandler(getMediaByHashedId) {
  var cancellable = Utils.cancellable();

  const events = {
    'play': video => {
      Playlist.renderPlaying(video.hashedId(), true);
    },
    'end': video => {
      const renderMediaEnded = () => Playlist.renderMediaEnded(video.hashedId());
      const nextMedia = getMediaByHashedId(Playlist.getNextHashedId());

      function onComplete() {
        renderMediaEnded();

        video.replaceWith(nextMedia.hashed_id, {
          autoPlay: false
        });
      }

      if (!Playlist.hasPlayed(nextMedia.hashed_id)) {
        cancellable.onCancel(renderMediaEnded);
        VideoPlayer.renderCountdown(nextMedia, onComplete, cancellable);
      } else {
        onComplete();
      }
    },
    'beforereplace': video => {
      cancellable.cancel();
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
      const data = [Playlist.getMedias(), Playlist.getHiddenMedias()];
      Promise.all(data).then(function([response, hidden]) {
        const allMedias = response.data;
        if (!allMedias) {
          return;
        }

        const medias = allMedias.filter(media => !hidden[media.hashed_id]);

        VideoPlayer.render(medias[0]);

        const handler = VideoLoadHandler(
          id => medias.find(media => media.hashed_id === id)
        );
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
