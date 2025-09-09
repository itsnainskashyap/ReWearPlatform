import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Shield,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Send,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bell,
  Globe,
  Zap,
  Image,
  FileText,
  Activity,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Percent,
  Gift,
  Palette,
  Monitor,
  Smartphone,
  CreditCard,
  QrCode,
  Mail,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Briefcase,
  Target,
  Award,
  Star,
  Heart
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Admin login component
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          otpToken: requiresOTP ? otpCode : undefined 
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresOTP) {
          setRequiresOTP(true);
          toast({
            title: "2FA Required",
            description: "Please enter your 2FA code"
          });
        } else if (data.token) {
          localStorage.setItem("adminToken", data.token);
          onLogin(data.token);
          toast({
            title: "Welcome back!",
            description: "Successfully logged in to admin panel"
          });
        }
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-admin-password"
              />
            </div>
            {requiresOTP && (
              <div className="space-y-2">
                <Label htmlFor="otp">2FA Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  data-testid="input-admin-otp"
                />
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
              data-testid="button-admin-login"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Admin Panel Component
export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
  };

  // API request helper with auth
  const apiRequest = async (method: string, url: string, body?: any) => {
    if (!adminToken) {
      throw new Error("No admin token");
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired");
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Dashboard Statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => apiRequest("GET", "/api/admin/dashboard/stats"),
    enabled: !!adminToken,
    refetchInterval: adminToken ? 30000 : false // Refresh every 30 seconds
  });

  // Orders Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/orders?limit=20"),
    enabled: !!adminToken && activeTab === "orders"
  });

  // Users Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/users?limit=20"),
    enabled: !!adminToken && activeTab === "users"
  });

  // Coupons Query
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ["admin-coupons", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/coupons"),
    enabled: !!adminToken && activeTab === "marketing"
  });

  // Banners Query
  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ["admin-banners", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/banners"),
    enabled: !!adminToken && activeTab === "content"
  });

  // AI Config Query
  const { data: aiConfig, isLoading: aiConfigLoading } = useQuery({
    queryKey: ["admin-ai-config", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/ai-config"),
    enabled: !!adminToken && activeTab === "ai"
  });

  // Audit Logs Query
  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["admin-audit-logs", activeTab],
    queryFn: () => apiRequest("GET", "/api/admin/audit-logs?limit=100"),
    enabled: !!adminToken && activeTab === "logs"
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully"
      });
    }
  });

  // Create coupon mutation
  const createCoupon = useMutation({
    mutationFn: (couponData: any) =>
      apiRequest("POST", "/api/admin/coupons", couponData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({
        title: "Coupon Created",
        description: "New coupon has been created successfully"
      });
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAdminToken(token);
    }
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Chart colors
  const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (!adminToken) {
    return <AdminLogin onLogin={setAdminToken} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex flex-1 items-center space-x-4">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">ReWeara Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-view-site"
            >
              <Globe className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-2">
                <Tag className="w-4 h-4" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Zap className="w-4 h-4" />
                AI Controls
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <Activity className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <Clock className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.totalOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.totalProducts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +3 new this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +18% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Last 7 days revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats?.revenueByDate || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentOrders?.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            order.status === "delivered" ? "default" :
                            order.status === "shipped" ? "secondary" :
                            order.status === "cancelled" ? "destructive" :
                            "outline"
                          }>
                            {order.status}
                          </Badge>
                          <span className="font-medium">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Management</CardTitle>
                    <CardDescription>View and manage customer orders</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search orders..." 
                      className="w-64"
                      data-testid="input-search-orders"
                    />
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordersData?.orders?.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                              <Badge>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.user?.email || order.guestEmail || "Guest"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.items?.length || 0} items
                              </p>
                            </div>
                            <Select
                              value={order.status}
                              onValueChange={(value) => 
                                updateOrderStatus.mutate({ orderId: order.id, status: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                              {order.items.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="text-xs bg-muted px-2 py-1 rounded">
                                  {item.product?.name || "Unknown"} x{item.quantity}
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="text-xs bg-muted px-2 py-1 rounded">
                                  +{order.items.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Manage your product inventory</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Product management interface will be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage customer accounts</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search users..." 
                      className="w-64"
                      data-testid="input-search-users"
                    />
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usersData?.users?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          <Button size="icon" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            <div className="grid gap-4">
              {/* Coupons Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Coupon Management</CardTitle>
                      <CardDescription>Create and manage discount codes</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Coupon
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Coupon</DialogTitle>
                          <DialogDescription>
                            Set up a new discount code for customers
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Coupon Code</Label>
                            <Input placeholder="SAVE20" />
                          </div>
                          <div>
                            <Label>Discount Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Discount Value</Label>
                            <Input type="number" placeholder="20" />
                          </div>
                          <div>
                            <Label>Minimum Purchase</Label>
                            <Input type="number" placeholder="500" />
                          </div>
                          <Button className="w-full">Create Coupon</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {couponsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {coupons?.map((coupon: any) => (
                        <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{coupon.code}</span>
                              <Badge variant={coupon.isActive ? "default" : "secondary"}>
                                {coupon.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {coupon.discountType === "percentage" ? 
                                `${coupon.discountValue}% off` : 
                                `₹${coupon.discountValue} off`}
                              {coupon.minPurchaseAmount && ` • Min: ₹${coupon.minPurchaseAmount}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Used: {coupon.usageCount || 0}/{coupon.usageLimit || "∞"}
                            </Badge>
                            <Button size="icon" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Send Notifications</CardTitle>
                      <CardDescription>Send bulk notifications to users</CardDescription>
                    </div>
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Notification Title</Label>
                      <Input placeholder="Special Sale Alert!" />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea 
                        placeholder="Get 30% off on all sustainable fashion items..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Target Audience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="active">Active Users (Last 30 days)</SelectItem>
                          <SelectItem value="premium">Premium Customers</SelectItem>
                          <SelectItem value="new">New Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4">
              {/* Banners Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Banner Management</CardTitle>
                      <CardDescription>Manage homepage banners and hero sections</CardDescription>
                    </div>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Banner
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bannersLoading ? (
                    <div className="grid gap-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {banners?.map((banner: any) => (
                        <div key={banner.id} className="border rounded-lg overflow-hidden">
                          <div className="flex">
                            <div className="w-48 h-32 bg-muted flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{banner.title || "Untitled Banner"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {banner.subtitle || "No subtitle"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                                      {banner.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Badge variant="outline">{banner.position}</Badge>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="icon" variant="ghost">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pages Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Pages</CardTitle>
                  <CardDescription>Edit static pages like About, FAQs, Terms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {["about", "faqs", "terms", "privacy", "careers", "blog"].map((page) => (
                      <div key={page} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize">{page}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Controls Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Feature Controls</CardTitle>
                <CardDescription>Manage AI-powered features and settings</CardDescription>
              </CardHeader>
              <CardContent>
                {aiConfigLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[
                      { 
                        feature: "recommendations", 
                        label: "Product Recommendations",
                        description: "AI-powered product suggestions based on user behavior"
                      },
                      { 
                        feature: "try-on", 
                        label: "Virtual Try-On",
                        description: "AR-based virtual clothing try-on feature"
                      },
                      { 
                        feature: "background-gen", 
                        label: "Background Generation",
                        description: "AI-generated product backgrounds and scenes"
                      },
                      { 
                        feature: "chat-assistant", 
                        label: "Chat Assistant",
                        description: "AI-powered customer support chatbot"
                      }
                    ].map((item) => {
                      const config = aiConfig?.find((c: any) => c.feature === item.feature);
                      return (
                        <div key={item.feature} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.label}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Button
                              variant={config?.isEnabled ? "default" : "outline"}
                              size="sm"
                            >
                              {config?.isEnabled ? "Enabled" : "Disabled"}
                            </Button>
                          </div>
                          {config?.isEnabled && (
                            <div className="ml-4 space-y-2">
                              <div className="text-sm">
                                <span className="text-muted-foreground">API Calls Today:</span>
                                <span className="ml-2 font-medium">
                                  {config?.usage?.callsToday || 0}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Monthly Cost:</span>
                                <span className="ml-2 font-medium">
                                  {formatCurrency(config?.usage?.monthlyCost || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Thrift Store", value: 45 },
                          { name: "ReWeara Originals", value: 30 },
                          { name: "Accessories", value: 15 },
                          { name: "Others", value: 10 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Vintage Denim Jacket", sales: 42, revenue: 52500 },
                      { name: "Organic Cotton Tee", sales: 38, revenue: 19000 },
                      { name: "Recycled Leather Bag", sales: 31, revenue: 46500 },
                      { name: "Bamboo Sunglasses", sales: 28, revenue: 14000 },
                      { name: "Hemp Canvas Sneakers", sales: 24, revenue: 36000 }
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                        </div>
                        <span className="font-medium">{formatCurrency(product.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Configure payment methods and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>UPI ID</Label>
                    <Input defaultValue="rewearastore@paytm" />
                  </div>
                  <div>
                    <Label>UPI QR Code</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 border rounded flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                      <Button variant="outline">Upload QR Code</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                  <CardDescription>Basic store settings and information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Store Name</Label>
                    <Input defaultValue="ReWeara" />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input defaultValue="rewearahelps@gmail.com" />
                  </div>
                  <div>
                    <Label>Store Description</Label>
                    <Textarea 
                      defaultValue="Curated Thrift. Crafted Originals. Sustainable, verified, ready-to-wear fashion."
                      rows={3}
                    />
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage admin security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your admin account
                      </p>
                    </div>
                    <Button variant="outline">Setup 2FA</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">
                        Update your admin password regularly
                      </p>
                    </div>
                    <Button variant="outline">Change</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>Track all admin actions and changes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create">Create</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {auditLogsLoading ? (
                  <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs?.logs?.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <span className="font-medium">{log.action}</span>
                            <span className="text-muted-foreground ml-2">
                              {log.entityType} {log.entityId && `#${log.entityId.slice(0, 8)}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{log.adminEmail}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}