import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Map, TrendingUp, HandCoins, Sparkles, Copy, MessageSquare, X, Send, Award, Facebook, Instagram, PhoneCall } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import PropertyCard from '../components/PropertyCard';
import { mockProperties, mockDirectors } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';
import { useToastStore } from '../components/ui/Toast';

export default function LandingPage() {
  const { addToast } = useToastStore();
  const featuredProperties = mockProperties.filter(p => p.featured).slice(0, 3);

  // AI Marketing Copilot States
  const [selectedPropertyId, setSelectedPropertyId] = useState(mockProperties[0].id);
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'sms' | 'whatsapp'>('facebook');
  const [generatedAd, setGeneratedAd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Floating Chatbot States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Jambo! Welcome to Vedama Company Limited. I am your AI Investment Advisor. How can I assist you with our properties or buying protocol today?' }
  ]);
  const [userInput, setUserInput] = useState('');

  const handleGenerateAd = () => {
    setIsGenerating(true);
    const prop = mockProperties.find(p => p.id === selectedPropertyId) || mockProperties[0];
    
    setTimeout(() => {
      let copy = '';
      const priceStr = formatCurrency(prop.pricePerPlot);
      const sizeStr = prop.id === 'p1' ? '50x100 (1/8 Acre)' : 'Quarter Acre';
      const amenitiesStr = prop.amenities.map(a => `✅ ${a}`).join('\n');

      if (platform === 'facebook') {
        copy = `🌟 EXCLUSIVE INVESTMENT OPPORTUNITY: ${prop.title.toUpperCase()}! 🌟\n\nLooking for genuine, high-yield land in ${prop.location}? Vedama Company Limited presents verified plots, ready for immediate development!\n\n📐 Size: ${sizeStr}\n💰 Special Offer: ${priceStr} per plot\n📜 Title deeds: Genuine, verified, and ready in 30 days!\n\nAvailable Infrastructure:\n${amenitiesStr}\n\n🏡 Perfect for holiday homes, family villas, or speculative investment with projected 15% annual appreciation!\n\n👇 Click "Learn More" to negotiate your custom offer directly on our interactive protocol website today! Cash discounts and flexible 12-month installment plans available.\n\n#VedamaCompany #KenyaRealEstate #LandForSale #InvestInKenya #PropertyManagement #VerifiedLand`;
      } else if (platform === 'instagram') {
        copy = `✨ Secure your future with ${prop.title} in ${prop.county}! ✨\n\nDreaming of owning beachfront views or strategic residential plots? We have done all the due diligence for you! \n\n💎 Plots starting at ${priceStr}\n💎 Flexible payments up to 12 months\n💎 100% Genuine Title Deeds\n\nInfrastructure is 100% ready: \n${amenitiesStr}\n\n👉 Tap the link in our bio to browse listings and try our live Purchase Negotiation tool. Propose your offer online and seal the deal instantly!\n\n#RealEstateKenya #LandSale #ThikaGreens #MalindiOceanview #FintechRealEstate #DianiBeach #AffordableLand #InvestRight`;
      } else if (platform === 'sms') {
        copy = `INVEST TODAY: Secure a verified plot at ${prop.title}, ${prop.county} from only KES ${prop.pricePerPlot.toLocaleString()}! Title deeds ready. Pay in 12-mo installments. Click to view photos & negotiate your offer directly online: http://vedama.co.ke/properties/${prop.id} Call 0712345678. Vedama Ltd.`;
      } else {
        copy = `Jambo! 👋 Are you looking for genuine land in ${prop.location}?\n\nVedama Company presents *${prop.title}*!\n\n*Key Highlights:*\n📐 Plot Size: ${sizeStr}\n💰 Price: ${priceStr}\n📜 Title Deed: 100% Verified\n\n*Amenities Included:*\n${amenitiesStr}\n\nWe have set up an interactive protocol website where you can make a custom offer, get an instant counter-proposal, and seal the deal online. Reference codes clear automatically with the bank real-time!\n\nReply to this message or visit http://vedama.co.ke/properties/${prop.id} to start!`;
      }

      setGeneratedAd(copy);
      setIsGenerating(false);
      addToast('Marketing campaign generated successfully!', 'success');
    }, 800);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedAd);
    addToast('Ad copy copied to clipboard!', 'success');
  };

  const handleSendMessage = (textToSend?: string) => {
    const input = textToSend || userInput;
    if (!input.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: input }];
    setChatMessages(newMessages);
    setUserInput('');

    setTimeout(() => {
      let botResponse = "Thank you for inquiring. All of our properties come with ready, verified title deeds. Would you like me to connect you with a sales representative, or would you like to explore our flexible payment plans?";
      
      const lower = input.toLowerCase();
      if (lower.includes('protocol') || lower.includes('buy') || lower.includes('negotiat') || lower.includes('offer')) {
        botResponse = "Our purchase protocol is fully digital! Visit any property details page, click 'Negotiate Custom Offer', enter your proposed price, and our system will instantly counter-propose a final price. Once agreed, a unique bank reference code is generated for secure payment.";
      } else if (lower.includes('malindi') || lower.includes('oceanview')) {
        botResponse = "Malindi Oceanview Estate is a premium beachfront development starting at KES 850,000 per plot. It features 100% genuine title deeds, piped water, electricity, and Indian Ocean views! You can submit an offer for it online.";
      } else if (lower.includes('payment') || lower.includes('installment') || lower.includes('pay')) {
        botResponse = "Absolutely! We offer flexible payment plans. You can deposit 20% to seal a deal, and pay the outstanding balance in up to 12 monthly installments. All payments update in our ledger instantly upon bank clearing.";
      } else if (lower.includes('bank') || lower.includes('link') || lower.includes('webhook')) {
        botResponse = "Our system is linked real-time with our bank account. Once you pay using your generated VDM-WEB reference code, the payment clears automatically via webhook, sends a WhatsApp receipt, and posts to our financial ledger.";
      }

      setChatMessages(prev => [...prev, { sender: 'bot' as const, text: botResponse }]);
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg relative">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-end justify-start pt-20 pb-20 md:pb-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="/bg-hero.png" 
            alt="Beautiful landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 text-left px-6 md:px-20 max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 animate-slide-up">
            Invest in Verified <br />
            <span className="text-vedama-gold">Kenyan Real Estate</span>
          </h1>
          <p className="text-base md:text-lg text-white/90 font-body mb-10 max-w-2xl animate-slide-up delay-100">
            Secure your future with premium land and property management services. Transparent, reliable, and trusted by thousands.
          </p>
          <div className="flex flex-col sm:flex-row justify-start gap-4 animate-slide-up delay-200">
            <Link to="/properties" className="btn-gold text-lg px-8 py-4 !rounded-full shadow-lg">View Properties</Link>
            <a href="#about" className="btn-secondary !text-white !border-white hover:!bg-white hover:!text-vedama-emerald text-lg px-8 py-4 !rounded-full transition-all">Learn More</a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b border-surface-border relative z-20 -mt-10 mx-4 md:mx-12 rounded-2xl shadow-card-lg animate-slide-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-surface-border">
          <div>
            <div className="text-4xl font-heading font-bold text-vedama-emerald mb-2">15+</div>
            <div className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Years Experience</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-vedama-emerald mb-2">500+</div>
            <div className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Happy Clients</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-vedama-emerald mb-2">1,200+</div>
            <div className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Plots Sold</div>
          </div>
          <div>
            <div className="text-4xl font-heading font-bold text-vedama-emerald mb-2">100%</div>
            <div className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Genuine Titles</div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-surface-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Featured Properties</h2>
            <p className="section-subtitle mx-auto">Explore our hand-picked selection of premium investment opportunities across the country.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/properties" className="inline-flex items-center text-vedama-emerald font-semibold hover:text-vedama-gold transition-colors text-lg">
              View All Properties <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24 bg-vedama-emerald text-white rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-white">Why Choose Vedama?</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                We believe that land ownership should be transparent, accessible, and secure. Our platform integrates fintech-grade transaction security with a premium real estate experience.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-vedama-gold/20 p-3 rounded-lg text-vedama-gold mr-4">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-semibold mb-2">Verified Title Deeds</h4>
                    <p className="text-white/70 text-sm">Every property on our platform goes through rigorous due diligence and comes with a ready title deed.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-vedama-gold/20 p-3 rounded-lg text-vedama-gold mr-4">
                    <HandCoins size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-semibold mb-2">Flexible Payment Plans</h4>
                    <p className="text-white/70 text-sm">We offer customized payment options, allowing you to pay in installments that fit your financial capabilities.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-vedama-gold/20 p-3 rounded-lg text-vedama-gold mr-4">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-heading font-semibold mb-2">High ROI Locations</h4>
                    <p className="text-white/70 text-sm">Our experts select properties in high-growth areas ensuring significant capital appreciation over time.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-vedama-gold rounded-2xl transform translate-x-4 translate-y-4 opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973" 
                alt="Happy family outside new home" 
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI MARKETING COPILOT PANEL */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-vedama-gold/10 text-vedama-gold px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
              <Sparkles size={14} /> AI Marketing Engine
            </div>
            <h2 className="section-title mb-4">Vedama AI Marketing Copilot</h2>
            <p className="section-subtitle mx-auto">Select a property and generate high-converting promotional copies with hashtags for social media and WhatsApp campaigns instantly.</p>
          </div>

          <div className="bg-surface-bg border border-surface-border rounded-3xl p-8 shadow-card grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Control Form */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-heading font-bold text-text-primary">Ad Copy Customizer</h3>
                
                <div>
                  <label className="label">Select Property Listing</label>
                  <select 
                    value={selectedPropertyId} 
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="input-field mt-1"
                  >
                    {mockProperties.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({formatCurrency(p.pricePerPlot)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Choose Marketing Channel</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {[
                      { id: 'facebook', label: 'Facebook', icon: <Facebook size={14} /> },
                      { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
                      { id: 'sms', label: 'Bulk SMS', icon: <PhoneCall size={14} /> },
                      { id: 'whatsapp', label: 'WhatsApp', icon: <Sparkles size={14} /> }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setPlatform(btn.id as any)}
                        className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-1 font-bold text-xs transition-all ${
                          platform === btn.id 
                            ? 'bg-vedama-emerald border-vedama-emerald text-white shadow-md' 
                            : 'bg-white border-surface-border text-text-secondary hover:bg-surface-hover'
                        }`}
                      >
                        {btn.icon}
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAd}
                disabled={isGenerating}
                className="w-full btn-gold py-3.5 !rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles size={16} />
                {isGenerating ? 'Writing Copy...' : 'Generate High-Converting Ad Copy'}
              </button>
            </div>

            {/* Response Display Box */}
            <div className="bg-white border border-surface-border rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-surface-border mb-4">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">AI Copilot Generated Text</span>
                  {generatedAd && (
                    <button 
                      onClick={handleCopyToClipboard}
                      className="text-xs text-vedama-emerald hover:text-vedama-gold font-bold flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  )}
                </div>

                {generatedAd ? (
                  <pre className="text-xs text-text-primary whitespace-pre-wrap font-sans leading-relaxed max-h-[320px] overflow-y-auto pr-2">
                    {generatedAd}
                  </pre>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-text-muted">
                    <Sparkles size={36} className="text-vedama-gold/40 mb-3 animate-pulse" />
                    <p className="text-xs font-semibold">Your generated marketing copy will appear here.</p>
                    <p className="text-[10px] max-w-[280px] mt-1">Select a property and click Generate to run the AI marketing ad writer.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Directors Section */}
      <section className="py-24 bg-surface-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Our Leadership</h2>
            <p className="section-subtitle mx-auto">Meet the visionary team driving Vedama's mission forward.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockDirectors.map((director, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
                <div className="h-64 overflow-hidden flex items-center justify-center bg-surface-bg relative">
                  {director.image.startsWith('http') ? (
                    <img 
                      src={director.image} 
                      alt={director.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale hover:grayscale-0" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-vedama-emerald-dark to-vedama-emerald flex flex-col items-center justify-center text-center p-6 relative group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C9A14A_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <div className="text-7xl select-none filter drop-shadow-md mb-2">{director.image}</div>
                      <div className="text-[10px] text-vedama-gold font-bold uppercase tracking-widest border border-vedama-gold/20 px-2.5 py-0.5 rounded-full bg-black/20">{director.badge || 'Director'}</div>
                    </div>
                  )}
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-1">{director.name}</h3>
                  <p className="text-vedama-gold text-sm font-semibold mb-4 uppercase tracking-wider">{director.title}</p>
                  <p className="text-text-secondary text-sm">{director.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Ready to make your investment?</h2>
          <p className="text-lg text-text-secondary mb-10">Create an account today to browse full details, negotiate prices, and manage your property portfolio.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="btn-primary text-lg !rounded-full shadow-md">Create Account</Link>
            <Link to="/properties" className="btn-secondary text-lg !rounded-full">Browse Properties</Link>
          </div>
        </div>
      </section>

      <PublicFooter />

      {/* FLOATING AI ASSISTANT CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-vedama-emerald hover:bg-vedama-emerald-dark text-white rounded-full flex items-center justify-center shadow-card-lg hover:shadow-2xl border-2 border-vedama-gold transition-all"
          >
            <MessageSquare size={26} />
          </button>
        ) : (
          <div className="w-80 md:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="bg-vedama-emerald text-white p-4 flex justify-between items-center border-b border-vedama-gold">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-vedama-gold/20 flex items-center justify-center text-vedama-gold font-bold">V</div>
                  <div className="w-2.5 h-2.5 bg-status-success rounded-full absolute bottom-0 right-0 border-2 border-vedama-emerald"></div>
                </div>
                <div>
                  <div className="font-heading font-bold text-sm">Vedama AI Advisor</div>
                  <div className="text-[10px] text-white/70">Online · Powered by Vedama AI</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>

            {/* Messages Body */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-surface-bg flex flex-col">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'bot' 
                      ? 'bg-white text-text-primary self-start shadow-sm border border-surface-border rounded-tl-none' 
                      : 'bg-vedama-emerald text-white self-end rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Quick Click Queries */}
            <div className="px-4 py-2 bg-white border-t border-surface-border flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {[
                "What is the buying protocol?",
                "Flexible installments?",
                "Malindi Beach Plots?",
                "How does bank link work?"
              ].map((query, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(query)}
                  className="px-2.5 py-1.5 bg-surface-bg border border-surface-border rounded-full text-[10px] font-semibold text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-surface-border flex gap-2 items-center"
            >
              <input
                type="text"
                className="flex-grow pl-3 pr-2 py-2 bg-surface-bg border-none rounded-xl text-xs focus:outline-none"
                placeholder="Type your investment query..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-8 h-8 rounded-xl bg-vedama-emerald hover:bg-vedama-emerald-dark text-white flex items-center justify-center transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
