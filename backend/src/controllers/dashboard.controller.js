const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
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

    // 3. Revenue aggregates
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
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' },
          },
          revenue: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' },
          pending: { $sum: '$pendingAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          revenue: 1,
          paid: 1,
          pending: 1,
          count: 1,
        },
      },
      { $sort: { year: -1, month: -1 } },
      { $limit: 12 },
    ]);

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
