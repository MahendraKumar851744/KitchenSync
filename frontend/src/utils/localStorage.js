import { v4 as uuidv4 } from 'uuid';

const CUSTOMER_ID_KEY = 'ks_customer_id';
const VENDOR_TOKEN_KEY = 'ks_vendor_token';
const CART_KEY_PREFIX = 'ks_cart_';

export function getCustomerLocalId() {
  let id = localStorage.getItem(CUSTOMER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(CUSTOMER_ID_KEY, id);
  }
  return id;
}

export function getVendorToken() {
  return localStorage.getItem(VENDOR_TOKEN_KEY);
}

export function setVendorToken(token) {
  localStorage.setItem(VENDOR_TOKEN_KEY, token);
}

export function clearVendorToken() {
  localStorage.removeItem(VENDOR_TOKEN_KEY);
}

export function getCart(vendorQrId) {
  const raw = localStorage.getItem(CART_KEY_PREFIX + vendorQrId);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(vendorQrId, cart) {
  localStorage.setItem(CART_KEY_PREFIX + vendorQrId, JSON.stringify(cart));
}

export function clearCart(vendorQrId) {
  localStorage.removeItem(CART_KEY_PREFIX + vendorQrId);
}
