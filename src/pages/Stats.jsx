import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Stats() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalMissions: 0,
        booksRead: 0,
        activeDays: 0,
        consistency: [] // Array of booleans or status for last 90 days
    });

    useEffect(() => {
        if (!user) return;
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            // 1. Total Completed Missions
            const { count: missionsCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('completed', true);

            // 2. Books Read
            const { count: booksCount } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'Finished');

            // 3. Consistency (Get all tasks, group by date locally)
            const { data: tasks } = await supabase
                .from('tasks')
                .select('date, completed')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            // Process consistency
            const daysMap = {};
            tasks.forEach(t => {
                if (!daysMap[t.date]) daysMap[t.date] = 0;
                if (t.completed) daysMap[t.date]++;
            });

            // Active days (days with at least 1 completion)
            const activeDaysCount = Object.keys(daysMap).filter(d => daysMap[d] > 0).length;

            // Generate grid for last 90 days
            const today = new Date();
            const grid = [];
            for (let i = 0; i < 90; i++) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const completions = daysMap[dateStr] || 0;

                // Color intensity based on completions (0-5)
                let intensity = 0;
                if (completions > 0) intensity = 0.4;
                if (completions > 3) intensity = 0.7;
                if (completions >= 5) intensity = 1; // Full day

                grid.push({ date: dateStr, intensity });
            }

            setStats({
                totalMissions: missionsCount || 0,
                booksRead: booksCount || 0,
                activeDays: activeDaysCount,
                consistency: grid.reverse() // Oldest first for grid usually? Or newest top-left? 
                // Usually GitHub graph is left-right (oldest -> newest). 
                // Let's do newest last (so reverse the "backwards" loop)
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 style={{ fontWeight: 600, marginBottom: '2rem', textAlign: 'center', letterSpacing: '-0.02em' }}>DATA</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                <StatCard label="MISSIONS COMPLETED" value={stats.totalMissions} />
                <StatCard label="BOOKS FINISHED" value={stats.booksRead} />
                <StatCard label="ACTIVE DAYS" value={stats.activeDays} />
                <StatCard label="COMPLETION RATE" value={`${Math.round((stats.activeDays / 90) * 100)}%`} />
            </div>

            <div style={{ marginTop: '4rem' }}>
                <h3 className="text-muted text-mono" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>CONSISTENCY MAP (LAST 90 DAYS)</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(24px, 1fr))',
                    gap: '6px',
                    maxWidth: '100%'
                }}>
                    {stats.consistency.map((day, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.005 }}
                            title={day.date}
                            style={{
                                aspectRatio: '1/1',
                                background: day.intensity > 0 ? `rgba(0, 255, 0, ${day.intensity})` : 'var(--surface-hover)',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="card"
            style={{ textAlign: 'center', padding: '2rem 1rem' }}
        >
            <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{value}</div>
            <div className="text-muted text-mono" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{label}</div>
        </motion.div>
    )
}
