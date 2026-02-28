import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, CreditCard, ChevronLeft, LogOut, ShoppingBag } from 'lucide-react';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const res = await api.get(`/${user.id}/purchases`);
                setProfileData(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [user.id]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) return <div style={{ minHeight: '100vh', background: '#050a0e', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    const gradientText = {
        background: 'linear-gradient(90deg, #00e5ff, #00b0ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050a0e', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

            {/* Top Navigation */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid #1e2d3d', color: '#8e9aaf', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <ChevronLeft size={16} /> Dashboard
                </button>

                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#8e9aaf', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <LogOut size={16} /> SIGN OUT
                </button>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '100px', paddingBottom: '40px', px: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div style={{ background: 'linear-gradient(45deg, #00e5ff, #00b0ff)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto', boxShadow: '0 10px 30px rgba(0,229,255,0.3)' }}>
                        <User size={40} color="black" />
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '2px', margin: '0 0 10px 0' }}>
                        {profileData?.user?.name || user.name || "USER"} <span style={gradientText}>PROFILE</span>
                    </h1>
                    <p style={{ color: '#8e9aaf', fontSize: '16px', margin: 0 }}>{profileData?.user?.email || user.email}</p>
                </div>

                {/* Total Analytics Card */}
                <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #0d2740 100%)', border: '1px solid #1e2d3d', borderRadius: '16px', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div>
                        <div style={{ color: '#8e9aaf', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={16} color="#00e5ff" /> TOTAL SPENT
                        </div>
                        <div style={{ fontSize: '56px', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <span style={{ fontSize: '24px', color: '#00e5ff', marginTop: '10px' }}>₹</span>
                            {profileData?.total_spent || 0}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '20px', borderRadius: '50%' }}>
                        <ShoppingBag size={48} color="#00e5ff" />
                    </div>
                </div>

                <h3 style={{ color: 'white', fontSize: '20px', borderBottom: '1px solid #1e2d3d', paddingBottom: '15px', marginBottom: '20px' }}>Purchase History</h3>

                {profileData?.history?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {profileData.history.map((tx, idx) => (
                            <div key={idx} style={{ background: '#0a0f14', border: '1px solid #1e2d3d', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'default' }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#00e5ff'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#1e2d3d'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: '#0d151c', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ff7eb3' }}>
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{tx.product_name}</div>
                                        <div style={{ color: '#4caf50', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{tx.status}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '900', fontSize: '18px', color: '#00e5ff' }}>
                                    ₹{tx.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed #1e2d3d', padding: '50px', borderRadius: '12px', textAlign: 'center', color: '#8e9aaf' }}>
                        You haven't made any purchases yet.
                    </div>
                )}
            </div>
        </div>
    );
}
