import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import SIPCalculator from './SIPCalculator';
import { TrendingUp, AccountBalance, Timeline, ShowChart } from '@mui/icons-material';

const Home = () => {
  return (
    <div className="home-container">
      {/* Market Ticker - Moved to top */}
      <section className="market-ticker-wrapper">
        <div className="market-ticker">
          <div className="ticker-track">
            <span className="ticker-item nifty">NIFTY 50 <b>22,350.10</b> <span className="up">▲ 0.45%</span></span>
            <span className="ticker-item sensex">SENSEX <b>74,150.20</b> <span className="down">▼ 0.12%</span></span>
            <span className="ticker-item">RELIANCE <b>2,850.00</b> <span className="up">▲ 1.10%</span></span>
            <span className="ticker-item">TCS <b>3,650.50</b> <span className="down">▼ 0.25%</span></span>
            <span className="ticker-item">HDFC BANK <b>1,650.00</b> <span className="up">▲ 0.80%</span></span>
            <span className="ticker-item">INFY <b>1,450.00</b> <span className="up">▲ 0.60%</span></span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="home-section hero-section">
        <div className="home-hero">
          <div className="hero-content">
            <h1>Trakvest</h1>
            <p className="hero-sub">India's Modern Stock Portfolio & SIP Tracker</p>
            <p className="hero-description">
              Take control of your investments with our powerful portfolio tracking and SIP management tools
            </p>
            <div className="home-actions">
              <Link to="/register" className="home-btn primary">Get Started</Link>
              <Link to="/login" className="home-btn secondary">Login</Link>
            </div>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp />
              </div>
              <h3>Portfolio Tracking</h3>
              <p>Real-time updates on your stock investments</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <AccountBalance />
              </div>
              <h3>SIP Management</h3>
              <p>Automate and track your systematic investments</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Timeline />
              </div>
              <h3>Performance Analytics</h3>
              <p>Detailed insights into your investment growth</p>
            </div>
           
          </div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* SIP Calculator */}
      <section className="home-section sip-section">
        <div className="section-header">
          <h2>SIP Calculator</h2>
          <p>Plan your investment journey with our SIP calculator</p>
        </div>
        <div className="home-sip">
          <SIPCalculator />
        </div>
      </section>
    </div>
  );
};

export default Home;
