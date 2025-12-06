import api from './api';
import * as XLSX from 'xlsx';
import { PH_LOCALE, PH_TIME_ZONE, parseApiDate } from '../utils/formatters';

export interface InventoryMovementDto {
  movementId: number;
  productId: number;
  productName: string;
  productCode: string;
  movementType: 'Inbound' | 'Outbound';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: string;
  referenceId: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface RecordInboundDto {
  productId: number;
  quantity: number;
  referenceType: 'PurchaseOrder' | 'Return' | 'Adjustment';
  referenceId?: string;
  reason?: string;
  userId?: number;
}

export interface RecordAdjustmentDto {
  productId: number;
  quantity: number;
  reason: string;
  referenceId?: string;
  userId?: number;
}

export interface MovementSummaryDto {
  productId: number;
  month: number;
  year: number;
  totalInbound: number;
  totalOutbound: number;
  netChange: number;
}

export interface MovementFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
  movementType?: 'Inbound' | 'Outbound';
}

export const inventoryMovementService = {
  /**
   * Gets inventory movements with optional filters
   */
  getMovements: async (filters?: MovementFilters): Promise<InventoryMovementDto[]> => {
    const { data } = await api.get<InventoryMovementDto[]>('/inventory-movements', {
      params: filters,
    });
    return data;
  },

  /**
   * Gets movements for a specific product
   */
  getProductMovements: async (productId: number, limit?: number): Promise<InventoryMovementDto[]> => {
    const { data } = await api.get<InventoryMovementDto[]>(`/inventory-movements/product/${productId}`, {
      params: limit ? { limit } : undefined,
    });
    return data;
  },

  /**
   * Records an inbound movement (admin only)
   */
  recordInbound: async (dto: RecordInboundDto): Promise<InventoryMovementDto> => {
    const { data } = await api.post<InventoryMovementDto>('/inventory-movements/inbound', dto);
    return data;
  },

  /**
   * Records a manual adjustment (admin only)
   */
  recordAdjustment: async (dto: RecordAdjustmentDto): Promise<InventoryMovementDto> => {
    const { data } = await api.post<InventoryMovementDto>('/inventory-movements/adjustment', dto);
    return data;
  },

  /**
   * Gets movement summary for a product in a specific month
   */
  getMovementSummary: async (
    productId: number,
    month?: number,
    year?: number
  ): Promise<MovementSummaryDto> => {
    const { data } = await api.get<MovementSummaryDto>(`/inventory-movements/summary/${productId}`, {
      params: { month, year },
    });
    return data;
  },

  /**
   * Exports movements to Excel (organized format)
   */
  exportMovements: (movements: InventoryMovementDto[], filename: string = 'inventory-movements.xlsx') => {
    // Prepare data for Excel
    const excelData = movements.map((m) => ({
      'Date & Time': parseApiDate(m.createdAt).toLocaleString(PH_LOCALE, { timeZone: PH_TIME_ZONE }),
      'Product Code': m.productCode,
      'Product Name': m.productName,
      'Type': m.movementType,
      'Quantity': m.quantity,
      'Previous Balance': m.previousQuantity,
      'New Balance': m.newQuantity,
      'Reference Type': m.referenceType,
      'Reference ID': m.referenceId || '',
      'Reason': m.reason || '',
      'Created By': m.createdBy,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Movements');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // Date & Time
      { wch: 15 }, // Product Code
      { wch: 30 }, // Product Name
      { wch: 10 }, // Type
      { wch: 10 }, // Quantity
      { wch: 15 }, // Previous Balance
      { wch: 15 }, // New Balance
      { wch: 15 }, // Reference Type
      { wch: 15 }, // Reference ID
      { wch: 30 }, // Reason
      { wch: 20 }, // Created By
    ];
    worksheet['!cols'] = columnWidths;

    // Generate Excel file and download
    XLSX.writeFile(workbook, filename);
  },
};
