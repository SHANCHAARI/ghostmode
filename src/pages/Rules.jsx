import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const RULES = [
    "No Social Media (IG, X, TikTok, FB)",
    "No Video Games",
    "No Junk Food / Sugar",
    "No Porn / Masturbation",
    "No Alcohol / Drugs",
    "Wake up by 6:00 AM",
    "Cold Shower Daily"
];

export default function Rules() {
    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}
                >
                    <Lock size={48} />
                </motion.div>
                <h1 style={{ fontWeight: 300, marginBottom: '0.5rem' }}>THE LAW</h1>
                <p className="text-muted">Non-negotiable parameters.</p>
            </header>

            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {RULES.map((rule, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', background: 'var(--error-color)', borderRadius: '50%' }} />
                        <span style={{ fontSize: '1.1rem' }}>{rule}</span>
                    </motion.div>
                ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                STATUS: <span style={{ color: 'var(--success-color)' }}>LOCKED & ACTIVE</span>
            </div>
        </div>
    );
}
