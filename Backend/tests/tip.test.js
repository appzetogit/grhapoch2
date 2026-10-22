import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTipAmount, MAX_TIP_AMOUNT } from '../src/modules/food/orders/helpers/tip.helper.js';
import { validateCreateOrderDto, validateCalculateOrderDto } from '../src/modules/food/orders/validators/order.validator.js';

test('normalizeTipAmount: valid values pass through as whole rupees', () => {
  assert.equal(normalizeTipAmount(20), 20);
  assert.equal(normalizeTipAmount('50'), 50);
  assert.equal(normalizeTipAmount(30.9), 30);
});

test('normalizeTipAmount: invalid, negative or missing becomes 0', () => {
  for (const v of [undefined, null, '', 'abc', NaN, Infinity, -5, 0]) {
    assert.equal(normalizeTipAmount(v), 0, `value ${String(v)}`);
  }
});

test('normalizeTipAmount: capped at MAX_TIP_AMOUNT', () => {
  assert.equal(normalizeTipAmount(MAX_TIP_AMOUNT), MAX_TIP_AMOUNT);
  assert.equal(normalizeTipAmount(100000), MAX_TIP_AMOUNT);
});

const baseCalc = {
  items: [{ itemId: 'i1', name: 'Dosa', price: 100, quantity: 1 }],
  restaurantId: 'r1',
};

test('calculate validator accepts tip and rejects negative tip', () => {
  assert.equal(validateCalculateOrderDto({ ...baseCalc, tip: 30 }).tip, 30);
  assert.equal(validateCalculateOrderDto(baseCalc).tip, undefined);
  assert.throws(() => validateCalculateOrderDto({ ...baseCalc, tip: -1 }));
});

test('create-order validator keeps pricing.tip', () => {
  const dto = validateCreateOrderDto({
    items: baseCalc.items,
    restaurantId: 'r1',
    address: { street: 's', city: 'c', state: 'st' },
    pricing: { subtotal: 100, tip: 20, total: 120 },
    paymentMethod: 'cash',
  });
  assert.equal(dto.pricing.tip, 20);
});
