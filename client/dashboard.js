'use strict';

var Dashboard = {
  getMedias: function() {
    var url = new URL('https://api.wistia.com/v1/medias.json');
    url.searchParams.set('api_password', TOKEN);
    return axios.get(String(url));
  },

  getPlayCount: function(hashedId) {
    var url = new URL(`https://api.wistia.com/v1/stats/medias/${hashedId}.json`);
    url.searchParams.set('api_password', TOKEN);
    return axios.get(String(url)).then(response => (response.data || {}).play_count);
  },

  getHiddenMedias: function() {
    var url = new URL(`http://localhost:3000/hidden-medias`);
    return axios.get(String(url)).then(response => (response.data || {}));
  },

  setVisibility: function(hashedId, { hidden }) {
    var url = new URL(`http://localhost:3000/hidden-medias/${hashedId}`);
    return axios.put(String(url), { hidden });
  },

  onVisibilityClick: function(el) {
    const hashedId = el.getAttribute('data-hashed-id');
    const hidden = el.getAttribute('data-value') === 'hidden';

    el.setAttribute('data-value', hidden ? 'visible' : 'hidden');
    this.setVisibility(hashedId, { hidden: !hidden });
    this.renderVisibility(el, { hidden: !hidden });
  },

  renderTag: function(mediaEl, tag) {
    var template = document.getElementById('tag-template');
    var clone = template.content.cloneNode(true);
    var tagEl = clone.children[0];

    tagEl.innerText = tag;
    mediaEl.querySelector('.tags').append(tagEl);
  },

  renderTags: function(mediaEl, tags) {
    tags.forEach(function(tag) {
      Dashboard.renderTag(mediaEl, tag);
    });
  },

  renderVisibility: function(el, { hidden }) {
    const hiddenEl = el.querySelector('.media--hidden');
    hiddenEl.style.display = hidden ? null : 'none';

    const visibleEl = el.querySelector('.media--visible');
    visibleEl.style.display = hidden ? 'none' : null;
  },

  renderMedia: function(media) {
    var template = document.getElementById('media-template');
    var clone = template.content.cloneNode(true);
    var el = clone.children[0];

    el.querySelector('.thumbnail').setAttribute('src', media.thumbnail.url);
    el.querySelector('.title').innerText = media.name;
    el.querySelector('.duration').innerText = Utils.formatTime(media.duration);
    el.querySelector('.count').innerText = media.playCount;
    el.setAttribute('data-hashed-id', media.hashed_id);

    const toggle = el.querySelector('.visibility-toggle');
    toggle.setAttribute('data-hashed-id', media.hashed_id);
    toggle.setAttribute('data-value', media.hidden ? 'hidden' : 'visible');
    this.renderVisibility(toggle, { hidden: media.hidden });

    this.renderTags(el, ['tag-1', 'tag-2']);

    document.getElementById('medias').appendChild(el);
  },

  openModal: function() {
    document.querySelector('.modal').classList.add('modal--open');
  },

  closeModal: function() {
    document.querySelector('.modal').classList.remove('modal--open');
  },

  addTag: function() {
    var el = document.createElement('li');
    el.querySelector('.tags').appendChild(el);
  }
};

(function() {
  document.addEventListener(
    'DOMContentLoaded',
    function() {
      const promises = [Dashboard.getMedias(), Dashboard.getHiddenMedias()];
      Promise.all(promises).then(function([response, hidden]) {
        const promises = response.data.map(async function(media) {
          return {
            ...media,
            hidden: hidden[media.hashed_id] || false,
            playCount: await Dashboard.getPlayCount(media.hashed_id)
          };
        });

        Promise.all(promises).then(medias => {
          medias.forEach(media => Dashboard.renderMedia(media));
        });
      });
    },
    { useCapture: false }
  );

  document.addEventListener(
    'click',
    function(event) {
      if (event && event.target.matches('.visibility-toggle')) {
        Dashboard.onVisibilityClick(event.target);
      }

      if (event && event.target.matches('.tag-button')) {
        Dashboard.openModal();
      }

      if (event && event.target.matches('.modal__button--close')) {
        Dashboard.closeModal();
      }
    },
    { useCapture: true }
  );
})();
