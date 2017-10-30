'use strict';

const execFile = require('child_process').execFile;
const path = require('path');

var testEnv = Object.assign({}, process.env, { NODE_PATH: __dirname });

function execTestFile(file, opts) {
  opts = Object.assign({ reporter: 'spec' }, opts);
  var args = [
    '--require', path.join(__dirname, '../mocha-gherkin-ui.js'),
    '--ui', 'mocha-gherkin-ui',
    '--reporter', opts.reporter,
    path.join(__dirname, file)
  ];
  //return execFile('mocha', args, { env: testEnv });
  return new Promise((resolve)=>{
    execFile('mocha', args, {env: testEnv}, (err, stdOut, stErr) => {
      if(err)
        resolve(stdOut);
      else
        resolve(stdOut);
    });
  });
}

module.exports = {
  execTestFile: execTestFile
};
