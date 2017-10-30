# Making Gherkin language use with mocha Easy

Mocha Gherkin UI is a [Gherkin](https://github.com/cucumber/cucumber/wiki/Gherkin)/[Cucumber](https://cucumber.io/) syntax UI integration for [Mocha](https://mochajs.org/) testing framework.

Allows you to:
 
- Use common Gherking language to define your features and scenarios.

```javascript
Feature('some feature', () => {
  Scenario('some scenario.', () => {
    Given('some precondition', () => {});
    And('another precondition', () => {});
    
    When('stimulus', () => {});

    Then('postcondition', () => {});
    But('another postcondition', () => {})
  });
});
```

- Allows you to define special tags to identify your Features or scenarios and filter them in execution
```javascript
Tag('critical', 'JIRA-1145')
.Feature('some feature', () => {
  Scenario('some scenario.', () => {
    ...
  });
});

Feature('some feature', () => {
  Scenario('some scenario.', () => {
    ...
  });
  Tag('critical')
  .Scenario('some scenario.', () => {
    ...
  });
});
```

- And, allows two test execution skip patterns on fail based on the Gherkin language:

*Moderated* (configured by default)
Will allow all complementary steps execution to let you see complete scenario from a main step and will skip the subsequent main steps (Given, When, Then)
```
    Feature: some
      Scenario: some
        ✓ Given prec
        ✗ And 2nd prec
        ✓ And 3rd prec
        ✗ And 4th prec
        ✓ But 5th prec
        - When stimulus
        - and another stimulus
        - Then postCond
        - But another postCond
```

Absolute: (*Concept introduced by @asyncadventures at [mocha-steps](https://www.npmjs.com/package/mocha-steps) *)
```
    Feature: some
      Scenario: some
        ✓ Given prec
        ✗ And 2nd prec
        - And 3rd prec
        - And 4th prec
        - But 5th prec
        - When stimulus
        - and another stimulus
        - Then postCond
        - But another postCond
```

Original: (*The one you are used to*)
```
    Feature: some
      Scenario: some
        ✓ Given prec
        ✗ And 2nd prec
        ✓ And 3rd prec
        ✗ And 4th prec
        ✓ But 5th prec
        ✗ When stimulus
        ✗ and another stimulus
        ✗ Then postCond
        ✗ But another postCond
```
## Installation

NPM:

```
npm install --save-dev mocha-gherking-ui
```

## Usage

Indicate mocha you are going to use `mocha-gherkin-ui` as a mocha integration using `--ui mocha-gherkin-ui` option on mocha command:

``` javascript
mocha --ui mocha-gherkin-ui path/to/my/tests
```

If you like specify which type of skip do you prefer `moderate`, `absolute` or `original` (By default `moderate`):

``` javascript
mocha --ui mocha-gherkin-ui --mochaGherkinUiSkipMode absolute path/to/my/tests 
```

And be able to filter by the tags you gave, the test you want to run
``` javascript
mocha --ui mocha-gherkin-ui --mochaGherkinUiSkipMode absolute --mochaGherkinUiFilterTags critical,system1,anything path/to/my/tests 
```


## Acknowledgements

Started by studying the code from @iensu in [mocha-cakes-2](https://github.com/iensu/mocha-cakes-2);
the good examples in the @mochajs wiki [Mocha wiki](https://github.com/mochajs/mocha/wiki)
and the ideas from @asyncadventures [mocha-steps](https://github.com/rprieto/mocha-steps) 
