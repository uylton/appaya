import React, { useState, useEffect } from 'react';
import { Location } from '@/entities/Location';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, Loader2, Phone, MapPin as LocationIcon } from 'lucide-react';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const locationsList = await Location.list();
        setLocations(locationsList);
      } catch (e) {
        console.error('Erro ao buscar locais:', e);
      }
      setIsLoading(false);
    };
    fetchLocations();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-blue-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
            <MapPin className="w-6 h-6" />
            Locais de Treino
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locations.map(location => (
                <div key={location.id} className="p-6 bg-gray-50 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {location.photo_url ? (
                        <img 
                          src={location.photo_url}
                          alt={location.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-blue-200 flex items-center justify-center">
                          <LocationIcon className="w-8 h-8 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
                        <div className="flex items-start gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{location.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    {location.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-gray-600">{location.phone}</p>
                      </div>
                    )}
                    
                    {location.notes && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">{location.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum local cadastrado no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}