import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { TextField } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";

const PortfolioReports = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [reportType, setReportType] = useState("weekly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await api.get("/portfolio");
      setPortfolios(response.data);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on report type
      const endDate = new Date(selectedDate);
      const startDate = new Date(selectedDate);
      
      if (reportType === "weekly") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (reportType === "monthly") {
        startDate.setMonth(endDate.getMonth() - 1);
      }

      // Fetch portfolio performance data for the date range
      const response = await api.get(`/portfolio/report`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: reportType
        }
      });

      setReportData(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      // If API endpoint doesn"t exist, generate report from existing portfolio data
      generateReportFromPortfolios();
    } finally {
      setLoading(false);
    }
  };

  const generateReportFromPortfolios = () => {
    // Generate report from existing portfolio data
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    
    if (reportType === "weekly") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (reportType === "monthly") {
      startDate.setMonth(endDate.getMonth() - 1);
    }

    const reportData = {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      type: reportType,
      portfolios: portfolios.map(portfolio => {
        const currentValue = portfolio.quantity * (portfolio.currentPrice || portfolio.averageBuyPrice);
        const investedValue = portfolio.quantity * portfolio.averageBuyPrice;
        const profitLoss = currentValue - investedValue;
        const profitLossPercentage = ((profitLoss / investedValue) * 100).toFixed(2);

        return {
          ...portfolio,
          currentValue: currentValue.toFixed(2),
          investedValue: investedValue.toFixed(2),
          profitLoss: profitLoss.toFixed(2),
          profitLossPercentage,
          performance: profitLoss >= 0 ? "profit" : "loss"
        };
      }),
      summary: {
        totalInvested: portfolios.reduce((sum, p) => sum + (p.quantity * p.averageBuyPrice), 0),
        totalCurrent: portfolios.reduce((sum, p) => sum + (p.quantity * (p.currentPrice || p.averageBuyPrice)), 0),
        totalProfitLoss: 0
      }
    };

    reportData.summary.totalProfitLoss = reportData.summary.totalCurrent - reportData.summary.totalInvested;
    reportData.summary.totalProfitLossPercentage = ((reportData.summary.totalProfitLoss / reportData.summary.totalInvested) * 100).toFixed(2);

    setReportData(reportData);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Portfolio Report`, 20, 20);
    
    // Add report period
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report Period: ${reportData.period}`, 20, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 37);
    
    // Add summary section
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Portfolio Summary:", 20, 50);
    
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Total Invested: $${reportData.summary.totalInvested.toFixed(2)}`, 20, 60);
    doc.text(`Current Value: $${reportData.summary.totalCurrent.toFixed(2)}`, 20, 67);
    doc.text(`Total P&L: $${reportData.summary.totalProfitLoss.toFixed(2)} (${reportData.summary.totalProfitLossPercentage}%)`, 20, 74);
    
    // Performance indicator
    const performanceColor = reportData.summary.totalProfitLoss >= 0 ? [0, 128, 0] : [255, 0, 0];
    doc.setTextColor(...performanceColor);
    doc.text(`Overall Performance: ${reportData.summary.totalProfitLoss >= 0 ? "PROFIT" : "LOSS"}`, 20, 81);
    
    // Prepare portfolio data for table
    const tableData = reportData.portfolios.map(portfolio => [
      portfolio.symbol || "N/A",
      portfolio.quantity.toString(),
      `$${portfolio.averageBuyPrice.toFixed(2)}`,
      `$${portfolio.currentPrice ? portfolio.currentPrice.toFixed(2) : portfolio.averageBuyPrice.toFixed(2)}`,
      `$${portfolio.investedValue}`,
      `$${portfolio.currentValue}`,
      `$${portfolio.profitLoss}`,
      `${portfolio.profitLossPercentage}%`,
      portfolio.performance.toUpperCase()
    ]);
    
    // Add portfolio details table
    autoTable(doc, {
      head: [["Symbol", "Quantity", "Avg Price", "Current Price", "Invested", "Current Value", "P&L", "P&L %", "Status"]],
      body: tableData,
      startY: 90,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold"
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        6: { textColor: [0, 0, 0] }, // P&L column
        7: { textColor: [0, 0, 0] }, // P&L % column
        8: { textColor: [0, 0, 0] }  // Status column
      },
      didParseCell: function (data) {
        // Color code profit/loss cells
        if (data.column.index === 6 || data.column.index === 7 || data.column.index === 8) {
          const cellValue = data.cell.raw;
          if (typeof cellValue === "string") {
            if (cellValue.includes("-") || cellValue.toLowerCase().includes("loss")) {
              data.cell.styles.textColor = [255, 0, 0]; // Red for loss
            } else if (cellValue !== "$0.00" && cellValue !== "0.00%" && cellValue.toLowerCase().includes("profit")) {
              data.cell.styles.textColor = [0, 128, 0]; // Green for profit
            }
          }
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    // Add insights section
    let currentY = 90 + (tableData.length * 8) + 30;
    
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Key Insights:", 20, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    
    // Calculate insights
    const profitableStocks = reportData.portfolios.filter(p => parseFloat(p.profitLoss) > 0).length;
    const totalStocks = reportData.portfolios.length;
    const bestPerformer = reportData.portfolios.reduce((best, current) => 
      parseFloat(current.profitLossPercentage) > parseFloat(best.profitLossPercentage) ? current : best
    );
    const worstPerformer = reportData.portfolios.reduce((worst, current) => 
      parseFloat(current.profitLossPercentage) < parseFloat(worst.profitLossPercentage) ? current : worst
    );
    
    doc.text(`• ${profitableStocks} out of ${totalStocks} stocks are profitable (${((profitableStocks/totalStocks)*100).toFixed(1)}%)`, 20, currentY);
    currentY += 7;
    doc.text(`• Best Performer: ${bestPerformer.symbol} (+${bestPerformer.profitLossPercentage}%)`, 20, currentY);
    currentY += 7;
    doc.text(`• Worst Performer: ${worstPerformer.symbol} (${worstPerformer.profitLossPercentage}%)`, 20, currentY);
    currentY += 7;
    
    const avgReturn = (reportData.portfolios.reduce((sum, p) => sum + parseFloat(p.profitLossPercentage), 0) / totalStocks).toFixed(2);
    doc.text(`• Average Return: ${avgReturn}%`, 20, currentY);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text("Portfolio Performance Report", 20, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `portfolio_${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  const getPerformanceColor = (value) => {
    return parseFloat(value) >= 0 ? "success" : "error";
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Portfolio Reports
        </Typography>
        
        {/* Report Configuration */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generate Report
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="weekly">Weekly Report</MenuItem>
                  <MenuItem value="monthly">Monthly Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Date"
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={generateReport}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
                {reportData && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={exportToPDF}
                  >
                    Export PDF
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Invested
                    </Typography>
                    <Typography variant="h5">
                      ${reportData.summary.totalInvested.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Current Value
                    </Typography>
                    <Typography variant="h5">
                      ${reportData.summary.totalCurrent.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total P&L
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={reportData.summary.totalProfitLoss >= 0 ? "success.main" : "error.main"}
                    >
                      ${reportData.summary.totalProfitLoss.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Return %
                    </Typography>
                    <Typography 
                      variant="h5"
                      color={reportData.summary.totalProfitLoss >= 0 ? "success.main" : "error.main"}
                    >
                      {reportData.summary.totalProfitLossPercentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Portfolio Details Table */}
            <Paper sx={{ width: "100%", mb: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Avg Price</TableCell>
                      <TableCell align="right">Current Price</TableCell>
                      <TableCell align="right">Invested</TableCell>
                      <TableCell align="right">Current Value</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">P&L %</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.portfolios.map((portfolio) => (
                      <TableRow key={portfolio._id || portfolio.symbol}>
                        <TableCell component="th" scope="row">
                          <Typography variant="subtitle2">
                            {portfolio.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{portfolio.quantity}</TableCell>
                        <TableCell align="right">${portfolio.averageBuyPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ${(portfolio.currentPrice || portfolio.averageBuyPrice).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">${portfolio.investedValue}</TableCell>
                        <TableCell align="right">${portfolio.currentValue}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: parseFloat(portfolio.profitLoss) >= 0 ? "success.main" : "error.main",
                            fontWeight: "bold"
                          }}
                        >
                          ${portfolio.profitLoss}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: parseFloat(portfolio.profitLoss) >= 0 ? "success.main" : "error.main",
                            fontWeight: "bold"
                          }}
                        >
                          {portfolio.profitLossPercentage}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={portfolio.performance.toUpperCase()}
                            color={getPerformanceColor(portfolio.profitLoss)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Container>
  );
};

export default PortfolioReports;
