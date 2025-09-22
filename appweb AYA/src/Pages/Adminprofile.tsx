import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/entities/User';
import { Grade } from '@/entities/Grade';
import { AuditLog } from '@/entities/AuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trophy, Target, Star, Loader2, Save, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const MultiColorCordaSVG = ({ colors = ['#808080'] }) => {
  const strokeWidth = 6;
  const gap = 2;

  const paths = colors.map((color, index) => {
    const radius = 30 - index * (strokeWidth + gap);
    if (radius <= 0) return null;

    return (
      <path
        key={index}
        d={`M 50,${50 - radius} A ${radius},${radius} 0 1,1 49.99,${50 - radius}`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 50 50`}
          to={`${index % 2 === 0 ? 360 : -360} 50 50`}
          dur={`${2 + index * 0.5}s`}
          repeatCount="indefinite"
        />
      </path>
    );
  }).filter(Boolean);

  return (
    <svg width="64" height="64" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {paths}
    </svg>
  );
};

export default function AdminProfilePage() {
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [nextGrade, setNextGrade] = useState(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trainingLocation, setTrainingLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const trainingLocations = ["Casa de Cultura-O.P", "E.E.Daura.C.Neto", "E.E.Antonio Pereira"];

  const loadProfileData = useCallback(async (studentId) => {
    setIsLoading(true);
    try {
      const studentData = await User.get(studentId);
      setStudent(studentData);
      setCurrentPoints(studentData.points_by_year?.[currentYear] || 0);
      setIsAdmin(studentData.profile_type === 'admin');
      setTrainingLocation(studentData.training_location || '');

      const allGrades = await Grade.list('order');
      setGrades(allGrades);

      if (studentData.current_grade_id) {
        const grade = allGrades.find(g => g.id === studentData.current_grade_id);
        setSelectedGrade(grade);
        
        const currentGradeIndex = allGrades.findIndex(g => g.id === studentData.current_grade_id);
        if (currentGradeIndex !== -1 && currentGradeIndex + 1 < allGrades.length) {
          setNextGrade(allGrades[currentGradeIndex + 1]);
        } else {
          setNextGrade(null);
        }
      } else {
        setSelectedGrade(allGrades.find(g => g.order === 0));
        setNextGrade(allGrades.find(g => g.order === 1));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
    }
    setIsLoading(false);
  }, [currentYear]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studentId = params.get('id');
    if (studentId) {
      loadProfileData(studentId);
    }
  }, [location.search, loadProfileData]);
  
  const handleGradeChange = (gradeId) => {
    const newGrade = grades.find(g => g.id === gradeId);
    setSelectedGrade(newGrade);

    // Atualiza o próximo objetivo automaticamente
    if (newGrade) {
      const nextGradeIndex = grades.findIndex(g => g.order === newGrade.order) + 1;
      if (nextGradeIndex < grades.length) {
        setNextGrade(grades[nextGradeIndex]);
      } else {
        setNextGrade(null); // Atingiu a graduação máxima
      }
    }
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedData = {};
      const logEntries = [];
      const adminUser = await User.me();

      // Graduação
      if (selectedGrade && student && selectedGrade.id !== student.current_grade_id) {
        updatedData.current_grade_id = selectedGrade.id;
        logEntries.push(AuditLog.create({
          target_user_id: student.id,
          field: 'graduacao',
          old_value: student.current_grade_id || 'Nenhuma',
          new_value: selectedGrade.id,
          reason: `Alteração de graduação por ${adminUser.email}`
        }));
      } else if (!selectedGrade && student?.current_grade_id) {
        updatedData.current_grade_id = null;
        logEntries.push(AuditLog.create({
          target_user_id: student.id,
          field: 'graduacao',
          old_value: student.current_grade_id,
          new_value: 'Nenhuma',
          reason: `Remoção de graduação por ${adminUser.email}`
        }));
      }

      // Pontos
      const studentPoints = student?.points_by_year?.[currentYear] || 0;
      const newCurrentPoints = Number(currentPoints);
      if (newCurrentPoints !== studentPoints) {
        updatedData.points_by_year = {
          ...(student?.points_by_year || {}),
          [currentYear]: newCurrentPoints
        };
        if (student) {
          logEntries.push(AuditLog.create({
            target_user_id: student.id,
            field: 'pontos',
            old_value: String(studentPoints),
            new_value: String(newCurrentPoints),
            reason: `Alteração de pontos por ${adminUser.email}`
          }));
        }
      }

      // Tipo de perfil (Admin/Aluno)
      const newProfileType = isAdmin ? 'admin' : 'student';
      if (student && student.profile_type !== newProfileType) {
        updatedData.profile_type = newProfileType;
        logEntries.push(AuditLog.create({
          target_user_id: student.id,
          field: 'profile_type',
          old_value: student.profile_type || 'student',
          new_value: newProfileType,
          reason: `Alteração de perfil por ${adminUser.email}`
        }));
      }

      // Local de treino
      if (student && student.training_location !== trainingLocation) {
        updatedData.training_location = trainingLocation;
        logEntries.push(AuditLog.create({
          target_user_id: student.id,
          field: 'training_location',
          old_value: student.training_location || 'Nenhum',
          new_value: trainingLocation,
          reason: `Alteração de local de treino por ${adminUser.email}`
        }));
      }

      if (Object.keys(updatedData).length > 0 && student) {
        await User.update(student.id, updatedData);
        await Promise.all(logEntries);
      }
      
      alert('Alterações salvas com sucesso!');
      if (student) {
        loadProfileData(student.id); 
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      alert('Falha ao salvar alterações.');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Editando Perfil de {student?.nickname || student?.full_name}
        </h1>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Graduação Atual */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-200 shadow-xl h-full">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-amber-800"><Trophy className="w-5 h-5" />Graduação Atual</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="flex justify-center items-center h-20">
                <MultiColorCordaSVG colors={selectedGrade?.colors || ['#808080']} />
              </div>
              <Select onValueChange={handleGradeChange} value={selectedGrade?.id || ''}>
                <SelectTrigger><SelectValue placeholder="Selecione a Graduação" /></SelectTrigger>
                <SelectContent>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pontos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-xl h-full">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-green-800"><Target className="w-5 h-5" />Pontos {currentYear}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points">Pontos Atuais</Label>
                <Input
                  id="points"
                  type="number"
                  value={currentPoints}
                  onChange={(e) => setCurrentPoints(e.target.value)}
                  className="text-2xl font-bold"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximo Objetivo */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-xl h-full">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-purple-800"><Star className="w-5 h-5" />Próximo Objetivo</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-center">
              {nextGrade ? (
                <>
                   <div className="flex justify-center items-center h-20 opacity-70">
                     <MultiColorCordaSVG colors={nextGrade.colors} />
                   </div>
                   <h4 className="font-semibold text-gray-900 text-lg">{nextGrade.name}</h4>
                </>
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <p>Graduação máxima alcançada!</p>
                  <Trophy className="w-8 h-8 mx-auto mt-2 text-amber-500" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Configurações de Admin e Local */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-white to-red-50 border-red-200 shadow-xl h-full">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-red-800"><Shield className="w-5 h-5" />Administração</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-switch" className="text-sm">Tornar Admin</Label>
                <Switch
                  id="admin-switch"
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local de Treino</Label>
                <Select value={trainingLocation} onValueChange={setTrainingLocation}>
                  <SelectTrigger><SelectValue placeholder="Selecione o local" /></SelectTrigger>
                  <SelectContent>
                    {trainingLocations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}