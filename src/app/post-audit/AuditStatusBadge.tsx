import {
  auditPartLabels,
  type AuditPartStatus,
} from '@/mock/prototype/postAudit';

const tone: Record<AuditPartStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-600',
  notify: 'badge-warning',
  fixing: 'badge-error',
  replied: 'badge-info',
  closed: 'badge-success',
};

export function AuditStatusBadge({
  status,
  small,
  prefix,
}: {
  status: AuditPartStatus;
  small?: boolean;
  prefix?: string;
}) {
  return (
    <span className={`badge ${tone[status]} ${small ? '!text-[11px]' : ''}`}>
      {prefix}
      {auditPartLabels[status]}
    </span>
  );
}
