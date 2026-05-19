import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Building2, Send } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function ContactPage() {
  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: 'Call Us',
      details: ['Main: 0722245928', 'Cell: 0720-809 800', 'Cell: 0722-245 928'],
      color: 'bg-vedama-gold/10 text-vedama-gold'
    },
    {
      icon: <Mail size={24} />,
      title: 'Email Us',
      details: ['vedamapropertymgt@gmail.com'],
      color: 'bg-vedama-emerald/10 text-vedama-emerald'
    },
    {
      icon: <MapPin size={24} />,
      title: 'Visit Us',
      details: ['P.O. Box 14222 - 00800', 'Westlands - Nairobi, Kenya'],
      color: 'bg-status-info/10 text-status-info'
    },
    {
      icon: <Clock size={24} />,
      title: 'Business Hours',
      details: ['Mon - Fri: 8:00 AM - 5:00 PM', 'Sat: 9:00 AM - 1:00 PM'],
      color: 'bg-status-warning/10 text-status-warning'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <PublicNavbar />
      
      {/* Header */}
      <div className="bg-vedama-emerald pt-32 pb-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Contact Us</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">
            Have questions about our properties or management services? We're here to help you build your future.
          </p>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-surface-border flex items-start gap-4">
                <div className={`p-3 rounded-lg ${item.color} shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-text-primary mb-1">{item.title}</h4>
                  {item.details.map((detail, dIdx) => (
                    <p key={dIdx} className="text-text-secondary text-sm">{detail}</p>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-vedama-gold text-white p-6 rounded-xl shadow-md mt-6">
              <h4 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
                <Building2 size={20} /> Financed by DTB
              </h4>
              <p className="text-white/90 text-sm">
                Diamond Trust Bank is ready to finance clients. Ask us about our partnership and how it can help you secure your property.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-surface-border p-8">
            <h3 className="text-2xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <MessageSquare className="text-vedama-emerald" /> Send us a Message
            </h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" placeholder="john@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Phone Number</label>
                  <input type="tel" className="input-field" placeholder="+254 700 000 000" />
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input-field">
                    <option>Property Inquiry</option>
                    <option>Management Services</option>
                    <option>Site Visit Request</option>
                    <option>Financing Options</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Your Message</label>
                <textarea rows={5} className="input-field resize-none" placeholder="Tell us more about how we can help you..."></textarea>
              </div>

              <button type="submit" className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 px-12">
                <Send size={18} /> Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-surface-border overflow-hidden p-2">
          <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-status-info/5 flex flex-col items-center justify-center text-center p-8">
              <MapPin size={48} className="text-vedama-emerald mb-4 opacity-50" />
              <h4 className="text-xl font-heading font-bold text-text-primary mb-2">Our Office Location</h4>
              <p className="text-text-secondary max-w-md">
                Visit us at our Westlands office for a face-to-face consultation. 
                Our team is ready to welcome you.
              </p>
              <div className="mt-6 flex gap-4">
                <button className="btn-secondary !bg-white">Open in Maps</button>
                <button className="btn-primary">Get Directions</button>
              </div>
            </div>
            {/* Real map could be integrated here */}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
