import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Session } from "@/entities/Session";
import { Attendance } from "@/entities/Attendance";
import { Event } from "@/entities/Event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  UserCheck,
  BarChart3,
  Clock,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const BirthdayWishes = () => {
  const [birthdayStudents, setBirthdayStudents] = useState([]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const allUsers = await User.list();
        const currentMonth = new Date().getMonth();
        
        const students = allUsers
          .filter(user => user.birth_date && new Date(user.birth_date).getMonth() === currentMonth)
          .sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

        setBirthdayStudents(students);
      } catch (error) {
        console.error("Erro ao buscar aniversariantes:", error);
      }
    };
    fetchBirthdays();
  }, []);

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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    totalEvents: 0,
    averagePoints: 0,
    monthlyAttendance: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas
      const allUsers = await User.list();
      const students = allUsers.filter(u => u.profile_type !== 'admin');
      const sessions = await Session.list();
      const events = await Event.list();
      
      // Calcular média de pontos do ano atual
      const currentYear = new Date().getFullYear();
      const averagePoints = students.length > 0 
        ? students.reduce((sum, student) => sum + (student.points_by_year?.[currentYear] || 0), 0) / students.length
        : 0;

      // Buscar presenças do mês atual de forma otimizada
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthAttendances = await Attendance.filter({
        status: 'present',
        created_date: {
          '$gte': startOfMonth.toISOString(),
          '$lte': endOfMonth.toISOString(),
        }
      });

      setStats({
        totalStudents: students.length,
        totalSessions: sessions.length,
        totalEvents: events.length,
        averagePoints: Math.round(averagePoints),
        monthlyAttendance: monthAttendances.length
      });

      // Próximas sessões
      const upcoming = sessions
        .filter(session => new Date(session.date_time) > now)
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .slice(0, 5);
      setRecentSessions(upcoming);

      // Próximos eventos
      const upcomingEvs = events
        .filter(event => new Date(event.date_time) > now)
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .slice(0, 3);
      setUpcomingEvents(upcomingEvs);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-blue-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-blue-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Visão geral do Coletivo AYA</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última atualização</p>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(), "dd/MM/yyyy • HH:mm", { locale: ptBR })}
          </p>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to={createPageUrl("StudentsManagement")}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Users className="w-5 h-5" />
                  Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
                <p className="text-blue-100 text-sm">Total ativo</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to={createPageUrl("SessionsManagement")}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-5 h-5" />
                  Treinos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalSessions}</p>
                <p className="text-green-100 text-sm">Agendados</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to={createPageUrl("EventsManagement")}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Trophy className="w-5 h-5" />
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalEvents}</p>
                <p className="text-purple-100 text-sm">Criados</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white/90">
                <TrendingUp className="w-5 h-5" />
                Média Pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.averagePoints}</p>
              <p className="text-amber-100 text-sm">Por aluno</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to={createPageUrl("AttendanceManagement")}>
            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <UserCheck className="w-5 h-5" />
                  Presenças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.monthlyAttendance}</p>
                <p className="text-teal-100 text-sm">Este mês</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Seção Principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Próximos Treinos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Próximos Treinos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900">{session.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        {format(new Date(session.date_time), "dd/MM • HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {session.level}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum treino agendado</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximos Eventos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-700">
                        {format(new Date(event.date_time), "dd/MM • HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Responsável: {event.host}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum evento próximo</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Aniversariantes do Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <BirthdayWishes />
        </motion.div>
      </div>
    </div>
  );
}