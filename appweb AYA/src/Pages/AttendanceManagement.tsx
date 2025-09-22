import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2, Save, XCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Session } from '@/entities/Session';
import { User } from '@/entities/User';
import { Location } from '@/entities/Location';
import { Attendance } from '@/entities/Attendance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AttendanceManagementPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentsForSession, setStudentsForSession] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
        const [locs, students] = await Promise.all([
          Location.list(), 
          User.filter({profile_type: 'student'})
        ]);
        setLocations(locs);
        setAllStudents(students);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetchSessionsForDate(selectedDate);
  }, [selectedDate]);

  const fetchSessionsForDate = async (date) => {
    setIsLoading(true);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const sessionsData = await Session.filter({
      date_time: {
        '$gte': startOfDay.toISOString(),
        '$lte': endOfDay.toISOString()
      }
    });
    setSessions(sessionsData);
    setSelectedSession(null);
    setStudentsForSession([]);
    setAttendanceData({});
    setIsLoading(false);
  };

  const handleSessionSelect = async (session) => {
    setSelectedSession(session);
    setIsLoading(true);

    const location = locations.find(l => l.id === session.location_id);
    const locationName = location?.name;
    
    const filteredStudents = allStudents.filter(s => s.training_location === locationName);
    setStudentsForSession(filteredStudents);

    const existingAttendance = await Attendance.filter({ session_id: session.id });
    const attendanceMap = existingAttendance.reduce((acc, att) => {
        acc[att.student_id] = att.status;
        return acc;
    }, {});
    setAttendanceData(attendanceMap);
    
    setIsLoading(false);
  };
  
  const setStudentStatus = (studentId, status) => {
      setAttendanceData(prev => ({
        ...prev, 
        [studentId]: status
      }));
  }

  const handleSaveAttendance = async () => {
      if(!selectedSession) return;
      setIsSaving(true);
      
      try {
        const existingRecords = await Attendance.filter({session_id: selectedSession.id});
        
        const operations = studentsForSession.map(student => {
            const studentId = student.id;
            const newStatus = attendanceData[studentId];
            const existing = existingRecords.find(r => r.student_id === studentId);
            
            if (existing && newStatus && existing.status !== newStatus) {
                return Attendance.update(existing.id, {status: newStatus});
            } else if (existing && !newStatus) {
                return Attendance.delete(existing.id);
            } else if (!existing && newStatus) {
                const currentYear = new Date().getFullYear();
                const currentPoints = student.points_by_year?.[currentYear] || 0;
                
                if (newStatus === 'present') {
                  User.update(studentId, {
                    points_by_year: {
                      ...student.points_by_year,
                      [currentYear]: currentPoints + 1
                    }
                  });
                }
                
                return Attendance.create({
                    session_id: selectedSession.id,
                    student_id: studentId,
                    status: newStatus
                });
            }
            return Promise.resolve();
        });

        await Promise.all(operations);
        alert('Presenças salvas com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar presenças:', error);
        alert('Erro ao salvar presenças.');
      }
      
      setIsSaving(false);
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-teal-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-teal-800">
            <UserCheck className="w-6 h-6" />
            Gerenciamento de Presenças
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8">
          {/* Coluna 1: Calendário e Sessões */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">1. Selecione a Data e o Treino</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            {isLoading && sessions.length === 0 && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
            {sessions.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-600">Treinos do dia:</h4>
                    {sessions.map(s => (
                        <Button 
                          key={s.id} 
                          variant={selectedSession?.id === s.id ? 'default' : 'outline'}
                          className="w-full justify-start text-left"
                          onClick={() => handleSessionSelect(s)}
                        >
                            <div>
                              <div className="font-semibold">{s.title}</div>
                              <div className="text-xs opacity-75">
                                {format(new Date(s.date_time), 'HH:mm')} - {locations.find(l => l.id === s.location_id)?.name}
                              </div>
                            </div>
                        </Button>
                    ))}
                </div>
            )}
             {sessions.length === 0 && !isLoading && <p className="text-sm text-gray-500 text-center py-4">Nenhum treino neste dia.</p>}
          </div>

          {/* Coluna 2 e 3: Lista de Alunos */}
          <div className="md:col-span-2">
            {selectedSession ? (
                <>
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-700">2. Marque a Presença</h3>
                        <p className="text-sm text-gray-500">
                          Treino: {selectedSession.title} • Local: {locations.find(l=> l.id === selectedSession.location_id)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Alunos cadastrados neste local: {studentsForSession.length}
                        </p>
                    </div>
                    <Button onClick={handleSaveAttendance} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} 
                        Salvar Presenças
                    </Button>
                 </div>
                 {isLoading ? (
                   <div className="flex justify-center items-center h-48">
                     <Loader2 className="w-8 h-8 animate-spin text-teal-600"/>
                   </div>
                 ) : studentsForSession.length > 0 ? (
                     <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                         {studentsForSession.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <img 
                                      src={student.photo_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=random`}
                                      alt={student.full_name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                      <p className="font-medium">{student.nickname || student.full_name}</p>
                                      <p className="text-sm text-gray-500">{student.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={attendanceData[student.id] === 'present' ? 'default' : 'outline'}
                                      className={attendanceData[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                      onClick={() => setStudentStatus(student.id, 'present')}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1"/> P
                                    </Button>
                                     <Button
                                      size="sm"
                                      variant={attendanceData[student.id] === 'absent' ? 'destructive' : 'outline'}
                                      onClick={() => setStudentStatus(student.id, 'absent')}
                                    >
                                        <XCircle className="w-4 h-4 mr-1"/> F
                                    </Button>
                                </div>
                            </div>
                         ))}
                     </div>
                 ) : (
                   <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                     <div className="text-center">
                       <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                       <p className="text-gray-500">Nenhum aluno cadastrado para este local de treino.</p>
                       <p className="text-sm text-gray-400 mt-2">
                         Certifique-se de que os alunos tenham o local de treino definido em seus perfis.
                       </p>
                     </div>
                   </div>
                 )}
                </>
            ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Selecione um treino para ver a lista de alunos.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}