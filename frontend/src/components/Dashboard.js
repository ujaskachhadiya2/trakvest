import React, { useState, useEffect } from "react";
import api from "../services/api";
import webSocketService from "../services/websocket";
import { formatIndianNumber } from "../utils/numberFormat";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [, setPortfolio] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    targetDate: "",
    description: "",
    type: "investment" // investment, savings, profit
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchSummary();
    fetchPortfolio();
    fetchGoals();
    
    webSocketService.connect();

    const unsubscribe = webSocketService.subscribe((stockData) => {
      setSummary(prevSummary => {
        if (!prevSummary) return prevSummary;

        try {
          const updatedItems = prevSummary.items.map(item => {
            if (item.symbol === stockData.symbol) {
              const currentValue = item.quantity * stockData.currentPrice;
              const investment = item.quantity * item.averageBuyPrice;
              const profitLoss = currentValue - investment;
              return {
                ...item,
                currentPrice: stockData.currentPrice,
                dayHigh: stockData.dayHigh,
                dayLow: stockData.dayLow,
                currentValue,
                investment,
                profitLoss,
                profitLossPercentage: (profitLoss / investment) * 100
              };
            }
            return item;
          });

          const totalCurrentValue = updatedItems.reduce((sum, item) => sum + item.currentValue, 0);
          const totalInvestment = updatedItems.reduce((sum, item) => sum + item.investment, 0);

          return {
            totalInvestment,
            currentValue: totalCurrentValue,
            items: updatedItems
          };
        } catch (error) {
          console.error("Error processing stock update:", error);
          return prevSummary;
        }
      });

      setPortfolio(prevPortfolio => {
        return prevPortfolio.map(item => {
          if (item.symbol === stockData.symbol) {
            const currentValue = item.quantity * stockData.currentPrice;
            const investment = item.quantity * item.averageBuyPrice;
            const profitLoss = currentValue - investment;
            return {
              ...item,
              currentPrice: stockData.currentPrice,
              currentValue,
              investment,
              profitLoss,
              profitLossPercentage: (profitLoss / investment) * 100
            };
          }
          return item;
        });
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);


  
  const fetchGoals = async () => {
    try {
      // Try to fetch goals from API, fallback to localStorage
      const response = await api.get("/goals");
      setGoals(response.data);
    } catch (error) {
      console.log("Goals API not available, using localStorage");
      const savedGoals = localStorage.getItem("userGoals");
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  };

  // Fetch user"s portfolio (same logic as Portfolio component)
  const fetchPortfolio = async () => {
    try {
      const response = await api.get("/portfolio");
      const portfolioWithValues = response.data.map(item => ({
        ...item,
        currentValue: item.quantity * (item.currentPrice || item.averageBuyPrice),
        investment: item.quantity * item.averageBuyPrice
      }));
      setPortfolio(portfolioWithValues);
    } catch (err) {
      console.error("Error fetching portfolio in Dashboard:", err);
    }
  };

  // Build a summary object from portfolio data
  const fetchSummary = async () => {
    try {
      const response = await api.get("/portfolio");
      const items = response.data.map(item => {
        const currentPrice = item.currentPrice || item.averageBuyPrice || 0;
        const currentValue = item.quantity * currentPrice;
        const investment = item.quantity * (item.averageBuyPrice || 0);
        const profitLoss = currentValue - investment;
        return {
          symbol: item.symbol,
          quantity: item.quantity,
          averageBuyPrice: item.averageBuyPrice,
          currentPrice,
          currentValue,
          investment,
          profitLoss,
          profitLossPercentage: investment ? (profitLoss / investment) * 100 : 0
        };
      });

      const totalCurrentValue = items.reduce((sum, it) => sum + (it.currentValue || 0), 0);
      const totalInvestment = items.reduce((sum, it) => sum + (it.investment || 0), 0);

      setSummary({
        totalInvestment,
        currentValue: totalCurrentValue,
        items
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError("Unable to load portfolio summary");
      setLoading(false);
    }
  };

  const saveGoalsToStorage = (updatedGoals) => {
    localStorage.setItem("userGoals", JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      alert("Please fill in all required fields");
      return;
    }

    const goalToAdd = {
      id: Date.now().toString(),
      ...newGoal,
      targetAmount: parseFloat(newGoal.targetAmount),
      createdAt: new Date().toISOString(),
      progress: 0
    };

    try {
      // Try to save to API first
      await api.post("/goals", goalToAdd);
      fetchGoals();
    } catch (error) {
      // Fallback to localStorage
      const updatedGoals = [...goals, goalToAdd];
      saveGoalsToStorage(updatedGoals);
    }

    setNewGoal({
      title: "",
      targetAmount: "",
      targetDate: "",
      description: "",
      type: "investment"
    });
    setShowAddGoal(false);
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    try {
      await api.delete(`/goals/${goalId}`);
      fetchGoals();
    } catch (error) {
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      saveGoalsToStorage(updatedGoals);
    }
  };

  const calculateGoalProgress = (goal) => {
    if (!summary) return 0;
    
    switch (goal.type) {
      case "investment":
        return Math.min((summary.totalInvestment / goal.targetAmount) * 100, 100);
      case "profit":
        const totalProfitLoss = summary.currentValue - summary.totalInvestment;
        return Math.min((Math.max(totalProfitLoss, 0) / goal.targetAmount) * 100, 100);
      case "portfolio_value":
        return Math.min((summary.currentValue / goal.targetAmount) * 100, 100);
      default:
        return 0;
    }
  };

  if (loading) return <div className="loading">Loading your portfolio data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div className="no-data">No portfolio data available</div>;

  const totalProfitLoss = summary.currentValue - summary.totalInvestment;
  const totalProfitLossPercentage = (totalProfitLoss / summary.totalInvestment) * 100;

  return (
    <div className="dashboard">
      {user && <h2>Welcome, {user.name}!</h2>}
      
      <div className="portfolio-card">
        <h3>Portfolio Overview</h3>
        <div className="summary-cards">
          <div className="summary-item">
            <h4>Total Investment</h4>
            <p>{formatIndianNumber(summary.totalInvestment)}</p>
          </div>
          <div className="summary-item">
            <h4>Current Value</h4>
            <p>{formatIndianNumber(summary.currentValue)}</p>
          </div>
          <div className="summary-item">
            <h4>Total P/L</h4>
            <p style={{ color: totalProfitLoss >= 0 ? "#22c55e" : "#ef4444" }}>
              {formatIndianNumber(totalProfitLoss)}
              <span style={{ marginLeft: "4px" }}>
                ({totalProfitLossPercentage.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      

      {/* Goals Section */}
      <div className="portfolio-card">
        <div className="goals-header">
          <h3>Financial Goals</h3>
          <button 
            className="add-goal-btn"
            onClick={() => setShowAddGoal(!showAddGoal)}
          >
            {showAddGoal ? "Cancel" : "+ Add Goal"}
          </button>
        </div>

        {showAddGoal && (
          <div className="add-goal-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Goal Title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              />
              <select
                value={newGoal.type}
                onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
              >
                <option value="investment">Total Investment</option>
                <option value="portfolio_value">Portfolio Value</option>
                <option value="profit">Profit Target</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Target Amount (₹)"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
              />
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
              />
            </div>
            <textarea
              placeholder="Description (optional)"
              value={newGoal.description}
              onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
            />
            <div className="form-actions">
              <button onClick={addGoal} className="save-goal-btn">Save Goal</button>
            </div>
          </div>
        )}

        <div className="goals-list">
          {goals.length === 0 ? (
            <p className="no-goals">No goals set yet. Add your first financial goal to track your progress!</p>
          ) : (
            goals.map((goal) => {
              const progress = calculateGoalProgress(goal);
              const isOverdue = new Date(goal.targetDate) < new Date();
              const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={goal.id} className={`goal-item ${isOverdue ? "overdue" : ""}`}>
                  <div className="goal-header">
                    <h4>{goal.title}</h4>
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="delete-goal-btn"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="goal-details">
                    <div className="goal-info">
                      <span className="goal-type">{goal.type.replace("_", " ").toUpperCase()}</span>
                      <span className="goal-amount">Target: {formatIndianNumber(goal.targetAmount)}</span>
                      <span className={`goal-deadline ${isOverdue ? "overdue" : ""}`}>
                        {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days left`}
                      </span>
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: progress >= 100 ? "#22c55e" : progress >= 75 ? "#3b82f6" : progress >= 50 ? "#f59e0b" : "#ef4444"
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{progress.toFixed(1)}% Complete</span>
                    </div>
                    
                    {goal.description && (
                      <p className="goal-description">{goal.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="portfolio-card">
        <h3>Your Holdings</h3>
        <div className="holdings-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Avg. Buy Price</th>
                <th>Current Price</th>
                <th>Investment</th>
                <th>Current Value</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {summary.items.map((item) => (
                <tr key={item.symbol} className={item.profitLoss >= 0 ? "profit-row" : "loss-row"}>
                  <td>{item.symbol}</td>
                  <td>{item.quantity}</td>
                  <td>{formatIndianNumber(item.averageBuyPrice)}</td>
                  <td>{formatIndianNumber(item.currentPrice)}</td>
                  <td>{formatIndianNumber(item.investment)}</td>
                  <td>{formatIndianNumber(item.currentValue)}</td>
                  <td className={item.profitLoss >= 0 ? "profit" : "loss"}>
                    {formatIndianNumber(item.profitLoss)}
                    <span>({item.profitLossPercentage.toFixed(2)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;