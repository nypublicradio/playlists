import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { run } from '@ember/runloop';
import { sum, mapBy } from '@ember/object/computed';

export default Component.extend({
  classNames:  ['nypr-playlist'],

  hifi:         service(),
  currentItem:  reads('hifi.currentMetadata.item'),

  allDurations: mapBy('items', 'estimatedDuration'),
  duration:     sum('allDurations'),

  init() {
    this._super(...arguments);
    get(this, 'hifi').on('audio-ended', () => run(this, 'queueUp'));
  },

  play(item) {
    set(this, 'showPlayer', true);

    let audio = get(item, 'audio');
    return get(this, 'hifi').play(audio, {metadata: {item}});
  },

  pause() {
    get(this, 'hifi').pause();
  },

  queueUp() {
    let currentItem = get(this, 'currentItem');
    let currentIndex = get(this, 'items').indexOf(currentItem);
    if (currentIndex === (get(this, 'items.length') - 1)) {
      set(this, 'showPlayer', false);
    } else {
      let nextItem = get(this, 'items').objectAt(currentIndex + 1);
      this.play(nextItem).then(() => {
        if (window.dataLayer) {
          window.dataLayer.push({event: 'playlist-passiveStart', 'playlist-currentStory': get(nextItem, 'title'), 'playlist-currentShow': get(nextItem, 'showTitle')});
        }
      });
    }
  },

  playAll() {
    let firstItem = get(this, 'items.firstObject');
    this.play(firstItem).then(() => {
      if (window.dataLayer) {
        window.dataLayer.push({event: 'playlist-passiveStart', 'playlist-currentStory': get(firstItem, 'title'), 'playlist-currentShow': get(firstItem, 'showTitle')});
      }
    });
  },

  playItemFromList(item) {
    this.play(item).then(({sound}) => {
      let event;
      if (Math.floor(sound.get('position')) === 0) {
        event = 'playlist-start';
      } else {
        event = 'playlist-resume';
      }
      if (window.dataLayer) {
        let currentIndex = get(this, 'items').indexOf(item);
        window.dataLayer.push({
          event,
          'playlist-currentPosition': currentIndex + 1,
          'playlist-currentStory': get(item, 'title'),
          'playlist-currentShow': get(item, 'showTitle')
        });
      }
    });
  }
});
