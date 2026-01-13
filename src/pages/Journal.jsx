import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Check } from 'lucide-react';

export default function Journal() {
    const { user } = useAuth();
    const [entry, setEntry] = useState({ well: '', avoided: '', lesson: '' });
    const [entryId, setEntryId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchTodayEntry();
    }, [user]);

    const fetchTodayEntry = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

            if (data) {
                setEntry({
                    well: data.well || '',
                    avoided: data.avoided || '',
                    lesson: data.lesson || ''
                });
                setEntryId(data.id);
            }
        } catch (error) {
            console.error('Error fetching journal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setEntry(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const saveEntry = async () => {
        setSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const payload = {
                user_id: user.id,
                date: today,
                well: entry.well,
                avoided: entry.avoided,
                lesson: entry.lesson,
                content: '' // keeping for schema compatibility if needed
            };

            let error;
            if (entryId) {
                // Update
                const { error: updateError } = await supabase
                    .from('journal_entries')
                    .update(payload)
                    .eq('id', entryId);
                error = updateError;
            } else {
                // Insert
                const { data, error: insertError } = await supabase
                    .from('journal_entries')
                    .insert([payload])
                    .select();

                if (data) setEntryId(data[0].id);
                error = insertError;
            }

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving journal:', error);
            alert('Failed to save journal');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container" style={{ marginTop: '3rem', maxWidth: '700px', paddingBottom: '4rem' }}>
            <header className="flex-between" style={{ marginBottom: '3rem', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>JOURNAL</h1>
                    <p className="text-muted text-mono" style={{ fontSize: '0.9rem' }}>RAW. HONEST. PRIVATE.</p>
                </div>
                <div className="text-mono text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
            >

                <section>
                    <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--success-color)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 600 }} className="text-mono">WHAT WENT WELL?</label>
                    <textarea
                        rows="5"
                        placeholder="Wins, progress, good decisions..."
                        value={entry.well}
                        onChange={(e) => handleChange('well', e.target.value)}
                        className="card"
                        style={{ width: '100%', resize: 'vertical', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: '1.6' }}
                    />
                </section>

                <section>
                    <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--error-color)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 600 }} className="text-mono">WHAT DID I AVOID?</label>
                    <textarea
                        rows="5"
                        placeholder="Distractions, weakness, procrastination..."
                        value={entry.avoided}
                        onChange={(e) => handleChange('avoided', e.target.value)}
                        className="card"
                        style={{ width: '100%', resize: 'vertical', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: '1.6' }}
                    />
                </section>

                <section>
                    <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 600 }} className="text-mono">ONE LESSON LEARNED</label>
                    <input
                        type="text"
                        placeholder="The core insight of the day..."
                        value={entry.lesson}
                        onChange={(e) => handleChange('lesson', e.target.value)}
                        className="card"
                        style={{ width: '100%', border: '1px solid var(--border-color)', fontSize: '1rem' }}
                    />
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveEntry}
                        disabled={saving}
                        style={{
                            background: saved ? 'var(--success-color)' : 'var(--text-primary)',
                            color: 'var(--bg-color)',
                            padding: '1rem 2.5rem',
                            fontSize: '1rem',
                            fontWeight: 700,
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.3s'
                        }}
                    >
                        {saving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE ENTRY'}
                        {saved ? <Check size={20} /> : <Save size={20} />}
                    </motion.button>
                </div>

            </motion.div>
        </div>
    );
}
