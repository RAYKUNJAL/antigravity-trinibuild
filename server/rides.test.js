const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRides, HONEST_EMPTY_LINE_1, HONEST_EMPTY_LINE_2 } = require('./rides');

function tmpStore() {
  return path.join(os.tmpdir(), `rides-v1-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
}

function kyc(extra = {}) {
  return {
    name: 'Maya',
    phone: '8685550100',
    plate: 'PAA 1234',
    permitPhoto: 'data:image/jpeg;base64,aaa',
    insurancePhoto: 'data:image/jpeg;base64,bbb',
    platePhoto: 'data:image/jpeg;base64,ccc',
    facePhoto: 'data:image/jpeg;base64,ddd',
    ...extra,
  };
}

const storePath = tmpStore();
const env = {};
const rides = createRides({ storePath, getEnv: (k) => env[k] });

const empty = rides.ridesDirectory();
assert.strictEqual(empty.listedCount, 0);
assert.strictEqual(empty.unavailable, true);
assert.strictEqual(empty.line1, HONEST_EMPTY_LINE_1);
assert.strictEqual(empty.line2, HONEST_EMPTY_LINE_2);
assert.strictEqual(empty.line1, 'Rides are unavailable on this origin.');
assert.strictEqual(empty.line2, 'No drivers are listed. Juvay does not invent a fare or a live booking button.');

assert.strictEqual(rides.subscriptionPriceCents(), null);
const blocked = rides.apply(kyc());
assert.ok(blocked.driver);
assert.strictEqual(blocked.driver.approved, false);
assert.strictEqual(blocked.driver.listed, false);
assert.ok(blocked.goOnline.reason.includes('Apply still works'));
assert.strictEqual(blocked.fulfill, false);

const missing = rides.apply({ name: 'Maya', phone: '8685550100', plate: 'PAA 1234' });
assert.ok(missing.error.includes('KYC'));

const mapped = rides.apply(kyc({ lat: 10.6 }));
assert.ok(mapped.error.includes('No map'));

assert.strictEqual(rides.ridesDirectory().listedCount, 0, 'unapproved stays unlistable');

const approved = rides.approve(blocked.driver.id);
assert.strictEqual(approved.driver.approved, true);
assert.strictEqual(approved.listed, false, 'approved but unpaid stays unlistable');
assert.strictEqual(rides.ridesDirectory().listedCount, 0);

const subUnset = rides.startSubscriptionWam({ phone: '8685550100' });
assert.ok(subUnset.error.includes('Apply still works'));
assert.strictEqual(subUnset.fulfill, false);

const markUnset = rides.markSubscribed(blocked.driver.id);
assert.ok(markUnset.error.includes('Go-online stays blocked'));

env.RIDES_DRIVER_SUB_CENTS = 'not-a-price';
assert.strictEqual(createRides({ storePath, getEnv: (k) => env[k] }).subscriptionPriceCents(), null);

env.RIDES_DRIVER_SUB_CENTS = '5000';
env.WAM_API_KEY = 'test-only-not-for-prod';
const priced = createRides({ storePath, getEnv: (k) => env[k] });
assert.strictEqual(priced.subscriptionPriceCents(), 5000);

const checkout = priced.startSubscriptionWam({ phone: '8685550100' });
assert.strictEqual(checkout.payment.amountCents, 5000);
assert.strictEqual(checkout.payment.faceCents, 5000);
assert.strictEqual(checkout.fulfill, false);
assert.strictEqual(priced.ridesDirectory().listedCount, 0, 'Wam intent does not list');

const paid = priced.markSubscribed(blocked.driver.id);
assert.strictEqual(paid.listed, true);
assert.strictEqual(paid.fulfill, false);
assert.strictEqual(priced.ridesDirectory().listedCount, 1);
assert.strictEqual(priced.ridesDirectory().listed[0].plate, 'PAA 1234');
assert.ok(!('permitPhoto' in priced.ridesDirectory().listed[0]));

const noQuote = priced.createOffer({
  driverId: blocked.driver.id,
  pickup: 'Tunapuna',
  drop: 'POS',
  riderPhone: '8685550199',
  pay: 'cash',
});
assert.ok(noQuote.error.includes('does not quote'));

const offer = priced.createOffer({
  driverId: blocked.driver.id,
  pickup: 'Tunapuna',
  drop: 'POS',
  riderPhone: '8685550199',
  pay: 'cash',
  offerTtd: 40,
});
assert.strictEqual(offer.book, false);
assert.strictEqual(offer.offer.offerTtd, 40);

const cancel = priced.cancelOffer(offer.offer.id, {});
assert.strictEqual(cancel.cancelFeeTtd, 0);

const offer2 = priced.createOffer({
  driverId: blocked.driver.id,
  pickup: 'Tunapuna',
  drop: 'POS',
  riderPhone: '8685550199',
  pay: 'cash',
  offerTtd: 45,
});
const accepted = priced.acceptOffer(offer2.offer.id, { driverPhone: '8685550100' });
assert.strictEqual(accepted.book, false);
const agreedDriver = priced.agreeOffer(offer2.offer.id, { role: 'driver', driverPhone: '8685550100' });
assert.strictEqual(agreedDriver.book, false);
const booked = priced.agreeOffer(offer2.offer.id, { role: 'rider', riderPhone: '8685550199' });
assert.strictEqual(booked.book, true);
assert.strictEqual(booked.trip.juvayTakePct, 0);
assert.strictEqual(booked.trip.amountCents, booked.trip.faceCents);
assert.ok(booked.trip.startPin);
assert.ok(booked.trip.sharePath.startsWith('/rides/trip/'));
assert.ok(booked.trip.sosCopy.includes('not a dispatcher'));
assert.strictEqual(booked.trip.ratings, null);
assert.strictEqual(booked.trip.bikeTaxi, false);
assert.ok(booked.trip.whatsapp.startsWith('https://wa.me/'));
assert.strictEqual(booked.fulfill, false);

const paidTap = priced.cashPaid(booked.trip.id, { riderPhone: '8685550199' });
assert.strictEqual(paidTap.debt, false);
assert.strictEqual(paidTap.trip.cashPaid, true);
assert.strictEqual(paidTap.trip.cashReceived, false);
const recv = priced.cashReceived(booked.trip.id, { driverPhone: '8685550100' });
assert.strictEqual(recv.trip.cashReceived, true);

const wamOnly = priced.createOffer({
  driverId: blocked.driver.id,
  pickup: 'Tunapuna',
  drop: 'POS',
  riderPhone: '8685550188',
  pay: 'wam',
  offerTtd: 50,
});
assert.ok(wamOnly.error.includes('Cash only'));

priced.apply(kyc({ wamHandle: 'maya-wam', affiliateRef: 'aff-1' }));
priced.approve(blocked.driver.id);
priced.markSubscribed(blocked.driver.id);
const wamOffer = priced.createOffer({
  driverId: blocked.driver.id,
  pickup: 'Tunapuna',
  drop: 'POS',
  riderPhone: '8685550177',
  pay: 'wam',
  offerTtd: 60,
});
priced.acceptOffer(wamOffer.offer.id, { driverPhone: '8685550100' });
priced.agreeOffer(wamOffer.offer.id, { role: 'driver', driverPhone: '8685550100' });
const wamBook = priced.agreeOffer(wamOffer.offer.id, { role: 'rider', riderPhone: '8685550177' });
assert.strictEqual(wamBook.trip.juvayTakePct, 7.5);
assert.strictEqual(wamBook.trip.amountCents, wamBook.trip.faceCents);
assert.strictEqual(wamBook.trip.wamPayOn, 'https://wam.com');
assert.strictEqual(wamBook.trip.wamIsNotWhatsapp, true);

const credits = JSON.parse(fs.readFileSync(storePath, 'utf8')).affiliateCredits;
assert.ok(credits.length >= 1);
assert.strictEqual(credits[0].of, 'sub');
assert.strictEqual(credits[0].notOf, 'trip');
assert.strictEqual(credits[0].creditCents, 500);

const otherIsland = priced.ridesDirectory({ island: 'Jamaica' });
assert.strictEqual(otherIsland.listedCount, 0);
assert.strictEqual(otherIsland.line1, 'Rides are unavailable on this origin.');
assert.strictEqual(otherIsland.line2, 'No drivers are listed. Juvay does not invent a fare or a live booking button.');

const kidsEmpty = priced.listChildren({ parentPhone: '8685550400' });
assert.strictEqual(kidsEmpty.empty, true);
assert.deepStrictEqual(kidsEmpty.children, []);

const schoolStore = tmpStore();
const school = createRides({ storePath: schoolStore, getEnv: (k) => env[k] });
const schoolApply = school.apply(kyc({ phone: '8685550200', schoolRunRequested: true, island: 'Trinidad' }));
school.approve(schoolApply.driver.id);
school.markSubscribed(schoolApply.driver.id);
assert.strictEqual(school.ridesDirectory({ schoolRun: true }).listedCount, 0, 'not listed for kids until flag approved');
const kidsFlag = school.approveSchoolRun(schoolApply.driver.id);
assert.strictEqual(kidsFlag.driver.schoolRunApproved, true);
assert.strictEqual(school.ridesDirectory({ schoolRun: true }).listedCount, 1);

const noKid = school.createOffer({
  kind: 'school_run',
  driverId: schoolApply.driver.id,
  pickup: 'Home',
  drop: 'School',
  parentPhone: '8685550400',
  offerTtd: 30,
  pay: 'cash',
  startPin: '2468',
});
assert.ok(noKid.error.includes('Child profile'));

const child = school.addChild({ parentPhone: '8685550400', name: 'Asha', school: 'St. Joseph\'s' });
assert.ok(child.child.id);
const schoolOffer = school.createOffer({
  kind: 'school_run',
  driverId: schoolApply.driver.id,
  pickup: 'Home',
  drop: 'School gate',
  parentPhone: '8685550400',
  childId: child.child.id,
  offerTtd: 30,
  pay: 'cash',
  startPin: '2468',
});
school.acceptOffer(schoolOffer.offer.id, { driverPhone: '8685550200' });
school.agreeOffer(schoolOffer.offer.id, { role: 'driver', driverPhone: '8685550200' });
const schoolBook = school.agreeOffer(schoolOffer.offer.id, { role: 'rider', parentPhone: '8685550400' });
assert.strictEqual(schoolBook.trip.kind, 'school_run');
assert.strictEqual(schoolBook.trip.started, false);
assert.ok(schoolBook.trip.schoolRunCopy.includes('not a teen dating app'));
assert.strictEqual(schoolBook.trip.shareAlways, true);
assert.strictEqual(schoolBook.trip.lastPoint, null);

const noTrack = school.reportTrack(schoolBook.trip.id, { driverPhone: '8685550200', lat: 10.65, lng: -61.4 });
assert.ok(noTrack.trip || noTrack.error);
const startFail = school.startTrip(schoolBook.trip.id, { driverPhone: '8685550200', pin: '0000' });
assert.ok(startFail.error);
const started = school.startTrip(schoolBook.trip.id, { driverPhone: '8685550200', pin: '2468' });
assert.strictEqual(started.started, true);
const tracked = school.reportTrack(schoolBook.trip.id, { driverPhone: '8685550200', lat: 10.65, lng: -61.4 });
assert.ok(tracked.trip.lastPoint);
assert.strictEqual(tracked.trip.lastPoint.lat, 10.65);

const kidCash = school.cashPaid(schoolBook.trip.id, { childPhone: '8685550999', riderPhone: '8685550400' });
assert.ok(kidCash.error.includes('Never cash to the child'));
const parentCash = school.cashPaid(schoolBook.trip.id, { parentPhone: '8685550400' });
assert.strictEqual(parentCash.debt, false);

const ghostPin = school.setDirectoryPin({ phone: '8685550200' }, { pinLat: 40.7, pinLng: -74 });
assert.ok(ghostPin.error);
const realPin = school.setDirectoryPin({ phone: '8685550200' }, { pinLat: 10.66, pinLng: -61.51 });
assert.strictEqual(realPin.driver.pinLat, 10.66);

fs.unlinkSync(storePath);
fs.unlinkSync(schoolStore);
console.log('rides.test.js ok');
