'use strict';

const pathFormat = require('..');
const assert = require('assert').strict;

assert.strictEqual(pathFormat(), 'Hello from pathFormat');
console.info("pathFormat tests passed");
