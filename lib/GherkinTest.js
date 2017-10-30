const Test  = require('mocha/lib/test');

module.exports = class GherkinTest extends Test {

  /**
   * Extends original mocha Test type, allowing to cancel Scenario execution on test failure.
   * Test execution is particular, will focus on stopping subsequent main blocks (Given, When, Then), but not
   * complement blocks (i.e And, But); this is friendly with Preconditions evaluation for example, where you need to
   * know which of all preconditions failed, and which passed; where with mocha's bail option you will need to run
   * multiple times to have a perspective of the complete set of failures; the above applies for Stimulus, and also
   * for Postconditions.
   *
   * @param title
   * @param fn
   * @param type
   * @param file
   */
  constructor(title, fn, type, file, gherkinConf) {
    let _async = (resolve) => this.decorateAsyncExecution(fn, resolve);
    let _sync = () => this.decorateSyncExecution(fn);
    let testName = type ? `${type} ${title}` : title;

    super(testName, !fn ? undefined : fn.length > 0 ? _async : _sync);

    this.file = file;
    this.gherkinType = type;
    this.originalCallback = fn;
    this.gherkinConf = gherkinConf;
  }

  /**
   * Original author: https://github.com/rprieto
   * Function obtained: from https://github.com/rprieto/mocha-steps/blob/master/lib/step.js
   * @param testCallback
   * @param testInstance
   * @param done
   */
  decorateAsyncExecution(testCallback, done) {
    const onError = () => {
      this.cancelSubsequentStepsExecution(this);
      process.removeListener('uncaughtException', onError);
    }

    process.addListener('uncaughtException', onError);

    try {
      testCallback.call(this.ctx, function(err) {
        if (err) {
          onError();
          done(err);
        } else {
          process.removeListener('uncaughtException', onError);
          done(null);
        }
      });
    } catch(ex) {
      onError();
      throw ex;
    }
  }

  /**
   * Original author: https://github.com/rprieto
   * Function obtained: from https://github.com/rprieto/mocha-steps/blob/master/lib/step.js
   * @param testCallback
   * @param testInstance
   * @returns {*}
   */
  decorateSyncExecution(testCallback) {
    try {
      let result = testCallback.apply(this.ctx);
      //If a promise was returned.
      if (!!result && !!result.then && !!result.catch) {
        return result.catch((err) => {
          this.cancelSubsequentStepsExecution(this);
          throw err;
        });
      }
      return result;
    } catch(err) {
      this.cancelSubsequentStepsExecution(this);
      throw err;
    }
  }

  findNextMainBlockIndex() {
    const isComplementExpression = /^(And|But)$/i;
    let index = this.parent.tests.indexOf(this);

    do {
      index++;
    } while(this.parent.tests[index] && this.parent.tests[index].gherkinType.match(isComplementExpression));

    return index;
  }

  /**
   * Marks any subsequent step as pending, to avoid executiong. Analyze if is an extension test like AND, and only stops execution of subsequent main blocks.
   * (Made based on https://github.com/rprieto/mocha-steps/blob/master/lib/step.js)
   * @param test
   */
  cancelSubsequentStepsExecution() {
    if (this._retries !== -1 && this._currentRetry < this._retries) {
      return;
    }
    let tests = this.parent.tests;
    let startingIndex;

    switch (this.gherkinConf.mochaGherkinUiSkipMode) {
      case 'moderate':
        startingIndex = this.findNextMainBlockIndex()
        break;
      case 'absolute':
        startingIndex = this.parent.tests.indexOf(this) + 1;
        break;
      default:
        startingIndex = test.length;
        break;
    }

    for (var index = startingIndex; index < tests.length; index++) {
      var testToStop = tests[index];
      testToStop.pending = true;
    }

    //Set back original callback, so reporters can show the original code and not the decorators one.
    this.fn = this.originalCallback;
    this.body = this.originalCallback.toString();
  }

  /**
   * Invokes original Mocha Test.run inherited from Mochas Runnable; after this is completed, the decorator
   * for sync or async execution is not needed anymore, so in order to leave information rich and precise for reporters
   * the original fn, is restored.
   * @param fn
   */
  run(fn) {
    super.run(fn);

    this.fn = this.originalCallback;
    this.body = this.fn.toString();
  }
}