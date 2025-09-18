import { useState } from 'react';
import { alphaVantageService } from '../services/alphaVantageService';

// Simple component to test if our API connection works
export const ApiTest = () => {
  // State to store the test results
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to test the API
  const testApi = async () => {
    setLoading(true);  // Show loading state
    setError(null);    // Clear any previous errors
    
    try {
      console.log('Testing API with key:', import.meta.env.VITE_ALPHAVANTAGE_API_KEY);
      
      // Try to get Apple's company overview
      const data = await alphaVantageService.getCompanyOverview('AAPL');
      
      console.log('API Response:', data);
      setResult(data);   // Store the result
      
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>🧪 Alpha Vantage API Test</h3>
      
      {/* Button to start the test */}
      <button 
        onClick={testApi} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {loading ? '🔄 Testing...' : '🚀 Test API Connection'}
      </button>

      {/* Show current API key (first 8 characters for security) */}
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        API Key: {import.meta.env.VITE_ALPHAVANTAGE_API_KEY ? 
          `${import.meta.env.VITE_ALPHAVANTAGE_API_KEY.substring(0, 8)}...` : 
          '❌ Not found'
        }
      </div>

      {/* Show loading message */}
      {loading && (
        <div style={{ 
          marginTop: '10px', 
          color: '#666',
          padding: '10px',
          backgroundColor: '#f0f8ff',
          borderRadius: '4px'
        }}>
          🔍 Testing API connection to Alpha Vantage...
        </div>
      )}

      {/* Show error if there is one */}
      {error && (
        <div style={{ 
          marginTop: '10px', 
          color: '#d32f2f', 
          padding: '10px', 
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          border: '1px solid #ffcdd2'
        }}>
          <strong>❌ Error:</strong> {error}
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            Common fixes:
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Check if .env file exists in project root</li>
              <li>Restart the development server</li>
              <li>Verify API key is correct</li>
              <li>Check internet connection</li>
            </ul>
          </div>
        </div>
      )}

      {/* Show successful result */}
      {result && !error && (
        <div style={{ marginTop: '10px' }}>
          <h4>✅ API Test Successful!</h4>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>🏢 Company:</strong> {result.Name || 'N/A'}
              </div>
              <div>
                <strong>📊 Symbol:</strong> {result.Symbol || 'N/A'}
              </div>
              <div>
                <strong>🏭 Sector:</strong> {result.Sector || 'N/A'}
              </div>
              <div>
                <strong>💰 Market Cap:</strong> {result.MarketCapitalization ? 
                  `$${(parseFloat(result.MarketCapitalization) / 1e9).toFixed(1)}B` : 'N/A'}
              </div>
              <div>
                <strong>📈 P/E Ratio:</strong> {result.PERatio || 'N/A'}
              </div>
              <div>
                <strong>💵 52 Week High:</strong> ${result['52WeekHigh'] || 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Show raw JSON data (collapsed by default) */}
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📋 Show Raw JSON Data
            </summary>
            <pre style={{ 
              backgroundColor: '#f1f1f1', 
              padding: '10px', 
              overflow: 'auto', 
              fontSize: '11px',
              maxHeight: '300px',
              borderRadius: '4px',
              marginTop: '5px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
