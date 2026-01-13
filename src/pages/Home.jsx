import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { user } = useAuth();
    const [dayCount, setDayCount] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        calculateDay();
    }, [user]);

    const calculateDay = async () => {
        try {
            // Find the earliest task to determine start date
            const { data, error } = await supabase
                .from('tasks')
                .select('date')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
                .limit(1);

            if (data && data.length > 0) {
                const start = new Date(data[0].date);
                const now = new Date();
                const diffTime = Math.abs(now - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setDayCount(diffDays || 1);
            }
        } catch (error) {
            console.error('Error calculating day:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalDays = 90;
    const progress = (dayCount / totalDays) * 100;
    const mission = "Disappear. Focus. Rebuild.";

    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-muted text-mono" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    GHOST MODE CONTRACT
                </h2>

                <h1 style={{ fontSize: '4rem', margin: '2rem 0', fontWeight: 600, letterSpacing: '-0.03em' }}>
                    DAY {dayCount} <span className="text-muted" style={{ fontSize: '2rem', fontWeight: 300 }}>/ {totalDays}</span>
                </h1>

                <div style={{ margin: '3rem auto', maxWidth: '400px', height: '4px', background: 'var(--surface-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                        style={{ height: '100%', background: 'var(--accent-color)' }}
                    />
                </div>

                <p style={{ fontSize: '1.25rem', margin: '3rem 0', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    "{mission}"
                </p>

                <Link to="/daily">
                    <motion.button
                        whileHover={{ scale: 1.05, borderColor: 'var(--accent-color)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '1.2rem 3rem',
                            fontSize: '1rem',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            marginTop: '2rem',
                            letterSpacing: '0.15em',
                            fontWeight: 600,
                            borderRadius: '4px'
                        }}
                    >
                        ENTER TODAY'S MISSION
                    </motion.button>
                </Link>

            </motion.div>
        </div>
    );
}
