import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ProductPayload } from '../../services/productService';

type AddProductModalProps = {
	open: boolean;
	categories: string[];
	onClose: () => void;
	onSave: (payload: ProductPayload) => Promise<void> | void;
};

type FormState = {
	productCode: string;
	productName: string;
	category: string;
	unitPrice: string;
	stockQuantity: string;
	supplierName: string;
	expiryDate: string;
	description: string;
};

const EMPTY_FORM: FormState = {
	productCode: '',
	productName: '',
	category: '',
	unitPrice: '',
	stockQuantity: '',
	supplierName: '',
	expiryDate: '',
	description: '',
};

const AddProductModal = ({ open, categories, onClose, onSave }: AddProductModalProps) => {
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const normalizedCategories = useMemo(() => Array.from(new Set(categories)).filter(Boolean), [categories]);

	if (!open) {
		return null;
	}

	const handleChange = (field: keyof FormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!form.productCode.trim() || !form.productName.trim()) {
			setError('Product code and product name are required.');
			return;
		}

		if (!form.category.trim()) {
			setError('Please select a category.');
			return;
		}

		const parsedPrice = Number(form.unitPrice);
		const parsedStock = Number(form.stockQuantity);

		if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
			setError('Enter a valid unit price greater than zero.');
			return;
		}

		if (!Number.isFinite(parsedStock) || parsedStock < 0) {
			setError('Enter a valid stock quantity of zero or more.');
			return;
		}

		setSaving(true);
		setError(null);

		try {
			await onSave({
				productCode: form.productCode.trim(),
				productName: form.productName.trim(),
				category: form.category.trim(),
				unitPrice: parsedPrice,
				stockQuantity: parsedStock,
				supplierName: form.supplierName.trim() || null,
				expiryDate: form.expiryDate || null,
				description: form.description.trim() || null,
				manufacturingDate: null,
			});

			setForm(EMPTY_FORM);
			onClose();
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setError(caughtError.message || 'Unable to add product.');
			} else {
				setError('Unable to add product.');
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur">
			<div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
				<div className="flex items-center justify-between p-8 pb-4">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
						<p className="text-sm text-brand-muted">Fill in the details below to register a new inventory item.</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
						aria-label="Close add product modal"
						disabled={saving}
					>
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>

				<div className="max-h-[70vh] overflow-y-auto px-8">
					{error ? (
						<div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
							{error}
						</div>
					) : null}

					<div className="grid gap-6 sm:grid-cols-2">
					<label className="text-sm font-semibold text-slate-700">
						Product Code
						<input
							value={form.productCode}
							onChange={(event) => handleChange('productCode', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="e.g. MED-1001"
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Product Name
						<input
							value={form.productName}
							onChange={(event) => handleChange('productName', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="e.g. Paracetamol 500mg"
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Category
						<select
							value={form.category}
							onChange={(event) => handleChange('category', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							disabled={saving}
						>
							<option value="">Select category</option>
							{normalizedCategories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Supplier
						<input
							value={form.supplierName}
							onChange={(event) => handleChange('supplierName', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="e.g. MediSupplies Inc."
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Unit Price (PHP)
						<input
							type="number"
							min="0"
							step="0.01"
							value={form.unitPrice}
							onChange={(event) => handleChange('unitPrice', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="0.00"
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Stock Quantity
						<input
							type="number"
							min="0"
							value={form.stockQuantity}
							onChange={(event) => handleChange('stockQuantity', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="0"
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						Expiry Date
						<input
							type="date"
							value={form.expiryDate}
							onChange={(event) => handleChange('expiryDate', event.target.value)}
							className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							disabled={saving}
						/>
					</label>

					<label className="text-sm font-semibold text-slate-700 sm:col-span-2">
						Description (optional)
						<textarea
							value={form.description}
							onChange={(event) => handleChange('description', event.target.value)}
							className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
							placeholder="Add dosage, instructions, or other notes"
						disabled={saving}
					/>
				</label>
			</div>
			</div>

				<div className="flex justify-end gap-3 px-8 pb-8 pt-4 relative z-10">
					<button
						type="button"
						onClick={onClose}
						className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
						disabled={saving}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						className="rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:brightness-105 disabled:opacity-75 disabled:cursor-not-allowed"
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Product'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AddProductModal;

