import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Property, Transaction, Tenant, Landlord, ServiceProvider, 
  ServiceRequest, CommunicationLog, AuditLog, Voucher, LedgerEntry 
} from '../types';
import { 
  mockProperties, mockTransactions, mockTenants, mockLandlords, 
  mockServiceProviders, mockServiceRequests, mockVouchers, 
  mockLedger, mockCommunicationLogs, mockAuditLogs 
} from '../lib/mockData';

interface DataState {
  properties: Property[];
  transactions: Transaction[];
  tenants: Tenant[];
  landlords: Landlord[];
  serviceProviders: ServiceProvider[];
  serviceRequests: ServiceRequest[];
  vouchers: Voucher[];
  ledger: LedgerEntry[];
  communicationLogs: CommunicationLog[];
  auditLogs: AuditLog[];
  
  // Bank Link states
  bankSyncStatus: 'connected' | 'disconnected';
  bankAccountBalance: number;
  bankLogs: { id: string; reference: string; amount: number; date: string; status: 'cleared' | 'failed' }[];

  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;
  
  addLedgerEntry: (entry: LedgerEntry) => void;
  
  addServiceRequest: (request: ServiceRequest) => void;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  
  addTenant: (tenant: Tenant) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  
  addCommunicationLog: (log: CommunicationLog) => void;
  addAuditLog: (log: AuditLog) => void;
  
  // Custom Actions
  triggerBankClearance: (reference: string, amount: number, paymentMethod?: string) => { success: boolean; error?: string };
  addOperationalCost: (amount: number, category: any, description: string) => void;
  runEndOfMonthProcess: () => void;
  processMonthlyLandlordVouchers: () => void;
  approveAndReleaseLandlordVoucher: (id: string, releaseOfficer: string) => void;
  confirmWorkCompletion: (id: string, party: 'tenant' | 'landlord') => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      properties: mockProperties.map((p) => {
        if (p.id === 'p1') return { ...p, landlordId: 'l1', landlordAgreedPrice: 600000, lienholderBank: 'KCB Bank Kenya Ltd' };
        if (p.id === 'p2') return { ...p, landlordId: 'l1', landlordAgreedPrice: 320000, lienholderBank: 'NCBA Bank Ltd' };
        if (p.id === 'p3') return { ...p, landlordId: 'l2', landlordAgreedPrice: 200000, lienholderBank: 'Equity Bank Kenya' };
        if (p.id === 'p4') return { ...p, landlordId: 'l3', landlordAgreedPrice: 1350000, lienholderBank: 'Standard Chartered Bank' };
        if (p.id === 'p5') return { ...p, landlordId: 'l3', landlordAgreedPrice: 280000, lienholderBank: 'Family Bank Ltd' };
        if (p.id === 'p6') return { ...p, landlordId: 'l1', landlordAgreedPrice: 480000, lienholderBank: 'Co-operative Bank of Kenya' };
        return p;
      }),
      transactions: mockTransactions,
      tenants: mockTenants,
      landlords: mockLandlords,
      serviceProviders: mockServiceProviders,
      serviceRequests: mockServiceRequests,
      vouchers: mockVouchers,
      ledger: mockLedger,
      communicationLogs: mockCommunicationLogs,
      auditLogs: mockAuditLogs,
      
