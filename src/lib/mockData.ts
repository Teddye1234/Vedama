import { Property, Transaction, Tenant, Landlord, ServiceProvider, ServiceRequest, CommunicationLog, AuditLog, User, Voucher, LedgerEntry } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'James Mwangi', email: 'admin@vedama.co.ke', phone: '0712345678', role: 'admin', isActive: true, createdAt: '2024-01-01' },
  { id: 'u2', name: 'Grace Wanjiku', email: 'finance@vedama.co.ke', phone: '0723456789', role: 'finance', isActive: true, createdAt: '2024-01-05' },
  { id: 'u3', name: 'Peter Kamau', email: 'landlord@vedama.co.ke', phone: '0734567890', role: 'landlord', isActive: true, createdAt: '2024-01-10' },
  { id: 'u4', name: 'Mary Njeri', email: 'client@vedama.co.ke', phone: '0745678901', role: 'client', isActive: true, createdAt: '2024-02-01' },
  { id: 'u5', name: 'David Ochieng', email: 'provider@vedama.co.ke', phone: '0756789012', role: 'service_provider', isActive: true, createdAt: '2024-02-15' },
];

export const mockProperties: Property[] = [
  {
    id: 'p1', title: 'Malindi Oceanview Estate', location: 'Malindi, Kilifi County', county: 'Kilifi',
    description: 'Premium beachfront plots with breathtaking Indian Ocean views. Gated estate with security, water, and electricity. Perfect for holiday homes, hotels, or investment.',
    totalAcres: 50, totalPlots: 400, soldPlots: 312, pricePerPlot: 850000, pricePerAcre: 6800000,
    lat: -3.2194, lng: 40.1169, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
    amenities: ['Electricity', 'Water', 'Security', 'Paved Roads', 'Title Deeds Ready'],
    status: 'selling', featured: true, createdAt: '2024-01-15',
  },
  {
    id: 'p2', title: 'Thika Greens Residential', location: 'Thika, Kiambu County', county: 'Kiambu',
    description: 'Affordable residential plots in a rapidly developing suburb of Nairobi. Close to SGR station, schools, and malls. Ready title deeds.',
    totalAcres: 30, totalPlots: 240, soldPlots: 180, pricePerPlot: 450000, pricePerAcre: 3600000,
    lat: -1.0332, lng: 37.0692, images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    amenities: ['Water', 'Electricity', 'All-weather Road', 'Near SGR'],
    status: 'selling', featured: true, createdAt: '2024-02-01',
  },
  {
    id: 'p3', title: 'Nakuru Valley Farms', location: 'Nakuru, Rift Valley', county: 'Nakuru',
    description: 'Agricultural and residential plots in the heart of the Rift Valley. Fertile land ideal for farming or serene residential development.',
    totalAcres: 100, totalPlots: 800, soldPlots: 120, pricePerPlot: 280000, pricePerAcre: 2240000,
    lat: -0.3031, lng: 36.0800, images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'],
    amenities: ['Water Borehole', 'Electricity Nearby', 'Fertile Soil', 'Title Deeds Ready'],
    status: 'available', featured: false, createdAt: '2024-03-01',
  },
  {
    id: 'p4', title: 'Diani Palm Beach Plots', location: 'Diani, Kwale County', county: 'Kwale',
    description: 'Exclusive beachfront and near-beach plots in Kenya\'s premier beach destination. Ideal for resort development or luxury homes.',
    totalAcres: 20, totalPlots: 80, soldPlots: 75, pricePerPlot: 1800000, pricePerAcre: 14400000,
    lat: -4.3167, lng: 39.5667, images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
    amenities: ['Beach Access', 'KPLC Power', 'Water', 'Security', 'Title Ready'],
    status: 'selling', featured: true, createdAt: '2024-01-20',
  },
  {
    id: 'p5', title: 'Konza Smart City Adjacent', location: 'Machakos County', county: 'Machakos',
    description: 'Strategic investment plots adjacent to the Konza Technopolis Smart City. High capital appreciation potential in Kenya\'s silicon valley.',
    totalAcres: 75, totalPlots: 600, soldPlots: 230, pricePerPlot: 380000, pricePerAcre: 3040000,
    lat: -1.7167, lng: 37.1500, images: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800'],
    amenities: ['Near Konza City', 'Electricity', 'Paved Roads', 'Title Ready'],
    status: 'selling', featured: false, createdAt: '2024-02-20',
  },
  {
    id: 'p6', title: 'Limuru Highland Retreat', location: 'Limuru, Kiambu County', county: 'Kiambu',
    description: 'Cool highland plots with spectacular views of the Great Rift Valley. Perfect for weekend homes and eco-tourism ventures.',
    totalAcres: 40, totalPlots: 160, soldPlots: 60, pricePerPlot: 650000, pricePerAcre: 5200000,
    lat: -1.1167, lng: 36.6333, images: ['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
    amenities: ['Cool Climate', 'Water', 'Great Views', 'Electricity'],
    status: 'available', featured: false, createdAt: '2024-03-10',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1', reference: 'VDM-2024-001', propertyId: 'p1', propertyTitle: 'Malindi Oceanview Estate',
    clientId: 'c1', clientName: 'Mary Njeri', plotSize: '50x100', plotCount: 2,
    unitPrice: 850000, totalAmount: 1700000, amountPaid: 1200000, balance: 500000,
    status: 'partially_paid', depositAmount: 300000, dueDate: '2024-09-30',
    payments: [
      { id: 'pay1', transactionId: 't1', amount: 300000, method: 'mpesa', reference: 'QGH8237492', date: '2024-03-15', status: 'confirmed' },
      { id: 'pay2', transactionId: 't1', amount: 500000, method: 'bank_transfer', reference: 'BTR20240401', date: '2024-04-01', status: 'confirmed' },
      { id: 'pay3', transactionId: 't1', amount: 400000, method: 'mpesa', reference: 'QKL9923847', date: '2024-05-10', status: 'confirmed' },
    ],
    createdAt: '2024-03-15', updatedAt: '2024-05-10',
  },
  {
    id: 't2', reference: 'VDM-2024-002', propertyId: 'p2', propertyTitle: 'Thika Greens Residential',
    clientId: 'c2', clientName: 'John Odhiambo', plotSize: 'quarter_acre', plotCount: 1,
    unitPrice: 900000, totalAmount: 900000, amountPaid: 900000, balance: 0,
    status: 'fully_paid', depositAmount: 180000, dueDate: '2024-06-30',
    payments: [
      { id: 'pay4', transactionId: 't2', amount: 900000, method: 'bank_transfer', reference: 'BTR20240320', date: '2024-03-20', status: 'confirmed' },
    ],
    createdAt: '2024-03-01', updatedAt: '2024-03-20',
  },
  {
    id: 't3', reference: 'VDM-2024-003', propertyId: 'p4', propertyTitle: 'Diani Palm Beach Plots',
    clientId: 'c3', clientName: 'Sarah Kamau', plotSize: '100x100', plotCount: 1,
    unitPrice: 1800000, totalAmount: 1800000, amountPaid: 360000, balance: 1440000,
    status: 'deposit_paid', depositAmount: 360000, dueDate: '2024-12-31',
    payments: [
      { id: 'pay5', transactionId: 't3', amount: 360000, method: 'mpesa', reference: 'QMN7741234', date: '2024-04-05', status: 'confirmed' },
    ],
    createdAt: '2024-04-01', updatedAt: '2024-04-05',
  },
  {
    id: 't4', reference: 'VDM-2024-004', propertyId: 'p5', propertyTitle: 'Konza Smart City Adjacent',
    clientId: 'c4', clientName: 'Robert Mutua', plotSize: 'half_acre', plotCount: 1,
    unitPrice: 1520000, totalAmount: 1520000, amountPaid: 0, balance: 1520000,
    status: 'negotiating', offerAmount: 1350000, counterOffer: 1480000,
    depositAmount: 304000, dueDate: '2025-01-31',
    payments: [], createdAt: '2024-05-01', updatedAt: '2024-05-05',
  },
  {
    id: 't5', reference: 'VDM-2024-005', propertyId: 'p1', propertyTitle: 'Malindi Oceanview Estate',
    clientId: 'c5', clientName: 'Angela Wangari', plotSize: 'full_acre', plotCount: 1,
    unitPrice: 6800000, totalAmount: 6800000, amountPaid: 3400000, balance: 3400000,
    status: 'partially_paid', depositAmount: 1360000, dueDate: '2025-03-31',
    payments: [
      { id: 'pay6', transactionId: 't5', amount: 1360000, method: 'bank_transfer', reference: 'BTR20240415', date: '2024-04-15', status: 'confirmed' },
      { id: 'pay7', transactionId: 't5', amount: 2040000, method: 'bank_transfer', reference: 'BTR20240601', date: '2024-06-01', status: 'confirmed' },
    ],
    createdAt: '2024-04-10', updatedAt: '2024-06-01',
  },
];

export const mockLandlords: Landlord[] = [
  { id: 'l1', name: 'Peter Kamau', email: 'pkamau@email.com', phone: '0712000001', properties: ['prop1', 'prop2'], totalRevenue: 3840000, pendingPayment: 320000 },
  { id: 'l2', name: 'Esther Muthoni', email: 'emuthoni@email.com', phone: '0712000002', properties: ['prop3'], totalRevenue: 1260000, pendingPayment: 105000 },
  { id: 'l3', name: 'Samuel Cheruiyot', email: 'scheruiyot@email.com', phone: '0712000003', properties: ['prop4', 'prop5'], totalRevenue: 2400000, pendingPayment: 0 },
];

export const mockTenants: Tenant[] = [
  { id: 'ten1', name: 'Alice Akinyi', email: 'aalkinyi@email.com', phone: '0733100001', propertyId: 'prop1', unitNumber: 'A1', rentAmount: 35000, leaseStart: '2024-01-01', leaseEnd: '2024-12-31', balance: 0, lastPaymentDate: '2024-05-02', status: 'active' },
  { id: 'ten2', name: 'Brian Otieno', email: 'botieno@email.com', phone: '0733100002', propertyId: 'prop1', unitNumber: 'A2', rentAmount: 35000, leaseStart: '2024-01-01', leaseEnd: '2024-12-31', balance: 70000, lastPaymentDate: '2024-03-10', status: 'arrears' },
  { id: 'ten3', name: 'Carol Wambui', email: 'cwambui@email.com', phone: '0733100003', propertyId: 'prop2', unitNumber: 'B1', rentAmount: 45000, leaseStart: '2023-07-01', leaseEnd: '2024-06-30', balance: 135000, lastPaymentDate: '2024-02-01', status: 'distress' },
  { id: 'ten4', name: 'Dennis Kiplangat', email: 'dkiplangat@email.com', phone: '0733100004', propertyId: 'prop3', unitNumber: 'C1', rentAmount: 28000, leaseStart: '2024-02-01', leaseEnd: '2025-01-31', balance: 0, lastPaymentDate: '2024-05-05', status: 'active' },
  { id: 'ten5', name: 'Eva Nyambura', email: 'enyambura@email.com', phone: '0733100005', propertyId: 'prop4', unitNumber: 'D1', rentAmount: 55000, leaseStart: '2023-09-01', leaseEnd: '2024-08-31', balance: 0, lastPaymentDate: '2024-05-01', status: 'active' },
];

export const mockServiceProviders: ServiceProvider[] = [
  { id: 'sp1', name: 'Moses Waweru', company: 'Waweru Plumbing Services', email: 'mwaweru@email.com', phone: '0722300001', category: 'Plumbing', rating: 4.8, jobsCompleted: 47, status: 'active', createdAt: '2024-01-10' },
  { id: 'sp2', name: 'Jane Ng\'ang\'a', company: 'Bright Spark Electricals', email: 'jnganga@email.com', phone: '0722300002', category: 'Electrical', rating: 4.6, jobsCompleted: 63, status: 'active', createdAt: '2024-01-15' },
  { id: 'sp3', name: 'Kevin Mwema', company: 'FinishLine Carpentry', email: 'kmwema@email.com', phone: '0722300003', category: 'Carpentry', rating: 4.9, jobsCompleted: 29, status: 'active', createdAt: '2024-02-01' },
  { id: 'sp4', name: 'Lucy Auma', company: 'ColorPro Painters', email: 'lauma@email.com', phone: '0722300004', category: 'Painting', rating: 4.4, jobsCompleted: 38, status: 'active', createdAt: '2024-02-10' },
  { id: 'sp5', name: 'Mark Obiero', company: 'SwiftFix General Maintenance', email: 'mobiero@email.com', phone: '0722300005', category: 'General', rating: 4.2, jobsCompleted: 91, status: 'active', createdAt: '2023-11-01' },
];

export const mockServiceRequests: ServiceRequest[] = [
  { id: 'sr1', tenantId: 'ten1', tenantName: 'Alice Akinyi', propertyId: 'prop1', category: 'plumbing', description: 'Blocked kitchen sink, water not draining properly', priority: 'high', status: 'in_progress', assignedProviderId: 'sp1', assignedProviderName: 'Moses Waweru', quotedAmount: 8500, approvedBy: 'admin', createdAt: '2024-05-08', updatedAt: '2024-05-09' },
  { id: 'sr2', tenantId: 'ten2', tenantName: 'Brian Otieno', propertyId: 'prop1', category: 'electrical', description: 'Power sockets in bedroom not working', priority: 'medium', status: 'quoted', assignedProviderId: 'sp2', assignedProviderName: 'Jane Ng\'ang\'a', quotedAmount: 12000, createdAt: '2024-05-10', updatedAt: '2024-05-11' },
  { id: 'sr3', tenantId: 'ten4', tenantName: 'Dennis Kiplangat', propertyId: 'prop3', category: 'carpentry', description: 'Main door hinges broken, door not closing properly', priority: 'urgent', status: 'assigned', assignedProviderId: 'sp3', assignedProviderName: 'Kevin Mwema', createdAt: '2024-05-12', updatedAt: '2024-05-12' },
  { id: 'sr4', tenantId: 'ten5', tenantName: 'Eva Nyambura', propertyId: 'prop4', category: 'painting', description: 'Living room walls need repainting after water damage', priority: 'low', status: 'open', createdAt: '2024-05-13', updatedAt: '2024-05-13' },
];

export const mockVouchers: Voucher[] = [
  { id: 'v1', reference: 'VCH-2024-001', description: 'Plumbing repair payment - Unit A1', amount: 8500, payee: 'Moses Waweru', approvedBy: 'James Mwangi', status: 'approved', createdAt: '2024-05-09' },
  { id: 'v2', reference: 'VCH-2024-002', description: 'Monthly landlord payment - Peter Kamau', amount: 320000, payee: 'Peter Kamau', status: 'pending_approval', createdAt: '2024-05-01' },
  { id: 'v3', reference: 'VCH-2024-003', description: 'Office supplies and stationery', amount: 15000, payee: 'Nairobi Stationers Ltd', approvedBy: 'James Mwangi', status: 'paid', createdAt: '2024-04-30' },
  { id: 'v4', reference: 'VCH-2024-004', description: 'Electrical repairs - Unit A2', amount: 12000, payee: 'Jane Ng\'ang\'a', status: 'draft', createdAt: '2024-05-11' },
];

export const mockLedger: LedgerEntry[] = [
  { id: 'led1', transactionId: 't1', type: 'income', description: 'Plot sale deposit - VDM-2024-001', amount: 1200000, landlordShare: 960000, companyCommission: 240000, date: '2024-05-10', status: 'processed' },
  { id: 'led2', transactionId: 't2', type: 'income', description: 'Full plot payment - VDM-2024-002', amount: 900000, landlordShare: 720000, companyCommission: 180000, date: '2024-03-20', status: 'reconciled' },
  { id: 'led3', transactionId: 't3', type: 'income', description: 'Deposit received - VDM-2024-003', amount: 360000, landlordShare: 288000, companyCommission: 72000, date: '2024-04-05', status: 'processed' },
  { id: 'led4', transactionId: 't5', type: 'income', description: 'Partial payment - VDM-2024-005', amount: 3400000, landlordShare: 2720000, companyCommission: 680000, date: '2024-06-01', status: 'processed' },
];

export const mockCommunicationLogs: CommunicationLog[] = [
  { id: 'cm1', type: 'whatsapp', recipient: '+254745678901', recipientName: 'Mary Njeri', subject: 'Payment Reminder', message: 'Dear Mary, your balance of KES 500,000 is due on 30 Sep 2024. Please make payment to avoid penalty charges.', status: 'delivered', category: 'payment_reminder', sentAt: '2024-05-10T09:00:00Z' },
  { id: 'cm2', type: 'email', recipient: 'john@email.com', recipientName: 'John Odhiambo', subject: 'Payment Receipt - VDM-2024-002', message: 'Thank you for your full payment of KES 900,000. Please find attached your official receipt.', status: 'delivered', category: 'receipt', sentAt: '2024-03-20T14:30:00Z' },
  { id: 'cm3', type: 'whatsapp', recipient: '+254756789012', recipientName: 'Angela Wangari', subject: 'Balance Due Alert', message: 'Dear Angela, your remaining balance of KES 3,400,000 is due 31 March 2025. Contact us for payment plan options.', status: 'sent', category: 'alert', sentAt: '2024-06-01T10:00:00Z' },
  { id: 'cm4', type: 'email', recipient: 'marketing@bulk.vedama.co.ke', recipientName: 'All Subscribers', subject: 'New Listings in Malindi!', message: 'Exclusive beachfront plots now available from KES 850,000. Limited units remaining. Book your site visit today!', status: 'delivered', category: 'marketing', sentAt: '2024-05-15T08:00:00Z' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', userId: 'u1', userName: 'James Mwangi', action: 'APPROVED_VOUCHER', module: 'Finance', details: 'Approved voucher VCH-2024-001 for KES 8,500', timestamp: '2024-05-09T11:23:00Z', ipAddress: '197.232.45.67' },
  { id: 'al2', userId: 'u2', userName: 'Grace Wanjiku', action: 'RECORDED_PAYMENT', module: 'Sales', details: 'Recorded payment of KES 400,000 for transaction VDM-2024-001', timestamp: '2024-05-10T09:15:00Z', ipAddress: '197.232.45.68' },
  { id: 'al3', userId: 'u1', userName: 'James Mwangi', action: 'ADDED_PROPERTY', module: 'Properties', details: 'Added new property: Limuru Highland Retreat (p6)', timestamp: '2024-03-10T10:00:00Z', ipAddress: '197.232.45.67' },
  { id: 'al4', userId: 'u2', userName: 'Grace Wanjiku', action: 'SENT_COMMUNICATION', module: 'Communications', details: 'Sent payment reminder via WhatsApp to Mary Njeri', timestamp: '2024-05-10T09:00:00Z', ipAddress: '197.232.45.68' },
  { id: 'al5', userId: 'u1', userName: 'James Mwangi', action: 'LOGIN', module: 'Auth', details: 'Admin login from Nairobi office', timestamp: '2024-05-14T08:00:00Z', ipAddress: '197.232.45.67' },
];

export const mockSalesTrends = [
  { month: 'Jan', sales: 8, revenue: 4800000 },
  { month: 'Feb', sales: 12, revenue: 7200000 },
  { month: 'Mar', sales: 15, revenue: 9900000 },
  { month: 'Apr', sales: 10, revenue: 7400000 },
  { month: 'May', sales: 18, revenue: 12600000 },
  { month: 'Jun', sales: 22, revenue: 15400000 },
];

export const mockPaymentInflow = [
  { month: 'Jan', amount: 3200000 },
  { month: 'Feb', amount: 5800000 },
  { month: 'Mar', amount: 8100000 },
  { month: 'Apr', amount: 6400000 },
  { month: 'May', amount: 9200000 },
  { month: 'Jun', amount: 11500000 },
];

export const mockKPIs = {
  totalSales: 127,
  totalRevenue: 89400000,
  totalCommission: 17880000,
  outstandingBalances: 23600000,
  totalProperties: 6,
  totalClients: 127,
  salesThisMonth: 18,
  revenueThisMonth: 12600000,
};

export const mockDirectors = [
  { 
    name: 'Francis Mathea', 
    title: 'Founder & Chief Executive Officer', 
    bio: 'A visionary entrepreneur with over 20 years in Kenyan real estate, Francis founded Vedama Company Limited with a mission to make land ownership accessible and transparent for every Kenyan family.', 
    image: '👨‍💼',
    badge: 'Executive Founder'
  },
  { 
    name: 'Dr. Amina Hassan', 
    title: 'Executive Director & Head of Finance', 
    bio: 'With a PhD in Financial Management and 15 years in fintech, Dr. Hassan oversees all financial operations ensuring the highest standards of accountability and investor confidence.', 
    image: '👩‍💼',
    badge: 'Finance Director'
  },
  { 
    name: 'Eng. Thomas Kirui', 
    title: 'Director of Operations & Development', 
    bio: 'A registered Civil Engineer with expertise in land surveying and urban planning, Thomas ensures all Vedama properties meet the highest legal and infrastructural standards.', 
    image: '👷‍♂️',
    badge: 'Operations Director'
  },
];
