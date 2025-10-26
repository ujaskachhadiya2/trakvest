import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AccountBalanceWallet as WalletIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

import api from "../services/api";
import { formatIndianNumber } from "../utils/numberFormat";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        setUser(response.data);
        setFormData({
          name: response.data.name || "",
          phone: response.data.phone || ""
        });
      } catch (error) {
        showNotification("Failed to fetch profile data", "error");
      }
    };
    loadProfile();
  }, []);

  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("topup");
  const [processing, setProcessing] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Component configuration
  const PROFILE_FIELDS = [
    { 
      icon: <EditIcon />, 
      label: "Full Name", 
      field: "name",
      color: "primary",
      bgcolor: "primary.lighter"
    },
    { 
      icon: <EmailIcon />, 
      label: "Email Address", 
      field: "email",
      color: "info",
      bgcolor: "info.lighter"
    },
    { 
      icon: <PhoneIcon />, 
      label: "Phone Number", 
      field: "phone",
      color: "success",
      bgcolor: "success.lighter"
    }
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        setUser(response.data);
        setFormData({
          name: response.data.name || "",
          phone: response.data.phone || ""
        });
      } catch (error) {
        showNotification("Failed to fetch profile data", "error");
      }
    };
    loadProfile();
  }, []);

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
    setShowCustomAmount(false);
  };

  const handleCustomAmount = () => {
    setAmount("");
    setShowCustomAmount(true);
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    setProcessing(true);
    try {
      const endpoint = transactionType === "topup" ? "/auth/topup" : "/auth/withdraw";
      const response = await api.post(endpoint, { amount: Number(amount) });
      setUser({ ...user, balance: response.data.balance });
      showNotification(
        `Successfully ${transactionType === "topup" ? "added" : "withdrawn"} ${formatIndianNumber(amount)}`,
        "success"
      );
      setAmount("");
      setShowCustomAmount(false);
    } catch (error) {
      showNotification(error.response?.data?.message || `Failed to process ${transactionType}`, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch("/auth/profile", formData);
      setUser(response.data);
      setIsEditing(false);
      showNotification("Profile updated successfully");

      const storedUser = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...formData }));
    } catch (error) {
      showNotification(error.response?.data?.message || "Error updating profile", "error");
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 4 }, 
        mb: { xs: 4, sm: 5, md: 6 },
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Grid container spacing={4}>
        {/* Left Column - Balance and Transactions */}
        <Grid item xs={12} md={8}>
          {/* Balance Card */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 4,
              background: "white",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 4,
                background: "linear-gradient(135deg, #2196F3 0%, #1E88E5 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden"
              }}>
                <Box sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: "200px",
                  height: "200px",
                  background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                  borderRadius: "50%"
                }} />
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: 3,
                  mb: 3
                }}>
                  <Box sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(8px)"
                  }}>
                    <WalletIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      Available Balance
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}>
                      {formatIndianNumber(user.balance || 0)}
                    </Typography>
                  </Box>
                </Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    display: "inline-block",
                    bgcolor: "rgba(255,255,255,0.2)",
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    backdropFilter: "blur(8px)"
                  }}
                >
                  Available for stock purchases
                </Typography>
              </Box>
            </CardContent>
          </Card>

        {/* Right Column - Profile Details */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              height: "100%",
              background: "white"
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                mb: 4
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Profile Details
                </Typography>
                {!isEditing && (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "primary.main",
                      py: 1,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "primary.dark",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                      }
                    }}
                  >
                    Edit
                  </Button>
                )}
              </Box>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate}>
                  <Box sx={{ 
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                  }}>
                    {PROFILE_FIELDS.map((field, index) => (
                      field.field !== "email" && (
                        <Box 
                          key={index}
                          sx={{
                            position: "relative",
                            "&:hover": {
                              "& .field-icon": {
                                transform: "translateY(-2px)",
                                color: `${field.color}.main`,
                              }
                            }
                          }}
                        >
                          <Box 
                            sx={{ 
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1
                            }}
                          >
                            <Box 
                              className="field-icon"
                              sx={{ 
                                transition: "all 0.2s ease",
                                color: `${field.color}.light`
                              }}
                            >
                              {field.icon}
                            </Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: `${field.color}.main`,
                                fontWeight: 600
                              }}
                            >
                              {field.label}
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            value={formData[field.field]}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              [field.field]: e.target.value 
                            })}
                            required={field.field === "name"}
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                bgcolor: field.bgcolor,
                                "& fieldset": {
                                  borderColor: "transparent"
                                },
                                "&:hover fieldset": {
                                  borderColor: `${field.color}.main`
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: `${field.color}.main`
                                },
                                "& input": {
                                  py: 1.5,
                                  px: 2,
                                  "&::placeholder": {
                                    color: `${field.color}.main`,
                                    opacity: 0.5
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                      )
                    ))}
                    
                    <Box sx={{ 
                      display: "flex", 
                      gap: 2, 
                      mt: 4,
                      mb: 2
                    }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          py: 2,
                          bgcolor: "success.main",
                          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
                          "&:hover": {
                            bgcolor: "success.dark",
                            boxShadow: "0 6px 16px rgba(76, 175, 80, 0.3)",
                            transform: "translateY(-1px)"
                          },
                          transition: "all 0.2s ease"
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user.name || "",
                            phone: user.phone || "",
                          });
                        }}
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          py: 2,
                          borderWidth: 2,
                          "&:hover": {
                            borderWidth: 2,
                            bgcolor: "error.lighter",
                            transform: "translateY(-1px)"
                          },
                          transition: "all 0.2s ease"
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </form>
              ) : (
                <Box sx={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: 3
                }}>
                  {PROFILE_FIELDS.map((field, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: field.bgcolor,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }
                      }}
                    >
                      <Box sx={{ 
                        minWidth: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: "white",
                        color: `${field.color}.main`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                      }}>
                        {field.icon}
                      </Box>
                      <Box>
                        <Typography 
                          variant="caption"
                          sx={{ 
                            color: `${field.color}.dark`,
                            fontWeight: 500,
                            display: "block",
                            mb: 0.5
                          }}
                        >
                          {field.label}
                        </Typography>
                        <Typography 
                          variant="subtitle1"
                          sx={{ 
                            color: `${field.color}.darker`,
                            fontWeight: 500,
                            lineHeight: 1.4
                          }}
                        >
                          {user[field.field] || "Not set"}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
{/* Transaction Card */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: "white",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #2196F3, #1E88E5, #2196F3)",
                backgroundSize: "200% 100%",
                animation: "gradientMove 4s linear infinite"
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4
              }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Manage Funds
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Add or withdraw funds from your account
                  </Typography>
                </Box>
                <Box sx={{
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                  <WalletIcon sx={{ fontSize: 20 }} />
                  Quick Transfer
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <ToggleButtonGroup
                  exclusive
                  value={transactionType}
                  onChange={(e, value) => value && setTransactionType(value)}
                  sx={{ 
                    width: "100%",
                    "& .MuiToggleButton-root": {
                      flex: 1,
                      py: 1.5,
                      borderRadius: "12px !important",
                      borderColor: "divider",
                      "&.Mui-selected": {
                        bgcolor: transactionType === "topup" ? "success.lighter" : "error.lighter",
                        color: transactionType === "topup" ? "success.main" : "error.main",
                        "&:hover": {
                          bgcolor: transactionType === "topup" ? "success.lighter" : "error.lighter",
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="topup">
                    <AddIcon sx={{ mr: 1 }} /> Add Funds
                  </ToggleButton>
                  <ToggleButton value="withdraw">
                    <RemoveIcon sx={{ mr: 1 }} /> Withdraw
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
                gap: 2, 
                mb: 4
              }}>
                {[1000, 5000, 10000, 25000, 50000].map((value) => (
                  <Button
                    key={value}
                    variant={amount === value.toString() ? "contained" : "outlined"}
                    onClick={() => handleAmountSelect(value)}
                    disabled={processing || (transactionType === "withdraw" && value > (user.balance || 0))}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: amount === value.toString() 
                        ? (transactionType === "topup" ? "success.lighter" : "error.lighter")
                        : "transparent",
                      color: amount === value.toString()
                        ? (transactionType === "topup" ? "success.dark" : "error.dark")
                        : "text.primary",
                      borderColor: amount === value.toString()
                        ? (transactionType === "topup" ? "success.main" : "error.main")
                        : "divider",
                      "&:hover": {
                        backgroundColor: amount === value.toString()
                          ? (transactionType === "topup" ? "success.lighter" : "error.lighter")
                          : "action.hover"
                      }
                    }}
                  >
                    {formatIndianNumber(value)}
                  </Button>
                ))}
                <Button
                  variant={showCustomAmount ? "contained" : "outlined"}
                  onClick={handleCustomAmount}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: showCustomAmount 
                      ? (transactionType === "topup" ? "success.lighter" : "error.lighter")
                      : "transparent",
                    color: showCustomAmount
                      ? (transactionType === "topup" ? "success.dark" : "error.dark")
                      : "text.primary",
                    borderColor: showCustomAmount
                      ? (transactionType === "topup" ? "success.main" : "error.main")
                      : "divider"
                  }}
                >
                  Custom
                </Button>
              </Box>

              {showCustomAmount && (
                <Box sx={{ maxWidth: "400px", mx: "auto", mb: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Enter Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={processing}
                    InputProps={{
                      startAdornment: "₹",
                      sx: {
                        borderRadius: 2,
                        "& input": {
                          p: 2
                        }
                      }
                    }}
                  />
                </Box>
              )}

              {amount && (
                <Box sx={{ maxWidth: "400px", mx: "auto" }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleTransaction}
                    disabled={processing}
                    startIcon={transactionType === "topup" ? <AddIcon /> : <RemoveIcon />}
                    sx={{
                      bgcolor: transactionType === "topup" ? "success.main" : "error.main",
                      color: "white",
                      py: 2,
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: transactionType === "topup" ? "success.dark" : "error.dark",
                      },
                      "&:disabled": {
                        bgcolor: "action.disabledBackground",
                        color: "text.disabled"
                      }
                    }}
                  >
                    {processing ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Processing...
                      </Box>
                    ) : (
                      `${transactionType === "topup" ? "Add" : "Withdraw"} ${formatIndianNumber(amount)}`
                    )}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;