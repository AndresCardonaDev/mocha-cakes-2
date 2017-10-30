'use-strict';

Feature('Testing selective skipping', function () {

  Scenario('Sub steps should not be skipped', function () {

    Given('executed', function () {
      true.should.equal(false);
    });
    And('executed', function () {
      true.should.equal(false);
    });
    And('executed', function () {
      true.should.equal(true);
    });
    But('executed', function () {
      true.should.equal(true);
    });

    When('omitted', function () {
      true.should.equal(true);
    });

    Then('omitted', function () {
      true.should.equal(true);
    });
  });

  Scenario('Skip all subsequent main steps', function () {

    Given('executed', function () {
      true.should.equal(false);
    });

    When('omitted', function () {
      true.should.equal(true);
    });

    And('omitted', function () {
      true.should.equal(true);
    });

    But('omitted', function () {
      true.should.equal(true);
    });

    Then('omitted', function () {
      "everything".should.be.ok;
    });

    And('omitted', function () {
      true.should.equal(true);
    });

    But('omitted', function () {
      true.should.equal(true);
    });
  })
});
