import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, BookOpen, CheckCircle, Circle } from 'lucide-react';

export default function Books() {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newBook, setNewBook] = useState({ title: '', author: '' });

    useEffect(() => {
        if (!user) return;
        fetchBooks();
    }, [user]);

    const fetchBooks = async () => {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const addBook = async (e) => {
        e.preventDefault();
        if (!newBook.title.trim()) return;

        try {
            const { data, error } = await supabase
                .from('books')
                .insert([{
                    user_id: user.id,
                    title: newBook.title,
                    author: newBook.author,
                    status: 'To Read'
                }])
                .select();

            if (error) throw error;
            setBooks([data[0], ...books]);
            setNewBook({ title: '', author: '' });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        // Optimistic update
        setBooks(books.map(b => b.id === id ? { ...b, status: newStatus } : b));

        try {
            await supabase.from('books').update({ status: newStatus }).eq('id', id);
        } catch (error) {
            console.error('Error updating status:', error);
            fetchBooks(); // Revert on error
        }
    };

    const updateLesson = async (id, lesson) => {
        setBooks(books.map(b => b.id === id ? { ...b, lesson } : b));
    };

    const saveLesson = async (id, lesson) => {
        try {
            await supabase.from('books').update({ lesson }).eq('id', id);
        } catch (error) {
            console.error('Error saving lesson:', error);
        }
    };

    const deleteBook = async (id) => {
        if (!confirm('Remove this book from your library?')) return;

        setBooks(books.filter(b => b.id !== id));
        try {
            await supabase.from('books').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting book:', error);
            fetchBooks();
        }
    };

    const completedCount = books.filter(b => b.status === 'Finished').length;

    return (
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '4rem' }}>
            <header className="flex-between" style={{ marginBottom: '3rem', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>LIBRARY</h1>
                    <p className="text-muted text-mono" style={{ fontSize: '0.9rem' }}>READ TO RE-PROGRAM.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 600, lineHeight: 1 }}>{completedCount}</span>
                    <span className="text-muted text-mono" style={{ fontSize: '0.9rem', display: 'block' }}>COMPLETED</span>
                </div>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={addBook}
                        className="card"
                        style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px dashed var(--border-color)' }}
                    >
                        <div className="grid-cols-2" style={{ gap: '1rem' }}>
                            <input
                                autoFocus
                                placeholder="Book Title"
                                value={newBook.title}
                                onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                            />
                            <input
                                placeholder="Author"
                                value={newBook.author}
                                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" style={{ color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1.5rem', borderRadius: '4px' }}>ADD TO LIBRARY</button>
                            <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'var(--text-secondary)' }}>CANCEL</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {books.map((book) => (
                    <motion.div
                        key={book.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card"
                        style={{
                            borderColor: book.status === 'Finished' ? 'rgba(0, 255, 0, 0.3)' : 'var(--border-color)',
                        }}
                    >
                        <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: book.status === 'Finished' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{book.title}</h3>
                                <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{book.author}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <select
                                    value={book.status}
                                    onChange={(e) => updateStatus(book.id, e.target.value)}
                                    className="text-mono"
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        width: 'auto',
                                        fontSize: '0.8rem',
                                        borderColor: book.status === 'Finished' ? 'var(--success-color)' : book.status === 'Reading' ? 'var(--accent-color)' : 'var(--border-color)',
                                        color: book.status === 'Finished' ? 'var(--success-color)' : book.status === 'Reading' ? 'var(--accent-color)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <option value="To Read">TO READ</option>
                                    <option value="Reading">READING</option>
                                    <option value="Finished">FINISHED</option>
                                </select>
                                <button onClick={() => deleteBook(book.id)} style={{ color: 'var(--text-tertiary)' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {book.status === 'Finished' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}
                            >
                                <label className="text-mono text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>KEY TAKEAWAY / LESSON</label>
                                <textarea
                                    value={book.lesson || ''}
                                    onChange={(e) => updateLesson(book.id, e.target.value)}
                                    onBlur={(e) => saveLesson(book.id, e.target.value)}
                                    placeholder="What did this book teach you?"
                                    rows="2"
                                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-primary)' }}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                ))}

                {books.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '4rem 0' }}>
                        <BookOpen size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>LIBRARY IS EMPTY</p>
                    </div>
                )}
            </div>

            {!isAdding && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAdding(true)}
                    style={{
                        marginTop: '2rem',
                        width: '100%',
                        padding: '1rem',
                        border: '1px dashed var(--text-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={18} /> ADD BOOK
                </motion.button>
            )}
        </div>
    );
}
