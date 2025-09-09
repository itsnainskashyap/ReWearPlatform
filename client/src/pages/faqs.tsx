import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, ChevronDown, ChevronUp, HelpCircle, Package, CreditCard, Truck } from "lucide-react";
import { useLocation } from "wouter";

export default function FAQs() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqCategories = [
    {
      title: "Orders & Shipping",
      icon: Package,
      faqs: [
        {
          question: "How long does shipping take?",
          answer: "Standard shipping takes 3-5 business days within India. Express shipping takes 1-2 business days for major cities."
        },
        {
          question: "Can I track my order?",
          answer: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order in the 'My Orders' section of your account."
        },
        {
          question: "What if my order is damaged?",
          answer: "If your order arrives damaged, please contact us within 48 hours with photos of the damaged items. We'll arrange a replacement or full refund."
        }
      ]
    },
    {
      title: "Payments",
      icon: CreditCard,
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept UPI payments and Cash on Delivery (COD). For UPI, simply scan our QR code and confirm payment."
        },
        {
          question: "Is UPI payment secure?",
          answer: "Yes, UPI payments are completely secure. We use bank-grade encryption and never store your payment information."
        },
        {
          question: "What if I accidentally paid twice?",
          answer: "If you've made a duplicate payment, please contact us immediately with your transaction details. We'll process a refund within 3-5 business days."
        }
      ]
    },
    {
      title: "Products & Sizing",
      icon: Truck,
      faqs: [
        {
          question: "How do I know my size?",
          answer: "Each product page has a detailed size guide. You can also contact us for personalized sizing advice based on your measurements."
        },
        {
          question: "What's the difference between Thrift and Originals?",
          answer: "Thrift items are carefully curated pre-loved pieces in excellent condition. ReWeara Originals are brand new, sustainably-made pieces designed by our team."
        },
        {
          question: "Are the thrift items authentic?",
          answer: "Absolutely! Every thrift item is carefully authenticated and verified before being listed on our platform."
        }
      ]
    }
  ];

  const allFAQs = faqCategories.flatMap((category, categoryIndex) =>
    category.faqs.map((faq, faqIndex) => ({
      ...faq,
      id: categoryIndex * 100 + faqIndex,
      category: category.title
    }))
  );

  const filteredFAQs = searchQuery
    ? allFAQs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFAQs;

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
          <h1 className="text-2xl font-bold gradient-text">FAQs</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3 animate-fadeInUp">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Find quick answers to common questions about ReWeara
          </p>
        </div>

        {/* Search */}
        <div className="relative animate-slideInLeft">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl glassmorphism border-white/20"
          />
        </div>

        {/* FAQ Categories */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {faqCategories.map((category, index) => (
              <Card
                key={index}
                className="card-premium rounded-2xl hover-lift animate-slideInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.faqs.length} questions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => (
            <Card
              key={faq.id}
              className="card-premium rounded-2xl overflow-hidden animate-slideInRight"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full p-6 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {searchQuery && (
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full mb-2 inline-block">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-left">{faq.question}</h3>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                  )}
                </div>
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-6 border-t border-white/10 animate-slideInDown">
                  <p className="text-muted-foreground leading-relaxed pt-4">
                    {faq.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredFAQs.length === 0 && searchQuery && (
          <div className="text-center py-12 animate-fadeInUp">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or browse our categories above
            </p>
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="rounded-2xl"
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* Contact CTA */}
        <Card className="card-premium rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 animate-scaleIn">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Still have questions?</h3>
            <p className="text-muted-foreground">
              Our team is here to help you with any questions or concerns
            </p>
            <Button
              onClick={() => navigate("/contact")}
              className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl button-glow hover-lift"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}