import React, { useState, useEffect } from "react";
import api from "../services/api";
import webSocketService from "../services/websocket";
import { formatIndianNumber } from "../utils/numberFormat";

const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [success, setSuccess] = useState("");

  // SIP Calculator states
  const [sipAmount, setSipAmount] = useState("");
  const [sipYears, setSipYears] = useState("");
  const [sipReturnRate, setSipReturnRate] = useState("");
  const [sipResult, setSipResult] = useState(null);

  useEffect(() => {
    webSocketService.connect();
    fetchUserBalance();
    const unsubscribe = webSocketService.subscribe((stockData) => {
      setStocks(prevStocks => {
        return prevStocks.map(stock => {
          if (stock.symbol === stockData.symbol) {
            const updatedStock = {
              ...stock,
              currentPrice: stockData.currentPrice,
              dayHigh: stockData.dayHigh,
              dayLow: stockData.dayLow,
              volume: stockData.volume,
              lastUpdated: new Date()
            };
            return updatedStock;
          }
          return stock;
        });
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Calculate SIP results whenever inputs change
  useEffect(() => {
    if (
      sipAmount !== "" &&
      sipYears !== "" &&
      sipReturnRate !== ""
    ) {
      const amount = Number(sipAmount);
      const years = Number(sipYears);
      const returnRate = Number(sipReturnRate);
      if (amount > 0 && years > 0 && returnRate > 0) {
        const monthlyRate = returnRate / (12 * 100);
        const months = years * 12;
        const futureValue = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        const totalInvestment = amount * months;
        const expectedReturns = futureValue - totalInvestment;
        setSipResult({
          totalInvestment: Math.round(totalInvestment),
          expectedReturns: Math.round(expectedReturns),
          futureValue: Math.round(futureValue)
        });
      } else {
        setSipResult(null);
      }
    } else {
      setSipResult(null);
    }
  }, [sipAmount, sipYears, sipReturnRate]);

  const fetchUserBalance = async () => {
    try {
      const response = await api.get("/auth/profile");
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const symbol = searchTerm.toUpperCase();
    try {
      const response = await api.get(`/stocks/${symbol}`);
      const stockData = Array.isArray(response.data) ? response.data : [response.data];
      
      if (stockData.length === 0) {
        setError(`No stock found with symbol "${symbol}"`);
        setStocks([]);
      } else {
        setStocks(stockData.map(stock => ({
          ...stock,
          lastUpdated: new Date()
        })));
      }
    } catch (error) {
      console.error("Error searching stocks:", error);
      const errorMessage = error.response?.data?.message || error.message;
      
      if (errorMessage.includes("API rate limit")) {
        setError(`API rate limit reached. Please wait a minute before trying again.`);
      } else if (errorMessage.includes("AlphaVantage API key not configured")) {
        setError(`To search international stocks like ${symbol}, please configure the API key. Contact administrator.`);
      } else {
        setError(errorMessage || `Failed to fetch data for ${symbol}. Please verify the symbol and try again.`);
      }
      setStocks([]);
    }
    setLoading(false);
  };

  const addToPortfolio = async (stock) => {
    try {
      if (stock.currentPrice > userBalance) {
        setError(`Insufficient balance. Required: ${formatIndianNumber(stock.currentPrice)}, Available: ${formatIndianNumber(userBalance)}`);
        return;
      }

      await api.post("/portfolio", {
        symbol: stock.symbol,
        quantity: 1,
        buyPrice: stock.currentPrice
      });

      setUserBalance(prevBalance => prevBalance - stock.currentPrice);
      setSuccess("Stock added to portfolio!");
      setError("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      setError(error.response?.data?.message || "Error adding stock to portfolio");
    }
  };

  return (
    <div className="stock-search">
      <div className="balance-info">
        <h3>Available Balance</h3>
        <p className="balance">{formatIndianNumber(userBalance)}</p>
      </div>

      <div className="sip-calculator" style={{
        backgroundColor: "#f5f5f5",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>


 <h2>Search Stocks</h2>
      <form onSubmit={handleSearch} className="search-form" style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter stock symbol (e.g., RELIANCE)"
            required
            style={{ width: "100%" }}
          />
        </div>
        <button type="submit">Search</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div className="error-message" style={{ color: "red", margin: "10px 0" }}>{error}</div>}
      {success && <div className="success-message" style={{ color: "green", margin: "10px 0" }}>{success}</div>}

      <div className="search-results">
        {stocks.map((stock) => (
          <div key={stock.symbol} className="stock-card">
            <h3>{stock.symbol}</h3>
            <p className="company-name">{stock.companyName}</p>
            <div className="stock-details">
              <div className="detail">
                <span>Current Price:</span>
                <span>{formatIndianNumber(stock.currentPrice)}</span>
              </div>
              <div className="detail">
                <span>Day High:</span>
                <span>{stock.dayHigh ? formatIndianNumber(stock.dayHigh) : "N/A"}</span>
              </div>
              <div className="detail">
                <span>Day Low:</span>
                <span>{stock.dayLow ? formatIndianNumber(stock.dayLow) : "N/A"}</span>
              </div>
              <div className="detail">
                <span>Volume:</span>
                <span>{stock.volume?.toLocaleString() || "N/A"}</span>
              </div>
              {stock.lastUpdated && (
                <div className="detail">
                  <span>Last Updated:</span>
                  <span>{new Date(stock.lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => addToPortfolio(stock)}
              className="add-to-portfolio-btn"
              disabled={stock.currentPrice > userBalance}
            >
              {stock.currentPrice > userBalance ? "Insufficient Balance" : "Buy"}
            </button>
          </div>
        ))}
      </div>

        <h2>SIP Calculator</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>Monthly Investment (₹)</label>
            <input
              type="number"
              min="500"
              step="500"
              placeholder="Enter monthly amount"
              value={sipAmount || ""}
              onChange={(e) => setSipAmount(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>Investment Period (Years)</label>
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Enter years"
              value={sipYears || ""}
              onChange={(e) => setSipYears(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>Expected Return Rate (%)</label>
            <input
              type="number"
              min="1"
              max="30"
              step="0.1"
              placeholder="Enter expected return rate"
              value={sipReturnRate || ""}
              onChange={(e) => setSipReturnRate(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd"
              }}
            />
          </div>

        </div>
        {sipResult && (
          <div style={{
            backgroundColor: "#fff",
            padding: "15px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ marginBottom: "10px" }}>SIP Results</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <p style={{ color: "#666" }}>Total Investment</p>
                  <p style={{ fontSize: "1.2em", fontWeight: "bold" }}>{formatIndianNumber(sipResult.totalInvestment)}</p>
                </div>
                <div>
                  <p style={{ color: "#666" }}>Expected Returns</p>
                  <p style={{ fontSize: "1.2em", fontWeight: "bold", color: "#4CAF50" }}>{formatIndianNumber(sipResult.expectedReturns)}</p>
                </div>
              </div>
      
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{ color: "#666", fontSize: "1em" }}>Future Value</p>
                <p style={{ fontSize: "1.5em", fontWeight: "bold", color: "#2196F3" }}>{formatIndianNumber(sipResult.futureValue)}</p>
              </div>
              
              
            </div>
          </div>
        )}
      </div>

     
    </div>
  );
};

export default StockSearch;