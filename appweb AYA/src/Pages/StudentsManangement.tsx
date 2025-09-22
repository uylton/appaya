import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';

export default function StudentsManagementPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const allUsers = await User.list();
      // Incluir usuários que são explicitamente 'student' OU que não têm profile_type definido (considerados alunos por padrão)
      // Excluir apenas usuários explicitamente marcados como 'admin'
      const studentUsers = allUsers
        .filter(u => u.profile_type !== 'admin') // Excluir apenas admins
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(studentUsers);
      setFilteredStudents(studentUsers);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const results = students.filter(student =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.nickname && student.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-indigo-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-2xl text-indigo-800">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6" />
              Gerenciamento de Alunos
            </div>
            <Badge>{filteredStudents.length} alunos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome ou apelido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => (
                <Link 
                  to={createPageUrl(`AdminProfile?id=${student.id}`)} 
                  key={student.id}
                  className="block p-4 bg-gray-50 rounded-lg border hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={student.photo_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=6366f1&color=fff`} 
                      alt={student.full_name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-gray-800">{student.nickname || student.full_name}</p>
                      <p className="text-sm text-gray-600">{student.full_name}</p>
 