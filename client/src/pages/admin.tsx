import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedAddProductModal } from "@/components/ui/enhanced-add-product-modal";
import { EditProductModal } from "@/components/ui/edit-product-modal";
import CategoryManagement from "@/components/admin/CategoryManagement";
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
  Calendar,
  Printer,
  FolderOpen
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if user is admin (based on the requirements, admin email is rewearaofficials@gmail.com)
  const isAdmin = user && typeof user === 'object' && 'email' in user ? user.email === "rewearaofficials@gmail.com" : false;

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
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Handle edit product
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

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

  // Admin Invoice Print Function
  const handlePrintOrderInvoice = async (order: any) => {
    try {
      // Fetch full order details with items if not already present
      let fullOrder = order;
      if (!order.items || order.items.length === 0) {
        const response = await fetch(`/api/orders/${order.id}`);
        if (response.ok) {
          fullOrder = await response.json();
        }
      }
      
      const invoiceData = generateInvoiceHTML(fullOrder);
      
      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceData);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  // HTML escape function to prevent XSS
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const generateInvoiceHTML = (order: any) => {
    const orderDate = order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReWeara Invoice - ${order.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a5f3f; padding-bottom: 20px; }
        .logo { color: #1a5f3f; font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .tagline { color: #666; font-size: 14px; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; color: #1a5f3f; margin-bottom: 10px; font-size: 16px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f8f9fa; font-weight: bold; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-final { font-weight: bold; font-size: 18px; color: #1a5f3f; border-top: 2px solid #1a5f3f; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="logo">ReWeara</div>
        <div class="tagline">Sustainable Fashion for a Better Tomorrow</div>
    </div>
    
    <div class="invoice-info">
        <div>
            <div class="section-title">Invoice To:</div>
            <div><strong>${escapeHtml(order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}`.trim() : order.guestEmail || 'Guest Customer')}</strong></div>
            <div>${escapeHtml(order.user?.email || order.guestEmail || '')}</div>
            ${order.shippingAddress ? `
            <div style="margin-top: 10px;">
                <div><strong>Shipping Address:</strong></div>
                <div>${escapeHtml(order.shippingAddress.fullName)}</div>
                <div>${escapeHtml(order.shippingAddress.address)}</div>
                <div>${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.pincode)}</div>
                <div>${escapeHtml(order.shippingAddress.phone)}</div>
            </div>` : ''}
        </div>
        <div style="text-align: right;">
            <div class="section-title">Invoice Details:</div>
            <div><strong>Invoice #:</strong> REW-${order.id.substring(0, 8).toUpperCase()}</div>
            <div><strong>Order #:</strong> ${order.id}</div>
            <div><strong>Date:</strong> ${orderDate}</div>
            <div><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</div>
        </div>
    </div>
    
    ${order.items && order.items.length > 0 ? `
    <div class="section">
        <div class="section-title">Items Ordered:</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map((item: any) => `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.product?.name || 'Unknown Product')}</strong>
                        ${item.product?.brand?.name ? `<br><small>Brand: ${escapeHtml(item.product.brand.name)}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>` : ''}
    
    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${order.subtotal}</span>
        </div>
        ${order.taxAmount && parseFloat(order.taxAmount) > 0 ? `
        <div class="total-row">
            <span>Tax:</span>
            <span>₹${order.taxAmount}</span>
        </div>` : ''}
        ${order.shippingAmount && parseFloat(order.shippingAmount) > 0 ? `
        <div class="total-row">
            <span>Shipping:</span>
            <span>₹${order.shippingAmount}</span>
        </div>` : ''}
        ${order.discountAmount && parseFloat(order.discountAmount) > 0 ? `
        <div class="total-row">
            <span>Discount:</span>
            <span>-₹${order.discountAmount}</span>
        </div>` : ''}
        <div class="total-row total-final">
            <span>Total Amount:</span>
            <span>₹${order.totalAmount}</span>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Payment Information:</div>
        <div><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'N/A'}</div>
        <div><strong>Payment Status:</strong> ${order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'N/A'}</div>
    </div>
    
    <div class="footer">
        <p>Thank you for shopping with ReWeara!</p>
        <p>For any queries, contact us at: support@reweara.com | +91 6200613195</p>
        <p>This is a computer-generated invoice. No signature required.</p>
    </div>
</body>
</html>`;
  };

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

  const dashboardCards = stats && typeof stats === 'object' ? [
    {
      title: "Total Revenue",
      value: `₹${(stats as any).totalRevenue || '0'}`,
      change: `${(stats as any).revenueChange || '+0'}%`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: (stats as any).totalOrders || '0',
      change: `${(stats as any).ordersChange || '+0'}%`,
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Active Products",
      value: (stats as any).activeProducts || '0',
      change: `${(stats as any).productsChange || '+0'}%`,
      icon: Package,
      color: "text-purple-600"
    },
    {
      title: "Total Users",
      value: (stats as any).totalUsers || '0',
      change: `${(stats as any).usersChange || '+0'}%`,
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/api-controls")}
              className="bg-white/50 hover:bg-white/80 border-primary/20"
              data-testid="button-api-controls"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              API Controls
            </Button>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {user && typeof user === 'object' && 'email' in user ? String(user.email) : 'Admin'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 glassmorphism rounded-2xl p-1 mb-6">
            <TabsTrigger value="dashboard" className="rounded-xl" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-xl" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl" data-testid="tab-settings">Settings</TabsTrigger>
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
                    {orders && Array.isArray(orders) && orders.length > 0 ? orders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-semibold">#{order.id.substring(0, 8).toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}`.trim() : order.guestEmail || 'Guest Customer'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : 'Date not available'}
                              </p>
                            </div>
                            <Badge className={orderStatuses.find(s => s.value === order.status)?.color}>
                              {orderStatuses.find(s => s.value === order.status)?.label || order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">₹{order.totalAmount}</span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl"
                              onClick={() => handlePrintOrderInvoice(order)}
                              title="Print Invoice"
                              data-testid={`button-print-invoice-${order.id}`}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl"
                              onClick={() => navigate(`/orders/${order.id}`)}
                              title="View Details"
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order.status === "pending" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl text-green-600"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "confirmed" })}
                                title="Confirm Order"
                                data-testid={`button-confirm-order-${order.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No orders found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Product Management</h2>
              <Button 
                onClick={() => setShowAddProduct(true)}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl"
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <Card className="card-premium rounded-3xl">
              <CardContent className="p-6">
                {productsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="border rounded-2xl overflow-hidden">
                        <div className="aspect-square skeleton"></div>
                        <div className="p-4 space-y-2">
                          <div className="h-4 skeleton w-3/4"></div>
                          <div className="h-3 skeleton w-1/2"></div>
                          <div className="h-4 skeleton w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products && Array.isArray(products) && products.length > 0 ? products.map((product: any) => (
                      <div key={product.id} className="border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-muted">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 truncate">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">₹{product.price}</span>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-xl text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-8">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No products found. Add your first product!</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6" data-testid="content-categories">
            <CategoryManagement />
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

      {/* Add Product Modal */}
      <EnhancedAddProductModal 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct} 
      />

      {/* Edit Product Modal */}
      <EditProductModal 
        open={showEditProduct} 
        onOpenChange={setShowEditProduct}
        product={selectedProduct}
      />
    </div>
  );
}