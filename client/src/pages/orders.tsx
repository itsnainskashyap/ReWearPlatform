import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, CheckCircle, Clock, X, ChevronRight, ArrowLeft, Calendar, Download, Printer } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";

export default function Orders() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Define helper functions first
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'shipped': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'delivered': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  // Invoice functions
  const handleDownloadInvoice = () => {
    // Create invoice data
    const invoiceData = generateInvoiceHTML(orderDetails);
    
    // Create a blob with the HTML content
    const blob = new Blob([invoiceData], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReWeara_Invoice_${orderDetails.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintInvoice = () => {
    // Create invoice data
    const invoiceData = generateInvoiceHTML(orderDetails);
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceData);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // HTML escape function to prevent XSS
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const generateInvoiceHTML = (order: any) => {
    const currentDate = new Date().toLocaleDateString();
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

  // If we have an order ID, fetch that specific order
  const { data: orders, isLoading } = useQuery({
    queryKey: params.id ? ["/api/orders", params.id] : ["/api/orders"],
  });

  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/orders", params.id],
    enabled: !!params.id,
  });

  // If we're viewing a specific order, show order details
  if (params.id) {
    if (isLoadingDetails) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
          <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
            <div className="h-8 w-32 skeleton rounded-full"></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="h-64 skeleton rounded-2xl"></div>
          </div>
        </div>
      );
    }

    if (!orderDetails) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
          <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/orders")}
                className="hover-lift rounded-2xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl font-bold gradient-text">Order Not Found</h1>
            </div>
          </div>
          <div className="p-4 text-center py-16">
            <h3 className="text-xl font-bold mb-3">Order not found</h3>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
          </div>
        </div>
      );
    }

    // Order Details View
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
        <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/orders")}
              className="hover-lift rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Order Details</h1>
              <p className="text-sm text-muted-foreground">Order #{orderDetails.id}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Card className="card-premium rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order #{orderDetails.id}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center mt-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {orderDetails.createdAt 
                      ? format(new Date(orderDetails.createdAt), 'dd MMM yyyy, hh:mm a')
                      : 'Date not available'
                    }
                  </p>
                </div>
                <Badge className={`rounded-full px-3 py-1 flex items-center space-x-1 ${getStatusColor(orderDetails.status)}`}>
                  {getStatusIcon(orderDetails.status)}
                  <span className="capitalize">{orderDetails.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Payment Method:</span>
                    <p className="font-medium uppercase">{orderDetails.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Payment Status:</span>
                    <p className="font-medium">{orderDetails.paymentStatus}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <p className="font-medium">₹{orderDetails.subtotal}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <p className="font-bold text-lg">₹{orderDetails.totalAmount}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Customer Information</h3>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="font-medium">{orderDetails.user?.firstName ? `${orderDetails.user.firstName} ${orderDetails.user.lastName || ''}`.trim() : orderDetails.guestEmail || 'Guest Customer'}</p>
                  <p className="text-sm text-muted-foreground">{orderDetails.user?.email || orderDetails.guestEmail}</p>
                  {orderDetails.shippingAddress?.phone && (
                    <p className="text-sm text-muted-foreground">{orderDetails.shippingAddress.phone}</p>
                  )}
                </div>
              </div>

              {/* Items Ordered */}
              {orderDetails.items && orderDetails.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Items Ordered</h3>
                  <div className="space-y-3">
                    {orderDetails.items.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.product?.brand?.name && `Brand: ${item.product.brand.name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{item.price}</p>
                          {item.product?.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.price) && (
                            <p className="text-sm text-muted-foreground line-through">₹{item.product.originalPrice}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {orderDetails.shippingAddress && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Shipping Address</h3>
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="font-medium">{orderDetails.shippingAddress.fullName}</p>
                    <p className="text-sm text-muted-foreground">{orderDetails.shippingAddress.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.pincode}
                    </p>
                    <p className="text-sm text-muted-foreground">{orderDetails.shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {/* Invoice Actions */}
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDownloadInvoice()}
                    data-testid="button-download-invoice"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePrintInvoice()}
                    data-testid="button-print-invoice"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
                
                {/* Order Actions */}
                <div className="flex space-x-3">
                  {orderDetails.status === 'shipped' && (
                    <Button variant="outline" className="flex-1">
                      Track Order
                    </Button>
                  )}
                  {orderDetails.status === 'delivered' && (
                    <Button variant="outline" className="flex-1">
                      Rate & Review
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/orders")}
                  >
                    Back to Orders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredOrders = orders && Array.isArray(orders) 
    ? (selectedStatus === 'all' ? orders : orders.filter((order: any) => order.status === selectedStatus))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
        <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
          <div className="h-8 w-32 skeleton rounded-full"></div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover-lift rounded-2xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">My Orders</h1>
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status Tabs */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
          <TabsList className="grid grid-cols-4 glassmorphism rounded-2xl p-1">
            <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl">Pending</TabsTrigger>
            <TabsTrigger value="shipped" className="rounded-xl">Shipped</TabsTrigger>
            <TabsTrigger value="delivered" className="rounded-xl">Delivered</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">No orders found</h3>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button 
              onClick={() => navigate("/shop")}
              className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl button-glow hover-lift"
              data-testid="button-start-shopping"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => (
              <Card key={order.id} className="card-premium rounded-2xl hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {order.createdAt 
                          ? format(new Date(order.createdAt), 'dd MMM yyyy')
                          : 'Date not available'
                        }
                      </p>
                      <p className="font-bold">Order #{order.id}</p>
                    </div>
                    <Badge className={`rounded-full px-3 py-1 flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Method:</span>
                      <span className="text-sm font-medium uppercase">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Status:</span>
                      <Badge variant="outline" className="text-xs">{order.paymentStatus}</Badge>
                    </div>
                  </div>

                  {/* Order Total and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-bold text-lg gradient-text">₹{order.totalAmount}</p>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          Rate & Review
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.status === 'shipped' && (
                    <div className="p-3 bg-primary/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Your order is on the way!</p>
                            <p className="text-xs text-muted-foreground">Expected delivery: 2-3 days</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}