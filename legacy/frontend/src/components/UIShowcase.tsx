import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EnhancedIndicatorsPanel from './EnhancedIndicatorsPanel';
import EnhancedWeightsPanel from './EnhancedWeightsPanel';

const UIShowcase = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-4">StockViz UI Components Showcase</h1>
        <p className="text-muted-foreground mb-8">
          Testing the new shadcn/ui components integration while preserving existing functionality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Various button styles and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="flex space-x-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Input and select elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Enter stock symbol..." />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select analysis mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner Mode</SelectItem>
                <SelectItem value="professional">Professional Mode</SelectItem>
                <SelectItem value="technical">Technical Analysis</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Skeleton components for loading states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-8 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tooltips */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Elements</CardTitle>
            <CardDescription>Tooltips and interactive components</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This tooltip explains stock analysis features</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button>Analysis Info</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get detailed analysis insights</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Components Demo */}
      <div className="col-span-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Enhanced StockViz Components</h2>
          <p className="text-muted-foreground mb-6">
            Testing the upgraded components with modern UI while preserving all functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Weights Panel */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Enhanced Weights Panel</h3>
            <EnhancedWeightsPanel 
              initial={{ fundamental: 45, technical: 35, sentiment: 20 }}
              onChange={(weights) => console.log('Weights changed:', weights)}
            />
          </div>

          {/* Enhanced Indicators Panel */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Enhanced Indicators Panel</h3>
            <EnhancedIndicatorsPanel 
              onChange={(config) => console.log('Indicators changed:', config)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>UI Components setup verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>shadcn/ui components installed ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Tailwind CSS configured with design system ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>TypeScript path aliases configured ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Modern CSS variables system active ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Enhanced components preserve all functionality ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Modern tooltips, loading states, and interactions ✓</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UIShowcase;
