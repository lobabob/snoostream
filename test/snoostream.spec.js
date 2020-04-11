'use strict';
const chai = require('chai');
const expect = chai.expect;

const SnooStream = require('..');

/**
 * A mock Snoowrap replacement. Works due to ducktyping
 * @param {Number} [drift=0] the number of seconds reddit is behind system time by
 */
function SnoowrapMock (drift = 0) {
  return {
    posts: [],
    addPost (selftext, created_utc = timeInSecs() - drift) {
      this.posts.push({ selftext, created_utc });
    },
    addComment (body, created_utc = timeInSecs() - drift) {
      this.posts.push({ body, created_utc });
    },
    getNew () {
      return Promise.resolve(this.posts);
    },
    getNewComments () {
      return Promise.resolve(this.posts);
    }
  };
}

function timeInSecs (time = Date.now()) {
  return Math.floor(time / 1000);
}

describe('SnooStream', function () {
  describe('commentStream', function () {
    it('only emits new comments', function (done) {
      const postsMatched = [];
      const snooWrap = SnoowrapMock();
      const commentStream = SnooStream(snooWrap).commentStream();
      commentStream.on('post', d => postsMatched.push(d));

      for (let i = 1; i <= 5; ++i) {
        snooWrap.addComment('old', timeInSecs(Date.now() - (i * 1000)));
        snooWrap.addComment('new', timeInSecs(Date.now() + (i * 1000)));
      }

      setTimeout(() => {
        expect(postsMatched.every(p => p.body !== 'old')).to.be.true;
        done();
      }, 100);
    });
    it('does not emit duplicates', function (done) {
      const postsMatched = [];
      const snooWrap = SnoowrapMock();
      const commentStream = SnooStream(snooWrap).commentStream('', { rate: 10 });
      commentStream.on('post', d => postsMatched.push(d));

      for (let i = 0; i < 5; ++i) {
        snooWrap.addComment('' + i);
      }

      setTimeout(() => {
        const dupCheck = [];
        dupCheck[postsMatched.length - 1] = '';
        dupCheck.fill(0);

        for (let i = 0; i < postsMatched.length; ++i) {
          dupCheck[postsMatched[i].body]++;
        }
        expect(dupCheck.every(count => count === 1)).to.be.true;
        done();
      }, 100);
    });
    it('can account for drift', function (done) {
      const drift = 1;
      const snooWrap = SnoowrapMock(drift);
      const commentStream = SnooStream(snooWrap, drift).commentStream('', { rate: 10 });
      commentStream.on('post', () => done());

      snooWrap.addComment('will only be emitted if drift is accounted for');
    });
    it('limits post events to posts that match regex', function (done) {
      const postsMatched = [];
      const regex = /abc/;
      const snooWrap = SnoowrapMock();
      const commentStream = SnooStream(snooWrap).commentStream('', { regex });
      commentStream.on('post', d => postsMatched.push(d));

      snooWrap.addComment('asdf asdf sadf abc asdf');
      snooWrap.addComment('qwqwe asdf ewqiopadf');

      setTimeout(() => {
        expect(postsMatched.every(p => !!p.body.match(regex))).to.be.true;
        done();
      }, 100);
    });
  });

  describe('submissionStream', function () {
    it('only emits new submssions', function (done) {
      const postsMatched = [];
      const snooWrap = SnoowrapMock();
      const submissionStream = SnooStream(snooWrap).submissionStream();
      submissionStream.on('post', d => postsMatched.push(d));

      for (let i = 1; i <= 5; ++i) {
        snooWrap.addPost('old', timeInSecs(Date.now() - (i * 1000)));
        snooWrap.addPost('new', timeInSecs(Date.now() + (i * 1000)));
      }

      setTimeout(() => {
        expect(postsMatched.every(p => p.selftext !== 'old')).to.be.true;
        done();
      }, 100);
    });
    it('does not emit duplicates', function (done) {
      const postsMatched = [];
      const snooWrap = SnoowrapMock();
      const submissionStream = SnooStream(snooWrap).submissionStream('', { rate: 10 });
      submissionStream.on('post', d => postsMatched.push(d));

      for (let i = 0; i < 5; ++i) {
        snooWrap.addPost('' + i);
      }

      setTimeout(() => {
        const dupCheck = [];
        dupCheck[postsMatched.length - 1] = '';
        dupCheck.fill(0);

        for (let i = 0; i < postsMatched.length; ++i) {
          dupCheck[postsMatched[i].selftext]++;
        }
        expect(dupCheck.every(count => count === 1)).to.be.true;
        done();
      }, 100);
    });
    it('can account for drift', function (done) {
      const drift = 1;
      const snooWrap = SnoowrapMock(drift);
      const submissionStream = SnooStream(snooWrap, drift).submissionStream('', { rate: 10 });
      submissionStream.on('post', () => done());

      snooWrap.addPost('will only be emitted if drift is accounted for');
    });
    it('limits post events to posts that match regex', function (done) {
      const postsMatched = [];
      const regex = /abc/;
      const snooWrap = SnoowrapMock();
      const submissionStream = SnooStream(snooWrap).submissionStream('', { regex });
      submissionStream.on('post', d => postsMatched.push(d));

      snooWrap.addPost('asdf asdf sadf abc asdf');
      snooWrap.addPost('qwqwe asdf ewqiopadf');

      setTimeout(() => {
        expect(postsMatched.every(p => !!p.selftext.match(regex))).to.be.true;
        done();
      }, 100);
    });
  });
});
