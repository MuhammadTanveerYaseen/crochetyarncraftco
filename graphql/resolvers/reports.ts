/**
 * Report resolver functions — createReport, reports (admin), resolveReport (admin).
 */

import Report from '@/models/Report';
import { validateReportInput } from '@/lib/validators';
import { PAGE_SIZES } from '@/lib/config';
import { isDbConnected, inMemoryReports, assertAdmin } from './shared';
import type { GraphQLContext, CreateReportInput } from '@/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function reports(
  { limit, offset }: { limit?: number; offset?: number },
  ctx: GraphQLContext
) {
  await assertAdmin(ctx);
  const pageLimit = Math.min(Number(limit ?? PAGE_SIZES.ADMIN_REPORTS), 100);
  const pageOffset = Number(offset ?? 0);

  const isConnected = await isDbConnected();
  if (isConnected) {
    return await Report.find()
      .sort({ createdAt: -1 })
      .skip(pageOffset)
      .limit(pageLimit)
      .lean();
  }
  return inMemoryReports.slice(pageOffset, pageOffset + pageLimit);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Public mutation — anyone can submit a support report */
export async function createReport(input: CreateReportInput) {
  validateReportInput(input);

  const isConnected = await isDbConnected();
  const reportData = {
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  if (isConnected) {
    return await Report.create(reportData);
  }

  const newReport = { _id: `report-mock-${Date.now()}`, ...reportData };
  inMemoryReports.unshift(newReport);
  return newReport;
}

/** Admin mutation — mark a report as resolved */
export async function resolveReport({ id }: { id: string }, ctx: GraphQLContext) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();

  if (isConnected) {
    const updated = await Report.findByIdAndUpdate(
      id,
      { status: 'resolved' },
      { new: true }
    ).lean();
    if (!updated) throw new Error('Report not found');
    return updated;
  }

  const idx = inMemoryReports.findIndex(r => r._id === id);
  if (idx === -1) throw new Error('Report not found');
  inMemoryReports[idx] = { ...inMemoryReports[idx], status: 'resolved' };
  return inMemoryReports[idx];
}
