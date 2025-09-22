import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Grade } from '@/entities/Grade';
import { Attendance } from '@/entities/Attendance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FeaturedStudents() {
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const allAttendances = await Attendance.list();
      const monthAttendances = allAttendances.filter(att => {
        const attDate = new Date(att.created_date);
        return attDate >= startOfMonth && attDate <= endOfMonth && att.status === 'present';
      });

      const pointsPerStudent = monthAttendances.reduce((acc, att) => {
        acc[att.student_id] = (acc[att.student_id] || 0) + (att.points_earned || 1);
        return acc;
      }, {});

      const sortedStudents = Object.entries(pointsPerStudent)
        .map(([studentId, points]) => ({ studentId, points }))
        .sort((a, b) => b.points - a.points);
      
      let topStudents = [];
      if (sortedStudents.length > 0) {
        const thirdPlaceScore = sortedStudents[2]?.points || 0;
        topStudents = sortedStudents.filter(s => s.points >= thirdPlaceScore);
      }
      
      if (topStudents.length > 0) {
          const [users, grades] = await Promise.all([
              User.list(),
              Grade.list()
          ]);
          
          const usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
          const gradesMap = grades.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});

          const highlightDetails = topStudents.map(s => ({
            user: usersMap[s.studentId],
            points: s.points,
            grade: gradesMap[usersMap[s.studentId]?.current_grade_id]
          })).filter(h => h.user);

          setHighlights(highlightDetails);
      }
    } catch (e) {
      console.error("Erro ao buscar destaques:", e);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <Card className="shadow-xl border-amber-200"><CardContent className="p-6 text-center text-gray-500">Carregando destaques...</CardContent></Card>;
  }

  return (
    <Card className="shadow-xl border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Award className="w-6 h-6" />
          Alunos Destaque – {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {highlights.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.map(h => (
              <div key={h.user.id} className="p-4 rounded-lg border bg-white relative group">
                <div className="flex items-center gap-4">
                  <img src={h.user.photo_url || `https://ui-avatars.com/api/?name=${h.user.full_name}&background=random`} alt={h.user.full_name} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold">{h.user.nickname || h.user.full_name}</h4>
                    {h.grade && <Badge style={{ backgroundColor: h.grade.colors[0], color: ['#FFFFFF', '#FFFF00', '#FFA500'].includes(h.grade.colors[0]) ? '#000' : '#FFF' }} className="mt-1 text-xs">{h.grade.name}</Badge>}
                    <p className="text-sm text-amber-700 font-bold mt-2">{h.points} pontos no mês</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ainda não há destaques de pontuação para este mês.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}