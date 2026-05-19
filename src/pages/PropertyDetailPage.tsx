import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Map as MapIcon, Image as ImageIcon, ArrowLeft, Star, Share, Heart, Shield, User, ThumbsUp, HelpCircle, ArrowRight, Award, Bell } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import Badge, { statusToBadge } from '../components/ui/Badge';
import { useDataStore } from '../stores/dataStore';
import { useToastStore } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, getCompletionPct } from '../lib/utils';
import { Transaction, PlotSize } from '../types';

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
}

const mockReviews: Review[] = [
  { id: '1', user: 'Samuel Kamau', rating: 5, date: '2 months ago', comment: 'Excellent investment opportunity. The title deed process was very smooth and transparent. Highly recommend Vedama!' },
  { id: '2', user: 'Faith Mutua', rating: 4, date: '3 weeks ago', comment: 'Very strategic location. The value appreciation in this area is impressive. Great service from the sales team.' },
  { id: '3', user: 'David Omondi', rating: 5, date: '5 days ago', comment: 'I visited the site last weekend and was impressed by the infrastructure. Definitely worth the price.' }
];

// Helper to get descriptive text label for plot size
const getPlotSizeLabelFromQuantity = (qty: number): string => {
  if (qty === 1) return '50x100 (1/8 Acre)';
  if (qty === 2) return '100x100 (1/4 Acre)';
  if (qty === 4) return 'Half Acre';
  if (qty === 8) return '1 Acre';
  if (qty > 8) {
    const acres = qty / 8;
    return acres % 1 === 0 ? `${acres} Acre(s)` : `${qty} Plots (50x100)`;
  }
  return `${qty} Plots (50x100)`;
};

