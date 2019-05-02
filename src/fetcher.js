/** This file contains critical functions that allow fetching a robust
* estimation for LUNA (here ETH) for various major foreign currencie.
*
* It has two steps: 1) Getting a matrix of ETH -> foreign currency data from 5 major exchanges
* 2) Then a best effort missing value estimation using 3 feeds of FX APIs
*
* Due to using 5 data feeds for crypto and 3 feeds for FX rates, this program is robust and has
* enough failsafe mechanisms built in
*/

const ccxt = require('ccxt');
const forex = require('./forex');
const config = require('../config/constant.json');


/* eslint-disable */
const ccxtExchanges = {
  coinmarketcap: new ccxt.coinmarketcap(),
  bitfinex: new ccxt.bitfinex(),
  kraken: new ccxt.kraken(),
  coinbasepro: new ccxt.coinbasepro(),
  okex: new ccxt.okex(),
};
/* eslint-enable */

const LUNA = 'ETH';

const InternalFunctions = {
  denomMapper(denoms) {
    const newDenoms = [];
    for (let i = 0; i < denoms.length; i += 1) {
      if (Object.prototype.hasOwnProperty.call(config.FX_CURRENCY_MAP, denoms[i]) === true) {
        const denom = config.FX_CURRENCY_MAP[denoms[i]];
        newDenoms.push(denom);
      }
    }
    return newDenoms;
  },

  async getRateByExchange(exchange, currency) {
    let rate;
    try {
      rate = (await ccxtExchanges[exchange].fetchTicker(`${LUNA}/${currency}`)).last;
    } catch (e) {
      rate = null;
    }
    return {
      exchange,
      currency,
      rate,
    };
  },

  getMedian(numbers) {
    const sorted = numbers.slice().sort();
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  },

  async getForexExchangeRates(denoms) {
    const exchangeRates = await forex.getForexRates(denoms);
    const medianRates = {};
    for (let i = 0; i < denoms.length; i += 1) {
      const denom = denoms[i];
      const rates = [];
      for (let j = 0; j < 3; j += 1) {
        if (exchangeRates[j].error === false) {
          rates.push(exchangeRates[j].parsedFXData[denom]);
        }
      }
      medianRates[config.FX_CURRENCY_MAP[denoms]] = InternalFunctions.getMedian(rates);
    }
    return medianRates;
  },

  async getExchangeCurrencyMap(excahnges, denoms) {
    const ratePromises = [];
    for (let excahngesIdx = 0; excahngesIdx < excahnges.length; excahngesIdx += 1) {
      const exchange = excahnges[excahngesIdx];
      for (let denomsIdx = 0; denomsIdx < denoms.length; denomsIdx += 1) {
        const denom = denoms[denomsIdx];
        ratePromises.push(InternalFunctions.getRateByExchange(exchange, denom));
      }
    }

    const rateResults = await Promise.all(ratePromises);
    const exchangeCurrencyMap = {};

    for (let excahngesIdx = 0; excahngesIdx < excahnges.length; excahngesIdx += 1) {
      const exchange = excahnges[excahngesIdx];
      exchangeCurrencyMap[exchange] = {};
    }

    for (let rateResultsIdx = 0; rateResultsIdx < rateResults.length; rateResultsIdx += 1) {
      const rateResult = rateResults[rateResultsIdx];
      exchangeCurrencyMap[rateResult.exchange][rateResult.currency] = rateResult.rate;
    }

    return exchangeCurrencyMap;
  },

  getMedianRatesWithForexInferredRates(exchangeCurrencyMap, usdExchangeRates, exchanges, denoms) {
    const medianDenoms = {};
    for (let denomsIdx = 0; denomsIdx < denoms.length; denomsIdx += 1) {
      const denom = denoms[denomsIdx];
      const rates = [];
      for (let exchangesIdx = 0; exchangesIdx < exchanges.length; exchangesIdx += 1) {
        const exchange = exchanges[exchangesIdx];
        if (exchangeCurrencyMap[exchange][denom] === null) {
          if (Object.prototype.hasOwnProperty.call(usdExchangeRates, denom)) {
            const usdInferredExchangeRate = usdExchangeRates[denom
            ] * exchangeCurrencyMap[exchange].USD;
            rates.push(usdInferredExchangeRate);
          }
        } else {
          rates.push(exchangeCurrencyMap[exchange][denom]);
        }
      }
      medianDenoms[config.FX_CURRENCY_MAP_REVERSE[denom]] = InternalFunctions.getMedian(rates);
    }
    return medianDenoms;
  },
};


async function fetchWithFallback(denoms) {
  const mappedDenoms = InternalFunctions.denomMapper(denoms);
  const denomsWithUSD = mappedDenoms.slice(0);
  if (denomsWithUSD.includes('USD') === false) {
    denomsWithUSD.push('USD');
  }
  const exchangeNames = Object.keys(ccxtExchanges);
  const exchangeCurrencyMap = await InternalFunctions.getExchangeCurrencyMap(exchangeNames,
    denomsWithUSD);
  const usdExchangeRates = await InternalFunctions.getForexExchangeRates(denoms);
  return InternalFunctions.getMedianRatesWithForexInferredRates(exchangeCurrencyMap,
    usdExchangeRates, exchangeNames, mappedDenoms);
}


module.exports = {
  fetchWithFallback,
};

fetchWithFallback(['jpt', 'gbt', 'krt'])
  .then((res) => {
    console.log(res);
  })
  .catch((e) => {
    console.log(e);
  });
