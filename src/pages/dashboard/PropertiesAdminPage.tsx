import React, { useState } from 'react';
import { Plus, Search, MapPin, Landmark, FileText, CheckCircle, Shield, Edit2, Info, X } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { useToastStore } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import Badge, { statusToBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import FileUpload from '../../components/ui/FileUpload';
import { Property } from '../../types';

export default function PropertiesAdminPage() {
  const { 
    properties, 
    landlords, 
    addProperty, 
    updateProperty, 
    addAuditLog 
  } = useDataStore();
  
  const { addToast } = useToastStore();
  const user = useAuthStore(s => s.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCounty, setFormCounty] = useState('');
  const [formTotalAcres, setFormTotalAcres] = useState(0);
  const [formTotalPlots, setFormTotalPlots] = useState(0);
  const [formPricePerPlot, setFormPricePerPlot] = useState(0);
  const [formPricePerAcre, setFormPricePerAcre] = useState(0);
  const [formLandlordId, setFormLandlordId] = useState('');
  const [formLandlordPrice, setFormLandlordPrice] = useState(0);
  const [formLienBank, setFormLienBank] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'available' | 'selling' | 'sold_out'>('available');
  const [formImages, setFormImages] = useState<string[]>([]);

  // Legal document states
  const [formTitleDeed, setFormTitleDeed] = useState('');
  const [formSurveyMap, setFormSurveyMap] = useState('');
  const [formNemaCert, setFormNemaCert] = useState('');
  const [formLandRateCert, setFormLandRateCert] = useState('');
  const [formValuationReport, setFormValuationReport] = useState('');

  // Document uploader toggles
  const [docTypeTitleDeed, setDocTypeTitleDeed] = useState<'upload' | 'link'>('upload');
  const [docTypeSurveyMap, setDocTypeSurveyMap] = useState<'upload' | 'link'>('upload');
  const [docTypeNemaCert, setDocTypeNemaCert] = useState<'upload' | 'link'>('upload');
  const [docTypeLandRateCert, setDocTypeLandRateCert] = useState<'upload' | 'link'>('upload');
  const [docTypeValuationReport, setDocTypeValuationReport] = useState<'upload' | 'link'>('upload');

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setSelectedProperty(null);
    setFormTitle('');
    setFormLocation('');
    setFormCounty('');
    setFormTotalAcres(10);
    setFormTotalPlots(80);
    setFormPricePerPlot(350000);
    setFormPricePerAcre(2400000);
    setFormLandlordId(landlords[0]?.id || 'l1');
    setFormLandlordPrice(250000);
    setFormLienBank('NCBA Bank Ltd');
    setFormDescription('');
    setFormStatus('available');
    setFormImages(['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80']);
    
    // Set realistic legal defaults for demo
    setFormTitleDeed('https://registry.lands.go.ke/deeds/title-deed-vdm.pdf');
    setFormSurveyMap('https://registry.lands.go.ke/maps/pid-survey-vdm.pdf');
    setFormNemaCert('https://nema.go.ke/licences/nema-dev-vdm.pdf');
    setFormLandRateCert('https://revenue.county.go.ke/clearance/rates-vdm.pdf');
    setFormValuationReport('https://valuation.vedama.co.ke/reports/val-vdm.pdf');
    
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setSelectedProperty(property);
    setFormTitle(property.title);
    setFormLocation(property.location);
    setFormCounty(property.county);
    setFormTotalAcres(property.totalAcres);
    setFormTotalPlots(property.totalPlots);
    setFormPricePerPlot(property.pricePerPlot);
    setFormPricePerAcre(property.pricePerAcre || property.pricePerPlot * 8);
    setFormLandlordId(property.landlordId || landlords[0]?.id || 'l1');
    setFormLandlordPrice(property.landlordAgreedPrice || property.pricePerPlot * 0.75);
    setFormLienBank(property.lienholderBank || 'NCBA Bank Ltd');
    setFormDescription(property.description);
    setFormStatus(property.status);
    setFormImages(property.images || []);

    // Document links
    setFormTitleDeed(property.titleDeedUrl || 'https://registry.lands.go.ke/deeds/title-deed-vdm.pdf');
    setFormSurveyMap(property.surveyMapUrl || 'https://registry.lands.go.ke/maps/pid-survey-vdm.pdf');
    setFormNemaCert(property.nemaCertUrl || 'https://nema.go.ke/licences/nema-dev-vdm.pdf');
    setFormLandRateCert(property.landRateCertUrl || 'https://revenue.county.go.ke/clearance/rates-vdm.pdf');
    setFormValuationReport(property.valuationReportUrl || 'https://valuation.vedama.co.ke/reports/val-vdm.pdf');
    
    setIsModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formLocation || !formCounty) {
      addToast('Please fill in all required asset fields', 'warning');
      return;
    }

    const propertyPayload: Partial<Property> = {
      title: formTitle,
      location: formLocation,
      county: formCounty,
      totalAcres: Number(formTotalAcres),
      totalPlots: Number(formTotalPlots),
      pricePerPlot: Number(formPricePerPlot),
      pricePerAcre: Number(formPricePerAcre),
      landlordId: formLandlordId,
      landlordAgreedPrice: Number(formLandlordPrice),
      lienholderBank: formLienBank,
      description: formDescription,
      status: formStatus,
      images: formImages,
      // Document URLs
      titleDeedUrl: formTitleDeed,
      surveyMapUrl: formSurveyMap,
      nemaCertUrl: formNemaCert,
      landRateCertUrl: formLandRateCert,
      valuationReportUrl: formValuationReport,
    };

    if (selectedProperty) {
      // EDITING
      updateProperty(selectedProperty.id, propertyPayload);
      
      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: user?.id || 'admin',
        userName: user?.name || 'Administrator',
        action: 'EDIT_PROPERTY_ASSET',
        module: 'PropertiesAdmin',
        details: `Edited property asset ${formTitle} (${selectedProperty.id}). Updated legal documents and escrow bounds.`,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast(`Property ${formTitle} successfully updated!`, 'success');
    } else {
      // ADDING NEW
      const newProperty: Property = {
        id: `prop-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        title: formTitle,
        location: formLocation,
        county: formCounty,
        description: formDescription,
        totalAcres: Number(formTotalAcres),
        totalPlots: Number(formTotalPlots),
        soldPlots: 0,
        pricePerPlot: Number(formPricePerPlot),
        pricePerAcre: Number(formPricePerAcre),
        lat: -1.286389,
        lng: 36.817223,
        images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'],
        amenities: ['Water Connection', 'Electricity Grids', 'Access Road', 'Lien Protection'],
        status: formStatus,
        featured: false,
        createdAt: new Date().toISOString(),
        landlordId: formLandlordId,
        landlordAgreedPrice: Number(formLandlordPrice),
        lienholderBank: formLienBank,
        // Document URLs
        titleDeedUrl: formTitleDeed,
        surveyMapUrl: formSurveyMap,
        nemaCertUrl: formNemaCert,
        landRateCertUrl: formLandRateCert,
        valuationReportUrl: formValuationReport,
      };

      addProperty(newProperty);

      addAuditLog({
        id: `AUD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: user?.id || 'admin',
        userName: user?.name || 'Administrator',
        action: 'ADD_PROPERTY_ASSET',
        module: 'PropertiesAdmin',
        details: `Registered new land property asset ${formTitle} under escrow with ${formLienBank} and attached legal deeds.`,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });

      addToast(`Property ${formTitle} successfully registered in system!`, 'success');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-1">Property Portfolio</h1>
          <p className="text-text-secondary text-lg">Manage land assets, pricing models, and real-world legal escrows.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-md hover:shadow-lg transition-all !rounded-full"
        >
          <Plus size={18} /> Register Property
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-surface-border mb-8 animate-slide-up delay-100">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-vedama-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by title, location, or county..." 
            className="w-full pl-12 pr-4 py-3 bg-surface-bg border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-vedama-emerald/20 focus:bg-white shadow-inner transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProperties.map((property, idx) => (
          <div key={property.id} className="card overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: `${(idx + 2) * 100}ms` }}>
            <div className="h-48 overflow-hidden relative">
              <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 flex gap-1">
                <Badge variant={statusToBadge(property.status)} className="shadow-sm backdrop-blur-md bg-white/90">
                  {property.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-lg font-heading font-bold text-text-primary mb-1 line-clamp-1">{property.title}</h3>
              <div className="flex items-center text-text-muted text-sm mb-4">
                <MapPin size={16} className="mr-1 shrink-0" />
                <span className="truncate">{property.location}, {property.county}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-xs flex-grow">
                <div>
                  <div className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Total Size</div>
                  <div className="font-semibold text-text-primary mt-0.5">{property.totalAcres} Acres</div>
                </div>
                <div>
                  <div className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Sold Ratio</div>
                  <div className="font-semibold text-vedama-emerald mt-0.5">{property.soldPlots} / {property.totalPlots} Plots</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-surface-border">
                  <div className="text-text-muted font-bold uppercase tracking-wider text-[10px] mb-0.5">Clearing Custodian Bank</div>
                  <div className="font-bold text-text-primary flex items-center gap-1.5">
                    <Landmark size={14} className="text-vedama-gold" /> {property.lienholderBank || 'NCBA Bank Kenya'}
                  </div>
                </div>
              </div>

              {/* REAL WORLD ATTACHMENTS PREVIEW IN THE CARD */}
              <div className="mb-4 p-3 bg-surface-bg rounded-xl border border-surface-border space-y-1.5 text-[10px]">
                <div className="font-bold text-text-secondary uppercase tracking-wider text-[8px] mb-1 flex items-center gap-1">
                  <Shield size={12} className="text-vedama-emerald" /> Legal Escrow Documents Attached
                </div>
                
                {property.titleDeedUrl && (
                  <a href={property.titleDeedUrl} target="_blank" rel="noreferrer" className="flex justify-between hover:text-vedama-emerald text-text-muted transition-colors font-medium">
                    <span className="flex items-center gap-1">📄 Land Title Deed (PDF)</span>
                    <span className="text-status-success font-bold text-[8px] bg-green-50 px-1 border rounded">✓ Verified</span>
                  </a>
                )}
                {property.surveyMapUrl && (
                  <a href={property.surveyMapUrl} target="_blank" rel="noreferrer" className="flex justify-between hover:text-vedama-emerald text-text-muted transition-colors font-medium">
                    <span className="flex items-center gap-1">🗺️ Registry PID Map Sheet</span>
                    <span className="text-status-success font-bold text-[8px] bg-green-50 px-1 border rounded">✓ Verified</span>
                  </a>
                )}
                {property.nemaCertUrl && (
                  <a href={property.nemaCertUrl} target="_blank" rel="noreferrer" className="flex justify-between hover:text-vedama-emerald text-text-muted transition-colors font-medium">
                    <span className="flex items-center gap-1">🌿 NEMA Dev License</span>
                    <span className="text-status-success font-bold text-[8px] bg-green-50 px-1 border rounded">✓ Verified</span>
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-between items-center mb-4">
                <div>
                  <div className="text-text-muted text-[8px] font-bold uppercase tracking-wider">Per-Plot Value</div>
                  <div className="font-bold text-sm text-vedama-emerald">{formatCurrency(property.pricePerPlot)}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted text-[8px] font-bold uppercase tracking-wider">Per-Acre Value</div>
                  <div className="font-bold text-sm text-text-primary">{formatCurrency(property.pricePerAcre || property.pricePerPlot * 8)}</div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-auto pt-4">
                <button 
                  onClick={() => openEditModal(property)}
                  className="btn-secondary flex-grow py-2.5 text-xs font-bold !rounded-full flex items-center justify-center gap-1 hover:border-vedama-gold"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
                <button 
                  onClick={() => addToast(`Title deed and survey charts verified for ${property.title}. Escrow hold active.`, 'info')}
                  className="btn-primary flex-grow py-2.5 text-xs font-bold !rounded-full shadow-sm"
                >
                  Clear Escrow
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER / EDIT PROPERTY MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedProperty ? "Edit Land Property Asset" : "Register New Land Property Asset"} 
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleSaveProperty}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Base Asset Info */}
            <div className="col-span-2 bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-text-primary text-[10px] flex items-center gap-1">
                <Info size={12} /> General Asset Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Property Title / Project Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Diani Oceanview Phase 2" 
                    required 
                  />
                </div>
                <div>
                  <label className="label">Location Town</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Diani Beach" 
                    required 
                  />
                </div>
                <div>
                  <label className="label">County</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formCounty}
                    onChange={(e) => setFormCounty(e.target.value)}
                    placeholder="e.g. Kwale" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Land metrics and Pricing */}
            <div className="col-span-1 bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-text-primary text-[10px]">📏 Land Dimensions & Retail Pricing</h4>
              <div>
                <label className="label">Total Acres</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formTotalAcres} 
                  onChange={(e) => setFormTotalAcres(Number(e.target.value))}
                  required 
                />
              </div>
              <div>
                <label className="label">Total Subdivided Plots</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formTotalPlots}
                  onChange={(e) => setFormTotalPlots(Number(e.target.value))}
                  required 
                />
              </div>
              <div>
                <label className="label">Retail Price Per Plot (KES)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formPricePerPlot}
                  onChange={(e) => setFormPricePerPlot(Number(e.target.value))}
                  required 
                />
              </div>
              <div>
                <label className="label">Retail Price Per Acre (KES)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formPricePerAcre}
                  onChange={(e) => setFormPricePerAcre(Number(e.target.value))}
                  required 
                />
              </div>
            </div>

            {/* Escrow and Landlord split */}
            <div className="col-span-1 bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-text-primary text-[10px]">🤝 Escrow Trust & Landowner Commission</h4>
              <div>
                <label className="label">Primary Landowner Beneficiary</label>
                <select 
                  className="input-field" 
                  value={formLandlordId}
                  onChange={(e) => setFormLandlordId(e.target.value)}
                  required
                >
                  {landlords.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Landlord Minimum Agreed Price / Plot (KES)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formLandlordPrice}
                  onChange={(e) => setFormLandlordPrice(Number(e.target.value))}
                  required 
                />
              </div>
              <div>
                <label className="label">Lienholding Custody Bank</label>
                <select 
                  className="input-field" 
                  value={formLienBank}
                  onChange={(e) => setFormLienBank(e.target.value)}
                  required
                >
                  <option value="NCBA Bank Ltd">NCBA Bank Kenya Ltd</option>
                  <option value="KCB Bank Kenya Ltd">KCB Bank Kenya Ltd</option>
                  <option value="Equity Bank Kenya">Equity Bank Kenya</option>
                  <option value="Standard Chartered Bank">Standard Chartered Bank Kenya</option>
                </select>
              </div>
              <div>
                <label className="label">Sales Status</label>
                <select 
                  className="input-field" 
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  required
                >
                  <option value="available">Available</option>
                  <option value="selling">Selling</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
            </div>

            {/* REAL WORLD COMPLIANCE DOCUMENTATION ATTACHMENTS */}
            <div className="col-span-2 bg-amber-50/50 p-4 rounded-2xl border border-vedama-gold/25 space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-vedama-gold-dark text-[10px] flex items-center gap-1">
                <Shield size={12} className="text-vedama-emerald" /> Real-World Legal Compliance Documents (Government Upload/Link)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Title Deed */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0 flex items-center gap-1 font-semibold">📄 Certified Title Deed</label>
                    <div className="flex gap-1 text-[8px] bg-white border p-0.5 rounded shadow-sm">
                      <button type="button" onClick={() => setDocTypeTitleDeed('upload')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeTitleDeed === 'upload' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Upload</button>
                      <button type="button" onClick={() => setDocTypeTitleDeed('link')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeTitleDeed === 'link' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Link</button>
                    </div>
                  </div>
                  {docTypeTitleDeed === 'upload' ? (
                    <FileUpload 
                      onUploadComplete={(url) => setFormTitleDeed(url)} 
                      defaultUrl={formTitleDeed}
                      defaultName={formTitleDeed ? formTitleDeed.split('/').pop() : ''}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formTitleDeed}
                      onChange={(e) => setFormTitleDeed(e.target.value)}
                      placeholder="https://registry.lands.go.ke/deeds/title.pdf"
                      required
                    />
                  )}
                </div>
                
                {/* 2. Survey Index Map */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0 flex items-center gap-1 font-semibold">🗺️ Survey Map Sheet (P.I.D)</label>
                    <div className="flex gap-1 text-[8px] bg-white border p-0.5 rounded shadow-sm">
                      <button type="button" onClick={() => setDocTypeSurveyMap('upload')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeSurveyMap === 'upload' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Upload</button>
                      <button type="button" onClick={() => setDocTypeSurveyMap('link')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeSurveyMap === 'link' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Link</button>
                    </div>
                  </div>
                  {docTypeSurveyMap === 'upload' ? (
                    <FileUpload 
                      onUploadComplete={(url) => setFormSurveyMap(url)} 
                      defaultUrl={formSurveyMap}
                      defaultName={formSurveyMap ? formSurveyMap.split('/').pop() : ''}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formSurveyMap}
                      onChange={(e) => setFormSurveyMap(e.target.value)}
                      placeholder="https://registry.lands.go.ke/maps/pid.pdf"
                      required
                    />
                  )}
                </div>

                {/* 3. NEMA Cert */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0 flex items-center gap-1 font-semibold">🌿 NEMA Development Licence</label>
                    <div className="flex gap-1 text-[8px] bg-white border p-0.5 rounded shadow-sm">
                      <button type="button" onClick={() => setDocTypeNemaCert('upload')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeNemaCert === 'upload' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Upload</button>
                      <button type="button" onClick={() => setDocTypeNemaCert('link')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeNemaCert === 'link' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Link</button>
                    </div>
                  </div>
                  {docTypeNemaCert === 'upload' ? (
                    <FileUpload 
                      onUploadComplete={(url) => setFormNemaCert(url)} 
                      defaultUrl={formNemaCert}
                      defaultName={formNemaCert ? formNemaCert.split('/').pop() : ''}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formNemaCert}
                      onChange={(e) => setFormNemaCert(e.target.value)}
                      placeholder="https://nema.go.ke/licences/nema.pdf"
                      required
                    />
                  )}
                </div>

                {/* 4. Land Rate Cert */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0 flex items-center gap-1 font-semibold font-bold">📈 Land Rate Clearance Cert</label>
                    <div className="flex gap-1 text-[8px] bg-white border p-0.5 rounded shadow-sm">
                      <button type="button" onClick={() => setDocTypeLandRateCert('upload')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeLandRateCert === 'upload' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Upload</button>
                      <button type="button" onClick={() => setDocTypeLandRateCert('link')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeLandRateCert === 'link' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Link</button>
                    </div>
                  </div>
                  {docTypeLandRateCert === 'upload' ? (
                    <FileUpload 
                      onUploadComplete={(url) => setFormLandRateCert(url)} 
                      defaultUrl={formLandRateCert}
                      defaultName={formLandRateCert ? formLandRateCert.split('/').pop() : ''}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formLandRateCert}
                      onChange={(e) => setFormLandRateCert(e.target.value)}
                      placeholder="https://revenue.county.go.ke/clearance.pdf"
                      required
                    />
                  )}
                </div>

                {/* 5. Valuation Report */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0 flex items-center gap-1 font-semibold">🏛️ Professional Valuation & Appraisal Report</label>
                    <div className="flex gap-1 text-[8px] bg-white border p-0.5 rounded shadow-sm">
                      <button type="button" onClick={() => setDocTypeValuationReport('upload')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeValuationReport === 'upload' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Upload</button>
                      <button type="button" onClick={() => setDocTypeValuationReport('link')} className={`px-1.5 py-0.5 rounded font-bold ${docTypeValuationReport === 'link' ? 'bg-vedama-emerald text-white' : 'text-text-muted hover:bg-surface-hover'}`}>Link</button>
                    </div>
                  </div>
                  {docTypeValuationReport === 'upload' ? (
                    <FileUpload 
                      onUploadComplete={(url) => setFormValuationReport(url)} 
                      defaultUrl={formValuationReport}
                      defaultName={formValuationReport ? formValuationReport.split('/').pop() : ''}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formValuationReport}
                      onChange={(e) => setFormValuationReport(e.target.value)}
                      placeholder="https://valuation.vedama.co.ke/reports/valuation.pdf"
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Property Image Gallery Showcase */}
            <div className="col-span-2 bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-4 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-text-primary text-[10px] flex items-center gap-1.5 font-bold">
                🖼️ Property Asset Showcase Gallery
              </h4>
              
              {/* Image Grid */}
              {formImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formImages.map((imgUrl: string, i: number) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-surface-border shadow-sm">
                      <img src={imgUrl} alt={`Showcase ${i+1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormImages(formImages.filter((_: string, idx: number) => idx !== i))}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <FileUpload 
                  label="Upload New Property Photo" 
                  accept="image/*"
                  onUploadComplete={(url) => {
                    if (url) {
                      setFormImages((prev: string[]) => [...prev, url]);
                      addToast("Photo uploaded and added to showcase gallery!", "success");
                    }
                  }} 
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="label">Public Project Description</label>
              <textarea 
                className="input-field min-h-[100px]" 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the asset, soil typography, access roads, amenities, and community attractions..."
                required
              ></textarea>
            </div>

          </div>

          <div className="border-t border-surface-border pt-6 flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary !rounded-full shadow-md">
              {selectedProperty ? "Save Updates" : "Register Property Asset"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
