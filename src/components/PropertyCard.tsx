import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Property } from '../types';
import { formatCurrency } from '../lib/utils';
import Badge, { statusToBadge } from './ui/Badge';

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="card group overflow-hidden flex flex-col h-full">
      <div className="relative h-60 overflow-hidden">
        <img 
          src={property.images[0]} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-4 right-4">
          <Badge variant={statusToBadge(property.status)} className="shadow-sm backdrop-blur-md bg-white/90">
            {property.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        {property.featured && (
          <div className="absolute top-4 left-4">
            <Badge variant="gold" className="shadow-sm backdrop-blur-md bg-vedama-gold text-white">
              FEATURED
            </Badge>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-heading font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-vedama-emerald transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center text-text-muted text-sm mb-4">
          <MapPin size={16} className="mr-1" />
          <span className="truncate">{property.location}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-surface-bg p-3 rounded-lg">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Area</span>
            <span className="font-semibold text-text-primary">{property.totalAcres} Acres</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs uppercase tracking-wider mb-1">Availability</span>
            <span className="font-semibold text-text-primary">
              {property.totalPlots - property.soldPlots} / {property.totalPlots} Plots
            </span>
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted uppercase font-medium">Starting From</span>
            <span className="text-lg font-bold text-vedama-emerald">{formatCurrency(property.pricePerPlot)}</span>
          </div>
          <Link to={`/properties/${property.id}`} className="btn-secondary px-4 py-2 text-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
