import React, { useState, useEffect } from 'react';
import { Session } from '@/entities/Session';
import { Teacher } from '@/entities/Teacher';
import { Location } from '@/entities/Location';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sessionsData, teachersData, locationsData] = await Promise.all([
          Session.filter({'date_time': {'$gte': new Date().toISOString()}}, 'date_time'),
          Teacher.list(),
          Location.list()
        ]);
        setSessions(sessionsData);
        setTeachers(teachersData);
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
      <Card className="shadow-lg border-amber-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-amber-800">
            <Calendar className="w-6 h-6" />
            Agenda de Treinos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="grid gap-4">
              {sessions.map((session) => {
                const teacher = teachers.find(t => t.id === session.teacher_id);
                const location = locations.find(l => l.id === session.location_id);
                
                return (
                  <div key={session.id} className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700 font-medium">
                              {format(new Date(session.date_time), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            <span className="text-gray-700">{location?.name || 'Local não definido'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-600" />
                            <span className="text-gray-700">{teacher?.nickname || teacher?.name || 'Professor não definido'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300 capitalize">
                        {session.level}
                      </Badge>
                    </div>
                    
                    {session.notes && (
                      <div className="mt-4 p-3 bg-amber-100 rounded-md">
                        <h4 className="font-medium text-amber-800 mb-1">Observações:</h4>
                        <p className="text-amber-700 text-sm">{session.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum treino agendado no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}