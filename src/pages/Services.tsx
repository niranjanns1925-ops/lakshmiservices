import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Search, Loader2, IndianRupee } from 'lucide-react';
import { TiltCard } from '../components/ui/TiltCard';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  requiredDocuments: string[];
  active: boolean;
  category: string;
  customFields?: { name: string; type: 'text' | 'number' | 'date'; required: boolean; label: string }[];
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() } as Service);
        });
        
        // Mock data if Firestore is empty (for preview purposes)
        if (servicesData.length === 0) {
          servicesData.push(
            { id: '1', title: 'PAN Card Application', description: 'Apply for a new Permanent Account Number.', price: 200, requiredDocuments: ['Aadhaar Card', 'Passport Photo', 'Signature'], active: true, category: 'Identity' },
            { id: '2', title: 'Community Certificate', description: 'Apply for BC/MBC/SC/ST Community Certificate.', price: 150, requiredDocuments: ['Aadhaar', 'Ration Card', 'TC / Parent Certificate', 'Photo'], active: true, category: 'Revenue' },
            { id: '3', title: 'Income Certificate', description: 'Get income certificate for scholarships and schemes.', price: 100, requiredDocuments: ['Aadhaar', 'Salary Slip/Affidavit', 'Ration Card'], active: true, category: 'Revenue' }
          );
        }
        
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-Sevai Services</h1>
          <p className="text-gray-500 mt-2">Browse and apply for government services.</p>
        </div>
        
        <div className="mt-4 md:mt-0 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full md:w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className="h-full">
              <TiltCard>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {service.category || 'General'}
                      </span>
                      <div className="flex items-center text-primary-700 font-semibold bg-primary-50 px-2 py-1 rounded">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {service.price}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Required Documents:</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                        {service.requiredDocuments.slice(0, 3).map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                        {service.requiredDocuments.length > 3 && (
                          <li className="text-gray-400 italic">+{service.requiredDocuments.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                    <Link to={`/apply/${service.id}`}>
                      <Button className="w-full">Apply Now</Button>
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
          {filteredServices.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-gray-500 text-lg">No services found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
