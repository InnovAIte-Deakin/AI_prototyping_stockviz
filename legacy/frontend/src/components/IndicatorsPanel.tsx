// Import necessary hooks and functions
import { useIndicators } from '../lib/queries' // Hook to fetch available indicators from the API
import { useState, useEffect } from 'react' // React hooks for state management and side effects

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

  // Function to enable/disable a specific technical indicator (like RSI, MACD, e tc.)
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

  // Show loading message while fetching data from the server
  if (isLoading) return <div>Loading indicators…</div>

  // Extract the available indicators and their default settings from the API response
  // availableIndicators = { trend: ["SMA", "EMA"], momentum: ["RSI", "Stochastic"], ... }
  const availableIndicators = data?.availableIndicators ?? {} // Use empty object if no data
  // defaultConfig = { "RSI": { period: 14 }, "MACD": { fastPeriod: 12, slowPeriod: 26 }, ... }
  const defaultConfig = data?.defaultConfig ?? {} // Use empty object if no data

  return (
    <div className="grid gap-3">
      {/* Header with title and reset button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">Available Indicators</div>
        {/* Button to reset all indicators to their default server settings */}
        <button
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={() => setConfig(defaultConfig)} // Replace current config with server defaults
        >
          Reset to defaults
        </button>
      </div>
      
      {/* Container for all indicator groups */}
      <div className="space-y-2">
        {/* Loop through each group (trend, momentum, volatility, volume) */}
        {Object.entries(availableIndicators).map(([group, indicators]) => (
          <div key={group} className="border rounded-md bg-white">
            {/* Clickable header for each group that can expand/collapse */}
            <button
              className="w-full px-3 py-2 text-left flex justify-between items-center"
              onClick={() => toggleGroup(group)} // Expand or collapse this group when clicked
            >
              {/* Group name (like "trend", "momentum") with capital first letter */}
              <span className="font-medium text-sm capitalize">{group}</span>
              {/* Arrow icon that rotates when group is expanded */}
              <svg 
                className={`w-4 h-4 transition-transform ${expandedGroups[group] ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Show the indicators inside this group only if the group is expanded */}
            {expandedGroups[group] && (
              <div className="px-3 pb-3 space-y-2">
                {/* Loop through each indicator in this group (like RSI, MACD, etc.) */}
                {indicators.map(indicator => {
                  // Check if this indicator is currently enabled
                  // If enabled property is missing, we assume it's enabled
                  const isEnabled = config[indicator]?.enabled !== false
                  
                  // Get the current configuration for this indicator (periods, etc.)
                  // Use current config, fallback to server default, or empty object
                  const indicatorConfig = config[indicator] || defaultConfig[indicator] || {}
                  
                  return (
                    <div key={indicator} className="border rounded p-2">
                      {/* Checkbox and indicator name */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          {/* Checkb ox to enable/disable this indicator */}
                          <input
                            type="checkbox"
                            checked={isEnabled} // Show checked if indicator is enabled
                            onChange={() => toggleIndicator(indicator)} // Toggle on/off when clicked
                            className="rounded"
                          />
                          {/* Display the indicator name (like "RSI", "MACD") */}
                          <span className="text-sm font-medium">{indicator}</span>
                        </label>
                      </div>
                      
                      {/* Show parameter controls only if indicator is enabled AND has configurable parameters */}
                      {isEnabled && defaultConfig[indicator] && (
                        <div className="mt-2 pl-6 space-y-2">
                          {/* Loop through each configurable parameter (like period, fastPeriod, etc.) */}
                          {Object.entries(defaultConfig[indicator]).map(([key, defaultValue]) => (
                            <div key={key} className="flex items-center justify-between">
                              {/* Parameter name (like "period:", "fastPeriod:") */}
                              <label className="text-xs text-slate-600 capitalize">{key}:</label>
                              {/* Number input to change the parameter value */}
                              <input
                                type="number"
                                // Show current value if set, otherwise show server default
                                value={indicatorConfig[key] ?? defaultValue}
                                // Update the parameter when user types a new number
                                onChange={(e) => updateIndicatorConfig(indicator, key, Number(e.target.value))}
                                className="w-16 text-xs border rounded px-1 py-0.5"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) // End of indicator item
                })} {/* End of indicators loop */}
              </div>
            )} {/* End of expanded group check */}
          </div>
        ))} {/* End of groups loop */}
      </div>
      
      {/* Help text at the bottom */}
      <div className="text-xs text-slate-500">
        Select which indicators to calculate and customize their parameters.
      </div>
    </div>
  ) // End of main container
}