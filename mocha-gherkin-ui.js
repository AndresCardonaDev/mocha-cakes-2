'use strict';

const Mocha = require('mocha');
const Suite = require('mocha/lib/suite');
const GherkinTest = require('./lib/GherkinTest');
const GherkinSuite = require('./lib/GherkinSuite');

const programParams = require('minimist')(process.argv.slice(2));

Mocha.interfaces['mocha-gherkin-ui'] = module.exports = mochaCakes;

const _commasToArray = (str) => {
  if(str) {
    return str.split(',').map(s=>s&&s.trim()).filter(s=>!!s)
  }
  return undefined;
}

const ourParams = {
  /**
   * Three options: [default|absolute|moderate]
   * [original]: Leaves out default mocha test execution, no changes respect to what you are used to.
   * [absolute]: Once 'Given'|'When'|'Then'|'And'|'But' fails, all subsequent steps within an scenario will be skipped.
   * [moderate]: When a step 'Given'|'When'|'Then' or a sub-step like 'And'|'But' fails, it will skip only from subsequent main step, all substeps following a main step will be executed (Recommended).
   * Default: moderate
   */
  mochaGherkinUiSkipMode: /^(original|absolute|moderate)$/.exec(programParams.mochaGherkinUiSkipMode) ? programParams.mochaGherkinUiSkipMode : 'moderate',
  /**
   * Comma separated filters, for the given Tags on Scenarios or Features.
   */
  mochaGherkinUiFilterTags: _commasToArray(programParams.mochaGherkinUiFilterTags)
};

function mochaCakes(suite) {
  var suites = [suite];

  suite.on('pre-require', function (context, file, mocha) {
    var common = require('mocha/lib/interfaces/common')(suites, context, mocha);

    context.run = mocha.options.delay && common.runWithSuite(suite);

    var wrapperCreator = createWrapper(file, suites, context, mocha);
    var testTypeCreator = createTestType(file, suites, mocha);

    context.after = common.after;
    context.afterEach = common.afterEach;
    context.before = common.before;
    context.beforeEach = common.beforeEach;

    context.Scenario = wrapperCreator('Scenario');
    context.Feature = wrapperCreator('Feature');

    context.Tags = tagsFunctionCreator(context);

    context.Given = testTypeCreator('Given');
    context.When = testTypeCreator('When');
    context.Then = testTypeCreator('Then');
    context.And = testTypeCreator('And');
    context.But = testTypeCreator('But');

    // lower-case aliases
    context.tags = context.Tags;
    context.scenario = context.Scenario;
    context.feature = context.Feature;
    context.given = context.Given;
    context.when = context.When;
    context.then = context.Then;
    context.and = context.And;
    context.but = context.But;
  });
}

function tagsFunctionCreator(context) {

  //Tag function.
  return (...tags)=>{
    // Decorator for a GherkinSuite definition, adding tags filtering.
    const tagsWrapper = (fn) => {
      let tagFunction = (...args) => {
        return fn(...args, tags);
      };
      tagFunction.skip = (...args) => {
        return fn.skip(...args);
      };
      tagFunction.only = (...args) => {
        return fn.only(...args, args);
      }

      return tagFunction;
    }

    //Return only Suites, tagging should only apply to Suites.
    return {
      Scenario: tagsWrapper(context.Scenario),
      Feature: tagsWrapper(context.Feature),
    }
  };
}

/**
 *  Helper functions
 **/

function createTestType(file, suites, mocha) {
  return function testTypeCreator(type) {
    function testType(title, fn) {
      let suite = suites[0];
      if (suite.pending) fn = null;

      let test = new GherkinTest(title, fn, type, file, ourParams);

      suite.addTest(test);

      return test;
    }

    testType.skip = function skip(title) {
      return testType(title);
    };

    testType.only = function only(title, fn) {
      var test = testType(title, fn);
      mocha.grep(test.fullTitle());
      return test;
    };

    return testType;
  };
}


function createWrapper(file, suites, context, mocha) {
  return function wrapperCreator(type) {
    function createLabel(title) {
      return type ? `${type}: ${title}` : title;
    }
    // Didn't like the fact that i had to modify the number of parameters, but apparently there is no other way to reenable a skipped test after the steps encapsulated here are executed.
    function wrapper(title, fn, tags) {
      //var suite = Suite.create(suites[0], createLabel(title));

      let suite = new GherkinSuite(title, suites[0],type, ourParams);
      if(ourParams.mochaGherkinUiFilterTags) {
        //We skip all the suites, so only tags matching are executed.
        suite.pending = true;
        //We need to to this here, mocha handles the state at this point an apparently there is no way to skip a Suite, as i could see in https://github.com/mochajs/mocha/issues/332
        suite.filterByTags(tags);
      }
      if (!suite.pending) {
        suite.file = file;
        suites.unshift(suite);
        fn.call(suite);
        suites.shift();
      }

      return suite;
    }

    wrapper.skip = function skip(title, fn) {
      var suite = Suite.create(suites[0], createLabel(title));

      suite.pending = true;
      suite.manuallySkipped = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };

    wrapper.only = function only(title, fn) {
      var suite = wrapper(title, fn);
      mocha.grep(suite.fullTitle());
      return suite;
    };

    return wrapper;
  };
}
