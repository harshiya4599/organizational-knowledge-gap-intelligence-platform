import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <AppRoutes />
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
