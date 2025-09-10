import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  Leaf,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  message: string;
  reply?: string;
  timestamp: string;
  isUser: boolean;
}

export default function AIChatAssistant() {
  // Fixed position at bottom-right corner
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        message: "Hi! I'm ReWeara's AI assistant. I can help you with sustainable fashion choices, product recommendations, shipping info, and more. How can I assist you today?",
        timestamp: new Date().toISOString(),
        isUser: false
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context: string }) => {
      const response = await apiRequest('POST', '/api/ai/chat', { message, context });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === variables.message ? { ...msg, reply: data.reply } : msg
        ));
      } else {
        throw new Error(data.error || 'Chat failed');
      }
      setIsTyping(false);
    },
    onError: (error: any, variables) => {
      setMessages(prev => prev.map(msg => 
        msg.id === variables.message ? { 
          ...msg, 
          reply: error.fallback || "I'm having trouble responding right now. Please try again or check our FAQs section for common questions." 
        } : msg
      ));
      setIsTyping(false);
      toast({
        title: "Connection Issue",
        description: "AI assistant is temporarily unavailable, but I've provided a helpful response.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const messageId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: messageId,
      message: currentMessage,
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    // Build context from recent messages
    const context = messages
      .slice(-3)
      .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.message}${msg.reply ? ' | ' + msg.reply : ''}`)
      .join('\n');

    chatMutation.mutate({ message: currentMessage, context });
    setCurrentMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What sustainable materials do you use?",
    "How do I care for thrift items?", 
    "What's your return policy?",
    "Do you have size guides?",
    "Tell me about your shipping"
  ];

  const handleQuickQuestion = (question: string) => {
    setCurrentMessage(question);
  };

  return (
    <>
      {/* Strong blur backdrop when chat is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[48] transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Fixed Chat Widget at bottom-right */}
      <div className="fixed right-4 bottom-4 z-50">
        {/* Floating Chat Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                size="icon"
                className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-primary/20"
                data-testid="button-ai-chat"
              >
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </Button>
            </DialogTrigger>
          
            <DialogContent className="max-w-md h-[600px] flex flex-col p-0 border-2 border-primary shadow-2xl">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-primary">ReWeara AI Assistant</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Online
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Powered
                    </Badge>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {/* User Message */}
                  {message.isUser && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2">
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Assistant Reply */}
                  {!message.isUser && (
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div className="max-w-[80%] bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Reply to User Message */}
                  {message.isUser && message.reply && (
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div className="max-w-[80%] bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                        <p className="text-sm">{message.reply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 pt-2 border-t">
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about sustainable fashion, shipping, returns..."
                  className="rounded-full"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={!currentMessage.trim() || isTyping}
                  className="rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isTyping ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                <Leaf className="w-3 h-3 inline mr-1" />
                Powered by sustainable AI • Your data is protected
              </p>
            </div>
          </DialogContent>
          </Dialog>
      </div>
    </>
  );
}