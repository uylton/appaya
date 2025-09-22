import React, { useState, useEffect } from 'react';
import { Session } from '@/entities/Session';
import { Teacher } from '@/entities/Teacher';
import { Location } from '@/entities/Location';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SessionForm = ({ session, onSave, teachers, locations }) => {
  const [formData, setFormData] = useState(session || {
    title: '',
    date_time: '',
    location_id: '',
    teacher_id: '',
    level: 'todos'
  });

  useEffect(() => {
    // Garante que o formulário seja atualizado se a prop 'session' mudar
    setFormData(session || {
      title: '',
      date_time: '',
      location_id: '',
      teacher_id: '',
      level: 'todos'
    });
  }, [session]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSelectChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Treino</Label>
        <Input id="title" value={formData.title} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="date_time">Data e Hora</Label>
        <Input id="date_time" type="datetime-local" value={formData.date_time ? format(new Date(formData.date_time), "yyyy-MM-dd'T'HH:mm") : ''} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="location_id">Local</Label>
        <Select id="location_id" onValueChange={(v) => handleSelectChange('location_id', v)} value={formData.location_id}>
          <SelectTrigger><SelectValue placeholder="Selecione o local..." /></SelectTrigger>
          <SelectContent>
            {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="teacher_id">Professor</Label>
        <Select id="teacher_id" onValueChange={(v) => handleSelectChange('teacher_id', v)} value={formData.teacher_id}>
          <SelectTrigger><SelectValue placeholder="Selecione o professor..." /></SelectTrigger>
          <SelectContent>
            {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.nickname || t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="level">Nível</Label>
        <Select id="level" onValueChange={(v) => handleSelectChange('level', v)} value={formData.level}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Salvar Treino</Button>
    </form>
  );
}