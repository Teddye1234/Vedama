import React, { useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import PropertyCard from '../components/PropertyCard';
import { mockProperties } from '../lib/mockData';
import { Search, Filter } from 'lucide-react';

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProperties = mockProperties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <div className="bg-vedama-emerald pb-12">
        <PublicNavbar />
        <div className="pt-32 pb-12 px-4 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Our Properties</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Discover prime real estate opportunities tailored for your investment goals.</p>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-border mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Search by location or title..." 
              className="input-field pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Filter className="text-text-muted hidden md:block" size={20} />
            <select 
              className="input-field py-3 pr-10 appearance-none bg-white w-full md:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="selling">Selling Fast</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex justify-between items-center text-sm text-text-secondary">
          <span>Showing <strong>{filteredProperties.length}</strong> properties</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-surface-border">
            <div className="text-text-muted mb-4">No properties found matching your criteria.</div>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
