export const isValidMobile = (m: string) => /^\d{10}$/.test(m);
export const isValidEmail = (e: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(e);
export const isValidPAN = (p: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(p);
export const isValidAadhaar = (a: string) => /^\d{12}$/.test(a);
export const passwordStrength = (p: string) => {
  const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
  return rules.reduce((acc, r) => acc + (r.test(p) ? 1 : 0), 0);
};
