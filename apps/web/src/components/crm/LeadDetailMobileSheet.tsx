import { Dialog } from '@/components/molecules/Dialog';
import { LeadDetail } from '@/components/crm/LeadDetail';
import type { Lead } from '@/types/leads';

interface LeadDetailMobileSheetProps {
  open: boolean;
  lead: Lead | null;
  productName?: string | null;
  loading?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onDelete?: (leadId: string) => void;
}

export function LeadDetailMobileSheet({
  open,
  lead,
  productName,
  loading,
  deleting,
  onClose,
  onDelete,
}: LeadDetailMobileSheetProps) {
  const title = loading ? 'Detalle del lead' : lead?.name || lead?.email || 'Detalle del lead';
  const description =
    lead && !loading ? lead.email : loading ? 'Cargando información…' : undefined;

  return (
    <Dialog
      visible={open}
      onHide={onClose}
      title={title}
      description={description}
      size="full"
    >
      <LeadDetail
        layout="plain"
        lead={lead}
        productName={productName}
        loading={loading}
        onClose={onClose}
        onDelete={onDelete}
        deleting={deleting}
      />
    </Dialog>
  );
}

export default LeadDetailMobileSheet;
