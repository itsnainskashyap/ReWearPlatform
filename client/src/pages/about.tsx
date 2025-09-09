import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Users, Leaf, Award } from "lucide-react";
import { useLocation } from "wouter";

export default function About() {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Committed to reducing fashion waste through thrift and eco-conscious originals"
    },
    {
      icon: Heart,
      title: "Quality",
      description: "Carefully curated pieces that meet our high standards for style and condition"
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a community of conscious fashion lovers who care about the planet"
    },
    {
      icon: Award,
      title: "Authenticity",
      description: "Every piece is verified and authentic, from vintage finds to our original designs"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
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
          <h1 className="text-2xl font-bold gradient-text">About ReWeara</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fadeInUp">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-4xl">R</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3 gradient-text">ReWeara</h2>
            <p className="text-xl text-muted-foreground">Curated Thrift. Crafted Originals.</p>
            <p className="text-lg text-muted-foreground mt-2">Sustainable, verified, ready-to-wear fashion.</p>
          </div>
        </div>

        {/* Story Section */}
        <Card className="card-premium rounded-3xl animate-slideInLeft">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-2xl font-bold">Our Story</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ReWeara was born from a simple belief: fashion should be sustainable, accessible, and authentic. 
                Founded by <strong className="text-primary">Nains</strong>, our platform bridges the gap between 
                conscious consumption and contemporary style.
              </p>
              <p>
                We're more than just an online store. We're a movement towards responsible fashion that doesn't 
                compromise on style. Every thrift piece is carefully curated, and every ReWeara Original is 
                crafted with sustainability at its core.
              </p>
              <p>
                Our mission is to make sustainable fashion the norm, not the exception. Through our dual approach 
                of thrift curation and original designs, we're building a future where looking good and doing 
                good go hand in hand.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Founder Section */}
        <Card className="card-premium rounded-3xl animate-slideInRight">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-2xl">N</span>
              </div>
              <div>
                <h4 className="text-xl font-bold">Nains</h4>
                <p className="text-muted-foreground">Founder & Creative Director</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              With a passion for sustainable fashion and years of experience in the industry, Nains founded 
              ReWeara to create a platform where style meets sustainability. Their vision is to make conscious 
              fashion choices accessible to everyone while supporting local artisans and reducing fashion waste.
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Our Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((value, index) => (
              <Card
                key={index}
                className={`card-premium rounded-2xl hover-lift transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100 + 600}ms` }}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">{value.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="card-premium rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 animate-scaleIn">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Join the ReWeara Community</h3>
            <p className="text-muted-foreground">
              Be part of the sustainable fashion revolution. Every purchase makes a difference.
            </p>
            <div className="flex space-x-3 justify-center">
              <Button
                onClick={() => navigate("/shop")}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl button-glow hover-lift"
              >
                Shop Now
              </Button>
              <Button
                onClick={() => navigate("/contact")}
                variant="outline"
                className="rounded-2xl"
              >
                Get in Touch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}