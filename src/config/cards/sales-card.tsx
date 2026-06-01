/* eslint-disable react/display-name */
import { FileText, Trash2, Banknote } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type SaleDef } from '@/features/sale/domain/sale.schema';

interface SaleCardActionsProps {
  role?: string;
  onPrint: (s: SaleDef) => void;
  onDelete: (id: string) => void;
  onManagePayments: (s: SaleDef) => void;
}

function formatDate(raw: string | Date) {
  const d = new Date(raw);
  return {
    date: d.toLocaleDateString('es-AR'),
    time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const getPaymentStatus = (s: SaleDef) => {
  const totalPaid = s.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const remaining = Math.max(0, s.total - totalPaid);
  const hasPayments = s.payments && s.payments.length > 0;

  if (remaining < 0.01) {
    return {
      label: 'Pagado',
      colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    };
  } else if (hasPayments) {
    return {
      label: `Parcial (Falta $${remaining.toLocaleString('es-AR')})`,
      colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };
  } else {
    return {
      label: `Pendiente (Falta $${remaining.toLocaleString('es-AR')})`,
      colorClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    };
  }
};

export function renderSaleCard(actions: SaleCardActionsProps) {
  return (sale: SaleDef) => {
    const { date, time } = formatDate(sale.createdAt);
    const { label, colorClass } = getPaymentStatus(sale);

    return (
      <EntityCard
        key={sale.id}
        title={
          <span>
            {date}{' '}
            <span className='text-indigo-600 dark:text-indigo-400 font-bold'>{time}</span>
          </span>
        }
        subtitle={sale.customer?.name ?? 'Consumidor Final'}
        badges={
          <div className='flex flex-wrap gap-1 items-center'>
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${colorClass}`}>
              {label}
            </span>
            {sale.payments?.map((p, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 text-xs font-black uppercase rounded ${p.type === 'efectivo' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10'}`}
              >
                {p.type === 'efectivo' ? 'EF' : 'TR'}
              </span>
            ))}
          </div>
        }
        details={
          <div className='flex flex-col gap-1 mt-1'>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>Vendedor</span>
              <span className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-black rounded uppercase'>
                {sale.vendor?.username ?? 'Sistema'}
              </span>
            </div>
            {(sale.discountPercentage > 0 || sale.discountAmount > 0) && (
              <div className='flex justify-between items-center'>
                <span className='text-xs text-zinc-400'>Descuento</span>
                <span className='text-emerald-600 dark:text-emerald-400 font-bold text-sm'>
                  {sale.discountPercentage > 0 ? `-${sale.discountPercentage}%` : `-$${sale.discountAmount.toLocaleString('es-AR')}`}
                </span>
              </div>
            )}
            <div className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>Total</span>
              <span className='font-black text-zinc-900 dark:text-zinc-100 text-base'>
                ${sale.total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        }
        actions={
          <>
            <CardAction
              icon={<Banknote className='w-4 h-4' />}
              label='Gestionar Pagos'
              onClick={() => actions.onManagePayments(sale)}
            />
            <CardAction
              icon={<FileText className='w-4 h-4' />}
              label='Imprimir Factura'
              onClick={() => actions.onPrint(sale)}
            />
            {actions.role === 'admin' && (
              <CardAction
                icon={<Trash2 className='w-4 h-4' />}
                label='Anular Venta'
                onClick={() => actions.onDelete(sale.id!)}
                variant='danger'
              />
            )}
          </>
        }
      />
    );
  };
}
