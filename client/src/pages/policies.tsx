import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Truck, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function Policies() {
  const [, navigate] = useLocation();

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
          <h1 className="text-2xl font-bold gradient-text">Policies</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="shipping" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glassmorphism rounded-2xl p-1 mb-6">
            <TabsTrigger value="shipping" className="rounded-xl">Shipping</TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-xl">Privacy</TabsTrigger>
            <TabsTrigger value="terms" className="rounded-xl">Terms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shipping" className="space-y-6">
            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Shipping & Returns Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Standard Shipping:</strong> 3-5 business days (Free on orders above ₹500)</p>
                    <p><strong>Express Shipping:</strong> 1-2 business days (₹50 extra)</p>
                    <p><strong>Cash on Delivery:</strong> Available for orders under ₹5000</p>
                    <p>We ship across India. Delivery times may vary for remote locations.</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Returns & Exchanges</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We accept returns within <strong>7 days</strong> of delivery for unworn items with original tags.</p>
                    <p><strong>Return Process:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Contact our support team</li>
                      <li>Pack items in original packaging</li>
                      <li>Schedule pickup or drop at our partner location</li>
                      <li>Refund processed within 5-7 business days</li>
                    </ul>
                    <p><strong>Non-returnable items:</strong> Undergarments, swimwear, and personalized items.</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Damage & Quality Issues</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>If you receive damaged or incorrect items, please contact us within 48 hours with photos.</p>
                    <p>We'll arrange for immediate replacement or full refund at no additional cost.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-6">
            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We collect information to provide better services to our users:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Personal Information:</strong> Name, email, phone, shipping address</li>
                      <li><strong>Order Information:</strong> Purchase history, preferences</li>
                      <li><strong>Technical Information:</strong> Device info, IP address, browsing data</li>
                      <li><strong>Communication:</strong> Customer service interactions</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">How We Use Your Information</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Process and fulfill your orders</li>
                      <li>Provide customer support</li>
                      <li>Send order updates and notifications</li>
                      <li>Improve our services and user experience</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Security</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We implement appropriate security measures to protect your personal information:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>SSL encryption for all data transmission</li>
                      <li>Secure payment processing</li>
                      <li>Regular security audits</li>
                      <li>Limited access to personal data</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Access your personal data</li>
                      <li>Correct inaccurate information</li>
                      <li>Delete your account and data</li>
                      <li>Opt-out of marketing communications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="terms" className="space-y-6">
            <Card className="card-premium rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Acceptance of Terms</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>By accessing and using ReWeara's website and services, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Use License</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>Permission is granted to temporarily download one copy of ReWeara's materials for personal, non-commercial transitory viewing only.</p>
                    <p><strong>This license shall automatically terminate if you violate any of these restrictions.</strong></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">User Account</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
                    <p>You are responsible for safeguarding your account and all activities that occur under your account.</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Prohibited Uses</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>You may not use our service:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>For any unlawful purpose</li>
                      <li>To transmit harmful code or viruses</li>
                      <li>To impersonate another person</li>
                      <li>To violate any laws in your jurisdiction</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Limitation of Liability</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>ReWeara shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}