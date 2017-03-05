'use strict';
const Snoowrap = require('snoowrap');
const Pollify = require('pollify');

/**
 * Ducktype check for whether obj is a Snoowrap object
 * @param {object} obj the object to ducktype check as a Snoowrap object
 */
function isSnoowrap (obj) {
  return typeof obj.getNew == 'function' && typeof obj.getNewComments == 'function';
}

/**
 * Produces an object that can create comment and submission eventStreams. These
 * eventStreams can be provided with a regex so that only posts that
 * match the provided regex will be emitted.
 * @param {object} options Options to initialize Snoowrap
 * @param {number} drift Difference between system time and Reddit's
 * server time. Not required, but can make SnooStream more responsive on startup.
 */
function SnooStream (options, drift = 0) {
  const snoowrap = isSnoowrap(options) ? options : new Snoowrap(options);
  const startTime = Math.floor(Date.now() / 1000);

  function postStream (pollFn, subreddit = 'all', opts = {}) {
    const cacheObj = { cache: [] };
    const poll = Pollify({ rate: opts.rate || 1000, mode: 'promise' }, pollFn, subreddit, opts);
    poll.on('data', data => {
      data = dedupe(data, cacheObj);
      data.filter(post => post.created_utc >= startTime - drift)
          .forEach(post => parse(post, poll, opts.regex));
    });

    return poll;
  }
  function parse (data, emitter, regex) {
    const match = data.body.match(regex);
    if (match) {
      emitter.emit('post', data, match);
    }
  }
  function dedupe (batch, cacheObj) {
    const diff = batch.filter(entry => cacheObj.cache.every(oldEntry => entry.id !== oldEntry.id));
    cacheObj.cache = batch;
    return diff;
  }

  return {
    /**
     * Returns an eventStream that emits 'post' and 'data' events. 'post' events
     * contain new comments that match the provided regex. 'data' events contain all new
     * comments regardless of whether they matched the regex.
     * @param {string} subreddit The subreddit to get new posts from. Default is the 'all' subreddit
     * @param {object} opts Optional. Any options that can be passed to Snoowrap.getNewComments() or Snoowrap.getNew()
     * @param {number} opts.rate The rate at which to poll Reddit. Default is 1000 ms
     * @param {RegExp} opts.regex The pattern to match. Posts that do not match this are
     * ignored.
     * @param {*} opts.* Any other options for Snoowrap.getNewComments() or Snoowrap.getNew()
     */
    commentStream (subreddit, opts) {
      const pollFn = snoowrap.getNewComments.bind(snoowrap);
      return postStream(pollFn, subreddit, opts);
    },
    submissionStream (subreddit, opts) {
      const pollFn = snoowrap.getNew.bind(snoowrap);
      return postStream(pollFn, subreddit, opts);
    }
  };
}

module.exports = SnooStream;
