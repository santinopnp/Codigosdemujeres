"use strict";
const epayco = require("epayco-sdk-node");

let _client = null;

function getEpaycoClient() {
  if (_client) return _client;
  if (!process.env.EPAYCO_PUBLIC_KEY || !process.env.EPAYCO_PRIVATE_KEY) {
    throw new Error("ePayco credentials not configured (EPAYCO_PUBLIC_KEY / EPAYCO_PRIVATE_KEY)");
  }
  _client = epayco({
    apiKey:     process.env.EPAYCO_PUBLIC_KEY,
    privateKey: process.env.EPAYCO_PRIVATE_KEY,
    lang:       "ES",
    test:       process.env.EPAYCO_TEST_MODE === "true",
  });
  return _client;
}

module.exports = { getEpaycoClient };
