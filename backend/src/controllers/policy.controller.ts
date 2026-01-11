import { Request, Response } from 'express';
import { resolvePolicy } from '../middleware/policy';

export function getFeatures(req: Request, res: Response) {
  const flags = resolvePolicy(req);
  return res.json({
    region: flags.region,
    features: {
      staking: flags.staking,
      custody: flags.custody,
      airdrops: flags.airdrops,
    },
    disclosures: {
      us:
        'US access is spot-only by default. Yield products disabled pending licensing/registration. Clear disclosures apply to all trading and custody services.',
      general:
        'Features are region-gated to ensure compliance. Fees are published with immutable caps; proofs of reserves and staking rewards are publicly verifiable.',
    },
  });
}
