import {
  complaintStageLabels,
  type ComplaintStage,
} from '@/mock/prototype/complaints';

const stageTone: Record<ComplaintStage, string> = {
  intake: 'bg-slate-100 text-slate-600',
  factfinding: 'badge-info',
  subcommittee: 'badge-warning',
  council: 'badge-warning',
  resolution: 'badge-error',
  closed: 'badge-success',
};

export function StageBadge({ stage }: { stage: ComplaintStage }) {
  return (
    <span className={`badge ${stageTone[stage]}`}>
      {complaintStageLabels[stage]}
    </span>
  );
}

const sevTone: Record<string, string> = {
  ต่ำ: 'badge-success',
  ปานกลาง: 'badge-warning',
  สูง: 'badge-error',
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`badge ${sevTone[severity] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {severity}
    </span>
  );
}
