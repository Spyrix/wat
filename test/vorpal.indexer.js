'use strict';

require('assert');
const should = require('should');
const app = require('../');

let _stdout = '';

app.init({
  updateRemotely: false
});

app.vorpal.pipe(function(str) {
  _stdout += str;
  return '';
});

function stdout() {
  const out = _stdout;
  _stdout = '';
  return out;
}

describe('vorpal.indexer', function () {
  before(function (done) {
    done();
  });

  after(function (done) {
    done();
  });

  it('should run', function (done) {
    this.timeout(10000);
    app.vorpal.exec('index', function (err, data) {
      (typeof err).should.equal('undefined');
      stdout().should.containEql('Successfully updated index.');
      done();
    })
  });
});