      // Bank Seeding
      bankSyncStatus: 'connected',
      bankAccountBalance: 48200350,
      bankLogs: [
        { id: 'bl1', reference: 'VDM-2024-001', amount: 500000, date: '2024-04-01', status: 'cleared' },
        { id: 'bl2', reference: 'VDM-2024-002', amount: 900000, date: '2024-03-20', status: 'cleared' },
      ],

      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),
      
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),

      addVoucher: (voucher) => set((state) => ({
        vouchers: [voucher, ...state.vouchers]
      })),

      updateVoucher: (id, updates) => set((state) => ({
        vouchers: state.vouchers.map((v) => v.id === id ? { ...v, ...updates } : v)
      })),

      addLedgerEntry: (entry) => set((state) => ({
        ledger: [entry, ...state.ledger]
      })),

      addServiceRequest: (request) => set((state) => ({
        serviceRequests: [request, ...state.serviceRequests]
      })),

      updateServiceRequest: (id, updates) => set((state) => ({
        serviceRequests: state.serviceRequests.map((r) => r.id === id ? { ...r, ...updates } : r)
      })),

      addTenant: (tenant) => set((state) => ({
        tenants: [tenant, ...state.tenants]
      })),

      updateTenant: (id, updates) => set((state) => ({
        tenants: state.tenants.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),

      addProperty: (property) => set((state) => ({
        properties: [property, ...state.properties]
      })),

      updateProperty: (id, updates) => set((state) => ({
        properties: state.properties.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),

      addCommunicationLog: (log) => set((state) => ({
        communicationLogs: [log, ...state.communicationLogs]
      })),

      addAuditLog: (log) => set((state) => ({
        auditLogs: [log, ...state.auditLogs]
      })),
      
      // Custom actions implementation
      triggerBankClearance: (reference, amount, paymentMethod = 'bank_transfer') => {
        let success = false;
        let error = undefined;
        let result: any = {};
        
        set((state) => {
          const txIndex = state.transactions.findIndex(
            (t) => t.reference.toLowerCase() === reference.toLowerCase() ||
                   t.id.toLowerCase() === reference.toLowerCase()
          );
          
          if (txIndex === -1) {
            error = "Reference code not found in the transaction records.";
            return {};
          }
          
          const tx = state.transactions[txIndex];
          const property = state.properties.find((p) => p.id === tx.propertyId);
          
          // Calculate payment update
          const newPaid = tx.amountPaid + amount;
          const newBalance = Math.max(0, tx.totalAmount - newPaid);
          const isFullyPaid = newBalance === 0;
          
          const paymentId = `pay_${Math.random().toString(36).substring(2, 9)}`;
          const newPayment = {
            id: paymentId,
            transactionId: tx.id,
            amount: amount,
            method: paymentMethod as any,
            reference: `BNK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            date: new Date().toISOString().split('T')[0],
            status: 'confirmed' as const,
          };
          
          // Update transaction
          const updatedTx = {
            ...tx,
            amountPaid: newPaid,
            balance: newBalance,
            status: (isFullyPaid ? 'fully_paid' : 'partially_paid') as any,
            payments: [...tx.payments, newPayment],
            updatedAt: new Date().toISOString(),
          };
          
          const newTransactions = [...state.transactions];
          newTransactions[txIndex] = updatedTx;
          
          // Split payments - priority allocation to landlord:
          // Minimum agreed price for this transaction's plots
          const agreedUnit = property?.landlordAgreedPrice || (tx.unitPrice * 0.75);
          const landlordTotalTarget = agreedUnit * tx.plotCount;
          
          // How much has already been allocated to the landlord before this payment?
          const previousTotalAllocatedToLandlord = Math.min(landlordTotalTarget, tx.amountPaid);
          
          // Out of the new total paid (newPaid), how much goes to the landlord?
          const newTotalAllocatedToLandlord = Math.min(landlordTotalTarget, newPaid);
          
          // Portion of this payment that goes to the landlord
          const landlordShare = newTotalAllocatedToLandlord - previousTotalAllocatedToLandlord;
          
          // Portions of this payment that goes to the company commission
          const companyCommission = amount - landlordShare;
          
          // Create Ledger entry
          const ledgerEntry = {
            id: `led_${Math.random().toString(36).substring(2, 9)}`,
            transactionId: tx.id,
            type: 'income' as const,
            description: `Clearing payment for ${tx.reference} (${tx.clientName})`,
            amount: amount,
            landlordShare: landlordShare,
            companyCommission: companyCommission,
            date: new Date().toISOString().split('T')[0],
            status: 'reconciled' as const,
          };
          
          // Create WhatsApp notification for client (Thank You & Receipt)
          const thankYouMsg = {
            id: `msg_${Math.random().toString(36).substring(2, 9)}`,
            type: 'whatsapp' as const,
            recipient: '+254700000000',
            recipientName: tx.clientName,
            subject: 'Payment Cleared',
            message: `Dear ${tx.clientName}, thank you for doing business with Vedama. KES ${amount.toLocaleString()} has been cleared for reference ${tx.reference}. Outstanding balance is KES ${newBalance.toLocaleString()}. Thank you!`,
            status: 'delivered' as const,
            category: 'thank_you' as const,
            sentAt: new Date().toISOString(),
          };
          
          // Create Admin alert notification for payment
          const adminLogMsg = {
            id: `msg_${Math.random().toString(36).substring(2, 9)}`,
            type: 'sms' as const,
            recipient: '+254712345678',
            recipientName: 'Francis Mathea (CEO)',
            subject: 'Bank Clearance Alert',
            message: `ALERT: Client ${tx.clientName} paid KES ${amount.toLocaleString()} in the bank for reference ${tx.reference}. Funds cleared automatically in real-time.`,
            status: 'delivered' as const,
            category: 'alert' as const,
            sentAt: new Date().toISOString(),
          };
          
          // Log audit
          const auditLog = {
            id: `al_${Math.random().toString(36).substring(2, 9)}`,
            userId: 'system',
            userName: 'Bank Link API',
            action: 'BANK_CLEARANCE',
            module: 'Finance',
            details: `Auto-cleared KES ${amount.toLocaleString()} for transaction ${tx.reference}. Landlord allocation: KES ${landlordShare.toLocaleString()}, Commission: KES ${companyCommission.toLocaleString()}`,
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.1',
          };
          
          // Add bank log
          const bankLog = {
            id: `bnklog_${Math.random().toString(36).substring(2, 9)}`,
            reference: tx.reference,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            status: 'cleared' as const,
          };
          
          success = true;
          
          return {
            transactions: newTransactions,
            ledger: [ledgerEntry, ...state.ledger],
            communicationLogs: [thankYouMsg, adminLogMsg, ...state.communicationLogs],
            auditLogs: [auditLog, ...state.auditLogs],
            bankAccountBalance: state.bankAccountBalance + amount,
            bankLogs: [bankLog, ...state.bankLogs],
          };
        });
        
        return { success, error };
      },

      addOperationalCost: (amount, category, description) => set((state) => {
        const costEntry = {
          id: `led_${Math.random().toString(36).substring(2, 9)}`,
          transactionId: `cost_${Math.random().toString(36).substring(2, 5)}`,
          type: 'expense' as const,
          costCategory: category,
          description: description,
          amount: amount,
          landlordShare: 0,
          companyCommission: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'reconciled' as const,
        };
        
        const auditLog = {
          id: `al_${Math.random().toString(36).substring(2, 9)}`,
          userId: 'admin',
          userName: 'Director Admin',
          action: 'RECORDED_EXPENSE',
          module: 'Finance',
          details: `Recorded corporate operational expense: ${description} of KES ${amount.toLocaleString()}`,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        };
        
        return {
          ledger: [costEntry, ...state.ledger],
          auditLogs: [auditLog, ...state.auditLogs],
        };
      }),

      runEndOfMonthProcess: () => set((state) => {
        const updatedTenants = state.tenants.map((t) => {
          let balance = t.balance;
          let status = t.status;
          let interestCharged = t.interestCharged || 0;
          let advocateNotified = t.advocateNotified || false;
          let advocateName = t.advocateName || '';
          let distressDate = t.distressDate || '';

          // 1. Charge rent interest (5% predetermined rate) on any outstanding balance
          if (balance > 0) {
            const interest = Math.round(t.rentAmount * 0.05);
            balance += interest;
            interestCharged += interest;
          }

          // 2. Add next month's rent (simulate billing period transition)
          balance += t.rentAmount;

          // 3. Determine if 2 months unpaid (balance >= 2 * rentAmount)
          if (balance >= t.rentAmount * 2) {
            status = 'distress';
            advocateNotified = true;
            advocateName = 'Muriuki & Partners Advocates';
            distressDate = new Date().toISOString().split('T')[0];
          } else if (balance > 0) {
            status = 'arrears';
          } else {
            status = 'active';
          }

          return {
            ...t,
            balance,
            status,
            interestCharged,
            advocateNotified,
            advocateName,
            distressDate,
            unpaidMonths: Math.floor(balance / t.rentAmount),
          };
        });

        // Generate communication alerts for distress tenants
        const newCommLogs: CommunicationLog[] = [];
        const newAuditLogs: AuditLog[] = [];

        updatedTenants.forEach((t) => {
          if (t.status === 'distress') {
            // Advocate notification
            newCommLogs.push({
              id: `msg_adv_${Math.random().toString(36).substring(2, 9)}`,
              type: 'sms',
              recipient: '+254722888999',
              recipientName: 'Muriuki & Partners Advocates',
              subject: 'Distress Instruction Note',
              message: `LEGAL INSTRUCTION: Tenant ${t.name} (Unit ${t.unitNumber}) of Thika Greens is in distress with an outstanding balance of KES ${t.balance.toLocaleString()}. Please raise a distress warrant immediately.`,
              status: 'delivered',
              category: 'alert',
              sentAt: new Date().toISOString(),
            });

            // Landlord notification
            newCommLogs.push({
              id: `msg_land_${Math.random().toString(36).substring(2, 9)}`,
              type: 'whatsapp',
              recipient: '+254712000001',
              recipientName: 'Peter Kamau',
              subject: 'Tenant Distress Alert',
              message: `ALERT: Tenant ${t.name} (Unit ${t.unitNumber}) has fallen 2+ months unpaid (Outstanding: KES ${t.balance.toLocaleString()}). Distress warrant has been automatically routed to Muriuki & Partners Advocates.`,
              status: 'delivered',
              category: 'alert',
              sentAt: new Date().toISOString(),
            });

            // Audit Log
            newAuditLogs.push({
              id: `al_${Math.random().toString(36).substring(2, 9)}`,
              userId: 'system',
              userName: 'EOM Billing Process',
              action: 'LEGAL_DISTRESS_TRIGGERED',
              module: 'PropertyMgmt',
              details: `Raised distress note to Muriuki & Partners Advocates for ${t.name} (Unit ${t.unitNumber}) due to KES ${t.balance.toLocaleString()} unpaid arrears.`,
              timestamp: new Date().toISOString(),
              ipAddress: '127.0.0.1',
            });
          }
        });

        // Audit run
        newAuditLogs.push({
          id: `al_${Math.random().toString(36).substring(2, 9)}`,
          userId: 'admin',
          userName: 'Finance Officer',
          action: 'RUN_EOM_PROCESS',
          module: 'PropertyMgmt',
          details: `Executed End of Month Billing & Rent Interest run. Processed ${state.tenants.length} active tenant accounts.`,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        });

        return {
          tenants: updatedTenants,
          communicationLogs: [...newCommLogs, ...state.communicationLogs],
          auditLogs: [...newAuditLogs, ...state.auditLogs],
        };
      }),

      processMonthlyLandlordVouchers: () => set((state) => {
        // We compile collections for Landlord Peter Kamau (l1) who owns p1 and p2 properties
        // We find tenants renting p1 and p2
        const p1p2Tenants = state.tenants.filter(t => t.propertyId === 'prop1' || t.propertyId === 'prop2' || t.propertyId === 'p1' || t.propertyId === 'p2');
        
        let totalAmount = 0;
        let totalNetAmount = 0;
        
        const lines = p1p2Tenants.map((t, idx) => {
          // Assume full month rent is collected or billed
          const amount = t.rentAmount;
          const netAmount = Math.round(amount * 0.9); // 10% management fee deducted, 90% net to landlord
          totalAmount += amount;
          totalNetAmount += netAmount;
          
          const property = state.properties.find(p => p.id === t.propertyId || p.id === 'p1');
          const propertyName = property ? property.title : 'Avenue Residential';
          
          return {
            no: idx + 1,
            name: propertyName,
            refNo: t.unitNumber,
            amount: amount,
            netAmount: netAmount
          };
        });

        const newVoucher: Voucher = {
          id: `VCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          reference: `LND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          description: `Landlord Monthly Consolidated Settlement Voucher - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          amount: totalNetAmount,
          payee: 'Peter Kamau',
          status: 'pending_approval',
          createdAt: new Date().toISOString().split('T')[0],
          isLandlordVoucher: true,
          landlordId: 'l1',
          voucherLines: lines
        };

        const auditLog = {
          id: `al_${Math.random().toString(36).substring(2, 9)}`,
          userId: 'system',
          userName: 'Billing Engine',
          action: 'PROCESSED_LANDLORD_VOUCHER',
          module: 'Finance',
          details: `Generated monthly consolidation settlement voucher ${newVoucher.id} for Peter Kamau. Gross: KES ${totalAmount.toLocaleString()}, Net: KES ${totalNetAmount.toLocaleString()}`,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        };

        return {
          vouchers: [newVoucher, ...state.vouchers],
          auditLogs: [auditLog, ...state.auditLogs],
        };
      }),

      approveAndReleaseLandlordVoucher: (id, releaseOfficer) => set((state) => {
        const vIndex = state.vouchers.findIndex(v => v.id === id);
        if (vIndex === -1) return {};

        const voucher = state.vouchers[vIndex];
        const hash = `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const updatedVoucher: Voucher = {
          ...voucher,
          status: 'paid',
          approvedBy: releaseOfficer,
          releasedBy: releaseOfficer,
          releasedAt: new Date().toISOString(),
          bankReleaseHash: hash
        };

        const newVouchers = [...state.vouchers];
        newVouchers[vIndex] = updatedVoucher;

        // Debit bank account for the landlord payout
        const newBalance = state.bankAccountBalance - voucher.amount;

        // Ledger entry for landlord payout
        const ledgerEntry: LedgerEntry = {
          id: `led_${Math.random().toString(36).substring(2, 9)}`,
          transactionId: voucher.id,
          type: 'landlord_payment',
          description: `Disbursed Landlord Monthly Settlement Voucher: ${voucher.id} (Hash: ${hash})`,
          amount: voucher.amount,
          landlordShare: voucher.amount,
          companyCommission: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'reconciled'
        };

        // Landlord notifications
        const notification = {
          id: `msg_${Math.random().toString(36).substring(2, 9)}`,
          type: 'whatsapp' as const,
          recipient: '+254712000001',
          recipientName: 'Peter Kamau',
          subject: 'Approved Settlement Dispatched',
          message: `Dear Peter Kamau, your monthly settlement voucher ${voucher.id} has been confirmed & signed by Release Officer ${releaseOfficer}. KES ${voucher.amount.toLocaleString()} has been released to your bank. Transaction Hash: ${hash}.`,
          status: 'delivered' as const,
          category: 'receipt' as const,
          sentAt: new Date().toISOString(),
        };

        const auditLog = {
          id: `al_${Math.random().toString(36).substring(2, 9)}`,
          userId: 'release_officer',
          userName: releaseOfficer,
          action: 'RELEASED_VOUCHER_TO_BANK',
          module: 'Finance',
          details: `Signed and released Landlord Voucher ${voucher.id} to bank. Amount KES ${voucher.amount.toLocaleString()} transferred. Hash: ${hash}`,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        };

        return {
          vouchers: newVouchers,
          ledger: [ledgerEntry, ...state.ledger],
          communicationLogs: [notification, ...state.communicationLogs],
          auditLogs: [auditLog, ...state.auditLogs],
          bankAccountBalance: newBalance
        };
      }),

      confirmWorkCompletion: (id, party) => set((state) => {
        const reqIndex = state.serviceRequests.findIndex(r => r.id === id);
        if (reqIndex === -1) return {};

        const req = state.serviceRequests[reqIndex];
        const isTenantConf = party === 'tenant' ? true : !!req.isConfirmedByTenant;
        const isLandlordConf = party === 'landlord' ? true : !!req.isConfirmedByLandlord;
        
        let status = req.status;
        const newVouchers = [...state.vouchers];
        const newLedger = [...state.ledger];
        const newTenants = [...state.tenants];
        const newCommLogs = [...state.communicationLogs];
        const newAuditLogs = [...state.auditLogs];

        const isBothConfirmed = isTenantConf && isLandlordConf;
        let voucherId = req.paymentVoucherId || '';

        if (isBothConfirmed && req.status !== 'completed' && req.status !== 'closed') {
          status = 'completed';
          voucherId = `VCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

          // Create payment dispatch voucher for service provider
          const providerVoucher: Voucher = {
            id: voucherId,
            reference: `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            description: `Auto Payment Dispatch - Completed ${req.category} maintenance for ${req.tenantName}`,
            amount: req.quotedAmount || 5000,
            payee: req.assignedProviderName || 'Registered Provider',
            approvedBy: 'Dual Confirmation Engine',
            status: 'approved',
            createdAt: new Date().toISOString().split('T')[0]
          };
          newVouchers.unshift(providerVoucher);

          // Update Service Provider performance metrics
          const pIndex = state.serviceProviders.findIndex(sp => sp.id === req.assignedProviderId);
          if (pIndex !== -1) {
            const provider = state.serviceProviders[pIndex];
            state.serviceProviders[pIndex] = {
              ...provider,
              jobsCompleted: provider.jobsCompleted + 1,
              rating: Math.min(5, Number((((provider.rating * provider.jobsCompleted) + 5) / (provider.jobsCompleted + 1)).toFixed(1)))
            };
          }

          // Debit landlord or debit tenant depending on caretaker responsibility setting
          const chargeAmount = req.quotedAmount || 5000;
          if (req.responsibility === 'tenant') {
            // Debit tenant: increase tenant's balance due
            const tIndex = state.tenants.findIndex(t => t.id === req.tenantId);
            if (tIndex !== -1) {
              const tenant = state.tenants[tIndex];
              newTenants[tIndex] = {
                ...tenant,
                balance: tenant.balance + chargeAmount,
                status: 'arrears'
              };
            }

            // Ledger entry - charged to tenant
            newLedger.unshift({
              id: `led_${Math.random().toString(36).substring(2, 9)}`,
              transactionId: req.id,
              type: 'commission',
              description: `Tenant Debited: Maintenance cost for ${req.category} (Unit ${req.tenantName})`,
              amount: chargeAmount,
              landlordShare: 0,
              companyCommission: chargeAmount,
              date: new Date().toISOString().split('T')[0],
              status: 'processed'
            });

            // Notify Tenant
            newCommLogs.push({
              id: `msg_t_${Math.random().toString(36).substring(2, 9)}`,
              type: 'whatsapp',
              recipient: '+254745678901',
              recipientName: req.tenantName,
              subject: 'Maintenance Bill Charged',
              message: `Dear ${req.tenantName}, the ${req.category} work is completed. Since responsibility was Tenant-assigned, KES ${chargeAmount.toLocaleString()} has been charged to your rental account balance.`,
              status: 'delivered',
              category: 'payment_reminder',
              sentAt: new Date().toISOString(),
            });
          } else {
            // Debit Landlord: charge to landlord's statement payout balance
            newLedger.unshift({
              id: `led_${Math.random().toString(36).substring(2, 9)}`,
              transactionId: req.id,
              type: 'landlord_payment',
              description: `Landlord Debited: Maintenance cost for ${req.category} (Unit ${req.tenantName})`,
              amount: chargeAmount,
              landlordShare: -chargeAmount, // negative means debited from their share!
              companyCommission: 0,
              date: new Date().toISOString().split('T')[0],
              status: 'processed'
  });

            // Notify Landlord
            newCommLogs.push({
              id: `msg_l_${Math.random().toString(36).substring(2, 9)}`,
              type: 'whatsapp',
              recipient: '+254712000001',
              recipientName: 'Peter Kamau',
              subject: 'Maintenance Cost Debited',
              message: `Dear Peter Kamau, the ${req.category} repair for Unit ${req.tenantName} is completed. Since responsibility was Landlord-assigned, KES ${chargeAmount.toLocaleString()} has been debited from your monthly payout balance.`,
              status: 'delivered',
              category: 'alert',
              sentAt: new Date().toISOString(),
            });
          }

          // Credit provider dispatch notification
          newCommLogs.push({
            id: `msg_sp_${Math.random().toString(36).substring(2, 9)}`,
            type: 'sms',
            recipient: '+254756789012',
            recipientName: req.assignedProviderName || 'Provider',
            subject: 'Work Completion Payment',
            message: `Dear ${req.assignedProviderName}, work completion is fully confirmed by the tenant and landlord for Job ${req.id}. Consolidated Payment Dispatch ${voucherId} of KES ${chargeAmount.toLocaleString()} has been auto-created.`,
            status: 'delivered',
            category: 'receipt',
            sentAt: new Date().toISOString(),
          });

          newAuditLogs.push({
            id: `al_${Math.random().toString(36).substring(2, 9)}`,
            userId: 'system',
            userName: 'Dual Confirmation Engine',
            action: 'COMPLETED_SERVICE_REQUEST',
            module: 'ServiceProviders',
            details: `Job ${req.id} completed. Auto-dispatched payment voucher ${voucherId} of KES ${chargeAmount.toLocaleString()} to ${req.assignedProviderName}. Responsibility: ${req.responsibility}`,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1',
          });
        }

        const updatedRequest = {
          ...req,
          isConfirmedByTenant: isTenantConf,
          isConfirmedByLandlord: isLandlordConf,
          status: status as any,
          paymentVoucherId: voucherId,
          updatedAt: new Date().toISOString()
        };

        const newRequests = [...state.serviceRequests];
        newRequests[reqIndex] = updatedRequest;

        newAuditLogs.push({
          id: `al_${Math.random().toString(36).substring(2, 9)}`,
          userId: party,
          userName: party === 'tenant' ? req.tenantName : 'Peter Kamau',
          action: 'CONFIRMED_WORK_COMPLETION',
          module: 'ServiceProviders',
          details: `Confirmed work completion for maintenance job ${req.id} by ${party === 'tenant' ? 'Tenant' : 'Landlord'}.`,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        });

        return {
          serviceRequests: newRequests,
          vouchers: newVouchers,
          ledger: newLedger,
          tenants: newTenants,
          communicationLogs: newCommLogs,
          auditLogs: newAuditLogs
        };
      }),
    }),
    { name: 'vedama-data' }
  )
);
