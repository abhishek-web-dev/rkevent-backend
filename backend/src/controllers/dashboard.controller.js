const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get dashboard KPIs and aggregates
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Customers
    const totalCustomers = await Customer.countDocuments({ isDeleted: { $ne: true } });

    // 2. Total Invoices
    const totalInvoices = await Invoice.countDocuments({ isDeleted: { $ne: true } });

    // 3. Revenue aggregates (Amount Pending calculated from remaining balances of active invoices)
    const revenueAgg = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },
        },
      },
    ]);

    const stats = revenueAgg[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
    };

    // 4. Overdue Invoices
    const overdueInvoicesCount = await Invoice.countDocuments({ status: 'Overdue', isDeleted: { $ne: true } });
    const latestOverdueInvoices = await Invoice.find({ status: 'Overdue', isDeleted: { $ne: true } })
      .populate('customer', 'name email phone')
      .sort({ dueDate: 1 })
      .limit(5);

    // 5. Monthly Revenue Aggregation (last 12 months)
    // Revenue is calculated from Invoice totals, and Paid is calculated from Payment history records.
    const invoiceMonths = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentMonths = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          paid: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyMap = {};

    invoiceMonths.forEach((item) => {
      if (item._id && item._id.year && item._id.month) {
        const key = `${item._id.year}-${item._id.month}`;
        monthlyMap[key] = {
          year: item._id.year,
          month: item._id.month,
          revenue: item.revenue || 0,
          paid: 0,
          pending: item.revenue || 0,
          count: item.count || 0,
        };
      }
    });

    paymentMonths.forEach((item) => {
      if (item._id && item._id.year && item._id.month) {
        const key = `${item._id.year}-${item._id.month}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            year: item._id.year,
            month: item._id.month,
            revenue: 0,
            paid: item.paid || 0,
            pending: 0,
            count: 0,
          };
        } else {
          monthlyMap[key].paid = item.paid || 0;
          monthlyMap[key].pending = Math.max(0, monthlyMap[key].revenue - monthlyMap[key].paid);
        }
      }
    });

    const monthlyRevenue = Object.values(monthlyMap)
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .slice(0, 12);

    // 6. Recent Invoice List
    const recentInvoices = await Invoice.find({ isDeleted: { $ne: true } })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          customersCount: totalCustomers,
          invoicesCount: totalInvoices,
          totalRevenue: stats.totalRevenue,
          totalPaid: stats.totalPaid,
          totalPending: stats.totalPending,
          overdue: {
            count: overdueInvoicesCount,
            list: latestOverdueInvoices,
          },
          monthlyRevenue,
          recentInvoices,
        },
        'Dashboard analytics retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
