import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MISSION_TASKS = [
    { key: 'deepwork', title: 'Deep Work', hasTime: true, target: '4 hrs' },
    { key: 'skill', title: 'Skill Learning', hasTime: true, target: '1 hr' },
    { key: 'exercise', title: 'Exercise', hasTime: true, target: '45 mins' },
    { key: 'reading', title: 'Reading', hasTime: true, target: '30 mins' },
    { key: 'journal', title: 'Journal', hasTime: false, target: '1 entry' },
];

export default function DailyExecution() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTodaysTasks = useCallback(async () => {
        if (!user) return;

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
            if (existingTasks.length < MISSION_TASKS.length) {
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
            }

            // 3. Merge DB data with static config (for targets etc)
            const mergedTasks = MISSION_TASKS.map(mt => {
                const dbTask = existingTasks.find(t => t.title === mt.title);
                return {
                    ...mt,
                    ...dbTask, // overwrites key, title with DB version (mostly same), adds id, completed, etc.
                    // If dbTask is missing (shouldn't happen after step 2), we'd have issues, but we handle it.
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
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

        try {
            await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
        } catch (error) {
            console.error('Error upgrading task:', error);
            // Revert on error
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
        }
    };

    const updateTaskField = async (id, field, value) => {
        // Update local state immediately
        setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const saveTaskField = async (id, field, value) => {
        // Persist to DB on blur
        try {
            await supabase.from('tasks').update({ [field]: value }).eq('id', id);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    // Calculate progress
    const completedCount = tasks.filter(t => t.completed).length;
    const progress = (completedCount / MISSION_TASKS.length) * 100;

    if (loading) {
        return (
            <div className="container flex-center" style={{ minHeight: '50vh' }}>
                <p className="text-muted text-mono">INITIALIZING MISSION PROTOCOLS...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '650px', marginTop: '3rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>TODAY'S MISSION</h1>

                <div style={{
                    height: '6px',
                    background: 'var(--surface-color)',
                    width: '100%',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    margin: '1.5rem 0'
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        style={{ height: '100%', background: 'var(--success-color)' }}
                    />
                </div>

                <div className="flex-between text-mono text-muted" style={{ fontSize: '0.8rem' }}>
                    <span>STATUS: {completedCount === MISSION_TASKS.length ? 'MISSION COMPLETE' : 'IN PROGRESS'}</span>
                    <span>{completedCount} / {MISSION_TASKS.length} OBJECTIVES</span>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map((task) => (
                    <motion.div
                        key={task.key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{
                            borderColor: task.completed ? 'rgba(0, 255, 0, 0.2)' : 'var(--border-color)',
                            background: task.completed ? 'rgba(0, 255, 0, 0.03)' : 'rgba(10, 10, 10, 0.6)',
                            padding: '1.25rem'
                        }}
                    >
                        <div
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            onClick={() => task.id && toggleTask(task.id, task.completed)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    border: `2px solid ${task.completed ? 'var(--success-color)' : 'var(--text-tertiary)'}`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}>
                                    {task.completed && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{ width: '12px', height: '12px', background: 'var(--success-color)', borderRadius: '50%' }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '1.1rem',
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                        transition: 'color 0.2s'
                                    }}>
                                        {task.title}
                                    </h3>
                                    <span className="text-mono text-muted" style={{ fontSize: '0.75rem' }}>TARGET: {task.target}</span>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {/* Inputs area */}
                            <motion.div
                                initial={{ opacity: 0.8 }}
                                style={{ marginTop: '1rem', paddingLeft: '3.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}
                            >
                                <div className="grid-cols-2">
                                    {task.hasTime && (
                                        <input
                                            type="text"
                                            placeholder="Time (e.g. 2h)"
                                            className="text-mono"
                                            value={task.time_spent || ''}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateTaskField(task.id, 'time_spent', e.target.value)}
                                            onBlur={(e) => saveTaskField(task.id, 'time_spent', e.target.value)}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Add a note..."
                                        value={task.note || ''}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateTaskField(task.id, 'note', e.target.value)}
                                        onBlur={(e) => saveTaskField(task.id, 'note', e.target.value)}
                                        style={{ fontSize: '0.9rem', gridColumn: task.hasTime ? 'auto' : '1 / -1' }}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={completedCount < MISSION_TASKS.length}
                style={{
                    width: '100%',
                    marginTop: '3rem',
                    padding: '1.5rem',
                    background: completedCount === MISSION_TASKS.length ? 'var(--success-color)' : 'var(--surface-color)',
                    color: completedCount === MISSION_TASKS.length ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.1em',
                    cursor: completedCount === MISSION_TASKS.length ? 'pointer' : 'not-allowed',
                    opacity: completedCount === MISSION_TASKS.length ? 1 : 0.4,
                    border: completedCount === MISSION_TASKS.length ? 'none' : '1px solid var(--border-color)'
                }}
            >
                {completedCount === MISSION_TASKS.length ? "MISSION ACCOMPLISHED" : "COMPLETE ALL OBJECTIVES"}
            </motion.button>
        </div>
    );
}
