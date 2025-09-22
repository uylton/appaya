import React, { useState, useEffect } from 'react';
import { Event } from '@/entities/Event';
import { Location } from '@/entities/Location';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, User, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventsData, locationsData] = await Promise.all([
          Event.filter({'date_time': {'$gte': new Date().toISOString()}}, 'date_time'),
          Location.list()
        ]);
        setEvents(eventsData);
        setLocations(locationsData);
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-purple-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
            <Trophy className="w-6 h-6" />
            Eventos e Rodas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="grid gap-6">
              {events.map((event) => {
                const location = locations.find(l => l.id === event.location_id);
                
                return (
                  <div key={event.id} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="text-purple-700 font-medium">
                              {format(new Date(event.date_time), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-700">{location?.name || 'Local não definido'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-700">Responsável: {event.host}</span>
                          </div>
                        </div>
                      </div>
                      {event.price && (
                        <Badge className="bg-purple-600 text-white">
                          R$ {event.price}
                        </Badge>
                      )}
                    </div>
                    
                    {event.description && (
                      <div className="mt-4 p-4 bg-purple-100 rounded-md">
                        <h4 className="font-medium text-purple-800 mb-2">Sobre o Evento:</h4>
                        <p className="text-purple-700">{event.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
 