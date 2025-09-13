import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, MapPin, Package, Heart, LogOut, ChevronRight, Bell, CreditCard, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    addresses: []
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
    setIsEditing(false);
  };

  const menuItems = [
    { icon: Package, label: "My Orders", path: "/orders", count: 0 },
    { icon: Heart, label: "Wishlist", path: "/wishlist", count: 0 },
    { icon: MapPin, label: "Addresses", action: () => {} },
    { icon: CreditCard, label: "Payment Methods", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {}, count: 3 },
    { icon: Shield, label: "Privacy & Security", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20 border-4 border-white/20">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-white/20 text-white text-2xl">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-green)' }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-white">{user?.email}</p>
            <Badge className="mt-2 bg-white/20 text-white border-white/30">
              Member since 2024
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glassmorphism rounded-2xl p-1">
            <TabsTrigger value="account" className="rounded-xl">Account</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4 mt-4">
            {/* Personal Information */}
            <Card className="card-premium rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle style={{ color: 'var(--brand-green)' }}>Personal Information</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className="rounded-xl"
                >
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    disabled={!isEditing}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Add phone number"
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <Card
                  key={index}
                  className="card-premium rounded-2xl hover-lift cursor-pointer"
                  onClick={() => item.path ? navigate(item.path) : item.action?.()}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.count !== undefined && item.count > 0 && (
                        <Badge className="bg-primary/10 text-primary border-0">
                          {item.count}
                        </Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-primary/70" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* App Settings */}
            <Card className="card-premium rounded-2xl">
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-primary/70">Receive order updates</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-primary/70">Promotional emails</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="card-premium rounded-2xl">
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  Help Center
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  Terms & Conditions
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  Privacy Policy
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-12 rounded-2xl"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}