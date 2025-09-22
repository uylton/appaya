import React, { useState, useEffect } from 'react';
import { Teacher } from '@/entities/Teacher';
import { Grade } from '@/entities/Grade';
import { User } from '@/entities/User';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Send, Loader2, MessageSquare } from 'lucide-react';

const TeacherProfile = ({ teacher, isOpen, onClose, grade }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Digite uma mensagem antes de enviar.');
      return;
    }
    
    setIsSending(true);
    try {
      const currentUser = await User.me();
      // Lógica de envio de mensagem (ex: ChatMessage.create)
      console.log(`Mensagem de ${currentUser.full_name} para ${teacher.name}: ${message}`);
      alert(`Mensagem enviada para ${teacher.nickname || teacher.name}!`);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            {teacher?.nickname || teacher?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <img 
              src={teacher?.photo_url || `https://ui-avatars.com/api/?name=${teacher?.name}&background=16a34a&color=fff`} 
              alt={teacher?.name} 
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="font-semibold text-lg">{teacher?.nickname || teacher?.name}</h3>
            {grade && (
              <p className="text-sm text-green-600 mt-1">Graduação: {grade.name}</p>
            )}
            {teacher?.bio && (
              <p className="text-sm text-gray-600 mt-2">{teacher.bio}</p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Enviar mensagem:</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
 