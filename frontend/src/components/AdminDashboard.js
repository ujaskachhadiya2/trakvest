import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  TextField,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupIcon from "@mui/icons-material/Group";
import FolderIcon from "@mui/icons-material/Folder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [query, setQuery] = useState("");
  const [showDisabled] = useState(false);

  // Export functions

  const convertUsersToCSV = (data) => {
    // Flatten users: include basic fields and a JSON string for portfolios
    const rows = data.map(u => ({
      _id: u._id,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      isAdmin: !!u.isAdmin,
      isActive: typeof u.isActive === "undefined" ? true : !!u.isActive,
      balance: u.balance || 0,
      createdAt: u.createdAt || "",
      portfolios: JSON.stringify(u.portfolios || [])
    }));

    const header = Object.keys(rows[0] || {});
    const escape = (v) => {
      if (v === null || typeof v === "undefined") return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
        return "\"" + s.replace(/"/g, "\"\"") + "\"";
      }
      return s;
    };

    const csv = [header.join(",")].concat(rows.map(r => header.map(h => escape(r[h])).join(","))).join("\n");
    return csv;
  };

  const handleExportCSV = () => {
    // Export only registered (non-admin, active) users
    const registered = users.filter(u => !u.isAdmin && u.isActive !== false);
    if (!registered || registered.length === 0) return alert("No registered users to export");
    const csv = convertUsersToCSV(registered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Export only registered (non-admin, active) users
    const registered = users.filter(u => !u.isAdmin && u.isActive !== false);
    if (!registered || registered.length === 0) return alert("No registered users to export");

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Stock Portfolio - User Report", 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);
    
    // Add statistics summary
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Summary Statistics:", 20, 45);
    
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Total Users: ${stats.totalUsers || 0}`, 20, 55);
    doc.text(`Total Portfolios: ${stats.totalPortfolios || 0}`, 20, 62);
    doc.text(`Total Stocks: ${stats.totalStocks || 0}`, 20, 69);
    doc.text(`Active Registered Users: ${registered.length}`, 20, 76);
    
    // Prepare user data for table
    const tableData = registered.map(user => [
      user.name || "N/A",
      user.email || "N/A",
      user.phone || "N/A",
      new Date(user.createdAt).toLocaleDateString(),
      `$${(user.balance || 0).toFixed(2)}`,
      (user.portfolios || []).length.toString(),
      user.isActive === false ? "Inactive" : "Active"
    ]);
    
    // Add user table
    autoTable(doc, {
      head: [["Name", "Email", "Phone", "Registered", "Balance", "Portfolios", "Status"]],
      body: tableData,
      startY: 85,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold"
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 85, left: 20, right: 20 }
    });
    
    // Calculate starting position for portfolio details
    let currentY = 85 + (tableData.length * 12) + 30; // Approximate calculation
    
    registered.forEach((user, userIndex) => {
      if (user.portfolios && user.portfolios.length > 0) {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        // User portfolio header
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(`${user.name}"s Portfolio Details:`, 20, currentY);
        currentY += 10;
        
        // Portfolio table data
        const portfolioData = user.portfolios.map(portfolio => [
          portfolio.symbol || "N/A",
          (portfolio.quantity || 0).toString(),
          `$${(portfolio.averageBuyPrice || 0).toFixed(2)}`,
          `$${((portfolio.quantity || 0) * (portfolio.averageBuyPrice || 0)).toFixed(2)}`,
          (portfolio.transactions || []).length.toString(),
          portfolio.investmentDate ? new Date(portfolio.investmentDate).toLocaleDateString() : "N/A"
        ]);
        
        autoTable(doc, {
          head: [["Symbol", "Quantity", "Avg Price", "Total Value", "Transactions", "Investment Date"]],
          body: portfolioData,
          startY: currentY,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: "bold"
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          margin: { left: 20, right: 20 }
        });
        
        // Approximate calculation for next position
        currentY += (portfolioData.length * 10) + 25;
      }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text("Stock Portfolio Admin Dashboard", 20, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`users_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refetch when showDisabled toggles
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDisabled]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/admin/users${showDisabled ? "?showDisabled=true" : ""}`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setLoading(false);
    }
  };



  const handleEditUser = async (user) => {
    const name = window.prompt("Name:", user.name) || user.name;
    const phone = window.prompt("Phone:", user.phone || "") || user.phone;
    try {
      await api.put(`/admin/users/${user._id}`, { name, phone });
      fetchData();
    } catch (error) {
      console.error("Error editing user:", error);
    }
  };


  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Paper sx={{ p: 2, mb: 3, background: "#f5f5f5" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
              sx: { background: "white" }
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
              sx={{
                background: "linear-gradient(45deg, #1976D2 30%, #2196F3 90%)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565C0 30%, #1976D2 90%)",
                }
              }}
            >
              CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportPDF}
              sx={{
                background: "linear-gradient(45deg, #43A047 30%, #66BB6A 90%)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(45deg, #2E7D32 30%, #43A047 90%)",
                }
              }}
            >
              PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            color: "white",
            boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
          }}>
            <CardContent sx={{ position: "relative", padding: 3 }}>
              <Box sx={{ position: "absolute", top: 16, right: 16, opacity: 0.3 }}>
                <GroupIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }} gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{
            background: "linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)",
            color: "white",
            boxShadow: "0 3px 5px 2px rgba(255, 152, 0, .3)",
          }}>
            <CardContent sx={{ position: "relative", padding: 3 }}>
              <Box sx={{ position: "absolute", top: 16, right: 16, opacity: 0.3 }}>
                <FolderIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }} gutterBottom>
                Total Portfolios
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.totalPortfolios}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{
            background: "linear-gradient(45deg, #4CAF50 30%, #81C784 90%)",
            color: "white",
            boxShadow: "0 3px 5px 2px rgba(76, 175, 80, .3)",
          }}>
            <CardContent sx={{ position: "relative", padding: 3 }}>
              <Box sx={{ position: "absolute", top: 16, right: 16, opacity: 0.3 }}>
                <ShowChartIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }} gutterBottom>
                Total Stocks
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.totalStocks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table - only registered (non-admin, active) users are shown */}
      <Paper sx={{ width: "100%", mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ width: "48px" }}></TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Registered At</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .filter(u => !u.isAdmin && u.isActive !== false)
                .filter(u => {
                  if (!query) return true;
                  const q = query.toLowerCase();
                  return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q);
                })
                .map((user) => (
                <React.Fragment key={user._id}>
                  <TableRow 
                    hover
                    sx={{ 
                      "&:nth-of-type(odd)": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
                      transition: "background-color 0.2s"
                    }}
                  >
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => setExpandedUsers(prev => ({ ...prev, [user._id]: !prev[user._id] }))}
                        sx={{
                          transform: expandedUsers[user._id] ? "rotate(180deg)" : "rotate(0)",
                          transition: "transform 0.3s"
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: "success.main", fontWeight: 500 }}>${(user.balance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: "inline-block",
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        backgroundColor: user.isActive === false ? "error.light" : "success.light",
                        color: user.isActive === false ? "error.dark" : "success.dark"
                      }}>
                        {user.isActive === false ? "Disabled" : "Active"}
                      </Box>
                    </TableCell>
                    <TableCell>
                      
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{
                          mr: 1,
                          background: "linear-gradient(45deg, #9575CD 30%, #B39DDB 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #7E57C2 30%, #9575CD 90%)",
                          }
                        }}
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DeleteIcon />}
                        sx={{
                          background: "linear-gradient(45deg, #EF5350 30%, #E57373 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #E53935 30%, #EF5350 90%)",
                          }
                        }}
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: "none" }}>
                      <Collapse in={!!expandedUsers[user._id]} timeout="auto" unmountOnExit>
                        <Box sx={{ 
                          p: 3,
                          backgroundColor: "rgba(0, 0, 0, 0.02)",
                          borderTop: "1px solid rgba(224, 224, 224, 1)"
                        }}>
                          
                          <Typography 
                            variant="h6" 
                            gutterBottom 
                            sx={{ 
                              color: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              gap: 1
                            }}
                          >
                            <FolderIcon /> User Portfolios
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          {user.portfolios && user.portfolios.length > 0 ? (
                            <Grid container spacing={2}>
                              {user.portfolios.map(p => (
                                <Grid item xs={12} sm={6} md={4} key={p._id}>
                                  <Card 
                                    elevation={2}
                                    sx={{
                                      height: "100%",
                                      background: "white",
                                      transition: "transform 0.2s, box-shadow 0.2s",
                                      "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow: 3
                                      }
                                    }}
                                  >
                                    <CardContent>
                                      <Typography variant="h6" color="primary" gutterBottom>
                                        {p.symbol}
                                      </Typography>
                                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                          <Typography color="text.secondary">Quantity:</Typography>
                                          <Typography fontWeight="medium">{p.quantity}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                          <Typography color="text.secondary">Avg Buy Price:</Typography>
                                          <Typography fontWeight="medium" color="primary">
                                            ${Number(p.averageBuyPrice).toFixed(2)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                          <Typography color="text.secondary">Total Value:</Typography>
                                          <Typography fontWeight="medium" color="success.main">
                                            ${(p.quantity * p.averageBuyPrice).toFixed(2)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                          <Typography color="text.secondary">Transactions:</Typography>
                                          <Typography 
                                            sx={{ 
                                              bgcolor: "info.light",
                                              color: "info.dark",
                                              px: 1,
                                              py: 0.5,
                                              borderRadius: 1,
                                              fontSize: "0.875rem"
                                            }}
                                          >
                                            {(p.transactions || []).length}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box 
                              sx={{ 
                                p: 3, 
                                textAlign: "center",
                                bgcolor: "background.paper",
                                borderRadius: 1
                              }}
                            >
                              <Typography color="text.secondary">No portfolios found for this user</Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;