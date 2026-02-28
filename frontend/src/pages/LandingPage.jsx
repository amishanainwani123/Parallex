import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
export default function LandingPage() {
  const [words] = useState(['SNACK', 'DRINK', 'COFFEE', 'CANDY']);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [words]);

  // Reusable gradient style for text
  const gradientTextStyle = {
    background: 'linear-gradient(90deg, #00e5ff, #ff7eb3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
  };

  return (
    <div style={{
      backgroundColor: '#050a0e',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundImage: `linear-gradient(to right, #121a21 1px, transparent 1px), 
                        linear-gradient(to bottom, #121a21 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      scrollBehavior: 'smooth'
    }}>

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '30px 60px', alignItems: 'center' }}>
        <h2 style={{ ...gradientTextStyle, letterSpacing: '4px', fontWeight: '900', fontSize: '28px' }}>
          VENDR
        </h2>
        <Link to="/login" style={{
          background: 'transparent',
          border: '1px solid #00e5ff',
          color: '#00e5ff',
          padding: '8px 24px',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textDecoration: 'none'
        }}>SIGN IN</Link>
      </nav>

      {/* PAGE 1: HERO */}
      <section style={{ height: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{
          border: '1px solid',
          borderImageSource: 'linear-gradient(90deg, #00e5ff, #ff7eb3)',
          borderImageSlice: 1,
          background: 'rgba(0, 229, 255, 0.05)',
          padding: '6px 16px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          marginBottom: '30px',
          color: '#00e5ff'
        }}>
          ● LIVE INVENTORY TRACKING
        </div>

        <h1 style={{ fontSize: '110px', fontWeight: '900', margin: '0', lineHeight: '0.9', letterSpacing: '-2px' }}>
          FIND YOUR <br />
          <span style={gradientTextStyle}>
            {words[index]}
          </span> <br />
          RIGHT NOW
        </h1>

        <p style={{ color: '#8e9aaf', marginTop: '35px', maxWidth: '600px', fontSize: '18px', lineHeight: '1.6' }}>
          Search any product and instantly see which nearby vending machines have it in stock — with real-time availability and directions.
        </p>

        <div style={{ marginTop: '50px', fontSize: '12px', color: '#4a5568', letterSpacing: '4px' }}>
          SCROLL ↓
        </div>
      </section>

      {/* PAGE 2: FEATURES */}
      <section style={{ padding: '100px 60px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '60px', fontWeight: 'bold' }}>
          EVERYTHING YOU <span style={gradientTextStyle}>NEED</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
          {[
            { label: 'REAL-TIME', title: 'Live Inventory', desc: "Stock updates every 15 seconds across all campus machines." },
            { label: 'LOCATION', title: 'Machine Finder', desc: "Find the nearest machine with your item. Distance-sorted." },
            { label: 'ANALYTICS', title: 'Demand Insights', desc: "Data-driven insights on peak hours and popular items." },
            { label: 'AI POWERED', title: 'Smart Restock', desc: "AI recommendations ensure machines are stocked automatically." }
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(13, 21, 28, 0.7)',
              padding: '50px',
              borderRadius: '12px',
              border: '1px solid #1e2d3d',
              backdropFilter: 'blur(10px)'
            }}>
              <h5 style={{ ...gradientTextStyle, margin: '0 0 15px 0', fontSize: '13px', letterSpacing: '1px' }}>
                — {item.label}
              </h5>
              <h3 style={{ fontSize: '24px', margin: '0 0 15px 0' }}>{item.title}</h3>
              <p style={{ color: '#8e9aaf', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PAGE 3: CTA */}
      <section style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#0d151c',
          width: '90%',
          maxWidth: '1100px',
          padding: '100px 40px',
          borderRadius: '24px',
          textAlign: 'center',
          border: '1px solid #1e2d3d'
        }}>
          <h2 style={{ fontSize: '70px', fontWeight: '900', margin: '0' }}>READY TO GET STARTED?</h2>
          <p style={{ color: '#8e9aaf', margin: '25px 0 50px 0', fontSize: '20px' }}>Join thousands of students who never walk to an empty machine anymore.</p>
          <Link to="/register" style={{
            background: 'linear-gradient(90deg, #00e5ff, #ff7eb3)',
            color: 'black',
            border: 'none',
            padding: '20px 60px',
            fontSize: '16px',
            fontWeight: '900',
            borderRadius: '8px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            FIND VENDINGS NEAR YOU →
          </Link>
        </div>
      </section>
    </div>
  );
}