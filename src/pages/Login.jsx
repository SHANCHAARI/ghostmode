import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        // For demo, just redirect
        setTimeout(() => {
            navigate('/');
        }, 1000);
        // await signIn(email, password);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <h1 style={{ letterSpacing: '0.2em', marginBottom: '2rem' }}>GHOST MODE 90</h1>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <input type="email" placeholder="Email" required style={{ padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }} />
                <input type="password" placeholder="Password" required style={{ padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }} />

                <button
                    disabled={loading}
                    style={{
                        padding: '1rem',
                        background: 'var(--text-primary)',
                        color: 'var(--bg-color)',
                        fontWeight: 600,
                        marginTop: '1rem'
                    }}
                >
                    {loading ? 'ENTERING...' : 'ENTER'}
                </button>
            </form>
        </div>
    );
}
