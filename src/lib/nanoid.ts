import { customAlphabet } from 'nanoid';

const orderAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateOrderNanoid = customAlphabet(orderAlphabet, 6);

export function generateOrderId(): string {
  return `KS-${generateOrderNanoid()}`;
}

const sessionAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateSessionNanoid = customAlphabet(sessionAlphabet, 32);

export function generateSessionId(): string {
  return generateSessionNanoid();
}
