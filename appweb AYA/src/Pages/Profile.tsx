import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Grade } from "@/entities/Grade";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Target, Star, Loader2, Camera, Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";

const CordaSVG = ({ colors = ['#808080'] }) => {
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

const WhatsAppStylePhotoUpload = ({ user, onPhotoUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ photo_url: file_url });
      onPhotoUpdate();
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto.");
    }
    setIsUploading(false);
  };

  return (
    <div className="profile-box flex flex-col items-center gap-3 mb-6">
      <div 
        className="avatar-wrap relative w-32 h-32 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center shadow-lg cursor-pointer"
        style={{ background: user?.photo_url ? 'transparent' : '#ddd' }}
        title="Clique para trocar a foto"
        onClick={() => document.getElementById('avatar-input').click()}
      >
        {user?.photo_url ? (
          <img 
            src={user.photo_url}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-500">
            ?
          </div>
        )}
        
        <label 
          htmlFor="avatar-input"
          className="camera-btn absolute right-1 bottom-1 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="dot w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </div>
        </label>
        
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={isUploading}
        />
      </div>
      <div className="hint text-sm text-gray-600">Clique no ícone para trocar a foto</div>
    </div>
  );
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [nextGrade, setNextGrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBirthDateForm, setShowBirthDateForm] = useState(false);
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (!currentUser.birth_date) {
        setShowBirthDateForm(true);
      }
      
      const grades = await Grade.list('order');

      if (currentUser.current_grade_id) {
        const grade = grades.find(g => g.id === currentUser.current_grade_id);
        setCurrentGrade(grade);

        const nextGradeIndex = grades.findIndex(g => g.id === currentUser.current_grade_id) + 1;
        if (nextGradeIndex < grades.length) {
          setNextGrade(grades[nextGradeIndex]);
        } else {
          setNextGrade(null);
        }
      } else {
        setCurrentGrade(grades.find(g => g.order === 0));
        setNextGrade(grades.find(g => g.order === 1));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
    }
    setIsLoading(false);
  };

  const handleBirthDateSave = async () => {
    if (!birthDate) {
      alert("Por favor, selecione sua data de nascimento.");
      return;
    }

    try {
      await User.updateMyUserData({ birth_date: birthDate });
      setShowBirthDateForm(false);
      loadProfileData();
    } catch (error) {
      console.error("Erro ao salvar data de nascimento:", error);
      alert("Erro ao salvar data de nascimento.");
    }
  };
  
  const currentYear = new Date().getFullYear();
  const currentPoints = user?.points_by_year?.[currentYear] || 0;
  const progressPercentage = nextGrade ? Math.min((currentPoints / (nextGrade.points_required || 1)) * 100, 100) : 0;
  const pointsToGo = nextGrade ? Math.max(nextGrade.points_required - currentPoints, 0) : 0;

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  if (showBirthDateForm) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center text-xl">
              <Calendar className="w-6 h-6 text-amber-600" />
              Complete seu Cadastro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">Para uma melhor experiência, por favor, adicione sua data de nascimento.</p>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button onClick={handleBirthDateSave} className="w-full bg-amber-600 hover:bg-amber-700">
              Confirmar Data
            </Button>
          </CardContent>
        </Card>
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
        <WhatsAppStylePhotoUpload user={user} onPhotoUpdate={loadProfileData} />
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {user?.nickname || user?.full_name}
        </h1>
        <p className="text-amber-600 text-lg">
          Acompanhe sua jornada e evolução na capoeira
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-200 shadow-xl h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Trophy className="w-5 h-5" />
                Graduação Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="flex justify-center items-center h-20">
                <CordaSVG colors={currentGrade?.colors || ['#808080']} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                {currentGrade?.name || "--- Não atribuída ---"}
              </h3>
              <p className="text-sm text-amber-600 min-h-[40px]">
                {currentGrade?.description || "Sua jornada está começando! Fale com um administrador para definir sua graduação."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-xl h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Target className="w-5 h-5" />
                Pontos {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-gray-900">{currentPoints}</span>
                  {nextGrade && <span className="text-sm text-gray-600">/ {nextGrade.points_required} pts</span>}
                </div>
                <Progress value={progressPercentage} className="h-3 bg-green-100" />
                {nextGrade && <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">{progressPercentage.toFixed(0)}% da meta</span>
                  <span className="text-gray-600">{pointsToGo} faltando</span>
                </div>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-xl h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Star className="w-5 h-5" />
                Próximo Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center flex flex-col justify-center items-center h-full pt-6">
              {nextGrade ? (
                <>
                   <div className="flex justify-center items-center h-16 opacity-70">
                     <CordaSVG colors={nextGrade.colors} />
                   </div>
                   <h4 className="font-semibold text-gray-900 text-lg mt-4">{nextGrade.name}</h4>
                </>
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center justify-center">
                  <Trophy className="w-8 h-8 mx-auto mt-2 text-amber-500" />
                  <p className="text-sm mt-2">Você alcançou a graduação máxima!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {user?.birth_date && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm">
            <Calendar className="w-4 h-4 inline mr-1" />
            Nascimento: {new Date(user.birth_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
          </p>
        </motion.div>
      )}
    </div>
  );
}