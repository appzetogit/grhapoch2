import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveDonationAmount,
  getDonationOptions,
  normalizeDonationAmounts,
  MAX_DONATION_AMOUNT,
  MAX_DONATION_OPTIONS,
} from '../src/modules/food/orders/helpers/donation.helper.js';
import { validateFeeSettingsUpsertDto } from '../src/modules/food/admin/validators/feeSettings.validator.js';
import { validateCalculateOrderDto, validateCreateOrderDto } from '../src/modules/food/orders/validators/order.validator.js';

const on = { donationEnabled: true, donationAmounts: [5, 10, 20] };

test('normalizeDonationAmounts: unique, ascending, whole rupees, valid range only', () => {
  assert.deepEqual(normalizeDonationAmounts([20, 5, 5, 10.9, 0, -3, 'x', 5000]), [5, 10, 20]);
  assert.deepEqual(normalizeDonationAmounts(undefined), []);
  assert.equal(normalizeDonationAmounts(Array.from({ length: 30 }, (_, i) => i + 1)).length, MAX_DONATION_OPTIONS);
  assert.deepEqual(normalizeDonationAmounts([MAX_DONATION_AMOUNT]), [MAX_DONATION_AMOUNT]);
});

test('getDonationOptions: empty when disabled, falls back to legacy single amount', () => {
  assert.deepEqual(getDonationOptions(on), [5, 10, 20]);
  assert.deepEqual(getDonationOptions({ ...on, donationEnabled: false }), []);
  assert.deepEqual(getDonationOptions({}), []);
  assert.deepEqual(getDonationOptions({ donationEnabled: true, donationAmount: 7 }), [7]);
  assert.deepEqual(getDonationOptions({ donationEnabled: true, donationAmounts: [], donationAmount: 7 }), [7]);
});

test('resolveDonationAmount: only admin-configured presets are accepted', () => {
  assert.equal(resolveDonationAmount(on, 10), 10);
  assert.equal(resolveDonationAmount(on, '20'), 20);
  assert.equal(resolveDonationAmount(on, 15), 0, 'not a preset');
  assert.equal(resolveDonationAmount(on, 0), 0);
  assert.equal(resolveDonationAmount(on, -5), 0);
  assert.equal(resolveDonationAmount(on, true), 0, 'boolean no longer accepted');
  assert.equal(resolveDonationAmount(on, undefined), 0);
  assert.equal(resolveDonationAmount({ ...on, donationEnabled: false }, 10), 0);
  assert.equal(resolveDonationAmount(undefined, 10), 0);
});

test('fee settings validator: accepts preset list, dedupes and sorts, rejects bad values', () => {
  const ok = validateFeeSettingsUpsertDto({ donationEnabled: true, donationAmounts: [20, 5, 10, 5] });
  assert.equal(ok.donationEnabled, true);
  assert.deepEqual(ok.donationAmounts, [5, 10, 20]);
  assert.deepEqual(validateFeeSettingsUpsertDto({ donationAmounts: [] }).donationAmounts, []);
  assert.equal(validateFeeSettingsUpsertDto({ donationEnabled: true }).donationAmounts, undefined);
  assert.throws(() => validateFeeSettingsUpsertDto({ donationAmounts: [0] }));
  assert.throws(() => validateFeeSettingsUpsertDto({ donationAmounts: [-5] }));
  assert.throws(() => validateFeeSettingsUpsertDto({ donationAmounts: [5.5] }));
  assert.throws(() => validateFeeSettingsUpsertDto({ donationAmounts: [5000] }));
  assert.throws(() => validateFeeSettingsUpsertDto({ donationAmounts: Array.from({ length: 11 }, (_, i) => i + 1) }));
});

const items = [{ itemId: 'i1', name: 'Dosa', price: 100, quantity: 1 }];

test('order validators accept the chosen donation amount', () => {
  assert.equal(validateCalculateOrderDto({ items, restaurantId: 'r1', donation: 10 }).donation, 10);
  assert.throws(() => validateCalculateOrderDto({ items, restaurantId: 'r1', donation: -1 }));
  const dto = validateCreateOrderDto({
    items,
    restaurantId: 'r1',
    address: { street: 's', city: 'c', state: 'st' },
    pricing: { subtotal: 100, donation: 10, total: 110 },
    paymentMethod: 'cash',
  });
  assert.equal(dto.pricing.donation, 10);
});
