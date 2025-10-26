export const formatIndianNumber = (num) => {
  // Convert to number if it's a string
  const value = Number(num);
  
  // Check if it's a valid number
  if (isNaN(value)) {
    return '₹0.00';
  }

  const numStr = value.toFixed(2);
  const [wholePart, decimal] = numStr.split('.');
  const lastThree = wholePart.slice(-3);
  const otherNumbers = wholePart.slice(0, -3);
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${otherNumbers ? formatted + ',' + lastThree : lastThree}${decimal ? '.' + decimal : ''}`;
};