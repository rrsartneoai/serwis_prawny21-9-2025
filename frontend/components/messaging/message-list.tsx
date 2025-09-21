"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  User, 
  Clock,
  Search,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_role: "client" | "operator" | "admin";
  case_id?: number;
  case_title?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_read: boolean;
}

interface MessageListProps {
  currentUserRole: "client" | "operator" | "admin";
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  className?: string;
}

export function MessageList({
  currentUserRole,
  onSelectConversation,
  selectedConversationId,
  className = ""
}: MessageListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to load conversations:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Wiadomości
          {conversations.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} nowych
            </Badge>
          )}
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Szukaj rozmów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Ładowanie rozmów...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 p-4">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Brak rozmów</p>
              <p className="text-sm">
                {searchQuery ? 'Nie znaleziono rozmów' : 'Nie masz jeszcze żadnych wiadomości'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "secondary" : "ghost"}
                className="w-full h-auto p-4 justify-start text-left"
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium truncate ${conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conversation.participant_name}
                      </span>
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[1.2rem] h-5">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {format(new Date(conversation.last_message_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {conversation.participant_role === 'operator' ? 'Operator' : 
                         conversation.participant_role === 'admin' ? 'Admin' : 'Klient'}
                      </Badge>
                      {conversation.case_id && (
                        <Badge variant="outline" className="text-xs">
                          Sprawa #{conversation.case_id}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {conversation.last_message}
                    </p>
                    
                    {conversation.case_title && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conversation.case_title}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}