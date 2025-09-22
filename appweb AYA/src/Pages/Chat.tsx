import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/entities/ChatMessage';
import { User } from '@/entities/User';
import { UploadFile } from "@/integrations/Core";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Trash2, Paperclip, File, Image as ImageIcon, Mic, Camera, FileText, Users as UsersIcon, BarChart3, PenTool, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MessageBubble = ({ msg, currentUser, onDelete }) => {
  const isSelf = msg.user_id === currentUser.id;
  const isAdmin = msg.user_is_admin;

  const renderContent = () => {
    if (msg.is_deleted) {
      return <p className="text-xs italic text-gray-400">Mensagem removida.</p>;
    }

    // Tratamento para diferentes tipos de arquivo
    if (msg.message.startsWith('http')) {
      if (msg.message.match(/\.(jpeg|jpg|gif|png)$/i)) {
        return <img src={msg.message} alt="imagem enviada" className="rounded-lg max-w-xs cursor-pointer mt-2" onClick={() => window.open(msg.message, '_blank')} />;
      }
      if (msg.message.match(/\.(mp4|webm|ogg|mov)$/i)) {
        return <video controls src={msg.message} className="rounded-lg max-w-xs mt-2"></video>;
      }
      if (msg.message.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return <audio controls src={msg.message} className="w-full max-w-xs mt-2"></audio>;
      }
      if (msg.message.match(/\.(pdf|doc|docx|txt)$/i)) {
        return (
          <a href={msg.message} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-current mt-2">
            <FileText className="w-4 h-4" />
            Ver documento
          </a>
        );
      }
      return (
        <a href={msg.message} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-current mt-2">
          <File className="w-4 h-4" />
          Ver anexo
        </a>
      );
    }
    
    return <p className="text-sm whitespace-pre-wrap">{msg.message}</p>;
  }

  const bubbleClass = isSelf 
    ? 'bg-blue-600 text-white' 
    : isAdmin ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg border-2 border-red-300' : 'bg-gray-200 text-gray-800';

  return (
    <div className={`flex items-end gap-2 ${isSelf ? 'justify-end' : ''}`}>
      {!isSelf && (
        <img src={msg.user_photo_url || `https://ui-avatars.com/api/?name=${msg.user_nickname}&background=random`} alt={msg.user_nickname} className="w-8 h-8 rounded-full" />
      )}
      <div className={`group relative max-w-[70%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2 rounded-2xl ${bubbleClass}`}>
          {!isSelf && (
            <p className={`text-xs font-bold mb-1 ${isAdmin ? 'text-yellow-200' : ''}`}>
                {msg.user_nickname} {isAdmin && <Badge variant="destructive" className="ml-1 text-xs bg-yellow-500 text-black">ADMIN</Badge>}
            </p>
          )}
          
          {renderContent()}

          <p className={`text-xs mt-1 ${isSelf ? 'text-blue-200' : isAdmin ? 'text-red-200' : 'text-gray-500'} text-right`}>
            {format(new Date(msg.created_date), 'HH:mm', { locale: ptBR })}
          </p>
        </div>
        {currentUser.profile_type === 'admin' && !isSelf && !msg.is_deleted && (
          <div className="absolute top-0 right-0 -mr-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(msg.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
  const allUsersRef = useRef(allUsers);
  allUsersRef.current = allUsers;

  const fetchMessages = async () => {
    const usersMap = allUsersRef.current;
    if (Object.keys(usersMap).length === 0) return;
    
    const fetchedMessages = await ChatMessage.list('-created_date', 100);
    const enrichedMessages = fetchedMessages.map(msg => ({
        ...msg,
        user_is_admin: usersMap[msg.user_id]?.profile_type === 'admin'
    }));
    
    setMessages(prevMessages => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(enrichedMessages.slice().reverse())) {
            return enrichedMessages.slice().reverse();
        }
        return prevMessages;
    });
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const [user, users] = await Promise.all([User.me(), User.list()]);
        setCurrentUser(user);
        const usersMap = users.reduce((acc, u) => ({...acc, [u.id]: u}), {});
        setAllUsers(usersMap);
      } catch (e) {
        console.error("Erro ao iniciar chat:", e);
      }
    };
    initChat();
  }, []);
  
  useEffect(() => {
    if(Object.keys(allUsers).length > 0) {
        fetchMessages();
    }
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [allUsers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    const tempMessage = newMessage;
    setNewMessage('');
    try {
      await ChatMessage.create({
        user_id: currentUser.id,
        user_nickname: currentUser.nickname || currentUser.full_name,
        user_photo_url: currentUser.photo_url,
        message: tempMessage
      });
      fetchMessages();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setNewMessage(tempMessage);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setIsUploading(true);
    setShowAttachmentMenu(false);
    try {
      const { file_url } = await UploadFile({ file });
      await ChatMessage.create({
        user_id: currentUser.id,
        user_nickname: currentUser.nickname || currentUser.full_name,
        user_photo_url: currentUser.photo_url,
        message: file_url,
      });
      fetchMessages();
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    }
    setIsUploading(false);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Tem certeza que deseja apagar esta mensagem?")) {
      try {
        await ChatMessage.update(messageId, { message: 'Mensagem removida pelo moderador.', is_deleted: true });
        fetchMessages();
      } catch (error) {
        console.error("Erro ao apagar mensagem:", error);
      }
    }
  };

  if (!currentUser) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] p-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} currentUser={currentUser} onDelete={handleDeleteMessage} />
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
        <div className="relative">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </Button>
          
          {showAttachmentMenu && (
            <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-2 space-y-1 z-10">
              <button 
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                onClick={() => fileInputRef.current.click()}
              >
                <ImageIcon className="w-4 h-4" /> Fotos e Vídeos
              </button>
              <button 
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                onClick={() => videoInputRef.current.click()}
              >
                <Camera className="w-4 h-4" /> Câmera
              </button>
              <button 
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                onClick={() => documentInputRef.current.click()}
              >
                <FileText className="w-4 h-4" /> Documentos
              </button>
              <button 
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                onClick={() => audioInputRef.current.click()}
              >
                <Mic className="w-4 h-4" /> Áudio
              </button>
            </div>
          )}
        </div>

        {/* Inputs ocultos para diferentes tipos de arquivo */}
        <input 
          ref={fileInputRef} 
          type="file" 
          onChange={(e) => handleFileUpload(e.target.files[0], 'media')} 
          className="hidden" 
          accept="image/*,video/*" 
        />
        <input 
          ref={videoInputRef} 
          type="file" 
          onChange={(e) => handleFileUpload(e.target.files[0], 'camera')} 
          className="hidden" 
          accept="image/*,video/*" 
          capture="environment"
        />
        <input 
          ref={documentInputRef} 
          type="file" 
          onChange={(e) => handleFileUpload(e.target.files[0], 'document')} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        />
        <input 
          ref={audioInputRef} 
          type="file" 
          onChange={(e) => handleFileUpload(e.target.files[0], 'audio')} 
          className="hidden" 
          accept="audio/*"
        />

        <Button 
          type="button"
          variant="ghost" 
          size="icon"
          onClick={() => {
            // Simular gravação de áudio - na prática você implementaria uma gravação real
            alert("Funcionalidade de gravação de áudio será implementada em breve!");
          }}
        >
          <Mic className="w-5 h-5" />
        </Button>
        
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}