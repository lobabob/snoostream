/*
 * Scrapes reddit for new comments that satisfy the trigger requirements (correct keyword and arguments) and
 * populates the Message Queue with those validated comments.
 */

/*
 * Scraper Logic:
 * 		- Scrape all new comments
 * 		- hashes comments that have certain keywords and satisfy formatting requirements
 *   	- Send scraped comments whose hashes are not present in DB to Message Queue
 *    	- If clean flag is on drop all saved comment hashes
 *   	- Add comment hashes to DB
 */

const Snoowrap = require('snoowrap');
const EventStream = require('lib/EventStream');
const EventEmitter = require('events');

const defaultRate = 1000; // In milliseconds

class SnooStream {
  constructor (options) {
    this.snoowrap = new Snoowrap(options);
  }
  commentStream (subreddit, regex = /[\S\s]*/, options = {}) {
    let pollFn = this.snoowrap.getNewComments;
    let rate = options.rate || defaultRate;
    let eventStream = new EventStream(rate, pollFn, subreddit, ...options);

    eventStream.on('data', post => {
      this.parse(post, eventStream, regex);
    });

    return eventStream;
  }
  submissionStream (subreddit, regex = /[\S\s]*/, options = {}) {
    let pollFn = this.snoowrap.getNew;
    let rate = options.rate || defaultRate;
    let eventStream = new EventStream(rate, pollFn, subreddit, ...options);

    eventStream.on('data', post => {
      this.parse(post, eventStream, regex);
    });

    return eventStream;
  }
  parse (data, emitter, regex) {
    data.forEach(dataPiece => {
      //emitter.emit('post', dataPiece.match(regex));
      emitter.emit('post', dataPiece);
    });
  }
}

module.exports = SnooStream;
