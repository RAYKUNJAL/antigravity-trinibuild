// src/auth.js — password hashing (scrypt), opaque sessions, HTTP helpers
'use strict';
const crypto = require('node:crypto');
const store = require('./store');

const SCRYPT_KEYLEN=32, SALT_LEN=16;
const SCRYPT_PARAMS={ N:16384, r:8, p:1, maxmem:64*1024*1024 };
const SESSION_TTL_MS = 7*86400000;

// in-memory session store (swap for DB/redis in production)
const sessions = new Map();

function isNonEmpty(v){ return typeof v==='string' && v.trim().length>0; }
function validEmail(e){ return typeof e==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

async function hashPassword(pw){
  if(!isNonEmpty(pw)) throw new Error('password required');
  const salt=crypto.randomBytes(SALT_LEN);
  const hash=await new Promise((res,rej)=>crypto.scrypt(Buffer.from(pw),salt,SCRYPT_KEYLEN,SCRYPT_PARAMS,(e,d)=>e?rej(e):res(d)));
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}
async function verifyPassword(pw, encoded){
  if(!isNonEmpty(pw)||typeof encoded!=='string') return false;
  const p=encoded.split(':'); if(p.length!==3||p[0]!=='scrypt') return false;
  const salt=Buffer.from(p[1],'hex'), expected=Buffer.from(p[2],'hex');
  if(!salt.length||!expected.length) return false;
  try{
    const d=await new Promise((res,rej)=>crypto.scrypt(Buffer.from(pw),salt,expected.length,SCRYPT_PARAMS,(e,b)=>e?rej(e):res(b)));
    return crypto.timingSafeEqual(d,expected);
  }catch{ return false; }
}

async function register({ email, name, password, org_name, island='tt', currency, role='owner', buyer_external=false, buyer_destination=null, consent_processing, consent_tos, consent_marketing }) {
  if(!validEmail(email)) throw new Error('A valid email is required');
  if(!isNonEmpty(password)||password.length<8) throw new Error('Password must be at least 8 characters');
  if(consent_processing !== 'yes') throw new Error('Consent to data processing is required (see Privacy Policy)');
  if(consent_tos !== 'yes') throw new Error('You must accept the Terms of Service');
  const hash = await hashPassword(password);
  return store.createUser({ email, name, password_hash: hash, role, org_name, island, currency, buyer_external, buyer_destination,
    consents: { processing: true, terms: true, marketing: consent_marketing==='yes', at: new Date().toISOString() } });
}

async function login({ email, password }) {
  const u=store.getUserByEmail(email); if(!u) return null;
  const ok=await verifyPassword(password, u.password_hash); if(!ok) return null;
  const token=crypto.randomBytes(32).toString('base64url');
  const exp=Date.now()+SESSION_TTL_MS;
  sessions.set(token,{user_id:u.id,expires_at:exp});
  return { token, expires_at: new Date(exp).toISOString(), user_id:u.id, email:u.email, name:u.name };
}

function getSession(token){
  if(!isNonEmpty(token)) return null;
  const s=sessions.get(token); if(!s) return null;
  if(Date.now()>s.expires_at){ sessions.delete(token); return null; }
  const u=store.getUserById(s.user_id); if(!u) return null;
  // find org
  const m=store._db().memberships.find(x=>x.user_id===u.id);
  const sub=store.getSubscription(m?.org_id);
  return { token, user_id:u.id, email:u.email, name:u.name, role:u.role, org_id:m?m.org_id:null, plan:sub?sub.plan_slug:'free', org_name:m?store._db().organizations.find(o=>o.id===m.org_id)?.name:null };
}
function logout(token){ if(token) sessions.delete(token); }
function auth(req){
  const h=String(req.headers.authorization||''); if(h.startsWith('Bearer ')) return getSession(h.slice(7));
  return null;
}

module.exports={ register, login, getSession, logout, auth, hashPassword, verifyPassword };
