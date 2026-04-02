import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Globe,
  Activity,
  Sliders,
  Settings,
  Mail,
  Github,
  Twitter
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                StockViz
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced stock analysis platform combining fundamental, technical, and sentiment analysis for intelligent investment decisions.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Website</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <BarChart3 className="h-3 w-3" />
                  <span>Home Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/indicators" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Activity className="h-3 w-3" />
                  <span>Technical Indicators</span>
                </Link>
              </li>
              <li>
                <Link to="/weights" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Sliders className="h-3 w-3" />
                  <span>Analysis Weights</span>
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Settings className="h-3 w-3" />
                  <span>Admin Panel</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <div className="text-muted-foreground flex items-center space-x-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>Fundamental Analysis</span>
                </div>
              </li>
              <li>
                <div className="text-muted-foreground flex items-center space-x-2">
                  <Activity className="h-3 w-3" />
                  <span>Technical Analysis</span>
                </div>
              </li>
              <li>
                <div className="text-muted-foreground flex items-center space-x-2">
                  <BookOpen className="h-3 w-3" />
                  <span>Sentiment Analysis</span>
                </div>
              </li>
              <li>
                <div className="text-muted-foreground flex items-center space-x-2">
                  <Sliders className="h-3 w-3" />
                  <span>Dual-Mode AI Analysis</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <BookOpen className="h-3 w-3" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>Contact Support</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Settings className="h-3 w-3" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Globe className="h-3 w-3" />
                  <span>Terms of Service</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} StockViz. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
            Made with ❤️ for intelligent investors
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
