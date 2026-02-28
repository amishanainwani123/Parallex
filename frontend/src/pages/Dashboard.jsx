import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Search, PackageMinus, ShoppingCart, LogOut } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [nearestMachine, setNearestMachine] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Load Razorpay Script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Gradient Text Reusable
    const gradientTextStyle = {
        background: 'linear-gradient(90deg, #00e5ff, #ff7eb3)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block'
    };

    useEffect(() => {
        fetchProducts();
        findNearestMachine();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    const handleSearch = async (e) => {
        setSearch(e.target.value);
        if (e.target.value === '') return fetchProducts();
        try {
            const res = await api.get(`/search?name=${e.target.value}`);
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const findNearestMachine = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // You ideally wouldn't hardcode these but here is a mock user loc
                    const res = await api.post(`/nearest-machine?user_lat=${latitude}&user_lon=${longitude}`);
                    setNearestMachine(res.data);
                } catch (err) {
                    console.error("Loc error", err);
                } finally {
                    setLoading(false);
                }
            });
        } else {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBuy = async (product) => {
        const res = await loadRazorpayScript();
        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            return;
        }

        try {
            // 1. Create order on backend
            const orderRes = await api.post(`/create-order/${product.id}`);
            const { order_id, amount, currency } = orderRes.data;

            // 2. Open Razorpay Window
            const options = {
                key: 'test_key_id', // Would be in env var properly
                amount: amount.toString(),
                currency: currency,
                name: 'Smart Vending',
                description: `Purchase ${product.name}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await api.post(`/buy/${product.id}?user_id=${user.id}`, {
                            order_id: response.razorpay_order_id,
                            payment_id: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        });
                        alert('Payment Successful! Item dispensing...');
                        fetchProducts(); // Refresh stock
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed on server");
                    }
                },
                prefill: {
                    name: "Student User",
                    email: "student@university.edu",
                },
                theme: {
                    color: "#00e5ff"
                }
            };
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Error initiating purchase");
        }
    };

    const handleRequestRefill = async (product) => {
        try {
            if (!nearestMachine) return alert("Please allow location to detect your machine");

            await api.post(`/demand?user_id=${user.id}`, {
                machine_id: nearestMachine.nearest_machine === "Library 1st Fl" ? 1 : 1, // Mock mapping
                product_name: product.name
            });
            alert(`Request received! We'll notify you when ${product.name} is restocked.`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050a0e', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

            {/* NAVBAR */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', alignItems: 'center', borderBottom: '1px solid #1e2d3d' }}>
                <h2 style={{ ...gradientTextStyle, letterSpacing: '2px', fontWeight: '900', fontSize: '24px', margin: 0 }}>
                    VENDR <span style={{ fontSize: '14px', letterSpacing: '0', color: '#8e9aaf', WebkitTextFillColor: '#8e9aaf' }}>DASHBOARD</span>
                </h2>

                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#8e9aaf', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* LOCATION HEADER */}
                {nearestMachine && (
                    <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid #00e5ff', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ background: 'rgba(0, 229, 255, 0.2)', padding: '12px', borderRadius: '50%' }}>
                            <MapPin color="#00e5ff" />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#00e5ff', letterSpacing: '1px', fontWeight: 'bold' }}>NEAREST MACHINE DETECTED</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{nearestMachine.nearest_machine} ({nearestMachine.distance_km} km away)</div>
                            <div style={{ color: '#8e9aaf', fontSize: '14px', marginTop: '4px' }}>{nearestMachine.location}</div>
                        </div>
                    </div>
                )}

                {/* CONTROLS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '24px', margin: 0 }}>Live Stock Inventory</h3>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '6px', padding: '10px 15px', width: '300px' }}>
                        <Search size={16} color="#8e9aaf" style={{ marginRight: '10px' }} />
                        <input
                            type="text"
                            placeholder="Search for a product..."
                            value={search}
                            onChange={handleSearch}
                            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* PRODUCTS GRID */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#8e9aaf' }}>Loading inventory...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                        {products.map((p) => (
                            <div key={p.id} style={{ background: '#0d151c', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '25px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '20px' }}>{p.name}</h4>
                                    <div style={{ background: 'rgba(255, 126, 179, 0.1)', color: '#ff7eb3', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                        ₹{p.price}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: p.stock > 0 ? '#4caf50' : '#ff4d4d', fontSize: '14px', fontWeight: 'bold', marginBottom: '30px' }}>
                                    <PackageMinus size={16} />
                                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    {p.stock > 0 ? (
                                        <button onClick={() => handleBuy(p)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00e5ff, #00b0ff)', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <ShoppingCart size={18} /> Buy Now
                                        </button>
                                    ) : (
                                        <button onClick={() => handleRequestRefill(p)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #1e2d3d', background: 'transparent', color: '#8e9aaf', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Request Refill
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {products.length === 0 && <div style={{ color: '#8e9aaf' }}>No products found...</div>}
                    </div>
                )}

            </div>
        </div>
    );
}
