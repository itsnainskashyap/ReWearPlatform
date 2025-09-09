import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Phone, Mail, MapPin, Send, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/contact", formData);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Required Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      value: "+91 6200613195",
      subtitle: "Mon-Sat 9:00 AM - 7:00 PM"
    },
    {
      icon: Mail,
      title: "Email",
      value: "rewearahelps@gmail.com",
      subtitle: "We reply within 24 hours"
    },
    {
      icon: MapPin,
      title: "Location",
      value: "India",
      subtitle: "Serving nationwide"
    },
    {
      icon: Clock,
      title: "Business Hours",
      value: "Mon - Sat",
      subtitle: "9:00 AM - 7:00 PM IST"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover-lift rounded-2xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Contact Us</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3 animate-fadeInUp">
          <h2 className="text-3xl font-bold">Get in Touch</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Have questions about our products or need help with your order? We're here to help!
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactInfo.map((info, index) => (
            <Card
              key={index}
              className="card-premium rounded-2xl hover-lift animate-slideInLeft"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <info.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{info.title}</h3>
                    <p className="text-sm text-muted-foreground">{info.subtitle}</p>
                  </div>
                </div>
                <p className="font-bold text-lg gradient-text">{info.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card className="card-premium rounded-3xl animate-slideInRight">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="rounded-xl min-h-[120px]"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl button-glow hover-lift h-12"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Quick Links */}
        <Card className="card-premium rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 animate-scaleIn">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Need Quick Answers?</h3>
            <p className="text-muted-foreground text-sm">
              Check out our frequently asked questions for instant help
            </p>
            <Button
              onClick={() => navigate("/faqs")}
              variant="outline"
              className="rounded-2xl"
            >
              View FAQs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}