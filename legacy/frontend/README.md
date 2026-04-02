# StockViz Frontend

A modern React-based frontend for stock analysis and visualization.

## Features

- 🔍 **Stock Search**: Search for stocks by symbol with autocomplete
- 📊 **Technical Analysis**: View technical indicators and charts
- 📈 **Fundamental Analysis**: Access fundamental data and metrics
- 💭 **Sentiment Analysis**: Get AI-powered sentiment insights
- 🎯 **Custom Weights**: Adjust analysis weights for personalized results
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Data**: Live stock data and trending information

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Lightweight Charts** - Interactive financial charts
- **Zod** - Runtime type validation
- **Axios** - HTTP client

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `VITE_API_BASE_URL` to your backend URL.

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter (placeholder)

## Pages

- **Home** (`/`) - Search stocks and view trending data
- **Symbol Analysis** (`/symbol/:symbol`) - Detailed analysis for a specific stock
- **Indicators** (`/indicators`) - Configure technical indicators
- **Weights** (`/weights`) - Adjust analysis weights
- **Admin** (`/admin`) - System diagnostics and cache management

## Environment Variables

| Variable            | Description         | Default                 |
| ------------------- | ------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API URL     | `http://localhost:3001` |
| `VITE_DEV_MODE`     | Enable dev features | `true`                  |

## Key Components

### Core Components

- `AppShell` - Main layout with navigation
- `SearchBox` - Stock symbol search with autocomplete
- `TrendingTabs` - Display trending stocks by category
- `PriceChart` - Interactive price charts
- `ErrorBoundary` - Error handling wrapper

### Analysis Components

- `WeightsPanel` - Adjust fundamental/technical/sentiment weights
- `IndicatorsPanel` - Configure technical indicators
- `ScoreBadge` - Display color-coded scores
- `RecommendationChip` - Buy/Hold/Sell recommendations
- `AISummary` - AI-generated insights

### Utility Components

- `LoadingSpinner` - Consistent loading states
- `EmptyState` - Empty state handling

## API Integration

The frontend communicates with the backend through a REST API:

- **Search**: `/api/stocks/search?query={symbol}`
- **Trending**: `/api/stocks/trending?category={gainers|losers|mostActive}`
- **Analysis**: `/api/stocks/analysis/{symbol}`
- **Indicators**: `/api/stocks/indicators`
- **Weights**: `/api/stocks/weights/defaults`

## State Management

- **React Query** - Server state management and caching
- **React Router** - URL state for navigation
- **URL State Encoding** - Persist analysis parameters in URL
- **Local State** - Component-level state with React hooks

## Error Handling

- **Error Boundary** - Catches React component errors
- **API Error Handling** - Graceful API error responses
- **Loading States** - User feedback during async operations
- **Empty States** - Handles no-data scenarios

## Performance

- **Code Splitting** - Automatic route-based splitting
- **Query Caching** - Intelligent data caching with React Query
- **Optimized Builds** - Vite's optimized production builds
- **Lazy Loading** - Components loaded on demand

## Development

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import where needed
4. Add TypeScript types

### Adding New Pages

1. Create page in `src/pages/`
2. Add route to `App.tsx`
3. Update navigation in `AppShell.tsx`

### API Integration

1. Add types to `src/lib/types.ts`
2. Add query hook to `src/lib/queries.ts`
3. Use hook in components

## Building for Production

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Preview the build**:

   ```bash
   npm run preview
   ```

3. **Deploy** the `dist/` folder to your hosting provider

## Troubleshooting

### Common Issues

- **CORS errors**: Ensure backend allows frontend origin
- **API connection**: Check `VITE_API_BASE_URL` in `.env`
- **Build errors**: Run `npm install` to ensure dependencies
- **Type errors**: Check TypeScript configuration

### Performance Issues

- Clear browser cache
- Check React Query devtools
- Monitor network requests
- Verify backend response times

## Contributing

1. Follow existing code style
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Ensure accessibility compliance
5. Update documentation as needed
