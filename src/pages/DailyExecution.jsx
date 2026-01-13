import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, Clock } from 'lucide-react';

const MISSION_TASKS = [
    // Morning
    { key: 'wake', title: 'Wake up (6:30 AM)', group: '🌅 Morning' },
    { key: 'brush', title: 'Brush', group: '🌅 Morning' },
    { key: 'bath', title: 'Bath', group: '🌅 Morning' },
    { key: 'stretch', title: '5 min stretching', group: '🌅 Morning' },
    { key: 'breakfast', title: 'Breakfast', group: '🌅 Morning' },
    { key: 'plan', title: 'Plan today (2 min)', group: '🌅 Morning' },
    // Midday
    { key: 'lunch', title: 'Lunch', group: '🧘 Midday Health' },
    { key: 'rest', title: '20 min rest (no phone)', group: '🧘 Midday Health' },
    { key: 'walk', title: 'Short walk (10 min)', group: '🧘 Midday Health' },
    // Evening
    { key: 'workout', title: 'Light workout / skipping', group: '🎮 Evening Recharge' },
    { key: 'games', title: 'Games / Free time', group: '🎮 Evening Recharge' },
    { key: 'tea', title: 'Tea / Snack break', group: '🎮 Evening Recharge' },
    // Night
    { key: 'dinner', title: 'Dinner', group: '🌙 Night Shutdown' },
    { key: 'revise', title: 'Quick revision (15 min)', group: '🌙 Night Shutdown' },
    { key: 'phone_off', title: 'Phone off / Relax', group: '🌙 Night Shutdown' },
    { key: 'sleep', title: 'Sleep (11:30 PM)', group: '🌙 Night Shutdown' },
];

export default function DailyExecution() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTodaysTasks = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Get existing tasks for today
            const { data: existingTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today);

            if (error) throw error;

            // 2. Check if we need to initialize tasks for today
            // We check if ALL mission tasks are present in DB
            const existingTitles = existingTasks.map(t => t.title);
            const missingTasks = MISSION_TASKS.filter(mt => !existingTitles.includes(mt.title));

            if (missingTasks.length > 0) {
                const newTasksPayload = missingTasks.map(mt => ({
                    user_id: user.id,
                    title: mt.title,
                    date: today,
                    completed: false,
                    time_spent: '',
                    note: ''
                }));

                const { error: insertError } = await supabase
                    .from('tasks')
                    .insert(newTasksPayload);

                if (insertError) throw insertError;

                // Re-fetch after insert
                return fetchTodaysTasks();
            }

            // 3. Merge DB data with static config
            const mergedTasks = MISSION_TASKS.map(mt => {
                const dbTask = existingTasks.find(t => t.title === mt.title);
                return {
                    ...mt,
                    ...dbTask,
                    id: dbTask?.id
                };
            });

            setTasks(mergedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTodaysTasks();
    }, [fetchTodaysTasks]);

    const toggleTask = async (id, currentStatus) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

        try {
            await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
        } catch (error) {
            console.error('Error upgrading task:', error);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = (completedCount / MISSION_TASKS.length) * 100;

    // Group tasks
    const groupedTasks = MISSION_TASKS.reduce((acc, task) => {
        if (!acc[task.group]) acc[task.group] = [];
        acc[task.group].push(task);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="container flex-center" style={{ minHeight: '50vh' }}>
                <p className="text-muted text-mono">INITIALIZING PROTOCOLS...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '650px', marginTop: '3rem', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>DAILY ROUTINE</h1>
                <p className="text-muted text-mono" style={{ fontSize: '0.8rem' }}>CONSISTENCY IS THE KEY.</p>

                <div style={{
                    height: '8px',
                    background: 'var(--surface-color)',
                    width: '100%',
                    borderRadius: '4px',
                    margin: '1.5rem 0',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        style={{
                            height: '100%',
                            background: 'var(--success-color)',
                            boxShadow: '0 0 15px var(--success-color)' // The Glow Effect
                        }}
                    />
                </div>

                <div className="flex-between text-mono text-muted" style={{ fontSize: '0.8rem' }}>
                    <span>{progress.toFixed(0)}% COMPLETE</span>
                    <span>{completedCount} / {MISSION_TASKS.length}</span>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                    <div key={groupName}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '1rem',
                            letterSpacing: '0.1em',
                            borderBottom: '1px solid var(--surface-color)',
                            paddingBottom: '0.5rem'
                        }} className="text-mono">
                            {groupName.toUpperCase()}
                        </h3>

                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {groupTasks.map((staticTask) => {
                                const task = tasks.find(t => t.title === staticTask.title) || staticTask;
                                return (
                                    <motion.div
                                        key={task.title}
                                        layout
                                        onClick={() => task.id && toggleTask(task.id, task.completed)}
                                        className="card"
                                        style={{
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            borderColor: task.completed ? 'rgba(0, 255, 0, 0.2)' : 'var(--border-color)',
                                            background: task.completed ? 'rgba(0, 255, 0, 0.03)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                        whileHover={{ x: 5 }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: `2px solid ${task.completed ? 'var(--success-color)' : 'var(--text-tertiary)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {task.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: '10px', height: '10px', background: 'var(--success-color)', borderRadius: '50%' }} />}
                                        </div>
                                        <span style={{
                                            textDecoration: task.completed ? 'line-through' : 'none',
                                            color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                            fontSize: '0.95rem'
                                        }}>
                                            {task.title}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
