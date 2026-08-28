/**
 * Cash-first Juvay rides v1.
 * File store so apply works without inventing DATABASE_URL or a TTD sub price.
 * Listed = approved AND subscriptionPaid. Webhook/checkout never auto-lists (not pay→fulfill).
 * Env name only: RIDES_DRIVER_SUB_CENTS (integer cents). Unset/invalid = no price.
 * Wam = wam.com. WhatsApp = wa.me to a listed driver. Do not mix them.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HONEST_EMPTY_LINE_1 = 'Rides are unavailable on this origin.';
const HONEST_EMPTY_LINE_2 = 'No drivers are listed. Juvay does not invent a fare or a live booking button.';

const KYC_FIELDS = ['permitPhoto', 'insurancePhoto', 'platePhoto', 'facePhoto'];

function defaultStorePath() {
  return path.join(__dirname, '..', 'data', 'rides-v1.json');
}

function emptyState() {
  return { drivers: [], offers: [], trips: [], affiliateCredits: [], wamIntents: [] };
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function readStore(storePath) {
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers : [],
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
      affiliateCredits: Array.isArray(parsed.affiliateCredits) ? parsed.affiliateCredits : [],
      wamIntents: Array.isArray(parsed.wamIntents) ? parsed.wamIntents : [],
    };
  } catch {
    return emptyState();
  }
}

function writeStore(storePath, state) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(state, null, 2));
}

function photoPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicDriver(driver) {
  return {
    id: driver.id,
    name: driver.name,
    plate: driver.plate,
    phone: driver.phone,
    wamHandle: driver.wamHandle || '',
  };
}

function createRides(opts = {}) {
  const storePath = opts.storePath || defaultStorePath();
  const getEnv = opts.getEnv || ((key) => process.env[key]);
  const now = () => (opts.now ? opts.now() : new Date().toISOString());

  function load() {
    return readStore(storePath);
  }

  function save(state) {
    writeStore(storePath, state);
    return state;
  }

  function subscriptionPriceCents() {
    const raw = getEnv('RIDES_DRIVER_SUB_CENTS');
    if (raw === undefined || raw === null || String(raw).trim() === '') return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
  }

  function whatsappConfigured() {
    return String(getEnv('WHATSAPP_ACCESS_TOKEN') || '').trim().length > 0;
  }

  function isListed(driver) {
    return driver && driver.approved === true && driver.subscriptionPaid === true;
  }

  function listedDrivers() {
    return load().drivers.filter(isListed).map(publicDriver);
  }

  function honestEmpty() {
    return {
      unavailable: true,
      listedCount: 0,
      listed: [],
      line1: HONEST_EMPTY_LINE_1,
      line2: HONEST_EMPTY_LINE_2,
    };
  }

  function ridesDirectory() {
    const listed = listedDrivers();
    if (listed.length === 0) return honestEmpty();
    return {
      unavailable: false,
      listedCount: listed.length,
      listed,
    };
  }

  function apply(body = {}) {
    const name = String(body.name || '').trim();
    const phone = digitsOnly(body.phone);
    const plate = String(body.plate || '').trim();
    const wamHandle = String(body.wamHandle || '').trim();
    const affiliateRef = String(body.affiliateRef || body.ref || '').trim();
    if (!name) return { error: 'Name is required', status: 400 };
    if (phone.length < 7) return { error: 'A real phone number is required', status: 400 };
    if (!plate) return { error: 'Plate is required', status: 400 };
    for (const field of KYC_FIELDS) {
      if (!photoPresent(body[field])) {
        return { error: `KYC photo required: ${field}`, status: 400 };
      }
    }
    if (body.lat != null || body.lng != null || body.map || body.eta) {
      return { error: 'No map, ETA, or location on apply', status: 400 };
    }

    const state = load();
    const existing = state.drivers.find((d) => d.phone === phone);
    const driver = {
      id: existing ? existing.id : newId('drv'),
      name,
      phone,
      plate,
      wamHandle,
      affiliateRef,
      userId: body.userId || existing?.userId || null,
      permitPhoto: true,
      insurancePhoto: true,
      platePhoto: true,
      facePhoto: true,
      approved: false,
      subscriptionPaid: false,
      copy: 'We will not show cars that are not you.',
      createdAt: existing?.createdAt || now(),
      updatedAt: now(),
    };
    if (existing) {
      Object.assign(existing, driver, { approved: false, subscriptionPaid: existing.subscriptionPaid === true });
    } else {
      state.drivers.push(driver);
    }
    save(state);
    const priceCents = subscriptionPriceCents();
    return {
      driver: statusView(existing || driver),
      goOnline: {
        allowed: false,
        reason: priceCents == null
          ? 'No driver subscription price is set on this origin. Apply still works. Go-online is blocked until a person sets the price.'
          : 'Not listed until a person approves you and confirms the subscription. Unpaid and unapproved stay unlistable.',
      },
      fulfill: false,
    };
  }

  function statusView(driver) {
    const priceCents = subscriptionPriceCents();
    const listed = isListed(driver);
    return {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      plate: driver.plate,
      wamHandle: driver.wamHandle || '',
      approved: driver.approved === true,
      subscriptionPaid: driver.subscriptionPaid === true,
      listed,
      subscriptionPriceCents: priceCents,
      goOnlineBlocked: !listed,
      goOnlineReason: listed
        ? null
        : priceCents == null
          ? 'No driver subscription price is set on this origin. Apply still works. Go-online is blocked until a person sets the price.'
          : driver.approved !== true
            ? 'A person must approve your KYC. You are not listed.'
            : 'Subscription is unpaid. You are not listed. Paying on wam.com does not list you until a person confirms.',
      copy: 'We will not show cars that are not you.',
    };
  }

  function findDriver({ id, phone, userId }) {
    const state = load();
    if (id) return state.drivers.find((d) => d.id === id) || null;
    if (phone) return state.drivers.find((d) => d.phone === digitsOnly(phone)) || null;
    if (userId) return state.drivers.find((d) => d.userId === userId) || null;
    return null;
  }

  function me(query = {}) {
    const driver = findDriver(query);
    if (!driver) return { error: 'No application on this origin for that phone', status: 404 };
    return { driver: statusView(driver) };
  }

  function approve(driverId) {
    const state = load();
    const driver = state.drivers.find((d) => d.id === driverId);
    if (!driver) return { error: 'Application not found', status: 404 };
    driver.approved = true;
    driver.updatedAt = now();
    save(state);
    return { driver: statusView(driver), listed: isListed(driver), fulfill: false };
  }

  function markSubscribed(driverId) {
    const state = load();
    const driver = state.drivers.find((d) => d.id === driverId);
    if (!driver) return { error: 'Application not found', status: 404 };
    if (driver.approved !== true) return { error: 'Approve KYC before confirming a subscription', status: 400 };
    const priceCents = subscriptionPriceCents();
    if (priceCents == null) {
      return { error: 'No driver subscription price is set. Go-online stays blocked.', status: 400 };
    }
    driver.subscriptionPaid = true;
    driver.updatedAt = now();
    if (driver.affiliateRef) {
      state.affiliateCredits.push({
        id: newId('aff'),
        driverId: driver.id,
        affiliateRef: driver.affiliateRef,
        source: 'driver_subscription',
        faceCents: priceCents,
        creditCents: Math.floor(priceCents * 0.1),
        of: 'sub',
        notOf: 'trip',
        createdAt: now(),
      });
    }
    save(state);
    return { driver: statusView(driver), listed: isListed(driver), fulfill: false };
  }

  function subscriptionStatus() {
    const priceCents = subscriptionPriceCents();
    return {
      priceCents,
      priceSet: priceCents != null,
      payOn: 'https://wam.com',
      fulfill: false,
      copy: priceCents == null
        ? 'No driver subscription price is set on this origin. Apply still works. Go-online is blocked until a person sets the price.'
        : 'Pay the face amount on wam.com. Wam is not WhatsApp. A person must confirm the subscription before you are listed.',
    };
  }

  function startSubscriptionWam(query = {}) {
    const priceCents = subscriptionPriceCents();
    if (priceCents == null) {
      return {
        error: 'No driver subscription price is set on this origin. Apply still works. Go-online is blocked until a person sets the price.',
        status: 400,
        fulfill: false,
      };
    }
    const driver = findDriver(query);
    if (!driver) return { error: 'Apply first', status: 404 };
    if (String(getEnv('WAM_API_KEY') || '').trim() === '') {
      return { error: 'Wam is not configured. Go-online stays blocked. Apply still stands.', status: 503, fulfill: false };
    }
    const state = load();
    const intent = {
      id: newId('wam'),
      purpose: 'driver_subscription',
      driverId: driver.id,
      amountCents: priceCents,
      faceCents: priceCents,
      processing: 'display-only',
      payOn: 'https://wam.com',
      status: 'pending',
      fulfill: false,
      createdAt: now(),
    };
    state.wamIntents.push(intent);
    save(state);
    return {
      payment: intent,
      fulfill: false,
      copy: 'Pay on wam.com. This does not list you. A person confirms the subscription. Not pay→fulfill.',
    };
  }

  function createOffer(body = {}) {
    const driver = findDriver({ id: body.driverId });
    if (!isListed(driver)) {
      return { error: 'That driver is not listed. No invented fare or live booking.', status: 400 };
    }
    const pickup = String(body.pickup || '').trim();
    const drop = String(body.drop || '').trim();
    const riderPhone = digitsOnly(body.riderPhone);
    const pay = body.pay === 'wam' ? 'wam' : 'cash';
    const offerTtd = body.offerTtd;
    if (!pickup || !drop) return { error: 'Pickup and drop are required', status: 400 };
    if (riderPhone.length < 7) return { error: 'Rider phone is required', status: 400 };
    if (offerTtd === undefined || offerTtd === null || String(offerTtd).trim() === '') {
      return { error: 'Offer a TTD amount. Juvay does not quote a fare.', status: 400 };
    }
    const ttd = Number(offerTtd);
    if (!Number.isFinite(ttd) || ttd <= 0) return { error: 'Offer a real TTD amount. No invented fare.', status: 400 };
    if (pay === 'wam' && !driver.wamHandle) {
      return { error: 'This listed driver has no Wam handle. Cash only. Wam is wam.com, not WhatsApp.', status: 400 };
    }
    const state = load();
    const offer = {
      id: newId('off'),
      driverId: driver.id,
      riderPhone,
      pickup,
      drop,
      offerTtd: ttd,
      counterTtd: null,
      pay,
      status: 'offered',
      cancelFeeTtd: 0,
      createdAt: now(),
    };
    state.offers.push(offer);
    save(state);
    return { offer, book: false, copy: 'Offer, don\'t quote. Book only after both agree.' };
  }

  function getOffer(offerId) {
    return load().offers.find((o) => o.id === offerId) || null;
  }

  function actorMatchesDriver(offer, body) {
    const driver = findDriver({ id: offer.driverId });
    if (!driver) return false;
    if (body.driverId && body.driverId !== driver.id) return false;
    if (body.driverPhone && digitsOnly(body.driverPhone) !== driver.phone) return false;
    return true;
  }

  function acceptOffer(offerId, body = {}) {
    const state = load();
    const offer = state.offers.find((o) => o.id === offerId);
    if (!offer) return { error: 'Offer not found', status: 404 };
    if (offer.status !== 'offered' && offer.status !== 'countered') {
      return { error: 'Offer is not waiting on the driver', status: 400 };
    }
    if (!actorMatchesDriver(offer, body)) return { error: 'Only the listed driver can accept', status: 403 };
    offer.status = 'accepted';
    offer.driverAgreed = true;
    offer.updatedAt = now();
    save(state);
    return { offer, book: false, copy: 'Accepted. Book only after the rider agrees to this amount.' };
  }

  function counterOffer(offerId, body = {}) {
    const state = load();
    const offer = state.offers.find((o) => o.id === offerId);
    if (!offer) return { error: 'Offer not found', status: 404 };
    if (offer.status !== 'offered' && offer.status !== 'countered') {
      return { error: 'Offer is not open to counter', status: 400 };
    }
    if (!actorMatchesDriver(offer, body)) return { error: 'Only the listed driver can counter', status: 403 };
    const ttd = Number(body.counterTtd);
    if (!Number.isFinite(ttd) || ttd <= 0) return { error: 'Counter a real TTD amount. No invented fare.', status: 400 };
    offer.counterTtd = ttd;
    offer.status = 'countered';
    offer.driverAgreed = true;
    offer.riderAgreed = false;
    offer.updatedAt = now();
    save(state);
    return { offer, book: false, copy: 'Counter sent. Book only after both agree.' };
  }

  function agreeOffer(offerId, body = {}) {
    const state = load();
    const offer = state.offers.find((o) => o.id === offerId);
    if (!offer) return { error: 'Offer not found', status: 404 };
    const role = body.role === 'driver' ? 'driver' : 'rider';
    if (role === 'driver' && !actorMatchesDriver(offer, body)) {
      return { error: 'Only the listed driver can agree as driver', status: 403 };
    }
    if (role === 'rider' && digitsOnly(body.riderPhone) !== offer.riderPhone) {
      return { error: 'Only the rider who offered can agree', status: 403 };
    }
    if (role === 'driver') offer.driverAgreed = true;
    if (role === 'rider') offer.riderAgreed = true;
    offer.updatedAt = now();
    if (offer.driverAgreed && offer.riderAgreed) {
      return bookOffer(state, offer);
    }
    save(state);
    return { offer, book: false, copy: 'Waiting on the other person. Book only after both agree.' };
  }

  function bookOffer(state, offer) {
    const driver = state.drivers.find((d) => d.id === offer.driverId);
    const faceTtd = offer.counterTtd || offer.offerTtd;
    const faceCents = Math.round(faceTtd * 100);
    const trip = {
      id: newId('trip'),
      offerId: offer.id,
      driverId: driver.id,
      driverName: driver.name,
      plate: driver.plate,
      driverPhone: driver.phone,
      wamHandle: driver.wamHandle || '',
      riderPhone: offer.riderPhone,
      pickup: offer.pickup,
      drop: offer.drop,
      faceTtd,
      faceCents,
      amountCents: faceCents,
      pay: offer.pay,
      cashPaid: false,
      cashReceived: false,
      startPin: String(Math.floor(1000 + Math.random() * 9000)),
      shareToken: crypto.randomBytes(8).toString('hex'),
      juvayTakePct: offer.pay === 'wam' ? 7.5 : 0,
      processingPassThrough: offer.pay === 'wam',
      fulfill: false,
      status: 'booked',
      createdAt: now(),
    };
    offer.status = 'booked';
    offer.tripId = trip.id;
    state.trips.push(trip);
    save(state);
    return { offer, trip: tripView(trip), book: true, fulfill: false };
  }

  function cancelOffer(offerId, body = {}) {
    const state = load();
    const offer = state.offers.find((o) => o.id === offerId);
    if (!offer) return { error: 'Offer not found', status: 404 };
    if (offer.status === 'booked') return { error: 'Booked trips are not cancelled on this path', status: 400 };
    const beforeAccept = offer.status === 'offered' || offer.status === 'countered';
    offer.status = 'cancelled';
    offer.cancelFeeTtd = beforeAccept ? 0 : offer.cancelFeeTtd;
    offer.updatedAt = now();
    save(state);
    return { offer, cancelFeeTtd: beforeAccept ? 0 : offer.cancelFeeTtd, copy: 'No cancel fee before accept.' };
  }

  function tripView(trip, query = {}) {
    const shareOk = !query.shareToken || query.shareToken === trip.shareToken;
    const waDigits = digitsOnly(trip.driverPhone);
    return {
      id: trip.id,
      driverName: trip.driverName,
      plate: trip.plate,
      driverPhone: trip.driverPhone,
      pickup: trip.pickup,
      drop: trip.drop,
      faceTtd: trip.faceTtd,
      faceCents: trip.faceCents,
      amountCents: trip.amountCents,
      pay: trip.pay,
      cashPaid: trip.cashPaid === true,
      cashReceived: trip.cashReceived === true,
      status: trip.status,
      startPin: shareOk ? trip.startPin : undefined,
      sharePath: `/rides/trip/${trip.id}?t=${trip.shareToken}`,
      sosCopy: 'If you are in danger, call local emergency services. Juvay is not a dispatcher. Share this trip link with someone you trust.',
      whatsapp: waDigits ? `https://wa.me/${waDigits}` : null,
      whatsappKind: 'listed-driver',
      wamPayOn: trip.pay === 'wam' ? 'https://wam.com' : null,
      wamIsNotWhatsapp: true,
      juvayTakePct: trip.pay === 'cash' ? 0 : 7.5,
      processingPassThrough: trip.pay === 'wam',
      fulfill: false,
      ratings: null,
      bikeTaxi: false,
    };
  }

  function getTrip(tripId, query = {}) {
    const trip = load().trips.find((t) => t.id === tripId);
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (query.shareToken && query.shareToken !== trip.shareToken) {
      return { error: 'Share token does not match', status: 403 };
    }
    return { trip: tripView(trip, query) };
  }

  function cashPaid(tripId, body = {}) {
    const state = load();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (trip.pay !== 'cash') return { error: 'This trip is not cash', status: 400 };
    if (digitsOnly(body.riderPhone) !== trip.riderPhone) return { error: 'Only the rider taps cash paid', status: 403 };
    trip.cashPaid = true;
    trip.updatedAt = now();
    save(state);
    return { trip: tripView(trip), debt: false, copy: 'No auto rider debt. Waiting on the driver to tap cash received.' };
  }

  function cashReceived(tripId, body = {}) {
    const state = load();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (trip.pay !== 'cash') return { error: 'This trip is not cash', status: 400 };
    const driver = findDriver({ id: trip.driverId });
    if (!driver || digitsOnly(body.driverPhone) !== driver.phone) {
      return { error: 'Only the listed driver taps cash received', status: 403 };
    }
    trip.cashReceived = true;
    trip.updatedAt = now();
    save(state);
    return { trip: tripView(trip), debt: false };
  }

  function driverOffers(query = {}) {
    const driver = findDriver(query);
    if (!driver) return { error: 'No application for that phone', status: 404 };
    const offers = load().offers.filter((o) => o.driverId === driver.id);
    return { offers, driver: statusView(driver) };
  }

  function whatsappLink(phone, text) {
    const digits = digitsOnly(phone);
    if (!digits) return { href: null, sent: false, push: false };
    const href = text
      ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
      : `https://wa.me/${digits}`;
    return { href, sent: false, push: false, cloud: whatsappConfigured() };
  }

  function adminApplications() {
    return {
      applications: load().drivers.map((d) => statusView(d)),
      fulfill: false,
    };
  }

  return {
    HONEST_EMPTY_LINE_1,
    HONEST_EMPTY_LINE_2,
    subscriptionPriceCents,
    listedDrivers,
    ridesDirectory,
    honestEmpty,
    apply,
    me,
    approve,
    markSubscribed,
    subscriptionStatus,
    startSubscriptionWam,
    createOffer,
    getOffer,
    acceptOffer,
    counterOffer,
    agreeOffer,
    cancelOffer,
    getTrip,
    cashPaid,
    cashReceived,
    driverOffers,
    whatsappLink,
    adminApplications,
    findDriver,
    isListed,
  };
}

const defaultRides = createRides();

module.exports = {
  createRides,
  defaultRides,
  HONEST_EMPTY_LINE_1,
  HONEST_EMPTY_LINE_2,
  KYC_FIELDS,
};
