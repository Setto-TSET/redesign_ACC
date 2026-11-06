import {
  auditPartLabels,
  type AuditPartStatus,
} from '@/mock/prototype/postAudit';

const tone: Record<AuditPartStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  notify: 'badge-warning',
  fixing: 'badge-error',
  replied: 'badge-info',
  closed: 'badge-success',
};

export function AuditStatusBadge({
  status,
  prefix,
}: {
  status: AuditPartStatus;
  prefix?: string;
}) {
  return (
    <span className={`badge ${tone[status]}`}>
      {prefix}
      {auditPartLabels[status]}
    </span>
  );
}
