
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Search, PackageMinus, ShoppingCart, LogOut, Navigation, ArrowRight, User } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [view, setView] = useState('machines'); // 'machines' | 'inventory' | 'nearest'
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [search, setSearch] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data State
    const [machines, setMachines] = useState([]);
    const [products, setProducts] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

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

    // Calculate distance locally
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) {
            console.warn("Missing coordinates for distance calculation", { lat1, lon1, lat2, lon2 });
            return null;
        }
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        const meters = d * 1000;
        console.log(`Calculated distance: ${meters.toFixed(0)} meters between User(${lat1},${lon1}) and Machine(${lat2},${lon2})`);
        return meters.toFixed(0); // Convert to meters
    };

    useEffect(() => {
        fetchMachines();

        const fetchLocationViaIP = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    setLocationError(null);
                    setUserLocation({
                        lat: data.latitude,
                        lon: data.longitude,
                        source: 'IP Address'
                    });
                    console.log("Fallback IP Location successful:", data.latitude, data.longitude);
                } else {
                    setLocationError("Could not determine location via IP.");
                }
            } catch (err) {
                console.error("IP Fallback failed:", err);
                setLocationError("Failed to determine location. Distances cannot be calculated.");
            }
        };

        // Explicitly request location on mount to ensure distance sorting works
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationError(null);
                    setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        source: 'GPS'
                    });
                },
                (err) => {
                    console.log("Browser GPS denied/failed. Falling back to IP:", err);
                    fetchLocationViaIP();
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Ask for best exact distance with timeout
            );
        } else {
            console.log("Geolocation NOT supported. Falling back to IP.");
            fetchLocationViaIP();
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search.trim() !== '' && view === 'machines') {
                searchProducts(search);
            } else {
                setGlobalSearchResults([]);
            }
        }, 300); // Debounce search API calls

        return () => clearTimeout(delayDebounceFn);
    }, [search, view]);

    const fetchMachines = async () => {
        try {
            setLoading(true);
            const res = await api.get('/machines');
            setMachines(res.data);
        } catch (err) {
            console.error("Failed to fetch machines", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async (machineId) => {
        try {
            setLoading(true);
            // Assuming products have machine_id. For now filtering frontend since API returns all
            const res = await api.get('/products');
            setProducts(res.data.filter(p => !p.machine_id || p.machine_id === machineId));
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    };

    // Global WebSocket Real-Time Sync with Auto-Reconnect
    useEffect(() => {
        let ws;
        let isComponentMounted = true;

        const connectWebSocket = () => {
            ws = new WebSocket("ws://localhost:8000/ws");

            ws.onopen = () => console.log("WebSocket Connected: Active");

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.action === "inventory_deducted") {
                    setProducts(prev => prev.map(p =>
                        p.id === data.product_id && p.stock > 0 ? { ...p, stock: p.stock - 1 } : p
                    ));
                    setGlobalSearchResults(prev => prev.map(p =>
                        p.id === data.product_id && p.stock > 0 ? { ...p, stock: p.stock - 1 } : p
                    ));
                    // Show a quick transient UI toast confirming the Sync!
                    const spanMessage = document.createElement("div");
                    spanMessage.innerText = "⚡ Offline Hardware Sync Received!";
                    spanMessage.style = "position:fixed;bottom:20px;right:20px;background:#00e5ff;color:black;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:9999;box-shadow:0 0 20px #00e5ff;";
                    document.body.appendChild(spanMessage);
                    setTimeout(() => spanMessage.remove(), 3500);
                }
            };

            ws.onclose = () => {
                if (isComponentMounted) {
                    console.log("WebSocket Disconnected. Reconnecting in 3s...");
                    setTimeout(connectWebSocket, 3000); // Auto Reconnect
                }
            };
        };

        connectWebSocket();

        return () => {
            isComponentMounted = false;
            if (ws) ws.close();
        };
    }, []);

    const searchProducts = async (query) => {
        try {
            setLoading(true);
            const res = await api.get(`/search?name=${query}`);
            setGlobalSearchResults(res.data);
        } catch (err) {
            console.error("Failed to search products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMachine = (machine) => {
        setSelectedMachine(machine);
        setView('inventory');
        fetchInventory(machine.id);
    };

    const handleBackToMachines = () => {
        setView('machines');
        setSelectedMachine(null);
        setSearch('');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBuy = async (product) => {
        const res = await loadRazorpayScript();
        if (!res) return alert("Razorpay SDK failed to load. Are you online?");

        try {
            const orderRes = await api.post(`/create-order/${product.id}`);
            const { order_id, amount, currency } = orderRes.data;

            const options = {
                key: 'test_key_id',
                amount: amount.toString(),
                currency: currency,
                name: 'Smart Vending',
                description: `Purchase ${product.name} `,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await api.post(`/buy/${product.id}?user_id=${user.id}`, {
                            order_id: response.razorpay_order_id,
                            payment_id: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        });
                        alert('Payment Successful! Item dispensing...');
                        fetchInventory(selectedMachine.id);
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed on server");
                    }
                },
                prefill: { name: user.name || "Student User", email: user.email },
                theme: { color: "#00e5ff" }
            };

            // Intercept if we are using the generic Test Key and safely route to Simulated Page
            if (options.key === 'test_key_id') {
                navigate('/checkout', { state: { product, amount, order_id } });
            } else {
                new window.Razorpay(options).open();
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error initiating purchase");
        }
    };

    const handleRequestRefill = async (product) => {
        try {
            if (!selectedMachine) return;
            await api.post(`/ demand ? user_id = ${user.id} `, {
                machine_id: selectedMachine.id,
                product_name: product.name
            });
            alert(`Request received! We'll notify you when ${product.name} is restocked.`);
        } catch (err) {
            console.error(err);
        }
    };

    // Hardware Simulation Demo
    const handleSimulatePhysicalPurchase = async (product) => {
        try {
            await api.post(`/machines/sync-offline-sales?product_id=${product.id}`);
            // Do NOT call fetchInventory() here! Let the WebSocket organically push the UI update to prove it works.
        } catch (err) {
            alert(err.response?.data?.error || "Error attempting to simulate offline hardware");
        }
    };

    // Filter Logic for Machines View
    const filteredMachines = machines;

    // Sort machines by distance if we have location
    const sortedMachines = React.useMemo(() => {
        let result = [...filteredMachines];
        console.log("Sorting Machines... User Location:", userLocation);
        if (result.length > 0) {
            console.log("First Machine Data:", result[0]);
        }

        if (userLocation) {
            result.sort((a, b) => {
                const distA = parseFloat(calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude)) || Infinity;
                const distB = parseFloat(calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude)) || Infinity;
                return distA - distB;
            });
        }
        return result;
    }, [filteredMachines, userLocation]);

    // Global Search sorting (Distance, then by Stock)
    const sortedGlobalResults = React.useMemo(() => {
        let result = [...globalSearchResults];
        // Sort first by stock descending, then by distance (if we have location)
        result.sort((a, b) => {
            if (userLocation) {
                const distA = parseFloat(calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude)) || Infinity;
                const distB = parseFloat(calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude)) || Infinity;
                // If distances are roughly equal (within 50 meters), sort by stock
                if (Math.abs(distA - distB) < 50) {
                    return b.stock - a.stock;
                }
                return distA - distB;
            }
            return b.stock - a.stock; // Default sort is just stock descending
        });
        return result;
    }, [globalSearchResults, userLocation]);

    // Inventory view sorting (Strictly Stock descending, matching Search query)
    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.stock - a.stock);

    const gradientText = {
        background: 'linear-gradient(90deg, #00e5ff, #ff7eb3)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050a0e', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

            {/* Top Navigation */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                {view === 'inventory' || view === 'nearest' ? (
                    <button onClick={handleBackToMachines} style={{ background: 'transparent', border: '1px solid #1e2d3d', color: '#8e9aaf', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        ← Back to Machines
                    </button>
                ) : (
                    <div></div> // Spacing
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: 'none', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <User size={18} /> MY PROFILE
                    </button>

                    <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#8e9aaf', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <LogOut size={16} /> SIGN OUT
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '100px', paddingBottom: '40px', px: '20px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '2px', margin: '0 0 20px 0' }}>
                        {view === 'machines' ? (
                            <>FIND YOUR <span style={gradientText}>CRAVINGS</span></>
                        ) : (
                            <>{selectedMachine?.location.toUpperCase()} <span style={gradientText}>INVENTORY</span></>
                        )}
                    </h1>

                    {/* Search Bar & Nearest Button Container */}
                    <div style={{ display: 'flex', gap: '15px', maxWidth: '700px', margin: '0 auto' }}>

                        <div style={{ flex: 1, background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '8px', padding: '15px 20px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                            <Search size={18} color="#8e9aaf" style={{ marginRight: '15px' }} />
                            <input
                                type="text"
                                placeholder="What are you craving for?"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none' }}
                            />
                        </div>

                        {/* Find Nearest Vending Button */}
                        <button
                            onClick={() => { setView('nearest'); setSearch(''); }}
                            style={{
                                background: 'linear-gradient(90deg, #00e5ff, #00b0ff)',
                                color: 'black', fontWeight: 'bold', fontSize: '14px',
                                border: 'none', borderRadius: '8px', padding: '0 20px',
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0,229,255,0.2)'
                            }}>
                            <Navigation size={18} /> Find Nearest Machine
                        </button>

                    </div>
                </div>

                {/* Location Success Display */}
                {userLocation && (
                    <div style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', color: '#4caf50', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                        📍 System has locked onto your coordinates via {userLocation.source}: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                    </div>
                )}

                {/* Location Error Warning */}
                {locationError && (
                    <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '15px 20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                        ⚠️ {locationError}
                    </div>
                )}

                {/* Loading State */}
                {loading && <div style={{ textAlign: 'center', color: '#8e9aaf', marginTop: '50px' }}>Loading data...</div>}

                {/* Machines List View (Empty Search) */}
                {!loading && view === 'machines' && search.trim() === '' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', padding: '0 20px' }}>
                        {sortedMachines.map(machine => {
                            const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, machine.latitude, machine.longitude) : null;
                            return (
                                <div key={machine.id} style={{ background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '25px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onClick={() => handleSelectMachine(machine)}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#00e5ff'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#1e2d3d'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#00e5ff' }}>
                                            <span style={{ height: '6px', width: '6px', background: '#00e5ff', borderRadius: '50%', boxShadow: '0 0 8px #00e5ff' }}></span>
                                            Online
                                        </div>
                                        {distance && <div style={{ fontSize: '12px', color: '#8e9aaf' }}>{distance} meters</div>}
                                    </div>

                                    <h3 style={{ fontSize: '24px', margin: '0 0 5px 0', fontWeight: 'bold' }}>{machine.location}</h3>

                                    <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', color: '#ff7eb3', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        VIEW INVENTORY <ArrowRight size={14} />
                                    </div>
                                </div>
                            )
                        })}
                        {sortedMachines.length === 0 && <div style={{ color: '#8e9aaf', gridColumn: '1 / -1', textAlign: 'center' }}>No machines available.</div>}
                    </div>
                )}

                {/* Nearest Machines View */}
                {!loading && view === 'nearest' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ color: '#00e5ff', margin: '0 0 10px 0', borderBottom: '1px solid #1e2d3d', paddingBottom: '10px' }}>Closest To You</h2>
                        {sortedMachines.map((machine, index) => {
                            const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, machine.latitude, machine.longitude) : null;
                            return (
                                <div key={machine.id} style={{ background: '#0a0f14', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: index === 0 ? '0 0 15px rgba(0,229,255,0.1)' : 'none' }}
                                    onClick={() => handleSelectMachine(machine)}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#00e5ff'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#1e2d3d'}
                                >
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#ff7eb3', fontWeight: 'bold', marginBottom: '4px' }}>
                                            {index === 0 ? '🏆 NEAREST MACHINE' : `#${index + 1}`}
                                        </div>
                                        <h3 style={{ fontSize: '20px', margin: '0 0 4px 0', fontWeight: 'bold' }}>{machine.name}</h3>
                                        <p style={{ color: '#8e9aaf', margin: '0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} /> {machine.location}
                                        </p>
                                    </div>

                                    {/* Prominent Distance Display */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#00e5ff' }}>
                                            {distance ? distance : '--'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#8e9aaf', textTransform: 'uppercase', letterSpacing: '1px' }}>meters away</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Global Search Results View (Active Search) */}
                {!loading && view === 'machines' && search.trim() !== '' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '0 20px' }}>
                        {sortedGlobalResults.map((p) => {
                            const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, p.latitude, p.longitude) : null;
                            return (
                                <div key={`${p.id}-${p.machine_id}`} style={{ background: '#0d151c', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '25px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '20px' }}>{p.name}</h4>
                                        <div style={{ background: 'rgba(255, 126, 179, 0.1)', color: '#ff7eb3', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                            ₹{p.price}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: p.stock > 0 ? '#4caf50' : '#ff4d4d', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                                        <PackageMinus size={14} />
                                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                                    </div>

                                    {/* Machine Location Details */}
                                    <div style={{ background: '#050a0e', borderRadius: '8px', padding: '12px', marginBottom: '20px', border: '1px solid #1e2d3d' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00e5ff' }}>{p.machine_name}</div>
                                            {distance && <div style={{ fontSize: '12px', color: '#8e9aaf', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {distance} meters</div>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#8e9aaf' }}>{p.location}</div>
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        {p.stock > 0 ? (
                                            <button onClick={() => {
                                                setSelectedMachine({ id: p.machine_id, name: p.machine_name });
                                                handleBuy(p);
                                            }} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00e5ff, #00b0ff)', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                <ShoppingCart size={18} /> Buy Here
                                            </button>
                                        ) : (
                                            <button onClick={() => {
                                                setSelectedMachine({ id: p.machine_id, name: p.machine_name });
                                                handleRequestRefill(p);
                                            }} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #1e2d3d', background: 'transparent', color: '#8e9aaf', fontWeight: 'bold', cursor: 'pointer' }}>
                                                Request Refill
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {sortedGlobalResults.length === 0 && <div style={{ color: '#8e9aaf', gridColumn: '1 / -1', textAlign: 'center' }}>No products found matching "{search}".</div>}
                    </div>
                )}

                {/* Inventory List View */}
                {!loading && view === 'inventory' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '0 20px' }}>
                        {filteredProducts.map((p) => (
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button onClick={() => handleBuy(p)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', background: 'linear-gradient(90deg, #00e5ff, #00b0ff)', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                <ShoppingCart size={18} /> Buy Now
                                            </button>

                                            {/* Offline Hardware Demo Button */}
                                            <button
                                                onClick={() => handleSimulatePhysicalPurchase(p)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px dashed #4caf50', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                                📲 Simulate Physical Purchase
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleRequestRefill(p)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #1e2d3d', background: 'transparent', color: '#8e9aaf', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Request Refill
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && <div style={{ color: '#8e9aaf', gridColumn: '1 / -1', textAlign: 'center' }}>No products found matching your search in this machine.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
