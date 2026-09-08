export const NFIL_EMAIL_DOMAIN = "@newfrontier.us";

export const isNfilEmail = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith(NFIL_EMAIL_DOMAIN);
