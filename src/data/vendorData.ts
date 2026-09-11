import {
  VendorBooking,
  BlockedDate,
  WhatsAppThread,
  CrewMember,
  VendorInvoice,
  FinancialPayout,
  VendorBrandSettings,
  POSItem,
  POSSaleRecord,
  ClientOrderTracking,
  ExpenseRecord,
  ReceivableDebt,
  CrewPayrollEntry,
  ConsolidatedCrewPaymentVoucher,
  CrewWorkHourLog,
  InventoryItem,
} from '../types';

export const DEFAULT_VENDOR_BRAND_SETTINGS: VendorBrandSettings = {
  brandName: '',
  slogan: '',
  logoUrl: '',
  stampUrl: '',
  crNumber: '',
  vatNumber: '',
  phone: '',
  email: '',
  city: 'الرياض',
  address: '',
  primaryColor: '#0A1A33',
  bankName: '',
  accountHolder: '',
  iban: '',
  invoiceHeaderNote: '',
  invoiceFooterNotes: '',
  showWatermark: true,
  fulfillment: [],
};

/** Empty on purpose: marketplace listings come from real vendor workspaces only. */
export const INITIAL_POS_ITEMS: POSItem[] = [];
export const INITIAL_POS_SALES: POSSaleRecord[] = [];
export const INITIAL_ORDER_TRACKINGS: ClientOrderTracking[] = [];
export const INITIAL_BLOCKED_DATES: BlockedDate[] = [];
export const INITIAL_VENDOR_BOOKINGS: VendorBooking[] = [];
export const INITIAL_WHATSAPP_THREADS: WhatsAppThread[] = [];
export const INITIAL_CREW_MEMBERS: CrewMember[] = [];
export const INITIAL_INVOICES: VendorInvoice[] = [];
export const INITIAL_PAYOUTS: FinancialPayout[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_RECEIVABLES: ReceivableDebt[] = [];
export const INITIAL_CREW_PAYROLL: CrewPayrollEntry[] = [];
export const INITIAL_CONSOLIDATED_VOUCHERS: ConsolidatedCrewPaymentVoucher[] = [];
export const INITIAL_CREW_WORK_HOURS: CrewWorkHourLog[] = [];
export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [];
