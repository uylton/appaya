import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Session } from "@/entities/Session";
import { Location } from "@/entities/Location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Gift, Trophy, Star, Loader2, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BirthdayWishes = () => {
  const [birthdayStudents, setBirthdayStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      setIsLoading(true);
      try {
        const allUsers = await User.list();
        const today = new Date();
        const currentMonth = today.getMonth();
        
        const students = allUsers
          .filter(user => {
            if (!user.birth_date) return false;
            const birthDate = new Date(user.birth_date);
            return birthDate.getMonth() === currentMonth;
          })
          .sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

        setBirthdayStudents(students);
      } catch (error) {
        console.error("Erro ao buscar aniversariantes:", error);
      }
      setIsLoading(false);
    };
    fetchBirthdays();
  }, []);

  if (isLoading) {
      return (
          <Card className="shadow-xl border-pink-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-pink-800"><Gift className="w-6 h-6" />Aniversariantes do Mês</CardTitle></CardHeader>
              <CardContent><div className="h-24 bg-pink-100 rounded-lg animate-pulse"></div></CardContent>
          </Card>
      );
  }
  
  if (birthdayStudents.length === 0) return null;

  return (
    <Card className="shadow-xl border-pink-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Gift className="w-6 h-6" />
          Aniversariantes de {format(new Date(), 'MMMM', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {birthdayStudents.map(student => (
            <div key={student.id} className="text-center p-3 bg-pink-50 rounded-lg">
              <img src={student.photo_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=ec4899&color=fff`} alt={student.full_name} className="w-12 h-12 rounded-full mx-auto mb-2" />
              <p className="font-semibold text-sm">{student.nickname || student.full_name}</p>
              <p className="text-xs text-pink-600 font-bold">Dia {format(new Date(student.birth_date), 'dd', {timeZone: 'UTC'})}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const FeaturedStudents = () => {
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const allUsers = await User.list();
      
      const students = allUsers
        .filter(user => user.profile_type !== 'admin')
        .map(user => ({
          ...user,
          yearPoints: user.points_by_year?.[currentYear] || 0
        }))
        .filter(user => user.yearPoints > 0)
        .sort((a, b) => b.yearPoints - a.yearPoints);

      const topThree = students.slice(0, 3);
      if (topThree.length < 1) {
        setHighlights([]);
        setIsLoading(false);
        return;
      }
      const thirdPlacePoints = topThree[topThree.length - 1].yearPoints;
      
      const finalHighlights = students.filter(user => user.yearPoints >= thirdPlacePoints);

      setHighlights(finalHighlights);
    } catch (error) {
      console.error("Erro ao buscar destaques:", error);
      setHighlights([]);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl border-blue-200">
        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Trophy className="w-5 h-5" />Alunos em Destaque</CardTitle></CardHeader>
        <CardContent><div className="h-24 bg-blue-100 rounded-lg animate-pulse"></div></CardContent>
      </Card>
    );
  }

  if (highlights.length === 0) {
    return (
      <Card className="shadow-xl border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Trophy className="w-5 h-5" />
            Alunos em Destaque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum destaque ainda este mês. Bora treinar!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Trophy className="w-5 h-5" />
          Alunos em Destaque - {format(new Date(), 'MMMM', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((student, index) => (
            <div key={student.id} className="text-center p-4 bg-blue-50 rounded-lg shadow-sm">
              <img 
                src={student.photo_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=3b82f6&color=fff`} 
                alt={student.full_name} 
                className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-blue-400" 
              />
              <p className="font-semibold text-blue-800">{student.nickname || student.full_name}</p>
              <Badge className="mt-1 bg-blue-600 text-white">
                {student.yearPoints} Pontos
              </Badge>
              {index < 3 && (
                <div className="text-xs text-blue-600 mt-1">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {index + 1}º Lugar
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SessionDetailsModal = ({ session, isOpen, onClose, locations }) => {
  if (!session) return null;
  
  const location = locations.find(l => l.id === session.location_id);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Detalhes do Treino
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{session.title}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{format(new Date(session.date_time), "dd/MM/yyyy • HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{location?.name || 'Local não definido'}</span>
            </div>
            <div>
              <span className="font-medium">Nível: </span>
              <Badge variant="outline" className="text-xs capitalize">
                {session.level}
              </Badge>
            </div>
            {session.notes && (
              <div>
                <span className="font-medium">Observações: </span>
                <p className="text-gray-600 mt-1">{session.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, sessions, locationsList] = await Promise.all([
        User.me(),
        Session.filter({'date_time': {'$gte': new Date().toISOString()}}, 'date_time', 5),
        Location.list()
      ]);
      
      setUser(currentUser);
      setUpcomingSessions(sessions);
      setLocations(locationsList);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 animate-pulse space-y-6">
        <div className="h-8 bg-amber-200 rounded w-64 mx-auto"></div>
        <div className="h-48 bg-amber-100 rounded-xl"></div>
        <div className="h-48 bg-amber-100 rounded-xl"></div>
        <div className="h-48 bg-amber-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Axé, {user?.nickname || user?.full_name}! 🥊
        </h1>
        <p className="text-amber-600 text-lg">
          Bem-vindo ao seu painel de capoeirista
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-xl border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Calendar className="w-5 h-5" />
              Próximos Treinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="grid gap-4">
                {upcomingSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900">{session.title}</h4>
                      <p className="text-sm text-amber-600">
                        {format(new Date(session.date_time), "dd/MM • HH:mm", { locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {session.level}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => handleViewDetails(session)}>
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum treino agendado no momento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-xl border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Trophy className="w-5 h-5" />
              Eventos e Rodas
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum evento especial agendado. Fique de olho!</p>
              </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FeaturedStudents />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BirthdayWishes />
      </motion.div>

      <SessionDetailsModal 
        session={selectedSession} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        locations={locations}
      />
    </div>
  );
}