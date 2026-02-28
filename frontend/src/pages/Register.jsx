import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            // Auto redirect to login after success
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Email might already exist.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050a0e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(13, 21, 28, 0.7)', padding: '50px', borderRadius: '12px', border: '1px solid #1e2d3d', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '10px', textAlign: 'center' }}>Create Account</h2>
                <p style={{ color: '#8e9aaf', textAlign: 'center', marginBottom: '30px' }}>Join the smart vending network</p>

                {error && <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#8e9aaf', fontSize: '14px' }}>Full Name</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '6px', padding: '10px' }}>
                            <User size={18} color="#8e9aaf" style={{ marginRight: '10px' }} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#8e9aaf', fontSize: '14px' }}>Email Address</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '6px', padding: '10px' }}>
                            <Mail size={18} color="#8e9aaf" style={{ marginRight: '10px' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                placeholder="you@university.edu"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#8e9aaf', fontSize: '14px' }}>Password</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '6px', padding: '10px' }}>
                            <Lock size={18} color="#8e9aaf" style={{ marginRight: '10px' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" style={{ background: '#00e5ff', color: 'black', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} /> Register
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '25px', color: '#8e9aaf', fontSize: '14px' }}>
                    Already have an account? <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}
