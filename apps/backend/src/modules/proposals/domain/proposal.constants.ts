export type ProposalStatus =
  | 'generating'
  | 'draft'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'failed';

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'generating',
  'draft',
  'reviewing',
  'accepted',
  'rejected',
  'failed',
];

export const SIGNABLE_STATUSES: ProposalStatus[] = ['draft', 'reviewing'];
