import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../components/LoginPage';
import { useApp } from '../contexts/AppContexts.tsx';

export function LoginPageWrapper() {
    const navigate = useNavigate();
    const { setUser } = useApp();

    return (
        <LoginPage
            onLogin={(userData) => {
                setUser(userData);
                navigate('/');
            }}
            onBack={() => navigate('/')}
        />
    );
}
