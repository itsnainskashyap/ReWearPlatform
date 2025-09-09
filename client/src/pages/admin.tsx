import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if user is admin (based on the requirements, admin email is itsnainskashyap@gmail.com)
  const isAdmin = user && typeof user === 'object' && 'email' in user ? user.email === "itsnainskashyap@gmail.com" : false;

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isAdmin, navigate, toast]);

  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  // Orders management
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: isAdmin && selectedTab === "orders",
  });

  // Products management
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products"],
    enabled: isAdmin && selectedTab === "products",
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
  });

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const dashboardCards = stats ? [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue || '0'}`,
      change: `${stats.revenueChange || '+0'}%`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders || '0',
      change: `${stats.ordersChange || '+0'}%`,
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Active Products",
      value: stats.activeProducts || '0',
      change: `${stats.productsChange || '+0'}%`,
      icon: Package,
      color: "text-purple-600"
    },
    {
      title: "Total Users",
      value: stats.totalUsers || '0',
      change: `${stats.usersChange || '+0'}%`,
      icon: Users,
      color: "text-orange-600"
    }
  ] : [];

  const orderStatuses = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "payment_pending", label: "Payment Pending", color: "bg-orange-100 text-orange-800" },
    { value: "placed", label: "Placed", color: "bg-blue-100 text-blue-800" },
    { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage your ReWeara store</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {user && typeof user === 'object' && 'email' in user ? String(user.email) : 'Admin'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 glassmorphism rounded-2xl p-1 mb-6">
            <TabsTrigger value="dashboard" className="rounded-xl">Dashboard</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl">Orders</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl">Products</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardCards.map((card, index) => (
                <Card key={index} className="card-premium rounded-2xl hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className={`text-sm ${card.color}`}>{card.change}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
                        <card.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                      <div>
                        <p className="font-semibold">Order #REW{1000 + index}</p>
                        <p className="text-sm text-muted-foreground">₹{(Math.random() * 5000 + 500).toFixed(0)}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Delivered
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Order Management</h2>
              <Button variant="outline" className="rounded-2xl">
                <Calendar className="w-4 h-4 mr-2" />
                Filter by Date
              </Button>
            </div>

            <Card className="card-premium rounded-3xl">
              <CardContent className="p-6">
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="p-4 border rounded-xl animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { id: "REW1001", customer: "John Doe", amount: "₹1,299", status: "payment_pending" },
                      { id: "REW1002", customer: "Jane Smith", amount: "₹2,199", status: "placed" },
                      { id: "REW1003", customer: "Mike Johnson", amount: "₹899", status: "shipped" },
                    ].map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-semibold">{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.customer}</p>
                            </div>
                            <Badge className={orderStatuses.find(s => s.value === order.status)?.color}>
                              {orderStatuses.find(s => s.value === order.status)?.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">{order.amount}</span>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order.status === "payment_pending" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl text-green-600"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "placed" })}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Product Management</h2>
              <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <Card className="card-premium rounded-3xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((_, index) => (
                    <div key={index} className="border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-muted"></div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">Sample Product {index + 1}</h3>
                        <p className="text-sm text-muted-foreground mb-2">Vintage Denim Jacket</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">₹{(Math.random() * 2000 + 500).toFixed(0)}</span>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle>UPI Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    placeholder="your-upi@paytm"
                    className="rounded-xl"
                    defaultValue="rewearastore@paytm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-code">QR Code Image URL</Label>
                  <Input
                    id="qr-code"
                    placeholder="https://example.com/qr-code.png"
                    className="rounded-xl"
                  />
                </div>
                <Button className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl">
                  Update Payment Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      defaultValue="ReWeara"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      defaultValue="rewearahelps@gmail.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-description">Store Description</Label>
                  <Textarea
                    id="store-description"
                    className="rounded-xl"
                    defaultValue="Curated Thrift. Crafted Originals. Sustainable, verified, ready-to-wear fashion."
                  />
                </div>
                <Button className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}