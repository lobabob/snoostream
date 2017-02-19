const Snoowrap = require('snoowrap');
const EventStream = require('./EventStream');

/**
 * A class that can create comment and submission EventStreams. These
 * EventStreams can be provided with a regex so that only posts that
 * match the provided regex will be emitted.
 */
class SnooStream {
  /**
   * @param {object} options Needs to contain required options for Snoowrap
   * @param {number} options.drift Difference between system time and Reddit's
   * server time. Not required, but can make SnooStream more responsive on startup.
   */
  constructor (options) {
    this.startTime = Math.floor(Date.now() / 1000);
    this.snoowrap = new Snoowrap(options);
    this.drift = options.drift ? options.drift : 0;
  }
  /**
   * Will create an EventStream that emits 'post' and 'data' events. 'post' events
   * contain new comments that match the provided regex. 'data' events contain new
   * comments.
   * @param {string} subreddit The subreddit to get new comments from
   * @param {RegExp} regex The pattern to match. Comments that do not match this are
   * ignored.
   * @param {object} options Any options that can be passed to Snoowrap.getNewComments()
   * @param {number} options.rate The rate at which to poll Reddit. Default is 1000 ms
   */
  commentStream (subreddit, regex = /[\S\s]*/, options = {}) {
    let pollFn = this.snoowrap.getNewComments.bind(this.snoowrap);
    return this._postStream(pollFn, options.rate, subreddit, regex, options);
  }
  /**
   * Will create an EventStream that emits 'post' and 'data' events. 'post' events
   * contain new submissions that match the provided regex. 'data' events contain new
   * submissions.
   * @param {string} subreddit The subreddit to get new comments from
   * @param {RegExp} regex The pattern to match. Comments that do not match this are
   * ignored.
   * @param {object} options Any options that can be passed to Snoowrap.getNewComments()
   * @param {number} options.rate The rate at which to poll Reddit. Default is 1000 ms
   */
  submissionStream (subreddit, regex = /[\S\s]*/, options = {}) {
    let pollFn = this.snoowrap.getNew.bind(this.snoowrap);
    return this._postStream(pollFn, options.rate, subreddit, regex, options);
  }
  _postStream (pollFn, rate = 1000, subreddit, regex, options) {
    let cache = [];
    let eventStream = new EventStream(rate, pollFn, subreddit, options);
    eventStream.on('data', (data, time) => {
      data = this._dedupe(data, cache);
      data.filter(post => post.created_utc >= this.startTime - this.drift)
          .forEach(post => this._parse(post, eventStream, regex));
    });

    return eventStream;
  }
  _parse (data, emitter, regex) {
    emitter.emit('post', data.body.match(regex), data);
  }
  _dedupe (batch, cache) {
    let diff = batch.filter(entry => cache.every(oldEntry => entry.id != oldEntry.id));
    cache.length = 0;
    cache.push(...batch);
    return diff;
  }
}

module.exports = SnooStream;
