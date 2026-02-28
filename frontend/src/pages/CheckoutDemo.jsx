import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import { Shield, CreditCard, Smartphone, CheckCircle, Loader } from 'lucide-react';

export default function CheckoutDemo() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success'

    // If accessed directly without state, boot back
    React.useEffect(() => {
        if (!state || !state.product) {
            navigate('/dashboard');
        }
    }, [state, navigate]);

    if (!state || !state.product) return null;

    const { product, amount, order_id } = state;

    const handleSimulatePayment = async () => {
        setLoading(true);
        setStatus('processing');

        // Add artificial delay for presentation realism
        await new Promise(r => setTimeout(r, 2000));

        try {
            const finalUserId = user?.id || localStorage.getItem('user_id');
            if (!finalUserId || finalUserId === 'undefined' || finalUserId === 'null') {
                alert("Stale Cache: Please manually refresh the page (F5 / Cmd+R) to apply the hotfix and verify your login.");
                navigate('/');
                return;
            }

            await api.post(`/buy/${product.id}?user_id=${finalUserId}`, {
                order_id: order_id || "demo_order",
                payment_id: `pay_DEMO_${Math.floor(Math.random() * 999999)}`,
                signature: 'demo_simulated_signature'
            });
            setStatus('success');

            // Redirect back to dashboard after showing success mark
            setTimeout(() => {
                navigate('/dashboard');
            }, 1800);
        } catch (err) {
            let errorMsg = err.response?.data?.error;
            if (!errorMsg && err.response?.data?.detail) {
                errorMsg = JSON.stringify(err.response.data.detail);
            }
            alert(`Purchase Failed: ${errorMsg || err.message || "Simulation Error"}`);
            setLoading(false);
            setStatus('idle');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#050a0e', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>

            <div style={{ width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                {/* Header pretending to be Razorpay */}
                <div style={{ background: '#0a1930', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

                    <button onClick={() => navigate(-1)} style={{ position: 'absolute', left: '15px', top: '15px', background: 'transparent', border: 'none', color: '#8e9aaf', cursor: 'pointer', fontSize: '24px' }}>
                        ×
                    </button>

                    <div style={{ background: '#00e5ff', color: 'black', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        <Shield size={24} />
                    </div>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px' }}>Smart Vending Demo</div>
                    <div style={{ color: '#8e9aaf', fontSize: '12px', marginTop: '4px' }}>TEST MODE</div>

                    <div style={{ fontSize: '32px', color: 'white', fontWeight: '900', marginTop: '15px' }}>
                        ₹{amount / 100}
                    </div>
                </div>

                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {status === 'processing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#334155' }}>
                            <Loader size={48} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                            <h3 style={{ marginTop: '15px', margin: '15px 0 0 0', color: '#0f172a' }}>Processing...</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' }}>Please do not close this window</p>
                            <style>{`
                                @keyframes spin { 100% { transform: rotate(360deg); } }
                            `}</style>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#10b981' }}>
                            <CheckCircle size={56} />
                            <h3 style={{ marginTop: '15px', margin: '15px 0 0 0', color: '#0f172a' }}>Payment Successful!</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' }}>Redirecting...</p>
                        </div>
                    )}

                    {status === 'idle' && (
                        <>
                            <div style={{ color: '#475569', fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '5px' }}>
                                Product: <b>{product.name}</b>
                                <br />
                                <span style={{ fontSize: '11px' }}>Order: {order_id}</span>
                            </div>

                            <button onClick={handleSimulatePayment} disabled={loading} style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: '#0f172a', fontWeight: 'bold' }}>
                                <Smartphone size={20} color="#3b82f6" />
                                Demo UPI Payment
                            </button>

                            <button onClick={handleSimulatePayment} disabled={loading} style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: '#0f172a', fontWeight: 'bold' }}>
                                <CreditCard size={20} color="#6366f1" />
                                Demo Cards
                            </button>

                            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>
                                <Shield size={12} /> SECURED BY MOCK PAYMENTS
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
