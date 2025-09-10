import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Truck, MapPin, ChevronRight, Shield, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { PaymentSettings } from "@shared/schema";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user && typeof user === 'object' && 'firstName' in user && 'lastName' in user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
      : "",
    email: user && typeof user === 'object' && 'email' in user ? user.email || "" : "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: ""
  });

  const [upiId, setUpiId] = useState("");
  const [taxInfo, setTaxInfo] = useState({ taxRate: 0, taxAmount: 0 });
  const [codAdvanceData, setCodAdvanceData] = useState({
    transactionId: "",
    screenshotProof: null as File | null,
    isPaid: false
  });

  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  const { data: paymentSettings } = useQuery<PaymentSettings>({
    queryKey: ["/api/payment-settings"],
  });

  const calculateTaxMutation = useMutation({
    mutationFn: async (subtotal: number) => {
      return await apiRequest("POST", "/api/calculate-tax", {
        subtotal,
        country: "India",
        state: shippingInfo.state,
        city: shippingInfo.city,
        zipCode: shippingInfo.pincode
      });
    },
    onSuccess: (data: any) => {
      setTaxInfo({
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0
      });
    }
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        shippingAddress: shippingInfo,
        paymentMethod,
        subtotal: calculateSubtotal(),
        totalAmount: calculateTotal(),
        paymentDetails: paymentMethod === 'upi' 
          ? { upiId } 
          : paymentMethod === 'cod' 
            ? { 
                securityAdvance: 99,
                transactionId: codAdvanceData.transactionId,
                paymentProofUploaded: !!codAdvanceData.screenshotProof
              } 
            : {}
      };
      
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: (data: any) => {
      setOrderPlaced(true);
      toast({
        title: "Order Placed Successfully!",
        description: data?.id ? `Your order #${data.id.slice(0, 8).toUpperCase()} has been placed` : "Your order has been placed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    if (!cart || !Array.isArray((cart as any)?.items)) return "0.00";
    const subtotal = (cart as any).items.reduce((total: number, item: any) => 
      total + (parseFloat(item.product.price) * item.quantity), 0
    );
    const shipping = subtotal > 500 ? 0 : 50;
    return (subtotal + shipping + taxInfo.taxAmount).toFixed(2);
  };

  const calculateSubtotal = () => {
    if (!cart || !Array.isArray((cart as any)?.items)) return "0.00";
    return (cart as any).items.reduce((total: number, item: any) => 
      total + (parseFloat(item.product.price) * item.quantity), 0
    ).toFixed(2);
  };

  // Calculate tax when shipping address changes
  useEffect(() => {
    if (shippingInfo.state && shippingInfo.city && cart && Array.isArray((cart as any)?.items)) {
      const subtotal = (cart as any).items.reduce((total: number, item: any) => 
        total + (parseFloat(item.product.price) * item.quantity), 0
      );
      if (subtotal > 0) {
        calculateTaxMutation.mutate(subtotal);
      }
    }
  }, [shippingInfo.state, shippingInfo.city, shippingInfo.pincode, cart]);

  const handlePlaceOrder = () => {
    if (step === 3) {
      // Validate COD advance payment
      if (paymentMethod === 'cod' && !codAdvanceData.transactionId.trim()) {
        toast({
          title: "Transaction ID Required",
          description: "Please enter the transaction ID for the ₹99 security advance payment.",
          variant: "destructive",
        });
        return;
      }
      
      placeOrderMutation.mutate();
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="card-premium rounded-3xl max-w-md w-full">
          <CardContent className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground">Thank you for your order. We'll send you a confirmation email shortly.</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/orders")}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:from-primary/90 hover:to-primary/70"
              >
                View Orders
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full rounded-2xl"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-12 skeleton rounded-2xl mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 skeleton rounded-2xl"></div>
              <div className="h-48 skeleton rounded-2xl"></div>
            </div>
            <div className="h-96 skeleton rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover-lift rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold gradient-text">Checkout</h1>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Step {step} of 3
          </Badge>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {[
                { num: 1, label: "Address", icon: MapPin },
                { num: 2, label: "Payment", icon: CreditCard },
                { num: 3, label: "Review", icon: CheckCircle }
              ].map((s, index) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className={`flex items-center ${index < 2 ? 'flex-1' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= s.num 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      step >= s.num ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step > s.num ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <Card className="card-premium rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                        className="rounded-xl"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="rounded-xl"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={shippingInfo.email || ""}
                      onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                      className="rounded-xl"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      className="rounded-xl"
                      placeholder="123, Street Name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className="rounded-xl"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        className="rounded-xl"
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        value={shippingInfo.pincode}
                        onChange={(e) => setShippingInfo({...shippingInfo, pincode: e.target.value})}
                        className="rounded-xl"
                        placeholder="400001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Landmark (Optional)</Label>
                      <Input
                        value={shippingInfo.landmark}
                        onChange={(e) => setShippingInfo({...shippingInfo, landmark: e.target.value})}
                        className="rounded-xl"
                        placeholder="Near Park"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:from-primary/90 hover:to-primary/70"
                  >
                    Continue to Payment
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <Card className="card-premium rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <Card className={`p-4 rounded-xl cursor-pointer ${paymentMethod === 'upi' ? 'border-primary' : ''}`}>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="upi" />
                        <div className="flex-1">
                          <div className="font-medium">UPI Payment</div>
                          <div className="text-sm text-muted-foreground">Pay using UPI ID or QR Code</div>
                        </div>
                      </label>
                      {paymentMethod === 'upi' && (
                        <div className="mt-4 space-y-3">
                          <Input
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="Enter UPI ID (e.g., yourname@upi)"
                            className="rounded-xl"
                          />
                          {paymentSettings?.upiId && (
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                              <p className="text-sm font-medium text-primary mb-1">Pay to:</p>
                              <p className="text-sm font-mono">{paymentSettings.upiId}</p>
                            </div>
                          )}
                          <div className="text-center p-4 bg-muted rounded-xl">
                            <p className="text-sm text-muted-foreground mb-2">Or scan QR code</p>
                            <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center">
                              {paymentSettings?.qrCodeUrl ? (
                                <img 
                                  src={paymentSettings.qrCodeUrl} 
                                  alt="UPI QR Code" 
                                  className="w-full h-full object-contain rounded-xl"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">QR Code not configured</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                    
                    <Card className={`p-4 rounded-xl cursor-pointer ${paymentMethod === 'cod' ? 'border-primary' : ''}`}>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <RadioGroupItem value="cod" />
                        <div className="flex-1">
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-sm text-muted-foreground">Pay ₹99 security advance + remaining on delivery</div>
                        </div>
                      </label>
                      {paymentMethod === 'cod' && (
                        <div className="mt-4 space-y-4">
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-5 h-5 text-amber-600" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">Security Advance Payment</p>
                                <p className="text-xs text-amber-600">Pay ₹99 security advance now using UPI</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* UPI Payment for COD Advance */}
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <h4 className="font-medium mb-3 text-primary">Pay ₹99 Security Advance</h4>
                            
                            {paymentSettings?.upiId && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">UPI ID:</p>
                                <div className="p-3 bg-white rounded-lg border text-center">
                                  <p className="font-mono text-sm text-primary">{paymentSettings.upiId}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Amount: ₹99</p>
                                </div>
                              </div>
                            )}
                            
                            {paymentSettings?.qrCodeUrl && (
                              <div className="text-center mb-4">
                                <p className="text-sm font-medium mb-2">Or scan QR code:</p>
                                <div className="w-32 h-32 bg-white rounded-lg mx-auto p-2 border">
                                  <img 
                                    src={paymentSettings.qrCodeUrl} 
                                    alt="UPI QR Code for ₹99" 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Scan to pay ₹99</p>
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="transactionId">Transaction ID/Reference Number</Label>
                                <Input
                                  id="transactionId"
                                  value={codAdvanceData.transactionId}
                                  onChange={(e) => setCodAdvanceData({...codAdvanceData, transactionId: e.target.value})}
                                  placeholder="Enter transaction ID"
                                  className="rounded-xl mt-1"
                                  data-testid="input-transaction-id"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="paymentProof">Payment Screenshot (Optional)</Label>
                                <Input
                                  id="paymentProof"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setCodAdvanceData({...codAdvanceData, screenshotProof: e.target.files?.[0] || null})}
                                  className="rounded-xl mt-1"
                                  data-testid="input-payment-proof"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Upload screenshot of successful payment</p>
                              </div>
                              
                              {codAdvanceData.transactionId && (
                                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="text-sm text-green-800">Payment details captured. You can proceed.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </RadioGroup>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 rounded-2xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:from-primary/90 hover:to-primary/70"
                    >
                      Review Order
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="space-y-4">
                <Card className="card-premium rounded-2xl">
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Shipping Address */}
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Shipping Address</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(1)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{shippingInfo.fullName}</p>
                        <p>{shippingInfo.address}</p>
                        <p>{shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pincode}</p>
                        <p>Phone: {shippingInfo.phone}</p>
                      </div>
                    </div>
                    
                    {/* Payment Method */}
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Payment Method</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(2)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {paymentMethod === 'upi' ? `UPI - ${upiId || 'Not specified'}` : 'Cash on Delivery'}
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="space-y-3">
                      <span className="font-medium">Order Items</span>
                      {cart && Array.isArray((cart as any)?.items) ? (cart as any).items.map((item: any) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-xl">
                          <img
                            src={item.product.images?.[0] || '/api/placeholder/60/60'}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold">₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                        </div>
                      )) : null}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1 rounded-2xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:from-primary/90 hover:to-primary/70"
                    data-testid="button-place-order"
                  >
                    {placeOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="card-premium rounded-2xl">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{calculateSubtotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{parseFloat(calculateSubtotal()) > 500 ? 'FREE' : '₹50'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (GST 18%)</span>
                    <span>₹{(parseFloat(calculateSubtotal()) * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="gradient-text">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">Free Shipping over ₹500</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}