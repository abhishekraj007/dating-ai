export function getDodoEnvironment(): "test_mode" | "live_mode" {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";
}

export function getDodoApiBaseUrl() {
  return getDodoEnvironment() === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}
