'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * History stores records of the most recent commands,
 * which is kept for the user's convenience and reference,
 * as well as so as to optimize remote storage of
 * the user's most used languages.
 */

var history = {

  _hist: [],

  _adds: 0,

  _lastWrite: new Date(),

  _max: 600,

  get: function get() {
    return this._hist;
  },

  push: function push(obj) {
    obj = obj || {
      type: 'unknown'
    };
    obj.date = new Date();
    this._hist.push(obj);
    this._adds++;
  },

  worker: function worker() {
    var self = this;
    var lastWrite = new Date() - self._lastWrite;
    var write = false;
    if (self._adds > 5) {
      write = true;
    } else if (self._adds > 0 && lastWrite > 30000) {
      write = true;
    }

    if (write) {
      self._adds = 0;
      self._lastWrite = new Date();
      self.write();
    }
  },

  write: function write() {
    if (this._hist.length > this._max) {
      this._hist = this._hist.slice(this._hist.length - this._max);
    }
    fs.writeFileSync(this.app.clerk.paths.hist, JSON.stringify(this._hist));
    return this;
  }
};

module.exports = function (app) {
  history.app = app;
  return history;
};