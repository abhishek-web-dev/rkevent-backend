import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

// Setup central React Query fetch controller
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          {/* Custom style for system alerts */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(20, 14, 33, 0.95)',
                color: '#f1f5f9',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'Outfit, sans-serif',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
