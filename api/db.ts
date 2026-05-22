import { put, list } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;


// Initial Seed Data
const INITIAL_DATABASE = {
  users: [
    { id: 'u1', name: 'James Mwangi', email: 'admin@vedama.co.ke', phone: '0712345678', role: 'admin', isActive: true, createdAt: '2024-01-01', password: 'admin123' },
    { id: 'u2', name: 'Grace Wanjiku', email: 'finance@vedama.co.ke', phone: '0723456789', role: 'finance', isActive: true, createdAt: '2024-01-05', password: 'finance123' },
    { id: 'u3', name: 'Peter Kamau', email: 'landlord@vedama.co.ke', phone: '0734567890', role: 'landlord', isActive: true, createdAt: '2024-01-10', password: 'landlord123' },
    { id: 'u4', name: 'Mary Njeri', email: 'client@vedama.co.ke', phone: '0745678901', role: 'client', isActive: true, createdAt: '2024-02-01', password: 'client123' },
    { id: 'u5', name: 'David Ochieng', email: 'provider@vedama.co.ke', phone: '0756789012', role: 'service_provider', isActive: true, createdAt: '2024-02-15', password: 'provider123' },
  ],
  properties: [
    {
      id: 'p1', title: 'Malindi Oceanview Estate', location: 'Malindi, Kilifi County', county: 'Kilifi',
      description: 'Premium beachfront plots with breathtaking Indian Ocean views. Gated estate with security, water, and electricity. Perfect for holiday homes, hotels, or investment.',
      totalAcres: 50, totalPlots: 400, soldPlots: 312, pricePerPlot: 850000, pricePerAcre: 6800000,
      lat: -3.2194, lng: 40.1169, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
      amenities: ['Electricity', 'Water', 'Security', 'Paved Roads', 'Title Deeds Ready'],
      status: 'selling', featured: true, createdAt: '2024-01-15',
      landlordId: 'l1', landlordAgreedPrice: 600000, lienholderBank: 'KCB Bank Kenya Ltd'
    },
    {
      id: 'p2', title: 'Thika Greens Residential', location: 'Thika, Kiambu County', county: 'Kiambu',
      description: 'Affordable residential plots in a rapidly developing suburb of Nairobi. Close to SGR station, schools, and malls. Ready title deeds.',
      totalAcres: 30, totalPlots: 240, soldPlots: 180, pricePerPlot: 450000, pricePerAcre: 3600000,
      lat: -1.0332, lng: 37.0692, images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
      amenities: ['Water', 'Electricity', 'All-weather Road', 'Near SGR'],
      status: 'selling', featured: true, createdAt: '2024-02-01',
      landlordId: 'l1', landlordAgreedPrice: 320000, lienholderBank: 'NCBA Bank Ltd'
    },
    {
      id: 'p3', title: 'Nakuru Valley Farms', location: 'Nakuru, Rift Valley', county: 'Nakuru',
      description: 'Agricultural and residential plots in the heart of the Rift Valley. Fertile land ideal for farming or serene residential development.',
      totalAcres: 100, totalPlots: 800, soldPlots: 120, pricePerPlot: 280000, pricePerAcre: 2240000,
      lat: -0.3031, lng: 36.0800, images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'],
      amenities: ['Water Borehole', 'Electricity Nearby', 'Fertile Soil', 'Title Deeds Ready'],
      status: 'available', featured: false, createdAt: '2024-03-01',
      landlordId: 'l2', landlordAgreedPrice: 200000, lienholderBank: 'Equity Bank Kenya'
    },
    {
      id: 'p4', title: 'Diani Palm Beach Plots', location: 'Diani, Kwale County', county: 'Kwale',
      description: 'Exclusive beachfront and near-beach plots in Kenya\'s premier beach destination. Ideal for resort development or luxury homes.',
      totalAcres: 20, totalPlots: 80, soldPlots: 75, pricePerPlot: 1800000, pricePerAcre: 14400000,
      lat: -4.3167, lng: 39.5667, images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
      amenities: ['Beach Access', 'KPLC Power', 'Water', 'Security', 'Title Ready'],
      status: 'selling', featured: true, createdAt: '2024-01-20',
      landlordId: 'l3', landlordAgreedPrice: 1350000, lienholderBank: 'Standard Chartered Bank'
    },
    {
      id: 'p5', title: 'Konza Smart City Adjacent', location: 'Machakos County', county: 'Machakos',
      description: 'Strategic investment plots adjacent to the Konza Technopolis Smart City. High capital appreciation potential in Kenya\'s silicon valley.',
      totalAcres: 75, totalPlots: 600, soldPlots: 230, pricePerPlot: 380000, pricePerAcre: 3040000,
      lat: -1.7167, lng: 37.1500, images: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800'],
      amenities: ['Near Konza City', 'Electricity', 'Paved Roads', 'Title Ready'],
      status: 'selling', featured: false, createdAt: '2024-02-20',
      landlordId: 'l3', landlordAgreedPrice: 280000, lienholderBank: 'Family Bank Ltd'
    },
    {
      id: 'p6', title: 'Limuru Highland Retreat', location: 'Limuru, Kiambu County', county: 'Kiambu',
      description: 'Cool highland plots with spectacular views of the Great Rift Valley. Perfect for weekend homes and eco-tourism ventures.',
      totalAcres: 40, totalPlots: 160, soldPlots: 60, pricePerPlot: 650000, pricePerAcre: 5200000,
      lat: -1.1167, lng: 36.6333, images: ['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
      amenities: ['Cool Climate', 'Water', 'Great Views', 'Electricity'],
      status: 'available', featured: false, createdAt: '2024-03-10',
      landlordId: 'l1', landlordAgreedPrice: 480000, lienholderBank: 'Co-operative Bank of Kenya'
    },
  ],
  transactions: [
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
  ],
  landlords: [
    { id: 'l1', name: 'Peter Kamau', email: 'pkamau@email.com', phone: '0712000001', properties: ['prop1', 'prop2'], totalRevenue: 3840000, pendingPayment: 320000, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', address: 'Limuru Road, Farm House 5, Kiambu', otherInfo: 'ID No: 12345678, KRA PIN: A000123456Z' },
    { id: 'l2', name: 'Esther Muthoni', email: 'emuthoni@email.com', phone: '0712000002', properties: ['prop3'], totalRevenue: 1260000, pendingPayment: 105000, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', address: 'Section 9, Block B1, Thika', otherInfo: 'ID No: 23456789, KRA PIN: A000234567Y' },
    { id: 'l3', name: 'Samuel Cheruiyot', email: 'scheruiyot@email.com', phone: '0712000003', properties: ['prop4', 'prop5'], totalRevenue: 2400000, pendingPayment: 0, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', address: 'Nandi Hills Tea Estate, Nandi', otherInfo: 'ID No: 34567890, KRA PIN: A000345678X' },
  ],
  tenants: [
    { id: 'ten1', name: 'Alice Akinyi', email: 'aalkinyi@email.com', phone: '0733100001', propertyId: 'prop1', unitNumber: 'A1', rentAmount: 35000, leaseStart: '2024-01-01', leaseEnd: '2024-12-31', balance: 0, lastPaymentDate: '2024-05-02', status: 'active', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150', address: 'Malindi Oceanview Estate, Unit A1', otherInfo: 'ID No: 35678901, Lease type: Residential 1-year' },
    { id: 'ten2', name: 'Brian Otieno', email: 'botieno@email.com', phone: '0733100002', propertyId: 'prop1', unitNumber: 'A2', rentAmount: 35000, leaseStart: '2024-01-01', leaseEnd: '2024-12-31', balance: 70000, lastPaymentDate: '2024-03-10', status: 'arrears', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', address: 'Malindi Oceanview Estate, Unit A2', otherInfo: 'ID No: 36789012, Lease type: Residential 1-year' },
    { id: 'ten3', name: 'Carol Wambui', email: 'cwambui@email.com', phone: '0733100003', propertyId: 'prop2', unitNumber: 'B1', rentAmount: 45000, leaseStart: '2023-07-01', leaseEnd: '2024-06-30', balance: 135000, lastPaymentDate: '2024-02-01', status: 'distress', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', address: 'Thika Greens Residential, Unit B1', otherInfo: 'ID No: 37890123, Legal Status: 2 Months Due (Advocate Dispatched)' },
    { id: 'ten4', name: 'Dennis Kiplangat', email: 'dkiplangat@email.com', phone: '0733100004', propertyId: 'prop3', unitNumber: 'C1', rentAmount: 28000, leaseStart: '2024-02-01', leaseEnd: '2025-01-31', balance: 0, lastPaymentDate: '2024-05-05', status: 'active', avatar: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=150', address: 'Nakuru Valley Farms, Unit C1', otherInfo: 'ID No: 38901234, Lease type: Commercial Farm 2-year' },
    { id: 'ten5', name: 'Eva Nyambura', email: 'enyambura@email.com', phone: '0733100005', propertyId: 'prop4', unitNumber: 'D1', rentAmount: 55000, leaseStart: '2023-09-01', leaseEnd: '2024-08-31', balance: 0, lastPaymentDate: '2024-05-01', status: 'active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', address: 'Diani Palm Beach Plots, Unit D1', otherInfo: 'ID No: 39012345, Lease type: Holiday Villa 1-year' },
  ],
  clients: [
    { id: 'c1', name: 'Mary Njeri', email: 'client@vedama.co.ke', phone: '0745678901', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', address: 'Thika Greens, Villa 4B, Kiambu County', otherInfo: 'ID No: 33445566, KRA PIN: A001234567Z', createdAt: '2024-01-01' },
    { id: 'c2', name: 'John Odhiambo', email: 'jodhiambo@email.com', phone: '0733200001', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', address: 'Milimani Estate, House 12, Kisumu', otherInfo: 'ID No: 28472947, KRA PIN: A009876543X', createdAt: '2024-01-02' },
    { id: 'c3', name: 'Sarah Kamau', email: 'skamau@email.com', phone: '0733200002', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', address: 'Nyali Heights, Apt 3C, Mombasa', otherInfo: 'ID No: 31229384, KRA PIN: A002938472Y', createdAt: '2024-01-03' },
    { id: 'c4', name: 'Robert Mutua', email: 'rmutua@email.com', phone: '0733200003', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', address: 'Syokimau Court, Phase 2, Machakos', otherInfo: 'ID No: 29384712, KRA PIN: A003847291P', createdAt: '2024-01-04' },
    { id: 'c5', name: 'Angela Wangari', email: 'awangari@email.com', phone: '0733200004', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', address: 'Runda Orchards, House 89, Nairobi', otherInfo: 'ID No: 30492817, KRA PIN: A004928374M', createdAt: '2024-01-05' }
  ],
  serviceProviders: [
    { id: 'sp1', name: 'Moses Waweru', company: 'Waweru Plumbing Services', email: 'mwaweru@email.com', phone: '0722300001', category: 'Plumbing', rating: 4.8, jobsCompleted: 47, status: 'active', createdAt: '2024-01-10' },
    { id: 'sp2', name: 'Jane Ng\'ang\'a', company: 'Bright Spark Electricals', email: 'jnganga@email.com', phone: '0722300002', category: 'Electrical', rating: 4.6, jobsCompleted: 63, status: 'active', createdAt: '2024-01-15' },
    { id: 'sp3', name: 'Kevin Mwema', company: 'FinishLine Carpentry', email: 'kmwema@email.com', phone: '0722300003', category: 'Carpentry', rating: 4.9, jobsCompleted: 29, status: 'active', createdAt: '2024-02-01' },
    { id: 'sp4', name: 'Lucy Auma', company: 'ColorPro Painters', email: 'lauma@email.com', phone: '0722300004', category: 'Painting', rating: 4.4, jobsCompleted: 38, status: 'active', createdAt: '2024-02-10' },
    { id: 'sp5', name: 'Mark Obiero', company: 'SwiftFix General Maintenance', email: 'mobiero@email.com', phone: '0722300005', category: 'General', rating: 4.2, jobsCompleted: 91, status: 'active', createdAt: '2023-11-01' },
  ],
  serviceRequests: [
    { id: 'sr1', tenantId: 'ten1', tenantName: 'Alice Akinyi', propertyId: 'prop1', category: 'plumbing', description: 'Blocked kitchen sink, water not draining properly', priority: 'high', status: 'in_progress', assignedProviderId: 'sp1', assignedProviderName: 'Moses Waweru', quotedAmount: 8500, approvedBy: 'admin', createdAt: '2024-05-08', updatedAt: '2024-05-09' },
    { id: 'sr2', tenantId: 'ten2', tenantName: 'Brian Otieno', propertyId: 'prop1', category: 'electrical', description: 'Power sockets in bedroom not working', priority: 'medium', status: 'quoted', assignedProviderId: 'sp2', assignedProviderName: 'Jane Ng\'ang\'a', quotedAmount: 12000, createdAt: '2024-05-10', updatedAt: '2024-05-11' },
    { id: 'sr3', tenantId: 'ten4', tenantName: 'Dennis Kiplangat', propertyId: 'prop3', category: 'carpentry', description: 'Main door hinges broken, door not closing properly', priority: 'urgent', status: 'assigned', assignedProviderId: 'sp3', assignedProviderName: 'Kevin Mwema', createdAt: '2024-05-12', updatedAt: '2024-05-12' },
    { id: 'sr4', tenantId: 'ten5', tenantName: 'Eva Nyambura', propertyId: 'prop4', category: 'painting', description: 'Living room walls need repainting after water damage', priority: 'low', status: 'open', createdAt: '2024-05-13', updatedAt: '2024-05-13' },
  ],
  vouchers: [
    { id: 'v1', reference: 'VCH-2024-001', description: 'Plumbing repair payment - Unit A1', amount: 8500, payee: 'Moses Waweru', approvedBy: 'James Mwangi', status: 'approved', createdAt: '2024-05-09' },
    { id: 'v2', reference: 'VCH-2024-002', description: 'Monthly landlord payment - Peter Kamau', amount: 320000, payee: 'Peter Kamau', status: 'pending_approval', createdAt: '2024-05-01' },
    { id: 'v3', reference: 'VCH-2024-003', description: 'Office supplies and stationery', amount: 15000, payee: 'Nairobi Stationers Ltd', approvedBy: 'James Mwangi', status: 'paid', createdAt: '2024-04-30' },
    { id: 'v4', reference: 'VCH-2024-004', description: 'Electrical repairs - Unit A2', amount: 12000, payee: 'Jane Ng\'ang\'a', status: 'draft', createdAt: '2024-05-11' },
  ],
  ledger: [
    { id: 'led1', transactionId: 't1', type: 'income', description: 'Plot sale deposit - VDM-2024-001', amount: 1200000, landlordShare: 960000, companyCommission: 240000, date: '2024-05-10', status: 'processed' },
    { id: 'led2', transactionId: 't2', type: 'income', description: 'Full plot payment - VDM-2024-002', amount: 900000, landlordShare: 720000, companyCommission: 180000, date: '2024-03-20', status: 'reconciled' },
    { id: 'led3', transactionId: 't3', type: 'income', description: 'Deposit received - VDM-2024-003', amount: 360000, landlordShare: 288000, companyCommission: 72000, date: '2024-04-05', status: 'processed' },
    { id: 'led4', transactionId: 't5', type: 'income', description: 'Partial payment - VDM-2024-005', amount: 3400000, landlordShare: 2720000, companyCommission: 680000, date: '2024-06-01', status: 'processed' },
  ],
  communicationLogs: [
    { id: 'cm1', type: 'whatsapp', recipient: '+254745678901', recipientName: 'Mary Njeri', subject: 'Payment Reminder', message: 'Dear Mary, your balance of KES 500,000 is due on 30 Sep 2024. Please make payment to avoid penalty charges.', status: 'delivered', category: 'payment_reminder', sentAt: '2024-05-10T09:00:00Z' },
    { id: 'cm2', type: 'email', recipient: 'john@email.com', recipientName: 'John Odhiambo', subject: 'Payment Receipt - VDM-2024-002', message: 'Thank you for your full payment of KES 900,000. Please find attached your official receipt.', status: 'delivered', category: 'receipt', sentAt: '2024-03-20T14:30:00Z' },
    { id: 'cm3', type: 'whatsapp', recipient: '+254756789012', recipientName: 'Angela Wangari', subject: 'Balance Due Alert', message: 'Dear Angela, your remaining balance of KES 3,400,000 is due 31 March 2025. Contact us for payment plan options.', status: 'sent', category: 'alert', sentAt: '2024-06-01T10:00:00Z' },
    { id: 'cm4', type: 'email', recipient: 'marketing@bulk.vedama.co.ke', recipientName: 'All Subscribers', subject: 'New Listings in Malindi!', message: 'Exclusive beachfront plots now available from KES 850,000. Limited units remaining. Book your site visit today!', status: 'delivered', category: 'marketing', sentAt: '2024-05-15T08:00:00Z' },
  ],
  auditLogs: [
    { id: 'al1', userId: 'u1', userName: 'James Mwangi', action: 'APPROVED_VOUCHER', module: 'Finance', details: 'Approved voucher VCH-2024-001 for KES 8,500', timestamp: '2024-05-09T11:23:00Z', ipAddress: '197.232.45.67' },
    { id: 'al2', userId: 'u2', userName: 'Grace Wanjiku', action: 'RECORDED_PAYMENT', module: 'Sales', details: 'Recorded payment of KES 400,000 for transaction VDM-2024-001', timestamp: '2024-05-10T09:15:00Z', ipAddress: '197.232.45.68' },
    { id: 'al3', userId: 'u1', userName: 'James Mwangi', action: 'ADDED_PROPERTY', module: 'Properties', details: 'Added new property: Limuru Highland Retreat (p6)', timestamp: '2024-03-10T10:00:00Z', ipAddress: '197.232.45.67' },
    { id: 'al4', userId: 'u2', userName: 'Grace Wanjiku', action: 'SENT_COMMUNICATION', module: 'Communications', details: 'Sent payment reminder via WhatsApp to Mary Njeri', timestamp: '2024-05-10T09:00:00Z', ipAddress: '197.232.45.68' },
    { id: 'al5', userId: 'u1', userName: 'James Mwangi', action: 'LOGIN', module: 'Auth', details: 'Admin login from Nairobi office', timestamp: '2024-05-14T08:00:00Z', ipAddress: '197.232.45.67' },
  ],
  bankSyncStatus: 'connected',
  bankAccountBalance: 48200350,
  bankLogs: [
    { id: 'bl1', reference: 'VDM-2024-001', amount: 500000, date: '2024-04-01', status: 'cleared' },
    { id: 'bl2', reference: 'VDM-2024-002', amount: 900000, date: '2024-03-20', status: 'cleared' },
  ],
  otpCodes: [],
};

const LOCAL_DB_PATH = path.join(process.cwd(), 'db.json');

let pool: pg.Pool | null = null;

function getPool() {
  if (pool) return pool;

  let host = process.env.SUPABASE_DB_HOST;
  let port = process.env.SUPABASE_DB_PORT ? parseInt(process.env.SUPABASE_DB_PORT) : 5432;
  const database = process.env.SUPABASE_DB_NAME;
  let user = process.env.SUPABASE_DB_USER;
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (host && user && password) {
    // Intelligent IPv6-to-IPv4 routing fallback:
    // Direct connection hosts (db.[ref].supabase.co) are IPv6-only since 2024, causing connections to fail on IPv4-only networks.
    // We automatically route through the official IPv4-capable Supabase pooler for eu-west-1.
    const directMatch = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
    if (directMatch) {
      const projectRef = directMatch[1];
      console.log(`[Database Driver] Direct IPv6 host detected (${host}). Routing via IPv4 Pooler for region eu-west-1...`);
      host = 'aws-0-eu-west-1.pooler.supabase.com';
      user = `postgres.${projectRef}`;
      port = 5432;
    }

    pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
      max: 1, // Minimize connection overhead in serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // 15 seconds timeout to allow SSL/TCP handshakes to complete
    });
    return pool;
  }
  return null;
}

function migrateDb(db: any): { db: any; changed: boolean } {
  let changed = false;
  if (!db.users || db.users.length === 0) {
    db.users = [...INITIAL_DATABASE.users];
    changed = true;
  }
  if (!db.otpCodes) {
    db.otpCodes = [];
    changed = true;
  }

  const DEMO_CREDENTIALS: Record<string, string> = {
    'admin@vedama.co.ke': 'admin123',
    'finance@vedama.co.ke': 'finance123',
    'landlord@vedama.co.ke': 'landlord123',
    'client@vedama.co.ke': 'client123',
    'provider@vedama.co.ke': 'provider123',
  };

  db.users.forEach((user: any) => {
    if (!user.password) {
      user.password = DEMO_CREDENTIALS[user.email.toLowerCase()] || '123456';
      changed = true;
    }
  });

  return { db, changed };
}

export async function getDb(): Promise<any> {
  let fetched: any = null;
  const pgPool = getPool();

  if (pgPool) {
    try {
      // 1. Ensure table exists (Self-Healing Schema)
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS system_state (
          id INT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Fetch the state
      const res = await pgPool.query('SELECT data FROM system_state WHERE id = 1');
      if (res.rows.length > 0) {
        fetched = res.rows[0].data;
      } else {
        // 3. Seed if table is empty (Auto-Seeding)
        await pgPool.query('INSERT INTO system_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [
          JSON.stringify(INITIAL_DATABASE),
        ]);
        fetched = INITIAL_DATABASE;
      }
    } catch (e) {
      console.error('Error with Supabase PostgreSQL operation, falling back to other layers:', e);
    }
  }

  // Fallback storage layers
  if (!fetched) {
    const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (isVercel) {
      try {
        const blobs = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
        const dbBlob = blobs.blobs.find((b) => b.pathname === 'db.json');
        if (dbBlob) {
          const response = await fetch(dbBlob.url);
          if (response.ok) {
            fetched = await response.json();
          }
        }
        if (!fetched) {
          // Seed first time
          await put('db.json', JSON.stringify(INITIAL_DATABASE), {
            access: 'public',
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          fetched = INITIAL_DATABASE;
        }
      } catch (e) {
        console.error('Error fetching from Vercel Blob:', e);
        fetched = INITIAL_DATABASE;
      }
    } else {
      // Local persistence
      try {
        await fs.access(LOCAL_DB_PATH);
        const content = await fs.readFile(LOCAL_DB_PATH, 'utf8');
        fetched = JSON.parse(content);
      } catch {
        await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf8');
        fetched = INITIAL_DATABASE;
      }
    }
  }

  const { db, changed } = migrateDb(fetched);
  if (changed) {
    await saveDb(db);
  }
  return db;
}

export async function saveDb(data: typeof INITIAL_DATABASE): Promise<void> {
  const pgPool = getPool();

  if (pgPool) {
    try {
      await pgPool.query(
        `INSERT INTO system_state (id, data, updated_at) 
         VALUES (1, $1, CURRENT_TIMESTAMP) 
         ON CONFLICT (id) 
         DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(data)]
      );
      return;
    } catch (e) {
      console.error('Error saving to Supabase PostgreSQL, falling back to other layers:', e);
    }
  }

  // Fallback storage layers
  const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (isVercel) {
    try {
      await put('db.json', JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (e) {
      console.error('Error saving to Vercel Blob:', e);
    }
  } else {
    try {
      await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing to local JSON db:', e);
    }
  }
}
