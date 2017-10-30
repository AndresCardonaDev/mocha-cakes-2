const Suite  = require('mocha/lib/suite');

const _includesAny = (arr1, arr2) => {
  if (!arr1 || !arr2) return false;
  if (!arr1.length || !arr2.length) return false;

  return arr2.every((a2)=>arr1.includes(a2));
}

module.exports = class GherkinSuite extends Suite {

  /**
   * Extends original mocha Suite type, Allowing tag based filtering..
   *
   * @param title
   * @param fn
   * @param type
   * @param file
   */
  constructor(title, parent, type, gherkinConf) {
    let suiteName = type ? `${type}: ${title}` : title;

    super(suiteName, parent.ctx);

    this.parent = parent;
    this.gherkinType = type;
    this.gherkinConf = gherkinConf;

    parent.addSuite(this);
  }

  filterByTags(tags) {
    if (!this.manuallySkipped && _includesAny(tags, this.gherkinConf.mochaGherkinUiFilterTags)) {
      this.pending = false;
    }
  }
}