const getPlotSizeFromQuantity = (qty: number): PlotSize => {
  if (qty === 1) return '50x100';
  if (qty === 2) return '100x100';
  if (qty === 4) return 'half_acre';
  if (qty === 8) return 'full_acre';
  if (qty > 8) return 'multi_acre';
  return '50x100';
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, addTransaction, addAuditLog, triggerBankClearance, transactions } = useDataStore();
  const { addToast } = useToastStore();
  const { isAuthenticated, user } = useAuthStore();
  
  const property = properties.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<'gallery' | 'map'>('gallery');
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 100) + 50);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);

  // Negotiation Protocol States
  const [negStep, setNegStep] = useState<1 | 2 | 3 | 4>(1);
  const [plotCount, setPlotCount] = useState<number>(1);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [generatedRef, setGeneratedRef] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [negError, setNegError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isPaymentCleared, setIsPaymentCleared] = useState(false);

  useEffect(() => {
    const savedProperties = JSON.parse(localStorage.getItem('saved_properties') || '[]');
    if (id && savedProperties.includes(id)) {
      setIsSaved(true);
    }
  }, [id]);

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-bg">
        <PublicNavbar />
        <div className="flex-grow flex items-center justify-center pt-24 pb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
            <Link to="/properties" className="btn-primary">Back to Properties</Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const soldPct = getCompletionPct(property.soldPlots, property.totalPlots);
  const basePrice = property.pricePerPlot * plotCount;

  const handleSave = () => {
    const savedProperties = JSON.parse(localStorage.getItem('saved_properties') || '[]');
    if (isSaved) {
      const newSaved = savedProperties.filter((pId: string) => pId !== id);
      localStorage.setItem('saved_properties', JSON.stringify(newSaved));
      setIsSaved(false);
      addToast('Removed from saved properties', 'info');
    } else {
      savedProperties.push(id);
      localStorage.setItem('saved_properties', JSON.stringify(savedProperties));
      setIsSaved(true);
      addToast('Property saved to your favorites!', 'success');
    }
  };

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
      addToast('Glad you like this property!', 'info');
    }
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title} in ${property.location}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Property link copied to clipboard!', 'success');
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      user: clientName || user?.name || 'Guest User',
      rating: newRating,
      date: 'Just now',
      comment: newReviewText,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewText('');
    setNewRating(5);
    addToast('Thank you for your review!', 'success');
  };

  // Negotiation Steps handlers
  const handleProceedToNeg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) {
      addToast('Please provide your contact information to proceed', 'warning');
      return;
    }
    setOfferPrice(Math.round(basePrice * 0.85)); // pre-fill with reasonable 85% offer
    setNegStep(2);
  };

  const handleCalculateOffer = () => {
    if (offerPrice <= 0) {
      addToast('Please enter a valid offer amount', 'warning');
      return;
    }

    setIsEvaluating(true);
    setNegError('');
    
    setTimeout(() => {
      setIsEvaluating(false);
      const ratio = offerPrice / basePrice;
      const landlordReserveRatio = (property.landlordAgreedPrice || (property.pricePerPlot * 0.75)) / property.pricePerPlot;

      if (ratio < landlordReserveRatio) {
        setNegError(`Offer rejected. Landlord reserves require a higher target. Please increase your offer to at least ${formatCurrency(Math.round(basePrice * (landlordReserveRatio + 0.05)))}.`);
      } else if (ratio >= 0.93) {
        // Instant accept!
        setAgreedPrice(offerPrice);
        setNegStep(3);
        addToast('Congratulations! Your offer is accepted instantly.', 'success');
      } else {
        // Counter-offer (split the difference between reserve floor and full price)
        const reserveFloor = Math.round(basePrice * landlordReserveRatio);
        const splitOffer = Math.round((basePrice + offerPrice) / 2);
        setCounterPrice(Math.max(splitOffer, reserveFloor + Math.round(basePrice * 0.05)));
        setNegStep(3);
      }
    }, 1000);
  };

  const handleAcceptDeal = (finalPrice: number) => {
    setAgreedPrice(finalPrice);
    
    const uniqueRef = `VDM-WEB-${Math.floor(Math.random() * 9000) + 1000}`;
    setGeneratedRef(uniqueRef);
    setPaymentAmount(finalPrice); // prefill payment simulator

    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      reference: uniqueRef,
      propertyId: property.id,
      propertyTitle: property.title,
      clientId: `c-${Math.random().toString(36).substring(2, 5)}`,
      clientName: clientName,
      plotSize: getPlotSizeFromQuantity(plotCount),
      plotCount: plotCount,
      unitPrice: Math.round(finalPrice / plotCount),
      totalAmount: finalPrice,
      amountPaid: 0,
      balance: finalPrice,
      status: 'agreed',
      offerAmount: offerPrice,
      counterOffer: counterPrice || undefined,
      agreedPrice: finalPrice,
      depositAmount: Math.round(finalPrice * 0.2), // 20% deposit standard
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assetType: 'land',
      assetDetails: `Web site purchase: ${getPlotSizeLabelFromQuantity(plotCount)}`
    };

    addTransaction(newTx);
    addAuditLog({
      id: Math.random().toString(36).substring(2, 9),
      userId: 'client_guest',
      userName: clientName,
      action: 'SEALED_DEAL_WEB',
      module: 'Sales',
      details: `Client sealed purchase deal online for ${property.title}. Ref: ${uniqueRef}, Agreed Price: KES ${finalPrice.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    });

    setNegStep(4);
    addToast('Deal sealed successfully! Reference generated.', 'success');
  };

  const handleSimulateWebhook = () => {
    if (paymentAmount <= 0) {
      addToast('Please specify a valid payment amount', 'warning');
      return;
    }

    const res = triggerBankClearance(generatedRef, paymentAmount, 'bank_transfer');
    if (res.success) {
      setIsPaymentCleared(true);
      addToast(`Payment of KES ${paymentAmount.toLocaleString()} cleared and receipt sent!`, 'success');
    } else {
      addToast(res.error || 'Clearance failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full mt-20">
        
        {/* Title & Actions Row */}
        <div className="mb-6 animate-slide-up">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary mb-2">{property.title}</h1>
              <div className="flex items-center gap-4 text-sm font-medium flex-wrap">
                <div className="flex items-center">
                  <Star size={16} className="text-vedama-gold mr-1 fill-vedama-gold" />
                  <span>4.95</span>
                  <span className="mx-1">·</span>
                  <button className="underline hover:text-vedama-emerald transition-colors" onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                    {reviews.length} reviews
                  </button>
                </div>
                <div className="flex items-center">
                  <ThumbsUp size={16} className={`mr-1 ${isLiked ? 'text-vedama-emerald fill-vedama-emerald' : 'text-text-muted'}`} />
                  <span>{likesCount} likes</span>
                </div>
                <div className="flex items-center">
                  <Shield size={16} className="text-status-success mr-1" />
                  <span className="text-status-success">Verified Title</span>
                </div>
                <div className="flex items-center underline cursor-pointer hover:text-vedama-emerald transition-colors">
                  <MapPin size={16} className="mr-1" />
                  <span>{property.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 relative">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-semibold underline hover:bg-surface-hover p-2 rounded-lg transition-colors relative"
              >
                <Share size={16} /> Share
              </button>
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 text-sm font-semibold underline hover:bg-surface-hover p-2 rounded-lg transition-colors ${isSaved ? 'text-status-danger' : ''}`}
              >
                <Heart size={16} className={isSaved ? 'fill-status-danger' : ''} /> {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="mb-8 relative rounded-xl overflow-hidden group animate-slide-up delay-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px]">
            <div className="md:col-span-2 relative overflow-hidden">
              <img 
                src={property.images[0]} 
                alt="Main view" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
              />
            </div>
            <div className="hidden md:grid grid-cols-2 grid-rows-2 col-span-2 gap-2">
              <div className="relative overflow-hidden">
                <img src={property.images[1] || property.images[0]} alt="View 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
              </div>
              <div className="relative overflow-hidden">
                <img src={property.images[0]} alt="View 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
              </div>
              <div className="relative overflow-hidden">
                <img src={property.images[1] || property.images[0]} alt="View 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
              </div>
              <div className="relative overflow-hidden">
                <img src={property.images[0]} alt="View 5" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
              </div>
            </div>
          </div>
          <button className="absolute bottom-6 right-6 bg-white px-4 py-2 rounded-lg border border-text-primary text-sm font-semibold shadow-md flex items-center gap-2 hover:bg-surface-hover transition-colors">
            <ImageIcon size={16} /> Show all photos
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10 animate-slide-up delay-200">
            <div className="flex justify-between items-center pb-8 border-b border-surface-border">
              <div>
                <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Property managed by Vedama Company</h2>
                <p className="text-text-secondary text-sm">1,200+ happy investors · Certified Real Estate Agency</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-vedama-emerald flex items-center justify-center text-white font-heading font-bold text-xl cursor-pointer hover:bg-vedama-emerald-light transition-colors">
                V
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><Shield className="text-vedama-gold" size={24} /></div>
                <div>
                  <h4 className="font-bold">Vedama Verified</h4>
                  <p className="text-text-secondary text-sm">This property has been vetted for genuine title deeds and legal compliance.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><MapIcon className="text-vedama-gold" size={24} /></div>
                <div>
                  <h4 className="font-bold">Prime Location</h4>
                  <p className="text-text-secondary text-sm">Situated in a high-growth zone with projected 15% annual appreciation.</p>
                </div>
              </div>
            </div>

            <div className="py-8 border-t border-b border-surface-border">
              <h3 className="text-xl font-heading font-bold mb-4">About this property</h3>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold mb-6">What this property offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center text-text-primary gap-4">
                    <CheckCircle size={20} className="text-vedama-emerald opacity-60" />
                    <span className="text-sm font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-surface-border">
                <h3 className="text-xl font-heading font-bold mb-6">Location Map</h3>
                <div className="h-[400px] w-full bg-gray-100 rounded-xl overflow-hidden border border-surface-border">
                    <MapContainer center={[property.lat, property.lng]} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[property.lat, property.lng]}>
                            <Popup>
                                <div className="font-bold">{property.title}</div>
                                <div>{property.location}</div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="pt-12 border-t border-surface-border scroll-mt-24">
              <div className="flex items-center gap-2 mb-8">
                <Star size={24} className="text-vedama-gold fill-vedama-gold" />
                <h3 className="text-2xl font-heading font-bold">4.95 · {reviews.length} reviews</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="font-bold">{review.user}</div>
                        <div className="text-xs text-text-muted">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'fill-vedama-gold text-vedama-gold' : 'text-surface-border'} />
                      ))}
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>

              {/* Leave a Property Review & Rating Form */}
              <div className="bg-surface-bg p-6 rounded-2xl border border-surface-border mt-8">
                <h4 className="font-heading font-bold text-text-primary text-base mb-1 flex items-center gap-2">
                  <Star className="text-vedama-gold fill-vedama-gold" size={18} />
                  Leave a Property Review & Rating
                </h4>
                <p className="text-[11px] text-text-secondary mb-5">Share your experience with the community regarding {property.title}.</p>
                
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase">Your Name</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        placeholder={user?.name || "Your Name"}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase block mb-1">Your Rating</label>
                      <div className="flex gap-1.5 items-center h-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star
                              size={20}
                              className={star <= newRating ? 'fill-vedama-gold text-vedama-gold' : 'text-text-muted hover:text-vedama-gold'}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-semibold text-text-secondary ml-1">({newRating}/5)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase">Review Description</label>
                    <textarea
                      className="input-field mt-1 min-h-[80px]"
                      placeholder="What did you like about this land? E.g., red soil, proximity to the highway, water access..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary flex items-center gap-1.5 shadow-md !rounded-full text-xs font-bold px-5 py-2.5">
                    Submit Certified Review
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Pricing & Interactive Negotiation Engine */}
          <div className="lg:relative animate-slide-up delay-300">
            <div className="lg:sticky lg:top-28">
              <div className="bg-white p-6 rounded-2xl shadow-card-lg border-2 border-vedama-emerald/20 shadow-vedama-emerald/5">
                
                {/* Header Info */}
                <div className="flex justify-between items-center pb-4 border-b border-surface-border mb-6">
                  <div>
                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Public Listing Price</span>
                    <div className="text-2xl font-bold text-text-primary mt-0.5">{formatCurrency(property.pricePerPlot)} <span className="text-xs text-text-secondary font-normal">/ Plot</span></div>
                  </div>
                  <div className="bg-vedama-gold/10 text-vedama-gold px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award size={12} /> Negotiation Enabled
                  </div>
                </div>

                {/* Negotiation Protocol Steps */}
                
                {/* STEP 1: SIZE & CUSTOMER DETAILS */}
                {negStep === 1 && (
                  <form onSubmit={handleProceedToNeg} className="space-y-4">
                    <h3 className="font-heading font-bold text-text-primary text-base">Step 1: Size & Client Profile</h3>
                    
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase">Select Plot Count (50x100 units)</label>
                      <select 
                        className="input-field mt-1"
                        value={plotCount}
                        onChange={(e) => setPlotCount(Number(e.target.value))}
                      >
                        <option value="1">1 Plot (50x100)</option>
                        <option value="2">2 Plots (100x100)</option>
                        <option value="4">4 Plots (Half Acre)</option>
                        <option value="8">8 Plots (1 Acre)</option>
                        <option value="16">16 Plots (2 Acres)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-surface-bg border border-surface-border rounded-xl">
                      <div className="text-[10px] text-text-muted font-bold uppercase">Computed Measurements</div>
                      <div className="text-sm font-bold text-vedama-emerald mt-0.5">{getPlotSizeLabelFromQuantity(plotCount)}</div>
                      <div className="text-xs text-text-secondary mt-1 flex justify-between">
                        <span>List Price:</span>
                        <span className="font-bold">{formatCurrency(basePrice)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-text-secondary uppercase">Your Contact Information</label>
                      <input 
                        type="text" 
                        placeholder="Your Full Name" 
                        className="input-field text-sm" 
                        required 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                      <input 
                        type="email" 
                        placeholder="Your Email Address" 
                        className="input-field text-sm" 
                        required 
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                      <input 
                        type="tel" 
                        placeholder="Your Phone (for WhatsApp notifications)" 
                        className="input-field text-sm" 
                        required 
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full btn-emerald flex items-center justify-center gap-2 py-3 !rounded-full shadow-md mt-4"
                    >
                      Negotiate Custom Offer <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* STEP 2: MAKE CUSTOM OFFER */}
                {negStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setNegStep(1)} className="text-text-muted hover:text-text-primary"><ArrowLeft size={16}/></button>
                      <h3 className="font-heading font-bold text-text-primary text-base">Step 2: Propose Your Offer</h3>
                    </div>

                    <div className="p-3.5 bg-surface-bg border border-surface-border rounded-xl text-center">
                      <span className="text-[10px] text-text-muted font-bold uppercase">Total Original Price</span>
                      <div className="text-xl font-bold text-text-secondary line-through">{formatCurrency(basePrice)}</div>
                      <div className="text-xs text-text-muted mt-1">{getPlotSizeLabelFromQuantity(plotCount)}</div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase">Proposed Purchase Offer (KES)</label>
                      <input 
                        type="number" 
                        className="input-field text-lg font-bold text-vedama-emerald mt-1 text-center" 
                        value={offerPrice || ''}
                        onChange={(e) => setOfferPrice(Number(e.target.value))}
                        placeholder="Enter KES Offer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" 
                        onClick={() => setOfferPrice(Math.round(basePrice * 0.8))}
                        className="py-2 bg-surface-bg border border-surface-border hover:bg-surface-hover rounded-xl text-xs font-semibold"
                      >
                        Offer 80% (KES {Math.round(basePrice * 0.8).toLocaleString()})
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setOfferPrice(Math.round(basePrice * 0.88))}
                        className="py-2 bg-surface-bg border border-surface-border hover:bg-surface-hover rounded-xl text-xs font-semibold"
                      >
                        Offer 88% (KES {Math.round(basePrice * 0.88).toLocaleString()})
                      </button>
                    </div>

                    {negError && (
                      <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-xs text-status-danger font-medium leading-relaxed">
                        {negError}
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={handleCalculateOffer}
                      disabled={isEvaluating}
                      className="w-full btn-gold py-3 flex items-center justify-center gap-2 !rounded-full shadow-md"
                    >
                      {isEvaluating ? (
                        <span>Analyzing with Landlord...</span>
                      ) : (
                        <>Submit Offer to Landlord <CheckCircle size={16} /></>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 3: COUNTER-OFFER RECONCILIATION */}
                {negStep === 3 && (
                  <div className="space-y-5">
                    <h3 className="font-heading font-bold text-text-primary text-base">Step 3: Protocol Counter-Offer</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Your Proposed Offer:</span>
                        <span className="font-bold text-text-secondary">{formatCurrency(offerPrice)}</span>
                      </div>
                      
                      {counterPrice > 0 ? (
                        <>
                          <div className="p-4 bg-amber-50 border-2 border-dashed border-vedama-gold/30 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Final Landlord Counter-Offer</span>
                            <div className="text-2xl font-bold text-vedama-gold">{formatCurrency(counterPrice)}</div>
                            <p className="text-[11px] text-amber-700 leading-normal px-2">
                              The Landlord has counter-proposed this special discounted final rate to seal the transaction.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <button 
                              onClick={() => setNegStep(2)}
                              className="py-2.5 bg-surface-bg border border-surface-border text-text-secondary font-bold text-xs rounded-full hover:bg-surface-hover transition-colors"
                            >
                              Counter Again
                            </button>
                            <button 
                              onClick={() => handleAcceptDeal(counterPrice)}
                              className="py-2.5 bg-vedama-emerald text-white font-bold text-xs rounded-full hover:bg-vedama-emerald-dark shadow-md transition-colors"
                            >
                              Accept Final Price
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-status-success font-bold uppercase">Offer Accepted Instantly</span>
                          <div className="text-2xl font-bold text-status-success">{formatCurrency(agreedPrice)}</div>
                          <button 
                            onClick={() => handleAcceptDeal(agreedPrice)}
                            className="w-full btn-emerald py-2.5 mt-3 !rounded-full shadow-md"
                          >
                            Proceed to Seal Deal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: DEAL SEALED & BANK SIMULATOR */}
                {negStep === 4 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-status-success/10 border-2 border-status-success/30 rounded-xl text-center">
                      <Award className="mx-auto text-status-success mb-2" size={32} />
                      <h4 className="text-sm font-bold text-status-success uppercase tracking-wide">DEAL SEALED SUCCESSFULLY!</h4>
                      <p className="text-xs text-text-secondary mt-1">Transaction recorded in escrow portal.</p>
                    </div>

                    <div className="p-4 bg-surface-bg border border-surface-border rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Client Name:</span>
                        <span className="font-bold text-text-primary">{clientName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Unique Reference:</span>
                        <span className="font-mono font-bold text-vedama-emerald text-sm">{generatedRef}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Lienholding Bank:</span>
                        <span className="font-semibold text-text-primary">{property.lienholderBank || 'KCB Bank Kenya'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-surface-border">
                        <span className="text-text-muted font-bold">Agreed Final Amount:</span>
                        <span className="font-bold text-vedama-gold">{formatCurrency(agreedPrice)}</span>
                      </div>
                    </div>

                    {/* LIVE WEBHOOK BANK CLEARING SIMULATOR */}
                    <div className="p-4 bg-vedama-emerald/[0.03] border-2 border-vedama-emerald/30 border-dashed rounded-2xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Bell className="text-vedama-emerald animate-bounce" size={18} />
                        <h4 className="text-xs font-bold text-vedama-emerald uppercase tracking-wider">Live Bank clearance console</h4>
                      </div>
                      
                      <p className="text-[11px] text-text-secondary leading-normal">
                        Simulate the bank clearing your payment via webhook. Once clicked, this will automatically update your ledger, splits, and send automated WhatsApp/SMS alerts.
                      </p>

                      {!isPaymentCleared ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-text-muted uppercase">Clearance Amount (KES)</label>
                            <input 
                              type="number" 
                              className="input-field text-sm font-semibold mt-1" 
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleSimulateWebhook}
                            className="w-full py-2 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            Clear via Real-time Webhook
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-xl text-center">
                          <CheckCircle className="mx-auto text-status-success mb-1" size={20} />
                          <div className="text-xs font-bold text-status-success uppercase">PAYMENT CLEARED!</div>
                          <div className="text-[11px] text-text-secondary mt-0.5">Funds fully processed. Receipt sent.</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>

              {/* Protective Badge card below */}
              <div className="mt-6 p-5 rounded-xl border border-surface-border flex items-center gap-4">
                <div className="bg-status-success/10 p-3 rounded-lg text-status-success"><Shield size={24}/></div>
                <div>
                    <h5 className="font-bold text-sm">Protected Investment</h5>
                    <p className="text-xs text-text-secondary">Vedama handles all legal escrow documents ensuring secure ownership transfer.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <div className="bg-surface-bg border-t border-surface-border mt-16 py-12 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-heading font-bold mb-6 text-center">Project Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                    <div className="text-2xl font-bold text-vedama-emerald">{property.totalAcres}</div>
                    <div className="text-xs text-text-secondary uppercase font-semibold">Total Acres</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-vedama-emerald">{property.totalPlots}</div>
                    <div className="text-xs text-text-secondary uppercase font-semibold">Total Plots</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-vedama-emerald">{property.totalPlots - property.soldPlots}</div>
                    <div className="text-xs text-text-secondary uppercase font-semibold">Available</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-vedama-gold">{soldPct}%</div>
                    <div className="text-xs text-text-secondary uppercase font-semibold">Sold Out</div>
                </div>
            </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
