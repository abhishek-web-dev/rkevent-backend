export const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

export const formatCurrency = (val) => {
  return currencyFormatter.format(val || 0);
};
