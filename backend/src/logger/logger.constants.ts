export const MAX_RESPONSE_BODY_SIZE = parseInt(
  process.env.LOG_MAX_RESPONSE_BODY_SIZE || '10000',
  10,
);

export const TAIL_SAMPLING_ENABLED =
  process.env.LOG_TAIL_SAMPLING_ENABLED !== 'false';

export const TAIL_SAMPLING_SUCCESS_RATE = (() => {
  const rate = parseFloat(process.env.LOG_TAIL_SAMPLING_SUCCESS_RATE || '1');
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return 1;
  }
  return rate;
})();

export const TAIL_SAMPLING_SLOW_THRESHOLD_MS = (() => {
  const threshold = parseInt(
    process.env.LOG_TAIL_SAMPLING_SLOW_THRESHOLD_MS || '1000',
    10,
  );
  if (isNaN(threshold) || threshold < 0) {
    return 1000;
  }
  return threshold;
})();

export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
];
