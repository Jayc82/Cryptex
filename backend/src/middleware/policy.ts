import { Request, Response, NextFunction } from 'express';

type Feature = 'staking' | 'custody' | 'airdrops';

interface PolicyFlags {
  staking: boolean;
  custody: boolean;
  airdrops: boolean;
  region: string;
}

function getEnvBool(name: string, defaultVal: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return defaultVal;
  return v.toLowerCase() === 'true' || v === '1';
}

export function resolvePolicy(req: Request): PolicyFlags {
  const defaultRegion = process.env.DEFAULT_REGION || 'US';
  const headerRegion = (req.headers['x-region'] as string | undefined)?.toUpperCase();
  const region = headerRegion || defaultRegion.toUpperCase();

  const isUS = region === 'US';
  const isOther = !isUS;

  const staking = isUS
    ? getEnvBool('FEATURE_STAKING_US', false)
    : getEnvBool('FEATURE_STAKING_OTHER', true);

  const custody = isUS
    ? getEnvBool('FEATURE_CUSTODY_US', false)
    : getEnvBool('FEATURE_CUSTODY_OTHER', true);

  const airdrops = isUS
    ? getEnvBool('FEATURE_AIRDROPS_US', false)
    : getEnvBool('FEATURE_AIRDROPS_OTHER', true);

  return { staking, custody, airdrops, region: region };
}

export function enforcePolicy(feature: Feature) {
  return (req: Request, res: Response, next: NextFunction) => {
    const flags = resolvePolicy(req);
    if (!flags[feature]) {
      return res.status(403).json({
        error: 'Feature not available in your region',
        feature,
        region: flags.region,
        compliance: {
          reason:
            feature === 'staking'
              ? 'Staking-as-a-service may be treated as a securities offering. Disabled pending licensing/registration.'
              : feature === 'custody'
              ? 'Custody requires money transmitter/state licensing and qualified arrangements. Disabled pending approvals.'
              : 'Airdrops distribution subject to regulatory constraints. Disabled in certain jurisdictions.',
        },
      });
    }
    next();
  };
}

export default enforcePolicy;
