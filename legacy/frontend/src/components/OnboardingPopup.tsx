import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  BarChart3,
  Globe,
  BookOpen,
  Wallet,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  content: React.ReactNode;
}

const OnboardingPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('stockviz_onboarding_completed');
    
    if (!hasSeenOnboarding) {
      // Show onboarding after a brief delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to StockViz",
      description: "Your comprehensive stock analysis platform",
      icon: TrendingUp,
      color: "from-blue-500 to-purple-600",
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg animate-pulse">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Welcome to StockViz
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Discover powerful stock analysis tools, real-time market data, and educational resources all in one platform.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-xs font-medium">Analysis</p>
              </CardContent>
            </Card>
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <Globe className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-xs font-medium">Market</p>
              </CardContent>
            </Card>
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <BookOpen className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-xs font-medium">Learn</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Explore Features",
      description: "Discover what makes StockViz special",
      icon: Sparkles,
      color: "from-purple-500 to-pink-600",
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Everything You Need</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Advanced Analytics</h4>
                <p className="text-sm text-muted-foreground">Technical & fundamental analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-lg">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Market Overview</h4>
                <p className="text-sm text-muted-foreground">Real-time market data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-lg">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Portfolio Tracking</h4>
                <p className="text-sm text-muted-foreground">Manage your investments</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    // Mark as completed but don't prevent showing again
  };

  const handleComplete = () => {
    localStorage.setItem('stockviz_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index <= currentStep
                      ? `bg-gradient-to-r ${currentStepData.color}`
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </div>
          <DialogTitle className="text-left">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}
        </div>

        <div className="flex justify-between space-x-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            className={`flex-1 bg-gradient-to-r ${currentStepData.color} text-white hover:opacity-90`}
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingPopup;
