import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../components/LoginPage';
import { useApp } from '../contexts/AppContexts';

export function LoginPageWrapper() {
  const navigate = useNavigate();
  const { setAuth } = useApp();

  return (
    <LoginPage
      onLogin={(token, user) => {
        setAuth(token, user);
        navigate('/');
      }}
      onBack={() => navigate('/')}
    />
  );
}
