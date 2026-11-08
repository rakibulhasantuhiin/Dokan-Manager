import test from 'node:test';
import assert from 'node:assert/strict';
import { toBengaliNumber, fromBengaliNumber, formatTaka, formatBengaliDate } from './bengali';

test('converts English digits to Bengali numerals', () => {
  assert.equal(toBengaliNumber(0), '০');
  assert.equal(toBengaliNumber(123456789), '১২৩৪৫৬৭৮৯');
  assert.equal(toBengaliNumber('6384'), '৬৩৮৪');
});

test('converts Bengali numerals back to English digits', () => {
  assert.equal(fromBengaliNumber('৬৩৮৪'), '6384');
  assert.equal(fromBengaliNumber('১২৩৪'), '1234');
});

test('formats Taka with Bengali symbol and commas', () => {
  assert.equal(formatTaka(0), '৳ ০');
  assert.equal(formatTaka(6384), '৳ ৬,৩৮৪');
  assert.equal(formatTaka(100000), '৳ ১,০০,০০০');
});

test('formats dates in Bengali format', () => {
  const date = new Date(2026, 10, 8); // November 8, 2026
  assert.equal(formatBengaliDate(date), '৮ নভে, ২০২৬');
});
