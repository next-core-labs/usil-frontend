import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ibanProblem, isValidSaudiIban, mobileProblem, vatProblem } from './vendorContactChecks.ts';

describe('vendor contact checks', () => {
  it('accepts a real Saudi IBAN in any spacing and case, and refuses typos', () => {
    assert.equal(isValidSaudiIban('SA03 8000 0000 6080 1016 7519'), true);
    assert.equal(isValidSaudiIban('sa0380000000608010167519'), true);
    assert.equal(isValidSaudiIban('SA0380000000608010167518'), false);
    assert.equal(isValidSaudiIban('SA12'), false);
    assert.equal(ibanProblem(''), '');
    assert.notEqual(ibanProblem('SA00'), '');
  });

  it('checks VAT numbers and mobiles only when given', () => {
    assert.equal(vatProblem(''), '');
    assert.equal(vatProblem('310123456700003'), '');
    assert.notEqual(vatProblem('12345'), '');
    assert.equal(mobileProblem('0551234567'), '');
    assert.notEqual(mobileProblem('123'), '');
  });
});
