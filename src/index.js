import ask  from './ask';
import {noop, kindof, parseArg} from './utils';
import {EventEmitter} from 'events';
import * as path from 'path';
let Promise = require('bluebird');

let program, argv;

class Option{

  constructor(flags, info, parser){

    parser = (parser && kindof(parser).fn)
           ? parser : noop;

    info   = (info   && kindof(info).string)
           ? info   : 'No Information provided';

    flags  = (flags   && kindof(flags).string)
           ? flags   : console.error('Command.option(): First argument, flags, must be defined!');

    this.parser = parser;
    this.flags  = flags;
    this.info   = info;

    this._isParsed = false;
  }


  get value() {
    this._value = this._value || this.parser(  argv[this.name]  );
    return this._value;
  }

  get name() {
    !this._name && this.parseFlags();
    return this._name;
  }

  get isRequired() {
    !this._required && this.parseFlags();
    return this._required;
  }

  get isOptional() {
    !this._optional && this.parseFlags();
    return this._optional;
  }

  parseFlags() {
    let short = this.flags.match(/^\-([a-z]+)/)[1];
    let long  = this.flags.match(/\-\-([a-z]+)/)[1];

    this._name     =  (  argv[short] && short  ) || (  argv[long] && long  );

    this._required = /\</.test(this.flags);
    this._optional = /\[/.test(this.flags);
    return this;
  }
}

class Command{
  constructor(name, args) {
    this.name   = name;
    this._args  = args;
    this._argv  = {_:[]};
    this._execs = {};
    this.isPrompts = false;
    this._prompts  = {load:[], lazy:[]};
    this.isExec    = false;
    this.options   = {};
    return this;
  }

  get isCmd() {
    return this._alias
      ? (this.alias === program.cmd)
      : (this.name  === program.cmd);
  }

  get opts() {
    return this._opts || this.getOPtions();
  }

  get argv() {

    return this._isParsed ? this._argv : this.parseArgv();
  }

  getOPtions() {
    this._isOpts = this._isOpts || false;
    if (!this._opts) {
      this._opts = {};
      for (let name in this.options) {
        this._opts[name] = this.options[name].value;
        program
          .when(this.name)
          .then(program.emit.bind(program, name));
      }
      this._isOpts = true;
    }
  }

  parseArgv() {

    let args    = this._args;
    let _args   = argv._.slice(1);
    let length  = args.length;
    if (length) {
      while(args.length) {
        let key    = args.shift();
        let value  = _args.shift();

        let parsed = parseArg(arg);
        if (value) {
          parsed.required &&(  this._argv[parsed.name] = value  );
          parsed.optional &&(  this._argv[parsed.name] = value  );
        }
        else if (parsed.required) {
          return console.error('Argument required');
        }
      }
    }
    this._isParsed = true;
    return this._argv;
  }

  alias(substr) {
    kindof(substr).string
      &&( this._alias = substr.trim() );
    return this;
  }

  description(substr) {
    kindof(substr).string
      &&( this._description = substr );
    return this;
  }

  _load_promp() {
    return this._prompts.load.length
      ? ask(this._prompts.load)
      : Promise.resolve(this._prompts.lazy);
  }

  prompt(question) {

    let when = question.onLoad ? 'load' : 'lazy';
    question.onLoad && delete question.onLoad;
    this._prompts.load.push(question);
    this.isPrompts = true;
    return this;
  }

  option(name, info, parser) {
    var self = this;
    var opt = new Option(name, info, parser);

    this.options[opt.name] = opt;

    program.when(this.name)
      .then(function(){
        return program.when(opt.name);
      })
      .then(function(){
        self._isOpts = true;
        self._opts[opt.name] = opt.value;
      });
    return this;
  }

  action(fn) {
    var self = this, _action;
    return program.when(this.name)
      .then(function() {
        return self.isCmd;
      })
      .then(function(valid) {
        if (valid) {
          _action = fn.bind(self, self.argv, self._opts);
          return !!self._prompts.load.length;
        }
      })
      .then(function(askOnLoad) {
        return askOnLoad && self._load_promp();
      })
      .then(function(answers) {
        return _action(answers);
      });
  }

  execute(execPath) {
    execPath = /\//.test(execPath)
        ? execPath
        : program.cmdDir(execPath);


    this.isExec   = true;
    this.execPath = execPath;
    var basename  = path.basename(execPath);
    var executeable = function(...args) {
      return require(execPath).action.apply(this, args);
    };
    return this.action(executeable);
  }

}

class Program extends EventEmitter{

  constructor(_argv) {

    super();

    argv = _argv;
    this.args = argv._;
    this.argv = argv;
    this._commands = {};
    this.cmdDir = path.join.bind(path, require.main.filename, '../../');

  }

  register(cmd) {
    this._commands[cmd.name] = cmd;
  }

  run() {
    this.cmd = this.args[0];
    this.emit(this.cmd);
    for (let index in this.argv) {
      this.emit(this.argv[index]);
    }
  }

  when(evt) {
    let self = this;
    return new Promise(
      function(resolve) {
        self.on(evt, function(payload) {
          resolve(payload);
        });
      }
    );
  }
}

export function configure(argv) {
  if (!program) {
    program = new Program(argv);
    program.emit('start', program.cmd);
  }
  return program;
}

export function command(name, ...args) {
  var cmd = new Command(name, args);
  program.register(cmd);
  return cmd;
}



