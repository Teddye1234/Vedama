// ============================
// Vedama Platform — Type Definitions
// ============================

export type UserRole = 'admin' | 'finance' | 'landlord' | 'client' | 'service_provider';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export type PlotSize = '50x100' | '100x100' | 'quarter_acre' | 'half_acre' | 'full_acre' | 'multi_acre';

export interface Property {
  id: string;
  title: string;
  location: string;
  county: string;
  description: string;
  totalAcres: number;
  totalPlots: number;
  soldPlots: number;
  pricePerPlot: number;
  pricePerAcre: number;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  status: 'available' | 'selling' | 'sold_out';
  featured: boolean;
  createdAt: string;
  landlordId?: string;
  landlordAgreedPrice?: number;
  lienholderBank?: string;
  // Real-world document attachments
  titleDeedUrl?: string;
  surveyMapUrl?: string;
  nemaCertUrl?: string;
  landRateCertUrl?: string;
  valuationReportUrl?: string;
}

export type TransactionStatus = 'pending' | 'negotiating' | 'agreed' | 'deposit_paid' | 'partially_paid' | 'fully_paid' | 'cancelled';

export interface Transaction {
  id: string;
  reference: string;
  propertyId: string;
  propertyTitle: string;
  clientId: string;
  clientName: string;
  plotSize: PlotSize;
  plotCount: number;
  unitPrice: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: TransactionStatus;
  offerAmount?: number;
  counterOffer?: number;
  agreedPrice?: number;
  depositAmount: number;
  dueDate: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  assetType?: 'land' | 'vehicle' | 'house' | 'machine';
  assetDetails?: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  method: 'mpesa' | 'bank_transfer' | 'cash' | 'cheque';
  reference: string;
  date: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  type: 'income' | 'expense' | 'commission' | 'landlord_payment';
  costCategory?: 'rents_directors' | 'transport_fuel' | 'electricity_water' | 'commissions_third_party' | 'licenses' | 'legal_fees' | 'bulk_sms' | 'system' | 'others';
  description: string;
  amount: number;
  landlordShare: number;
  companyCommission: number;
  date: string;
  status: 'pending' | 'processed' | 'reconciled';
}

export interface Voucher {
  id: string;
  reference: string;
  description: string;
  amount: number;
  payee: string;
  approvedBy?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  isLandlordVoucher?: boolean;
  landlordId?: string;
  releasedBy?: string;
  releasedAt?: string;
  bankReleaseHash?: string;
  voucherLines?: { no: number; name: string; refNo: string; amount: number; netAmount: number }[];
}

export interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: string[];
  totalRevenue: number;
  pendingPayment: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unitNumber: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  balance: number;
  lastPaymentDate?: string;
  status: 'active' | 'arrears' | 'distress' | 'vacated';
  unpaidMonths?: number;
  interestCharged?: number;
  advocateNotified?: boolean;
  advocateName?: string;
  distressDate?: string;
  leaseAgreementUrl?: string;
}

export interface ServiceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  category: 'masonry' | 'plumbing' | 'electrical' | 'painting' | 'carpentry' | 'general';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'closed';
  assignedProviderId?: string;
  assignedProviderName?: string;
  quotedAmount?: number;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  videoUrl?: string;
  responsibility?: 'tenant' | 'landlord';
  isConfirmedByTenant?: boolean;
  isConfirmedByLandlord?: boolean;
  invoiceUrl?: string;
  paymentVoucherId?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  jobsCompleted: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  type: 'email' | 'whatsapp' | 'sms';
  recipient: string;
  recipientName: string;
  subject: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  category: 'payment_reminder' | 'receipt' | 'marketing' | 'alert' | 'thank_you';
  sentAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface KPIData {
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  outstandingBalances: number;
  totalProperties: number;
  totalClients: number;
  salesThisMonth: number;
  revenueThisMonth: number;
}

export interface Director {
  name: string;
  title: string;
  bio: string;
  image: string;
}

export interface SalesTrend {
  month: string;
  sales: number;
  revenue: number;
}

export interface PaymentInflow {
  month: string;
  amount: number;
}
