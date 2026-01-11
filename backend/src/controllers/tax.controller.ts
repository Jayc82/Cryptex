import { Request, Response } from 'express';
import { buildTaxReport, exportTradesCSV, exportStakingCSV, exportMiningCSV, BasisMethod } from '../services/tax.service';
import { AuthRequest } from '../middleware/auth';

export async function getTaxReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || new Date().getUTCFullYear().toString(), 10);
    const basis = ((req.query.basis as string) || process.env.TAX_DEFAULT_BASIS || 'fifo') as BasisMethod;
    const report = await buildTaxReport(userId, year, basis);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to build tax report' });
  }
}

export async function exportTrades(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || new Date().getUTCFullYear().toString(), 10);
    const csv = await exportTradesCSV(userId, year);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trades_${year}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export trades CSV' });
  }
}

export async function exportStaking(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || new Date().getUTCFullYear().toString(), 10);
    const csv = await exportStakingCSV(userId, year);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="staking_${year}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export staking CSV' });
  }
}

export async function exportMining(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const year = parseInt((req.query.year as string) || new Date().getUTCFullYear().toString(), 10);
    const csv = await exportMiningCSV(userId, year);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mining_${year}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export mining CSV' });
  }
}
