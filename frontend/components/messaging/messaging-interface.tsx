"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  User, 
  Calendar,
  Clock,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: "client" | "operator" | "admin";
  case_id?: number;
  created_at: string;
  read_at?: string;
}

interface MessagingInterfaceProps {
  currentUserId: string;
  currentUserRole: "client" | "operator" | "admin";
  caseId?: number;
  recipientId?: string;
  recipientName?: string;
  className?: string;
}

export function MessagingInterface({
  currentUserId,
  currentUserRole,
  caseId,
  recipientId,
  recipientName,
  className = ""
}: MessagingInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [caseId, recipientId]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      // Determine API endpoint based on user role and context
      const endpoint = caseId 
        ? `/api/v1/messages/case/${caseId}`
        : `/api/v1/messages/conversation/${recipientId}`;
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Failed to load messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const messageContent = input.trim();
    setInput("");

    try {
      const endpoint = caseId 
        ? `/api/v1/operator/cases/${caseId}/messages`
        : `/api/v1/messages/send`;
        
      const body = caseId 
        ? new URLSearchParams({ message_content: messageContent })
        : JSON.stringify({
            recipient_id: recipientId,
            content: messageContent,
            case_id: caseId
          });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': caseId ? 'application/x-www-form-urlencoded' : 'application/json',
        },
        body,
      });

      if (response.ok) {
        // Add message optimistically to UI
        const newMessage: Message = {
          id: Date.now().toString(),
          content: messageContent,
          sender_id: currentUserId,
          sender_name: "Ty",
          sender_role: currentUserRole,
          case_id: caseId,
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Reload messages to get server version
        setTimeout(() => loadMessages(), 500);
      } else {
        console.error('Failed to send message:', response.statusText);
        setInput(messageContent); // Restore message if failed
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageContent); // Restore message if failed
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {recipientName ? `Rozmowa z ${recipientName}` : 'Wiadomości'}
          {caseId && (
            <Badge variant="outline" className="ml-auto">
              Sprawa #{caseId}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Ładowanie wiadomości...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Brak wiadomości</p>
                <p className="text-sm">Napisz pierwszą wiadomość!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id.toString() === currentUserId;
                const showDate = index === 0 || 
                  format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !== 
                  format(new Date(message.created_at), 'yyyy-MM-dd');

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <Separator className="flex-1" />
                        <span className="px-3 text-xs text-gray-500 bg-white">
                          {format(new Date(message.created_at), 'd MMMM yyyy', { locale: pl })}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                    )}
                    
                    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "ml-12" : "mr-12"}`}>
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {message.sender_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {message.sender_role === 'operator' ? 'Operator' : 
                               message.sender_role === 'admin' ? 'Admin' : 'Klient'}
                            </Badge>
                          </div>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {isOwnMessage && message.read_at && (
                            <CheckCircle2 className="h-3 w-3 text-blue-500 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napisz wiadomość..."
              disabled={isLoading}
              className="flex-1"
              maxLength={1000}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {input.length > 800 && (
            <p className="text-xs text-gray-500 mt-1">
              {1000 - input.length} znaków pozostało
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}