import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productCreateSchema, type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';

interface UseProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput | ProductUpdateInput) => void;
  editingItem?: ProductDef | null;
}

export function parseFormattedNumber(val: string): number {
  if (!val) return 0;
  const sanitized = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

export function formatNumberForForm(num: number): string {
  return num.toFixed(2).replace('.', ',');
}

export function useProductForm({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
}: UseProductFormProps) {
  const [markupPercentage, setMarkupPercentage] = useState<string>('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProductInput>({
    resolver: zodResolver(productCreateSchema),
  });

  const selectedDeviceId = watch('deviceId');
  const selectedProviderId = watch('providerId');

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      reset({
        deviceId: editingItem.deviceId,
        providerId: editingItem.providerId,
        description: editingItem.description || '',
        purchasePrice: formatNumberForForm(editingItem.purchasePrice),
        salePrice: formatNumberForForm(editingItem.salePrice),
        stock: editingItem.stock,
      } as any);
      const cost = editingItem.purchasePrice;
      const sale = editingItem.salePrice;
      setMarkupPercentage(cost > 0 ? formatNumberForForm(((sale - cost) / cost) * 100) : '0,00');
    } else {
      reset({
        deviceId: '',
        providerId: '',
        description: '',
        purchasePrice: '0,00',
        salePrice: '0,00',
        stock: 1,
      } as any);
      setMarkupPercentage('');
    }
  }, [isOpen, editingItem, reset]);

  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    setValue('purchasePrice', val, { shouldDirty: true, shouldValidate: true });
    const cost = parseFormattedNumber(val);
    const markupVal = parseFloat(markupPercentage.replace(',', '.'));
    if (cost > 0 && !isNaN(markupVal)) {
      setValue('salePrice', formatNumberForForm(cost * (1 + markupVal / 100)), { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    setValue('salePrice', val, { shouldDirty: true, shouldValidate: true });
    const cost = parseFormattedNumber(watch('purchasePrice') || '0');
    const sale = parseFormattedNumber(val);
    if (cost > 0) {
      setMarkupPercentage(formatNumberForForm(((sale - cost) / cost) * 100));
    }
  };

  const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\./g, '');
    setMarkupPercentage(val);
    const cost = parseFormattedNumber(watch('purchasePrice') || '0');
    const markupVal = parseFloat(val.replace(',', '.'));
    if (cost > 0 && !isNaN(markupVal)) {
      setValue('salePrice', formatNumberForForm(cost * (1 + markupVal / 100)), { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleFormSubmit = (data: ProductInput) => {
    if (editingItem) {
      const changedData: any = {
        version: editingItem.version,
        deviceVersion: editingItem.device?.version,
        providerVersion: editingItem.provider?.version,
      };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        const k = key as keyof ProductInput;
        if (k === 'stock') {
          changedData.stockDelta = (data.stock ?? 0) - (editingItem.stock ?? 0);
          if (changedData.stockDelta !== 0) hasChanges = true;
        } else {
          changedData[k] = data[k];
          hasChanges = true;
        }
      });
      if (!hasChanges) {
        onClose();
        return;
      }
      onSubmit(changedData as ProductUpdateInput);
    } else {
      onSubmit(data);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    selectedDeviceId,
    selectedProviderId,
    setValue,
    markupPercentage,
    handlePurchasePriceChange,
    handleSalePriceChange,
    handleMarkupChange,
    handleFormSubmit,
  };
}
