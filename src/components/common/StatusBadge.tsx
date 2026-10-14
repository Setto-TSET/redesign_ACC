import type { CertStatus, RequestStatus } from '@/types/api';
import { certStatusLabels, requestStatusLabels } from '@/lib/constants';

const requestTone: Record<RequestStatus, string> = {
  submitted: 'badge-info',
  doc_review: 'badge-info',
  need_docs: 'badge-warning',
  assigned: 'badge-info',
  assessed: 'badge-warning',
  committee: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

const certTone: Record<CertStatus, string> = {
  N: 'badge-info',
  A: 'badge-success',
  E: 'badge-warning',
  X: 'badge-error',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`badge ${requestTone[status]}`}>
      {requestStatusLabels[status]}
    </span>
  );
}

export function CertBadge({ status }: { status: CertStatus }) {
  return (
    <span className={`badge ${certTone[status]}`}>
      {certStatusLabels[status]}
    </span>
  );
}
