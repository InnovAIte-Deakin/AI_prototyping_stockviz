// Import necessary hooks and functions
import { useIndicators } from '../lib/queries' // Hook to fetch available indicators from the API
import { useState, useEffect } from 'react' // React hooks for state management and side effects
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, ChevronRight, RotateCcw, Info } from 'lucide-react'

// Define the properties (props) that this component can receive from its parent
type Props = {
  onChange?: (config: Record<string, any>) => void // Optional function called when config changes
  initialConfig?: Record<string, any> // Optional initial configuration to start with
}

export default function IndicatorsPanel({ onChange, initialConfig }: Props) {
  // Fetch available indicators from the backend API
  // data = list of indicators, isLoading = true while fetching
  const { data, isLoading } = useIndicators()
  
  // State to store the current configuration of selected indicators
  // Example: { "RSI": { "period": 14, "enabled": true }, "MACD": { "enabled": false } }
  const [config, setConfig] = useState<Record<string, any>>(initialConfig ?? {})
  
  // State to track which indicator groups are expanded/collapsed in the UI
  // Example: { "trend": true, "momentum": false } means trend group is open
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Effect: Update local config when parent component provides new initialConfig
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
    }
  }, [initialConfig]) // Run this effect when initialConfig changes

  // Effect: Notify parent component when our config changes
  useEffect(() => {
    onChange?.(config) // The ? means "call onChange only if it exists"
  }, [config, onChange]) // Run this effect when config or onChange changes

  // Function to expand/collapse indicator groups (like "trend", "momentum", etc.)
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev, // Keep all existing group states
      [group]: !prev[group] // Flip the state of this specific group (open becomes closed, closed becomes open)
    }))
  }

  // Function to enable/disable a specific technical indicator (like RSI, MACD, etc.)
  const toggleIndicator = (indicator: string) => {
    setConfig(prev => {
      // Create a copy of the current configuration to avoid modifying the original
      const newConfig = { ...prev }
      
      if (newConfig[indicator]) {
        // If indicator already exists in config, disable it
        newConfig[indicator] = { enabled: false }
      } else {
        // If indicator doesn't exist, enable it with default settings from the server
        // Example: RSI gets { period: 14, enabled: true }
        newConfig[indicator] = data?.defaultConfig?.[indicator] || { enabled: true }
      }
      return newConfig // Return the updated configuration
    })
  }

  // Function to update specific parameters of an indicator
  // Example: updateIndicatorConfig("RSI", "period", 21) changes RSI period from 14 to 21
  const updateIndicatorConfig = (indicator: string, key: string, value: any) => {
    setConfig(prev => {
      // Create a copy of the current configuration
      const newConfig = { ...prev }
      
      // If this indicator doesn't exist yet, create an empty object for it
      if (!newConfig[indicator]) {
        newConfig[indicator] = {}
      }
      
      // Update the specific parameter (like period, fastPeriod, etc.)
      newConfig[indicator][key] = value
      
      return newConfig // Return the updated configuration
    })
  }

  // Show loading state with modern skeleton components
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <div className="pl-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract the available indicators and their default settings from the API response
  // availableIndicators = { trend: ["SMA", "EMA"], momentum: ["RSI", "Stochastic"], ... }
  const availableIndicators = data?.availableIndicators ?? {} // Use empty object if no data
  // defaultConfig = { "RSI": { period: 14 }, "MACD": { fastPeriod: 12, slowPeriod: 26 }, ... }
  const defaultConfig = data?.defaultConfig ?? {} // Use empty object if no data

  // Count enabled indicators for the header
  const enabledCount = Object.values(config).filter(cfg => cfg?.enabled !== false).length

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Technical Indicators</CardTitle>
            <CardDescription>
              Customize which indicators to analyze ({enabledCount} selected)
            </CardDescription>
          </div>
          
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select indicators and adjust their parameters for analysis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConfig(defaultConfig)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all indicators to server defaults</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Loop through each group (trend, momentum, volatility, volume) */}
        {Object.entries(availableIndicators).map(([group, indicators]) => {
          const isExpanded = expandedGroups[group]
          const enabledInGroup = indicators.filter(indicator => 
            config[indicator]?.enabled !== false
          ).length

          return (
            <Card key={group} className="border-2">
              {/* Clickable header for each group that can expand/collapse */}
              <button
                className="w-full p-4 text-left flex justify-between items-center hover:bg-accent/50 transition-colors rounded-lg"
                onClick={() => toggleGroup(group)}
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-semibold capitalize text-sm">{group}</div>
                    <div className="text-xs text-muted-foreground">
                      {enabledInGroup} of {indicators.length} enabled
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Show the indicators inside this group only if the group is expanded */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4 space-y-3">
                  {/* Loop through each indicator in this group (like RSI, MACD, etc.) */}
                  {indicators.map(indicator => {
                    // Check if this indicator is currently enabled
                    // If enabled property is missing, we assume it's enabled
                    const isEnabled = config[indicator]?.enabled !== false
                    
                    // Get the current configuration for this indicator (periods, etc.)
                    // Use current config, fallback to server default, or empty object
                    const indicatorConfig = config[indicator] || defaultConfig[indicator] || {}
                    
                    return (
                      <Card key={indicator} className={`transition-all ${isEnabled ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
                        <CardContent className="p-4">
                          {/* Checkbox and indicator name */}
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              {/* Checkbox to enable/disable this indicator */}
                              <input
                                type="checkbox"
                                checked={isEnabled} // Show checked if indicator is enabled
                                onChange={() => toggleIndicator(indicator)} // Toggle on/off when clicked
                                className="rounded border-2 h-4 w-4 text-primary focus:ring-primary focus:ring-2"
                              />
                              {/* Display the indicator name (like "RSI", "MACD") */}
                              <div>
                                <span className="font-medium text-sm">{indicator}</span>
                                {isEnabled && (
                                  <div className="text-xs text-green-600 font-medium">Enabled</div>
                                )}
                              </div>
                            </label>
                          </div>
                          
                          {/* Show parameter controls only if indicator is enabled AND has configurable parameters */}
                          {isEnabled && defaultConfig[indicator] && (
                            <div className="mt-4 pl-7 space-y-3">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Parameters
                              </div>
                              {/* Loop through each configurable parameter (like period, fastPeriod, etc.) */}
                              {Object.entries(defaultConfig[indicator]).map(([key, defaultValue]) => (
                                <div key={key} className="flex items-center justify-between">
                                  {/* Parameter name (like "period:", "fastPeriod:") */}
                                  <label className="text-sm text-foreground capitalize font-medium">
                                    {key}:
                                  </label>
                                  {/* Number input to change the parameter value */}
                                  <Input
                                    type="number"
                                    // Show current value if set, otherwise show server default
                                    value={indicatorConfig[key] ?? defaultValue}
                                    // Update the parameter when user types a new number
                                    onChange={(e) => updateIndicatorConfig(indicator, key, Number(e.target.value))}
                                    className="w-20 h-8 text-center"
                                    min="1"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) // End of indicator item
                  })} {/* End of indicators loop */}
                </CardContent>
              )} {/* End of expanded group check */}
            </Card>
          )
        })} {/* End of groups loop */}
        
        {/* Help text at the bottom */}
        <div className="text-sm text-muted-foreground bg-accent/20 p-4 rounded-lg border">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="font-medium mb-1">How to use:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Check indicators you want to include in the analysis</li>
                <li>• Adjust parameters like periods to fine-tune calculations</li>
                <li>• Higher periods create smoother but less sensitive indicators</li>
                <li>• Use "Reset" to return to recommended default settings</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ) // End of main container
}
