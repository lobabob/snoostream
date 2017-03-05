# SnooStream

An event based wrapper for getting new comments and submissions from Snoowrap.

## Features

* Can filter new posts via regex.
* Remove post duplicates returned from Reddit.
* Accounts for drift between system time and Reddit server time.

## Installation

```sh
npm install snoostream
```

## Usage

### How to initialize

```javascript
const SnooStream = require('snoostream');

let snooStream = SnooStream({
  ... // This is all Snoowrap configuration
});
```

OR

```javascript
const SnooStream = require('snoostream');
const Snoowrap = require('snoowrap');

let snooWrap = new Snoowrap({
  ... // This is all Snoowrap configuration
});

let snooStream = SnooStream(snooWrap);
```

`SnooStream(options[, drift])`

`SnooStream(Snoowrap[, drift])`

* `options` Snoowrap configuration
* `Snoowrap` A Snoowrap object
* `drift` the number of seconds system time is ahead of Reddit server time. Usually not needed.

### Create a Comment Stream

```javascript
let commentStream = snooStream.commentStream('all');
// Or if you want to match with a specific regex
let commentStream = snooStream.commentStream('all', { regex: /abc/ });

commentStream.on('post', (post, match) => {
  ... // post is returned directly from Snoowrap
  ... // match contains the groups matched by regex
});
```

`snooStream.commentStream(subreddit[, options])`

* `subreddit` the subreddit to poll for new comments. Default is 'all'.
* `options.regex` Will only emit posts that match the provided regex
* `options.rate` Rate at which to poll Reddit. Default is 1000 ms.
* `options.*` Any additional options that would apply to `Snoowrap.getNewComments()` such as `limit` which limits the amount of comments fetched every call.

### Create a Submission Stream

```javascript
let submissionStream = snooStream.submissionStream('all');
// Or if you want to match with a specific regex
let submissionStream = snooStream.submissionStream('all', { regex: /abc/ });

submissionStream.on('post', (post, match) => {
  ... // post is returned directly from Snoowrap
  ... // match contains the groups matched by regex
});
```

`snooStream.submissionStream(subreddit[, options])`

* `subreddit` the subreddit to poll for new submissions. Default is 'all'.
* `options.regex` Will only emit posts that match the provided regex
* `options.rate` Rate at which to poll Reddit. Default is 1000 ms.
* `options.*` Any additional options that would apply to `Snoowrap.getNew()` such as `limit` which limits the amount of comments fetched every call.
