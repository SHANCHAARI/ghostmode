import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, Calendar, AlertTriangle } from 'lucide-react';

const SYLLABUS = [
    {
        name: 'Engineering Physics',
        units: ['Wave Optics', 'Crystallography & X-Ray', 'Dielectric & Magnetic', 'Quantum Mechanics', 'Semiconductors']
    },
    {
        name: 'Linear Algebra & Calculus',
        units: ['Linear Algebra', 'Eigen Values', 'Calculus & Mean Value', 'Partial Differentiation', 'Multiple Integrals']
    },
    {
        name: 'C Programming',
        units: ['Target 1: Basics & Algorithms', 'Target 2: Control Structures', 'Target 3: Arrays & Pointers', 'Target 4: Functions & Strings', 'Target 5: Structures & Files']
    },
    {
        name: 'Civil & Mechanical',
        units: ['Civil: Basics', 'Civil: Surveying', 'Civil: Transport/Water', 'Mech: Materials & Mfg', 'Mech: Thermal/Power']
    },
    {
        name: 'English',
        units: ['Unit 1 (Self Study)', 'Unit 2 (Self Study)', 'Unit 3 (Self Study)', 'Unit 4 (Self Study)', 'Unit 5 (Self Study)']
    }
];

// Simplified Timeline Logic
const PLAN_START = new Date('2026-01-13');
const EXAM_START = new Date('2026-01-20');

const getTodayPlan = () => {
    const today = new Date();
    // For demo/testing if date is before start, show day 1
    if (today < PLAN_START) return "PRE-GAME PREP";

    // Simple date diff (in days)
    const diffTime = Math.abs(today - PLAN_START);
    const dayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Hardcoded plan logic based on user prompt
    if (dayDiff === 0 || dayDiff === 1) return "HIGH INTENSITY: Clear Physics Unit 1-3";
    if (dayDiff >= 2 && dayDiff <= 4) return "PONGAL BREAK: Formula Reading & Light Revision (Physics/Maths)";
    if (dayDiff === 5 || dayDiff === 6) return "CRITICAL MASS: Complete all Physics Units. Start Math Rev.";
    if (today >= EXAM_START) return "WAR MODE: Exam Cycle Active. Focus on Next Paper.";

    return "STAY HARD: Clear pending backlogs.";
};

export default function SemExams() {
    const { user } = useAuth();
    const [units, setUnits] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchProgress();
    }, [user]);

    const fetchProgress = async () => {
        try {
            const { data, error } = await supabase
                .from('exam_units')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Transform array to object { "Physics-1": "Completed" }
            const statusMap = {};
            data?.forEach(item => {
                statusMap[`${item.subject}-${item.unit_number}`] = item.status;
            });
            setUnits(statusMap);
        } catch (error) {
            console.error('Error fetching exam progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUnit = async (subject, unitIndex, currentStatus) => {
        const key = `${subject}-${unitIndex + 1}`;
        const newStatus = currentStatus === 'Completed' ? 'Not Started' : 'Completed';

        // Optimistic update
        setUnits(prev => ({ ...prev, [key]: newStatus }));

        try {
            // Upsert
            const { error } = await supabase
                .from('exam_units')
                .upsert({
                    user_id: user.id,
                    subject,
                    unit_number: unitIndex + 1,
                    status: newStatus
                }, { onConflict: 'user_id, subject, unit_number' });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating unit:', error);
            // Revert
            setUnits(prev => ({ ...prev, [key]: currentStatus }));
        }
    };

    const todayMsg = getTodayPlan();

    return (
        <div className="container" style={{ marginTop: '3rem', maxWidth: '800px', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>SEMESTER PROTOCOL</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <div className="card" style={{ padding: '1rem', flex: 1, borderColor: 'var(--accent-color)', background: 'rgba(57, 255, 20, 0.05)' }}>
                        <span className="text-mono text-muted" style={{ fontSize: '0.75rem' }}>CURRENT OBJECTIVE</span>
                        <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: 'var(--accent-color)' }}>{todayMsg}</p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {SYLLABUS.map((subj) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={subj.name}
                        className="card"
                    >
                        <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{subj.name}</h3>
                            <span className="text-mono text-muted" style={{ fontSize: '0.8rem' }}>5 UNITS</span>
                        </div>

                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {subj.units.map((uName, idx) => {
                                const isDone = units[`${subj.name}-${idx + 1}`] === 'Completed';
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => toggleUnit(subj.name, idx, isDone ? 'Completed' : 'Not Started')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            cursor: 'pointer',
                                            padding: '0.8rem',
                                            borderRadius: '6px',
                                            background: isDone ? 'rgba(0, 255, 0, 0.05)' : 'transparent',
                                            border: '1px solid',
                                            borderColor: isDone ? 'var(--success-color)' : 'var(--border-color)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            border: `2px solid ${isDone ? 'var(--success-color)' : 'var(--text-tertiary)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: isDone ? 'var(--success-color)' : 'transparent'
                                        }}>
                                            {isDone && <Check size={14} color="#000" strokeWidth={4} />}
                                        </div>
                                        <div>
                                            <span style={{
                                                display: 'block',
                                                fontSize: '0.95rem',
                                                color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                textDecoration: isDone ? 'line-through' : 'none'
                                            }}>
                                                {uName}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>
            <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.6 }}>
                <p className="text-mono text-muted">EXAMS START: JAN 20, 2026</p>
                <p className="text-mono text-muted">NO EXCUSES. EXECUTE.</p>
            </div>
        </div>
    );
}
