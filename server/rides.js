/**
 * Cash-first Juvay rides v1.
 * File store so apply works without inventing DATABASE_URL or a TTD sub price.
 * Listed = person-approved. If RIDES_DRIVER_SUB_CENTS is later set, listing also needs a person confirm (subscriptionPaid).
 * Webhook/checkout never auto-lists (not pay→fulfill). Do not invent the cents env.
 * Env name only: RIDES_DRIVER_SUB_CENTS (integer cents). Unset/invalid = no price.
 * Wam = wam.com. WhatsApp = wa.me to a listed driver. Do not mix them.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HONEST_EMPTY_LINE_1 = 'Rides are unavailable on this origin.';
const HONEST_EMPTY_LINE_2 = 'No drivers are listed. Juvay does not invent a fare or a live booking button.';
const SCHOOL_RUN_COPY = 'This is a parent-booked school run, not a teen dating app, not unattended street hail.';
const LIVE_ISLANDS = ['Trinidad', 'Tobago'];
const JOB_TYPES = ['rideshare', 'courier', 'delivery'];

const KYC_FIELDS = ['permitPhoto', 'insurancePhoto', 'platePhoto', 'facePhoto'];

function normalizeIsland(value) {
  const raw = String(value || '').trim();
  if (raw === 'Trinidad' || raw === 'Tobago') return raw;
  return raw;
}

function isLiveIsland(value) {
  return LIVE_ISLANDS.includes(normalizeIsland(value));
}

function inTtBounds(lat, lng) {
  return lat >= 10.0 && lat <= 11.45 && lng >= -62.05 && lng <= -60.4;
}

function defaultStorePath() {
  return path.join(__dirname, '..', 'data', 'rides-v1.json');
}

function emptyState() {
  return { drivers: [], offers: [], trips: [], affiliateCredits: [], wamIntents: [], children: [] };
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
      children: Array.isArray(parsed.children) ? parsed.children : [],
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

function normalizeJobTypes(value) {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : [value];
  const out = [];
  for (const item of raw) {
    const t = String(item || '').trim().toLowerCase();
    if (JOB_TYPES.includes(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

function normalizeServiceType(value) {
  const t = String(value || '').trim().toLowerCase();
  return JOB_TYPES.includes(t) ? t : '';
}

function resolveApplyJobTypes(body, schoolRunRequested) {
  const provided = body.jobTypes !== undefined || body.jobs !== undefined;
  let jobTypes = normalizeJobTypes(body.jobTypes !== undefined ? body.jobTypes : body.jobs);
  if (!provided) jobTypes = ['rideshare'];
  if (schoolRunRequested && !jobTypes.includes('rideshare')) jobTypes = ['rideshare', ...jobTypes];
  return jobTypes;
}

function driverJobTypes(driver) {
  const fromStore = normalizeJobTypes(driver && driver.jobTypes);
  return fromStore.length ? fromStore : ['rideshare'];
}

function publicDriver(driver) {
  const pinLat = Number(driver.pinLat);
  const pinLng = Number(driver.pinLng);
  const hasPin = Number.isFinite(pinLat) && Number.isFinite(pinLng) && inTtBounds(pinLat, pinLng);
  return {
    id: driver.id,
    name: driver.name,
    plate: driver.plate,
    phone: driver.phone,
    wamHandle: driver.wamHandle || '',
    island: driver.island || 'Trinidad',
    schoolRunApproved: driver.schoolRunApproved === true,
    jobTypes: driverJobTypes(driver),
    pinLat: hasPin ? pinLat : null,
    pinLng: hasPin ? pinLng : null,
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
    if (!driver || driver.approved !== true) return false;
    const priceCents = subscriptionPriceCents();
    if (priceCents == null) return true;
    return driver.subscriptionPaid === true;
  }

  function listedDrivers(query = {}) {
    const island = query.island ? normalizeIsland(query.island) : '';
    const schoolRun = query.schoolRun === true || query.schoolRun === '1' || query.schoolRun === 'true';
    const serviceType = normalizeServiceType(query.serviceType);
    return load().drivers.filter((d) => {
      if (!isListed(d)) return false;
      if (island && d.island !== island) return false;
      if (schoolRun && d.schoolRunApproved !== true) return false;
      if (serviceType && !driverJobTypes(d).includes(serviceType)) return false;
      return true;
    }).map(publicDriver);
  }

  function honestEmpty() {
    return {
      unavailable: true,
      listedCount: 0,
      listed: [],
      line1: HONEST_EMPTY_LINE_1,
      line2: HONEST_EMPTY_LINE_2,
      liveIslands: LIVE_ISLANDS,
    };
  }

  function ridesDirectory(query = {}) {
    const island = query.island ? normalizeIsland(query.island) : '';
    if (island && !isLiveIsland(island)) return honestEmpty();
    const listed = listedDrivers(query);
    if (listed.length === 0) return honestEmpty();
    return {
      unavailable: false,
      listedCount: listed.length,
      listed,
      liveIslands: LIVE_ISLANDS,
    };
  }

  function apply(body = {}) {
    const name = String(body.name || '').trim();
    const phone = digitsOnly(body.phone);
    const plate = String(body.plate || '').trim();
    const wamHandle = String(body.wamHandle || '').trim();
    const affiliateRef = String(body.affiliateRef || body.ref || '').trim();
    const islandRaw = body.island == null || String(body.island).trim() === '' ? 'Trinidad' : normalizeIsland(body.island);
    const schoolRunRequested = body.schoolRunRequested === true || body.schoolRunRequested === 'true';
    const jobTypes = resolveApplyJobTypes(body, schoolRunRequested);
    if (!name) return { error: 'Name is required', status: 400 };
    if (jobTypes.length === 0) {
      return { error: 'Select at least one job: rideshare, courier, or delivery', status: 400 };
    }
    if (phone.length < 7) return { error: 'A real phone number is required', status: 400 };
    if (!plate) return { error: 'Plate is required', status: 400 };
    if (!isLiveIsland(islandRaw)) {
      return { error: 'Only Trinidad and Tobago are live islands. Other islands stay empty.', status: 400 };
    }
    for (const field of KYC_FIELDS) {
      if (!photoPresent(body[field])) {
        return { error: `KYC photo required: ${field}`, status: 400 };
      }
    }
    if (body.lat != null || body.lng != null || body.pinLat != null || body.pinLng != null || body.map || body.eta) {
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
      island: islandRaw,
      schoolRunRequested,
      schoolRunApproved: existing?.schoolRunApproved === true,
      jobTypes,
      pinLat: existing?.pinLat ?? null,
      pinLng: existing?.pinLng ?? null,
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
      Object.assign(existing, driver, { approved: false, subscriptionPaid: existing.subscriptionPaid === true, schoolRunApproved: existing.schoolRunApproved === true });
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
          ? 'Not listed until a person approves your KYC. No driver subscription price is set on this origin. Apply still works.'
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
      island: driver.island || 'Trinidad',
      schoolRunRequested: driver.schoolRunRequested === true,
      schoolRunApproved: driver.schoolRunApproved === true,
      jobTypes: driverJobTypes(driver),
      schoolRunListed: listed && driver.schoolRunApproved === true,
      approved: driver.approved === true,
      subscriptionPaid: driver.subscriptionPaid === true,
      listed,
      pinLat: publicDriver(driver).pinLat,
      pinLng: publicDriver(driver).pinLng,
      subscriptionPriceCents: priceCents,
      goOnlineBlocked: !listed,
      goOnlineReason: listed
        ? null
        : driver.approved !== true
          ? (priceCents == null
            ? 'A person must approve your KYC. You are not listed. No driver subscription price is set on this origin.'
            : 'A person must approve your KYC. You are not listed.')
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

  function approveSchoolRun(driverId) {
    const state = load();
    const driver = state.drivers.find((d) => d.id === driverId);
    if (!driver) return { error: 'Application not found', status: 404 };
    if (isListed(driver) !== true) {
      return { error: 'Not listed for kids until the driver is listed and school-run flagged.', status: 400 };
    }
    if (driver.schoolRunRequested !== true) {
      return { error: 'Driver did not request school-run eligibility', status: 400 };
    }
    driver.schoolRunApproved = true;
    driver.updatedAt = now();
    save(state);
    return { driver: statusView(driver), fulfill: false };
  }

  function setDirectoryPin(query = {}, body = {}) {
    const driver = findDriver(query);
    if (!isListed(driver)) return { error: 'Only a listed driver can drop a directory pin. No ghost cars.', status: 400 };
    const lat = Number(body.pinLat);
    const lng = Number(body.pinLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inTtBounds(lat, lng)) {
      return { error: 'Type a real Trinidad or Tobago map point. We do not invent nearby.', status: 400 };
    }
    const state = load();
    const row = state.drivers.find((d) => d.id === driver.id);
    row.pinLat = lat;
    row.pinLng = lng;
    row.updatedAt = now();
    save(state);
    return { driver: publicDriver(row), fulfill: false };
  }

  function addChild(body = {}) {
    const parentPhone = digitsOnly(body.parentPhone);
    const name = String(body.name || '').trim();
    const school = String(body.school || '').trim();
    if (parentPhone.length < 7) return { error: 'Parent phone is required', status: 400 };
    if (!name) return { error: 'Child name is required', status: 400 };
    if (!school) return { error: 'School is required — type the real school. We do not invent schools.', status: 400 };
    const state = load();
    const child = {
      id: newId('kid'),
      parentPhone,
      name,
      school,
      photo: photoPresent(body.photo),
      createdAt: now(),
    };
    state.children.push(child);
    save(state);
    return { child: { id: child.id, name: child.name, school: child.school, parentPhone, photo: child.photo } };
  }

  function listChildren(query = {}) {
    const parentPhone = digitsOnly(query.parentPhone);
    if (parentPhone.length < 7) return { children: [], empty: true };
    const children = load().children
      .filter((c) => c.parentPhone === parentPhone)
      .map((c) => ({ id: c.id, name: c.name, school: c.school, parentPhone: c.parentPhone, photo: c.photo === true }));
    return { children, empty: children.length === 0 };
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
        ? 'No driver subscription price is set on this origin. A person-approved driver may be listed. When a price is set, listing requires a person to confirm the subscription. Apply still works.'
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
    const kind = body.kind === 'school_run' ? 'school_run' : 'ride';
    if (kind === 'school_run' && driver.schoolRunApproved !== true) {
      return { error: 'Not listed for kids until school-run eligibility is approved.', status: 400 };
    }
    let serviceType = 'rideshare';
    if (kind === 'school_run') {
      serviceType = 'rideshare';
    } else if (body.serviceType != null && String(body.serviceType).trim() !== '') {
      serviceType = normalizeServiceType(body.serviceType);
      if (!serviceType) return { error: 'Service must be rideshare, courier, or delivery', status: 400 };
    }
    if (!driverJobTypes(driver).includes(serviceType)) {
      return { error: 'This driver did not apply for that service', status: 400 };
    }
    const pickup = String(body.pickup || '').trim();
    const drop = String(body.drop || '').trim();
    const riderPhone = digitsOnly(kind === 'school_run' ? (body.parentPhone || body.riderPhone) : body.riderPhone);
    const pay = body.pay === 'wam' ? 'wam' : 'cash';
    const offerTtd = body.offerTtd;
    if (!pickup || !drop) return { error: 'Pickup and drop are required', status: 400 };
    if (riderPhone.length < 7) {
      return { error: kind === 'school_run' ? 'Parent phone is required' : 'Rider phone is required', status: 400 };
    }
    if (offerTtd === undefined || offerTtd === null || String(offerTtd).trim() === '') {
      return { error: 'Offer a TTD amount. Juvay does not quote a fare.', status: 400 };
    }
    const ttd = Number(offerTtd);
    if (!Number.isFinite(ttd) || ttd <= 0) return { error: 'Offer a real TTD amount. No invented fare.', status: 400 };
    if (pay === 'wam' && !driver.wamHandle) {
      return { error: 'This listed driver has no Wam handle. Cash only. Wam is wam.com, not WhatsApp.', status: 400 };
    }
    let child = null;
    let parentStartPin = null;
    if (kind === 'school_run') {
      const stateKids = load();
      child = stateKids.children.find((c) => c.id === body.childId && c.parentPhone === riderPhone);
      if (!child) return { error: 'Child profile not found for this parent. Empty child list stays empty.', status: 400 };
      parentStartPin = String(body.startPin || '').trim();
      if (!/^\d{4}$/.test(parentStartPin)) {
        return { error: 'Parent must set a 4-digit start PIN. The trip does not start until the driver enters it.', status: 400 };
      }
    }
    const state = load();
    const offer = {
      id: newId('off'),
      kind,
      serviceType,
      driverId: driver.id,
      riderPhone,
      parentPhone: kind === 'school_run' ? riderPhone : null,
      childId: child ? child.id : null,
      childName: child ? child.name : null,
      school: child ? child.school : null,
      parentStartPin,
      shareAlways: kind === 'school_run',
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
    const driver = findDriver({ id: offer.driverId });
    const serviceType = offer.serviceType || 'rideshare';
    if (!driverJobTypes(driver).includes(serviceType)) {
      return { error: 'This driver did not apply for that service', status: 400 };
    }
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
    if (role === 'rider' && digitsOnly(body.riderPhone || body.parentPhone) !== offer.riderPhone) {
      return { error: offer.kind === 'school_run' ? 'Only the parent who booked can agree' : 'Only the rider who offered can agree', status: 403 };
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
      kind: offer.kind || 'ride',
      serviceType: offer.serviceType || 'rideshare',
      parentPhone: offer.parentPhone || null,
      childId: offer.childId || null,
      childName: offer.childName || null,
      school: offer.school || null,
      startPin: offer.kind === 'school_run' ? offer.parentStartPin : String(Math.floor(1000 + Math.random() * 9000)),
      started: false,
      lastPoint: null,
      shareAlways: offer.kind === 'school_run',
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
      sosCopy: trip.kind === 'school_run'
        ? 'SOS to the parent. Call local emergency services if needed. Juvay is not a dispatcher. This share link is always on for the parent.'
        : 'If you are in danger, call local emergency services. Juvay is not a dispatcher. Share this trip link with someone you trust.',
      whatsapp: waDigits ? `https://wa.me/${waDigits}` : null,
      whatsappKind: 'listed-driver',
      wamPayOn: trip.pay === 'wam' ? 'https://wam.com' : null,
      wamIsNotWhatsapp: true,
      juvayTakePct: trip.pay === 'cash' ? 0 : 7.5,
      processingPassThrough: trip.pay === 'wam',
      fulfill: false,
      ratings: null,
      bikeTaxi: false,
      kind: trip.kind || 'ride',
      serviceType: trip.serviceType || 'rideshare',
      schoolRun: trip.kind === 'school_run',
      schoolRunCopy: trip.kind === 'school_run' ? SCHOOL_RUN_COPY : null,
      parentPhone: trip.parentPhone || null,
      childName: trip.childName || null,
      school: trip.school || null,
      started: trip.started === true,
      lastPoint: trip.status === 'booked' && trip.lastPoint ? trip.lastPoint : null,
      shareAlways: trip.shareAlways === true,
      kidNeverPays: trip.kind === 'school_run',
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
    if (trip.kind === 'school_run') {
      if (body.childPhone || body.kidPhone) {
        return { error: 'Never cash to the child. Parent pays at pickup or Wam from the parent.', status: 403 };
      }
      if (digitsOnly(body.parentPhone || body.riderPhone) !== trip.parentPhone) {
        return { error: 'Only the parent taps cash paid. The child never sees cash confirm.', status: 403 };
      }
    } else if (digitsOnly(body.riderPhone) !== trip.riderPhone) {
      return { error: 'Only the rider taps cash paid', status: 403 };
    }
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

  function startTrip(tripId, body = {}) {
    const state = load();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (trip.status !== 'booked') return { error: 'Trip is not accepted', status: 400 };
    const driver = findDriver({ id: trip.driverId });
    if (!driver || digitsOnly(body.driverPhone) !== driver.phone) {
      return { error: 'Only the listed driver can enter the start PIN', status: 403 };
    }
    if (String(body.pin || '').trim() !== String(trip.startPin)) {
      return { error: 'Start PIN does not match. Trip does not start.', status: 403 };
    }
    trip.started = true;
    trip.updatedAt = now();
    save(state);
    return { trip: tripView(trip), started: true };
  }

  function reportTrack(tripId, body = {}) {
    const state = load();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (trip.status !== 'booked') {
      return { error: 'Live tracking is only inside an accepted trip. No radar.', status: 400 };
    }
    const driver = findDriver({ id: trip.driverId });
    if (!driver || digitsOnly(body.driverPhone) !== driver.phone) {
      return { error: 'Only the listed driver on this trip can share a point', status: 403 };
    }
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inTtBounds(lat, lng)) {
      return { error: 'Type a real point on Trinidad or Tobago. No ghost cars.', status: 400 };
    }
    trip.lastPoint = { lat, lng, at: now() };
    trip.updatedAt = now();
    save(state);
    return { trip: tripView(trip), fulfill: false };
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
    approveSchoolRun,
    setDirectoryPin,
    addChild,
    listChildren,
    startTrip,
    reportTrack,
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
  SCHOOL_RUN_COPY,
  LIVE_ISLANDS,
  JOB_TYPES,
  KYC_FIELDS,
};
