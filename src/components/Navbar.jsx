import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const links = [
    { path: '/', label: 'HOME' },
    { path: '/daily', label: 'DAILY' },
    { path: '/books', label: 'BOOKS' },
    { path: '/journal', label: 'JOURNAL' },
    { path: '/rules', label: 'RULES' },
    { path: '/stats', label: 'STATS' },
];

export default function Navbar() {
    const location = useLocation();

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            padding: '2rem 1rem',
            borderBottom: '1px solid var(--surface-color)'
        }}>
            {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                    <Link key={link.path} to={link.path} style={{ position: 'relative', padding: '0.5rem 0' }}>
                        <span style={{
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}>
                            {link.label}
                        </span>
                        {isActive && (
                            <motion.div
                                layoutId="underline"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    background: 'var(--accent-color)'
                                }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
