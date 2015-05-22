'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.configure = configure;
exports.command = command;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ask = require('../ask');

var _ask2 = _interopRequireDefault(_ask);

var _utils = require('../utils');

var _events = require('events');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var Promise = require('bluebird');

var program = undefined,
    argv = undefined;

var Option = (function () {
  function Option(flags, info, parser) {
    _classCallCheck(this, Option);

    parser = parser && (0, _utils.kindof)(parser).fn ? parser : _utils.noop;

    info = info && (0, _utils.kindof)(info).string ? info : 'No Information provided';

    flags = flags && (0, _utils.kindof)(flags).string ? flags : console.error('Command.option(): First argument, flags, must be defined!');

    this.parser = parser;
    this.flags = flags;
    this.info = info;

    this._isParsed = false;
  }

  _createClass(Option, [{
    key: 'value',
    get: function () {
      this._value = this._value || this.parser(argv[this.name]);
      return this._value;
    }
  }, {
    key: 'name',
    get: function () {
      !this._name && this.parseFlags();
      return this._name;
    }
  }, {
    key: 'isRequired',
    get: function () {
      !this._required && this.parseFlags();
      return this._required;
    }
  }, {
    key: 'isOptional',
    get: function () {
      !this._optional && this.parseFlags();
      return this._optional;
    }
  }, {
    key: 'parseFlags',
    value: function parseFlags() {
      var short = this.flags.match(/^\-([a-z]+)/)[1];
      var long = this.flags.match(/\-\-([a-z]+)/)[1];

      this._name = argv[short] && short || argv[long] && long;

      this._required = /\</.test(this.flags);
      this._optional = /\[/.test(this.flags);
      return this;
    }
  }]);

  return Option;
})();

var Command = (function () {
  function Command(name, args) {
    _classCallCheck(this, Command);

    this.name = name;
    this._args = args;
    this._argv = { _: [] };
    this._execs = {};
    this.isPrompts = false;
    this._prompts = { load: [], lazy: [] };
    this.isExec = false;
    this.options = {};
    return this;
  }

  _createClass(Command, [{
    key: 'isCmd',
    get: function () {
      return this._alias ? this.alias === program.cmd : this.name === program.cmd;
    }
  }, {
    key: 'opts',
    get: function () {
      return this._opts || this.getOPtions();
    }
  }, {
    key: 'argv',
    get: function () {

      return this._isParsed ? this._argv : this.parseArgv();
    }
  }, {
    key: 'getOPtions',
    value: function getOPtions() {
      this._isOpts = this._isOpts || false;
      if (!this._opts) {
        this._opts = {};
        for (var _name in this.options) {
          this._opts[_name] = this.options[_name].value;
          program.when(this.name).then(program.emit.bind(program, _name));
        }
        this._isOpts = true;
      }
    }
  }, {
    key: 'parseArgv',
    value: function parseArgv() {

      var args = this._args;
      var _args = argv._.slice(1);
      var length = args.length;
      if (length) {
        while (args.length) {
          var key = args.shift();
          var value = _args.shift();

          var parsed = (0, _utils.parseArg)(arg);
          if (value) {
            parsed.required && (this._argv[parsed.name] = value);
            parsed.optional && (this._argv[parsed.name] = value);
          } else if (parsed.required) {
            return console.error('Argument required');
          }
        }
      }
      this._isParsed = true;
      return this._argv;
    }
  }, {
    key: 'alias',
    value: function alias(substr) {
      (0, _utils.kindof)(substr).string && (this._alias = substr.trim());
      return this;
    }
  }, {
    key: 'description',
    value: function description(substr) {
      (0, _utils.kindof)(substr).string && (this._description = substr);
      return this;
    }
  }, {
    key: '_load_promp',
    value: function _load_promp() {
      return this._prompts.load.length ? (0, _ask2['default'])(this._prompts.load) : Promise.resolve(this._prompts.lazy);
    }
  }, {
    key: 'prompt',
    value: function prompt(question) {

      var when = question.onLoad ? 'load' : 'lazy';
      question.onLoad && delete question.onLoad;
      this._prompts.load.push(question);
      this.isPrompts = true;
      return this;
    }
  }, {
    key: 'option',
    value: function option(name, info, parser) {
      var self = this;
      var opt = new Option(name, info, parser);

      this.options[opt.name] = opt;

      program.when(this.name).then(function () {
        return program.when(opt.name);
      }).then(function () {
        self._isOpts = true;
        self._opts[opt.name] = opt.value;
      });
      return this;
    }
  }, {
    key: 'action',
    value: function action(fn) {
      var self = this,
          _action;
      return program.when(this.name).then(function () {
        return self.isCmd;
      }).then(function (valid) {
        if (valid) {
          _action = fn.bind(self, self.argv, self._opts);
          return !!self._prompts.load.length;
        }
      }).then(function (askOnLoad) {
        return askOnLoad && self._load_promp();
      }).then(function (answers) {
        return _action(answers);
      });
    }
  }, {
    key: 'execute',
    value: function execute(execPath) {
      execPath = /\//.test(execPath) ? execPath : program.cmdDir(execPath);

      this.isExec = true;
      this.execPath = execPath;
      var basename = path.basename(execPath);
      var executeable = function executeable() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return require(execPath).action.apply(this, args);
      };
      return this.action(executeable);
    }
  }]);

  return Command;
})();

var Program = (function (_EventEmitter) {
  function Program(_argv) {
    _classCallCheck(this, Program);

    _get(Object.getPrototypeOf(Program.prototype), 'constructor', this).call(this);

    argv = _argv;
    this.args = argv._;
    this.argv = argv;
    this._commands = {};
    this.cmdDir = path.join.bind(__dirname, '../../', 'commands');
  }

  _inherits(Program, _EventEmitter);

  _createClass(Program, [{
    key: 'register',
    value: function register(cmd) {
      this._commands[cmd.name] = cmd;
    }
  }, {
    key: 'run',
    value: function run() {
      this.cmd = this.args[0];
      this.emit(this.cmd);
      for (var index in this.argv) {
        this.emit(this.argv[index]);
      }
    }
  }, {
    key: 'when',
    value: function when(evt) {
      var self = this;
      return new Promise(function (resolve) {
        self.on(evt, function (payload) {
          resolve(payload);
        });
      });
    }
  }]);

  return Program;
})(_events.EventEmitter);

function configure(argv) {
  if (!program) {
    program = new Program(argv);
    program.emit('start', program.cmd);
  }
  return program;
}

function command(name) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  var cmd = new Command(name, args);
  program.register(cmd);
  return cmd;
}