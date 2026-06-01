import { useState, useTransition } from 'react';
import { CreditCard, Banknote, Calendar, User, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { addSalePaymentAction } from '@/features/sale/actions/sale.actions';

type PaymentDef = {
  id: string;
  type: string;
  amount: number;
  createdAt?: string | Date;
};

type SalePaymentsHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDef | null;
  onRefresh: () => void;
};

export function BalanceSummary({ total, totalPaid, remaining }: { total: number; totalPaid: number; remaining: number }) {
  return (
    <div className='grid grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50'>
      <div className='flex flex-col'>
        <span className='text-[10px] font-bold uppercase text-zinc-400 tracking-wider'>Total Venta</span>
        <span className='text-base font-black text-zinc-900 dark:text-zinc-100'>
          ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className='flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-3'>
        <span className='text-[10px] font-bold uppercase text-zinc-400 tracking-wider'>Total Cobrado</span>
        <span className='text-base font-black text-emerald-600 dark:text-emerald-400'>
          ${totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className='flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-3'>
        <span className='text-[10px] font-bold uppercase text-zinc-400 tracking-wider'>Saldo Restante</span>
        <span className={`text-base font-black ${remaining > 0.01 ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
          ${remaining.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

export function PaymentHistoryRow({ payment }: { payment: PaymentDef }) {
  const date = payment.createdAt ? new Date(payment.createdAt) : new Date();
  const dateStr = `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  const isCash = payment.type === 'efectivo';

  return (
    <div className='flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-lg'>
      <div className='flex items-center gap-3'>
        <div className={`p-2 rounded-full ${isCash ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10'}`}>
          {isCash ? <Banknote className='w-4 h-4' /> : <CreditCard className='w-4 h-4' />}
        </div>
        <div>
          <p className='text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100'>{payment.type}</p>
          <p className='text-[10px] text-zinc-400 font-bold'>{dateStr}</p>
        </div>
      </div>
      <span className='font-black text-indigo-600 dark:text-indigo-400'>
        ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export function PaymentHistoryList({ payments }: { payments: PaymentDef[] }) {
  if (!payments || payments.length === 0) {
    return (
      <div className='py-6 text-center text-zinc-400 italic text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg'>
        No hay pagos registrados para esta venta.
      </div>
    );
  }

  return (
    <div className='space-y-2 max-h-[160px] overflow-y-auto pr-1'>
      {payments.map((p) => (
        <PaymentHistoryRow key={p.id} payment={p} />
      ))}
    </div>
  );
}

function useAddPaymentForm(remaining: number, onSubmit: (type: 'efectivo' | 'transferencia', amount: number) => void) {
  const [type, setType] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (val: string) => {
    if (val === '' || (!val.includes('.') && /^\d*,?\d{0,2}$/.test(val))) {
      setAmountStr(val);
      setError(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Monto inválido');
      return;
    }
    if (cleanAmount > remaining + 0.001) {
      setError(`El monto excede el saldo pendiente`);
      return;
    }
    onSubmit(type, cleanAmount);
    setAmountStr('');
  };

  return { type, setType, amountStr, error, handleAmountChange, handleFormSubmit };
}

export function PaymentTypeButtons({ type, setType }: { type: 'efectivo' | 'transferencia'; setType: (t: 'efectivo' | 'transferencia') => void }) {
  const isCash = type === 'efectivo';
  const isTransf = type === 'transferencia';
  const btnClass = 'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all';
  return (
    <div className='grid grid-cols-2 gap-2'>
      <button
        type='button'
        onClick={() => setType('efectivo')}
        className={`${btnClass} ${isCash ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400'}`}
      >
        <Banknote className='w-4 h-4' />
        <span>Efectivo</span>
      </button>
      <button
        type='button'
        onClick={() => setType('transferencia')}
        className={`${btnClass} ${isTransf ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400'}`}
      >
        <CreditCard className='w-4 h-4' />
        <span>Transferencia</span>
      </button>
    </div>
  );
}

export function AddPaymentForm({ onSubmit, isPending, remaining }: { onSubmit: (t: 'efectivo' | 'transferencia', a: number) => void; isPending: boolean; remaining: number }) {
  const { type, setType, amountStr, error, handleAmountChange, handleFormSubmit } = useAddPaymentForm(remaining, onSubmit);

  return (
    <form onSubmit={handleFormSubmit} className='p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-3'>
      <span className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Agregar Pago Parcial</span>
      <PaymentTypeButtons type={type} setType={setType} />
      <div className='relative'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm'>$</span>
        <input
          type='text'
          inputMode='decimal'
          placeholder='0,00'
          className='w-full pl-7 pr-20 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-sm text-zinc-900 dark:text-zinc-100'
          value={amountStr}
          onChange={(e) => handleAmountChange(e.target.value)}
        />
        <Button
          type='submit'
          className='absolute right-1 top-1/2 -translate-y-1/2 h-8 text-xs font-bold px-3 py-1'
          isLoading={isPending}
          disabled={!amountStr}
        >
          Pagar
        </Button>
      </div>
      {error && (
        <div className='text-[10px] text-red-500 font-bold flex items-center gap-1'>
          <AlertCircle className='w-3 h-3' />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}

export function SaleInfoSection({ customerName, dateString }: { customerName: string; dateString: string }) {
  return (
    <div className='flex flex-col gap-1 text-sm bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/40'>
      <div className='flex justify-between items-center'>
        <span className='text-xs text-zinc-400 font-bold flex items-center gap-1'>
          <User className='w-3 h-3' /> Cliente
        </span>
        <span className='font-bold text-zinc-800 dark:text-zinc-200'>{customerName}</span>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-xs text-zinc-400 font-bold flex items-center gap-1'>
          <Calendar className='w-3 h-3' /> Fecha de Emisión
        </span>
        <span className='font-bold text-zinc-800 dark:text-zinc-200'>{dateString}</span>
      </div>
    </div>
  );
}

export function SalePaymentsHistoryModal({ isOpen, onClose, sale, onRefresh }: SalePaymentsHistoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  if (!sale) return null;

  const totalPaid = sale.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const remaining = Math.max(0, sale.total - totalPaid);
  const date = new Date(sale.createdAt);
  const dateStr = `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  const clientName = sale.customer?.name || 'Consumidor Final';

  const handleAddPayment = (type: 'efectivo' | 'transferencia', amount: number) => {
    setLocalError(null);
    setLocalSuccess(null);
    startTransition(async () => {
      const res = await addSalePaymentAction(sale.id, type, amount);
      if (res.success) {
        setLocalSuccess(res.message || 'Pago registrado');
        onRefresh();
      } else {
        setLocalError(res.error);
      }
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Historial de Pagos'
      icon={<DollarSign className='w-5 h-5 text-indigo-600' />}
      width='md'
    >
      <div className='space-y-4 text-zinc-800 dark:text-zinc-100'>
        <SaleInfoSection customerName={clientName} dateString={dateStr} />
        <BalanceSummary total={sale.total} totalPaid={totalPaid} remaining={remaining} />
        
        <div className='space-y-2'>
          <span className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Historial</span>
          <PaymentHistoryList payments={sale.payments || []} />
        </div>

        {remaining > 0.01 && (
          <AddPaymentForm onSubmit={handleAddPayment} isPending={isPending} remaining={remaining} />
        )}

        {localError && (
          <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg border border-red-100 dark:border-red-900/30 text-xs font-bold'>
            <AlertCircle className='w-4 h-4 shrink-0' />
            <span>{localError}</span>
          </div>
        )}

        {localSuccess && (
          <div className='flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold'>
            <CheckCircle className='w-4 h-4 shrink-0' />
            <span>{localSuccess}</span>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
