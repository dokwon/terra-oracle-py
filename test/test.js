const assert = require('assert');
const rewire = require('rewire');

const app = rewire('../src/fetcher');
/* eslint-disable */
const fetcher = app.__get__('InternalFunctions');
/* eslint-enable */

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe('fetcher', () => {

  describe('#fetchWithFallback()', () => {

    it('should return json with values given in denoms', async () => {
      let result = await app.fetchWithFallback(['ust', 'jpt']);
      result = result.result;
      console.log(result);
      assert.equal('ust' in result && 'jpt' in result && Object.keys(result).length === 2, true);
      for (var elem in result) {
        if (result.hasOwnProperty(elem)) {
          assert.equal(typeof result[elem] === 'number', true);
        }
      }
    });
    it('should return json with all seven values given in denoms', async () => {
      let result = await app.fetchWithFallback(['ust', 'krt', 'cnt', 'jpt', 'eut', 'gbt']);
      result = result.result;
      console.log(result);
      assert.equal('ust' in result && 'krt' in result && 'cnt' in result && 'jpt' in result && 'eut' in result && 'gbt' in result && Object.keys(result).length === 6, true);
      for (var elem in result) {
        if (result.hasOwnProperty(elem)) {
          assert.equal(typeof result[elem] === 'number', true);
        }
      }
    });
  });

  describe('#getMedian()', () => {
    it('should return median', () => {
      assert.equal(fetcher.getMedian([9, 3, 10]), 9);
    });
    it('should return median', () => {
      assert.equal(fetcher.getMedian([8, 10.3, 6.1, 8]), 8);
    });
    it('should return median', () => {
      assert.equal(fetcher.getMedian([8, 10.3, 6.1, 9]), 8.5);
    });
    it('should return median', () => {
      assert.equal(fetcher.getMedian([8, 10.3, 6.1, 9, 8.6]), 8.6);
    });
    it('should return median', () => {
      assert.equal(fetcher.getMedian([0.1, 0.001, 5, 0.963]), 0.5315);
    });
  });

  describe('#getForexExchangeRates()', () => {
    it('should return json with values given in denoms', async () => {
      let result = await fetcher.getForexExchangeRates(['ust', 'jpt']);
      console.log(result);
      assert.equal('ust' in result && 'jpt' in result && Object.keys(result).length === 2, true);
      for (var elem in result) {
        if (result.hasOwnProperty(elem)) {
          assert.equal(typeof result[elem], 'number');
        }
      }
    });

    it('should return json with all seven values given in denoms', async () => {
      let result = await fetcher.getForexExchangeRates(['ust', 'krt', 'cnt', 'jpt', 'eut', 'gbt']);
      console.log(result);
      assert.equal('ust' in result && 'krt' in result && 'cnt' in result && 'jpt' in result && 'eut' in result && 'gbt' in result && Object.keys(result).length === 6, true);
      for (var elem in result) {
        if (result.hasOwnProperty(elem)) {
          assert.equal(typeof result[elem], 'number');
        }
      }
    });
  });
});

