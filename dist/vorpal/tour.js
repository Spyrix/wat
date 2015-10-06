'use strict';

var chalk = require('chalk');
var wrap = require('wrap-ansi');
var strip = require('strip-ansi');
var os = require('os');

var windows = os.platform() === 'win32';
var tl = windows ? '-' : '┌';
var tr = windows ? '-' : '┐';
var bl = windows ? '-' : '└';
var br = windows ? '-' : '┘';
var hl = windows ? '-' : '─';

function pad(str, width, delim) {
  delim = delim || ' ';
  var len = strip(str).length;
  for (var i = len; i < width; ++i) {
    str += delim;
  }
  return str;
}

module.exports = function (vorpal) {

  function Step(number) {
    this._step = number;
    this._cb;
    this._fn;
    this._listener;
    this._noevent;
    this._events = {
      "nothing": "nothing",
      "submit": "client_prompt_submit",
      "keypress": "keypress",
      "command": "client_command_executed"
    };
    return this;
  }

  Step.prototype.exec = function (cb) {
    if (typeof cb !== 'function') {
      throw new Error('No callbend was passed into vorpal-tour\'s step.exec() command.');
    }
    this._cb = cb;
    if (typeof this._begin === 'function') {
      this._begin.call(vorpal);
    } else if (typeof this._begin === 'string') {
      this.log(this._begin);
    }
    if (this._noevent === true) {
      this._listener.fn();
    } else {
      vorpal.on(this._listener.event, this._listener.fn);
    }
  };

  Step.prototype.reject = function (str) {
    this._reject = str;
    return this;
  };

  Step.prototype.expect = function (evt, _fn) {
    var self = this;
    var event = this._events[evt] || evt;
    if (evt === "nothing") {
      this._noevent = true;
    }
    this._listener = {
      event: event,
      fn: function fn(e) {
        function end() {
          if (typeof self._end === 'function') {
            self._end.call(vorpal);
          } else if (typeof self._end === 'string') {
            self.log(self._end);
          }
          if (self._cb) {
            self._cb();
          }
        }

        _fn.call(vorpal, e, function (valid) {
          if (valid) {
            vorpal.removeListener(self._listener.event, self._listener.fn);
            if (self._wait) {
              setTimeout(end, self._wait);
            } else {
              end();
            }
          } else {
            if (self._reject) {
              self.log(self._reject, { error: true });
            }
          }
        });
      }
    };
    return self;
  };

  Step.prototype.begin = function (x) {
    this._begin = x;
    return this;
  };

  Step.prototype.end = function (x) {
    this._end = x;
    return this;
  };

  Step.prototype.wait = function (amt) {
    if (isNaN(amt)) {
      throw new Error('An invalid value was passed into vorpal-tour\'s step.wait() method. Expecting an integer of millis.');
    }
    this._wait = amt;
    return this;
  };

  Step.prototype.log = function (str, options) {
    options = options || {};
    var leftWidth = String('1').length + 4;
    var mainWidth = process.stdout.columns - leftWidth - 6;
    var wrapped = str.split('\n').map(function (s) {
      return wrap(s, mainWidth).split('\n').map(function (sub) {
        return pad(sub, mainWidth, ' ');
      }).join('\n');
    }).join('\n');

    var color = options.error ? 'yellow' : 'white';

    var top = chalk[color]('' + pad('', 2) + tl + pad('', mainWidth + 4, hl) + tr);
    var bottom = chalk[color]('' + pad('', 2) + bl + pad('', mainWidth + 4, hl) + br);

    wrapped = wrapped.split('\n').map(function (line) {
      return '  ' + chalk[color]('|') + '  ' + line + '  ' + chalk[color]('|');
    }).join('\n');

    wrapped = chalk[tour._color || 'reset']('\n' + wrapped + '\n');
    wrapped = '\n' + top + wrapped + bottom + '\n';
    vorpal.log(wrapped);
    return this;
  };

  var tour = {

    _step: 0,

    _steps: [],

    color: function color(clr) {
      if (!chalk[clr]) {
        throw new Error('An invalid Chalk color was passed into `tour.color`.');
      }
      this._color = clr;
    },

    step: function step() {
      var step = new Step(this._steps.length + 1);
      this._steps.push(step);
      return step;
    },

    wait: function wait(amt) {
      if (isNaN(amt)) {
        throw new Error('An invalid value was passed into vorpal-tour\'s tour.wait() method. Expecting an integer of millis.');
      }
      tour.step().wait(amt).expect("nothing", function (data, cb) {
        cb(true);
      });
    },

    next: function next() {
      var self = this;
      var step = this._steps[this._step];
      if (step) {
        step.exec(function () {
          self._step++;
          self.next();
        });
      }
    },

    end: function end(msg) {
      var step = tour.step();
      if (msg) {
        step.begin(msg);
      }
      step.expect("nothing", function (data, cb) {
        cb(true);
      });
    }
  };

  var start1 = '\nWelcome to Wat. Let\'s look up how to use Javascript\'s "array.slice()" method.\n\nType "' + chalk.white('js array slice') + '" and press ' + chalk.white('[enter]') + '.\n';
  var end1 = '\nThis pulled up a rapid description of the ".slice" command, and a usage example.\nThis is the hallmark of wat - just the data you need, and nothing more.\n';
  var start2 = '\nNow, let\'s see what content wat has. Press ' + chalk.white('[tab]') + ' twice.\n';
  var end2 = '\nThis shows a list of all of wat\'s currently supported libraries.\n\nThe bolded libraries are already built, while the faded ones can be automatically generated.\n';
  var start3 = '\nLet\'s generate "chalk", a Node.js module for coloring strings. Type "' + chalk.white('cha') + '", and then hit ' + chalk.white('[tab]') + ' twice. Then follow the instructions.\n';
  var end4 = '\nNice. That last tab you did shows what\'s in Chalk. The green items are methods, blue are properties, and the rest are docs, such as Chalk\'s readme on Github.\n';
  var start5 = '\nTake a look at what\'s in "stripColor". You\'ve typed half of it already.\n';
  var end5 = '\nThe data you see here was automatically parsed from Chalk\'s readme when you downloaded it a second ago.\n';
  var start6 = '\nThe tab key is your friend. Notice the "/" on "readme/"? That means you can drill down further into the readme, which is indexed by its main sections.\n\nUse your tab key to find and pull up the "Why" section of Chalk\'s readme.\n';
  var start7 = '\nYou can also view the full readme. Run "' + chalk.white('chalk readme') + '"\n\nNote: As the readme is longer than your screen, wat is going to throw you into a "less" (linux) command automatically. If you are unfamiliar with how to use less, type "' + chalk.white('h') + '" as soon as the readme pulls up.\n\nWhen you\'re done viewing the readme, press "' + chalk.white('q') + '" to quit less.\n';
  var start8 = '\nOkay. Let\'s see what a really big libary looks like.\n\nDownload "node" using your tab keys, or by typing "' + chalk.white('node') + '" and pressing ' + chalk.white('[enter]') + '.\n';
  var start9 = '\nNice. Now press ' + chalk.white('[tab]') + ' twice to see Node\'s contents.\n';
  var end9 = '\nBecause Node\'s API is so large, wat broke it into digestible chunks.\n';
  var start10 = '\nUse the tab key to look into the "os" (Operating System) object and find a method that has to do with what platform you are running. Run that command.\n';
  var start11 = '\nDon\'t worry, you don\'t have to type a million words to pull up a command. If you type part of a command, wat will pull up the best results.\n\nType "' + chalk.white('slice') + '" and press ' + chalk.white('[enter]') + '. You\'ll be prompted to choose between two matches. Pull up the Javascript one.\n';
  var start12 = '\nUm... what if you downloaded a library you don\'t use and you don\'t want it polluting your search results?.\n\nType "' + chalk.white('delete node') + '" to forever banish it.\n';
  var start13 = '\nIt\'s gone. Now run "' + chalk.white('slice') + '" again. It should pull up the best result with no questions asked.\n';
  var start14 = '\nBy the way, did you notice the syntax highlighting on the code samples? If you don\'t like the color theme, you can pick your own!\n\nRun "' + chalk.white('themes') + '" to see what\'s available.\n';
  var start15 = '\nPick one that looks interesting, and then run "' + chalk.white('theme <name>') + '". \n';
  var end15 = '\nDid you know you can publish your own themes? If you\'re interested, check the out "Creating Themes" page on Wat\'s Github Wiki.\n';
  var start16 = '\nWat can also search Stack Overflow. Run "' + chalk.white('stackoverflow js splice an array') + '".\n';
  var end16 = '\n"stackoverflow" is a really long word. You can also run it with "so ..." or "stack ...".\n';
  var conclusion = '\nThat concludes the tour!\n\nIf you like Wat, help spread the word! And remember, contributing is ridiculously easy. If you want to add content, check out the Wiki to get started.\n\nOver to you!\n';

  tour.color('magenta');

  tour.step(1).begin(start1).expect("command", function (data, cb) {
    cb(data.command === 'js array slice');
  }).reject('Err.. wrong command.').wait(1000).end(end1);

  tour.step(2).begin(start2).expect("keypress", function (data, cb) {
    this._tabs = this._tabs || 0;
    this._tabs = data.key === 'tab' ? this._tabs + 1 : 0;
    cb(this._tabs === 2);
  }).wait(1000).end(end2);

  tour.step(3).begin(start3).expect("wat_library_build", function (data, cb) {
    cb(data.name === 'chalk');
  }).reject('Er.. wrong library.');

  tour.step(4).expect("keypress", function (data, cb) {
    cb(data.key === "tab");
  }).wait(1000).end(end4);

  tour.step(5).begin(start5).expect("command", function (data, cb) {
    cb(data.command.toLowerCase().indexOf('strip') > -1);
  }).wait(1000).end(end5);

  tour.step(6).begin(start6).wait(1000).expect("command", function (data, cb) {
    cb(data.command.toLowerCase().indexOf('why') > -1);
  });

  tour.step(7).begin(start7).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf('readme') > -1);
  }).wait(1000);

  tour.step(8).begin(start8).expect("wat_library_build", function (data, cb) {
    cb(data.name === 'node');
  }).reject('Er.. wrong library.');

  tour.step(9).end(start9).expect("keypress", function (data, cb) {
    this._tabs2 = this._tabs2 || 0;
    this._tabs2 = data.key === 'tab' ? this._tabs2 + 1 : 0;
    cb(this._tabs2 > 0);
  }).wait(1000).end(end9);

  tour.step(10).begin(start10).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("platform") > -1);
  }).wait(1000);

  tour.step(11).begin(start11).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("slice") > -1);
  }).wait(1000);

  tour.step(12).begin(start12).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("delete") > -1);
  }).wait(1500);

  tour.step(13).begin(start13).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("slice") > -1);
  }).wait(1000);

  tour.step(14).begin(start14).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("themes") > -1);
  }).wait(1000);

  tour.step(15).begin(start15).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("theme ") > -1);
  }).wait(1000).end(end15);

  tour.step(16).begin(start16).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("stackoverflow") > -1);
  }).wait(1000).end(end16);

  tour.end(conclusion);

  vorpal.command('tour').hidden().action(function (args, cb) {
    setTimeout(function () {
      tour._step = 0;
      tour.next();
    }, 250);
    cb();
  });
};