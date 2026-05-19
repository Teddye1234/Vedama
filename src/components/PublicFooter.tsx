import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './ui/Logo';

export default function PublicFooter() {
  return (
    <footer className="bg-vedama-emerald-dark text-white pt-16 pb-8 border-t-[6px] border-vedama-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & About */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <Logo variant="light" size="lg" />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Vedama Company Limited is Kenya's premier land selling and property management firm. We specialize in providing verified, affordable, and strategically located properties to ensure your investment grows.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-vedama-gold hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-vedama-gold hover:text-white transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-vedama-gold hover:text-white transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-vedama-gold hover:text-white transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-heading font-bold mb-6 text-vedama-gold">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/properties" className="text-white/70 hover:text-vedama-gold transition-colors">All Properties</Link></li>
              <li><a href="/#about" className="text-white/70 hover:text-vedama-gold transition-colors">About Us</a></li>
              <li><Link to="/contact" className="text-white/70 hover:text-vedama-gold transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="text-white/70 hover:text-vedama-gold transition-colors">Client Portal</Link></li>
              <li><Link to="/login" className="text-white/70 hover:text-vedama-gold transition-colors">Landlord Portal</Link></li>
              <li><a href="#" className="text-white/70 hover:text-vedama-gold transition-colors">Careers</a></li>
              <li><a href="#" className="text-white/70 hover:text-vedama-gold transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-heading font-bold mb-6 text-vedama-gold">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 text-vedama-gold shrink-0 mt-0.5" />
                <span className="text-white/70">P.O. Box 14222 - 00800<br/>Westlands - Nairobi, Kenya</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-3 text-vedama-gold shrink-0" />
                <span className="text-white/70">0722245928<br/>0720-809 800</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-3 text-vedama-gold shrink-0" />
                <span className="text-white/70">vedamapropertymgt@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-heading font-bold mb-6 text-vedama-gold">Newsletter</h4>
            <p className="text-white/70 text-sm mb-4">Subscribe to our newsletter to receive the latest updates on new properties and exclusive offers.</p>
            <form className="flex flex-col space-y-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-3 rounded-button focus:outline-none focus:border-vedama-gold text-sm"
              />
              <button type="button" className="btn-gold py-3 text-sm">Subscribe</button>
            </form>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Vedama Company Limited. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-white/50 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
