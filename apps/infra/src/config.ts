export type DnsProvider = "route53" | "external";

const rawDnsProvider = process.env.DNS_PROVIDER ?? "route53";
if (rawDnsProvider !== "route53" && rawDnsProvider !== "external") {
  throw new Error(
    `Invalid DNS_PROVIDER "${rawDnsProvider}". Must be "route53" or "external".`,
  );
}

export const CONFIGS = {
  ACCOUNT_ID: process.env.ACCOUNT_ID,
  REGION: process.env.REGION,
  STAGE: process.env.STAGE,
  DNS_PROVIDER: rawDnsProvider as DnsProvider,
};
