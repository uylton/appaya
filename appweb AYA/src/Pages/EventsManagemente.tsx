import React, { useState, useEffect } from 'react';
import { Event } from '@/entities/Event';
import { Location } from '@/entities/Location';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const EventForm = ({ event, onSave, locations }) => {
  const [formData, setFormData] = useState(event || {
    title: '',
    date_time: '',
    location_id: '',
    description: '',
    host: ''
  });

   useEffect(() => {
    setFormData(event || {
      title: '',
      date_time: '',
      location_id: '',
      description: '',
      host: ''
    });
  }, [event]);

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
        <Label htmlFor="title">Título do Evento</Label>
        <Input id="title" value={formData.title} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="host">Mestre/Responsável</Label>
        <Input id="host" value={formData.host} onChange={handleChange} required />
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
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={formData.description} onChange={handleChange} />
      </div>
      <Button type="submit">Salvar Evento</Button>
    </form>
  );
}

export default function EventsManagementPage() {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsData, locationsData] = await Promise.all([
        Event.list('-date_time'),
        Location.list()
      ]);
      setEvents(eventsData);
      setLocations(locationsData);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    }
    setIsLoading(false);
  };

  const handleSave = async (data) => {
    try {
        if (editingEvent) {
            await Event.update(editingEvent.id, data);
        } else {
            await Event.create(data);
        }
        fetchData();
        setIsFormOpen(false);
        setEditingEvent(null);
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        alert("Falha ao salvar evento.");
    }
  };
  
  const handleEdit = (event) => {
      setEditingEvent(event);
      setIsFormOpen(true);
  }

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      await Event.delete(id);
      fetchData();
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-purple-200 bg-white/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
            <Trophy className="w-6 h-6" />
            Gerenciamento de Eventos
          </CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEvent(null)}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
              </DialogHeader>
              <EventForm event={editingEvent} onSave={handleSave} locations={locations} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(event => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Data:</strong> {format(new Date(event.date_time), 'dd/MM/yyyy HH:mm')}</p>
                    <p><strong>Local:</strong> {locations.find(l => l.id === event.location_id)?.name || 'N/A'}</p>
                    <p><strong>Responsável:</strong> {event.host}</p>
                    <p className="pt-2 text-gray-600">{event.description}</p>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(event)}><Edit className="w-3 h-3 mr-1" /> Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-3 h-3 mr-1" /> Excluir</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}