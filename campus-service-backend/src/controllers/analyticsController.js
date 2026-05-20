const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { getAiRuntimeMetrics } = require("../services/ai/aiMetrics");

const getAdminAnalytics = async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admin/Manager only" });
    }

    const totalComplaints = await Complaint.countDocuments();
    const open = await Complaint.countDocuments({ status: "NEW" });
    const assigned = await Complaint.countDocuments({ status: "ASSIGNED" });
    const inProgress = await Complaint.countDocuments({ status: "IN_PROGRESS" });
    const completed = await Complaint.countDocuments({ status: "COMPLETED" });
    const closed = await Complaint.countDocuments({ status: "CLOSED" });
    const rejected = await Complaint.countDocuments({ status: "REJECTED" });

    const critical = await Complaint.countDocuments({ priority: "critical" });
    const high = await Complaint.countDocuments({ priority: "high" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCreated = await Complaint.countDocuments({ createdAt: { $gte: startOfDay } });
    const todayClosed = await Complaint.countDocuments({
      closedAt: { $gte: startOfDay },
      status: "CLOSED",
    });

    const avgResAgg = await Complaint.aggregate([
      { $match: { status: "CLOSED", closedAt: { $ne: null } } },
      { $project: { diff: { $subtract: ["$closedAt", "$createdAt"] } } },
      { $group: { _id: null, avgResolutionMs: { $avg: "$diff" } } },
    ]);
    const avgResolutionMs = avgResAgg[0]?.avgResolutionMs || 0;

    const techPerf = await Complaint.aggregate([
      { $match: { status: "COMPLETED", completedBy: { $ne: null } } },
      {
        $group: {
          _id: "$completedBy",
          completedCount: { $sum: 1 },
          avgCompletionMs: { $avg: { $subtract: ["$completedAt", "$createdAt"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          technicianId: "$_id",
          name: "$user.name",
          email: "$user.email",
          completedCount: 1,
          avgCompletionMs: 1,
        },
      },
      { $sort: { completedCount: -1 } },
    ]);

    const pendingByTech = await Complaint.aggregate([
      { $match: { status: { $in: ["ASSIGNED", "IN_PROGRESS"] }, assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", pendingCount: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          technicianId: "$_id",
          name: "$user.name",
          email: "$user.email",
          pendingCount: 1,
        },
      },
      { $sort: { pendingCount: -1 } },
    ]);

    const technicians = await User.countDocuments({ role: "technician" });

    return res.json({
      success: true,
      data: {
        overview: {
          totalComplaints,
          open,
          assigned,
          inProgress,
          completed,
          closed,
          rejected,
        },
        priority: {
          critical,
          high,
        },
        time: {
          avgResolutionMs,
          todayCreated,
          todayClosed,
        },
        technicians: {
          total: technicians,
          performance: techPerf,
          pending: pendingByTech,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getAiAnalytics = async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admin/Manager only" });
    }

    const [
      categoryDistribution,
      priorityDistribution,
      confidenceAgg,
      aiStatusCounts,
      criticalTrend,
      topTags,
    ] = await Promise.all([
      Complaint.aggregate([
        { $match: { aiStatus: "COMPLETED", aiCategory: { $ne: null } } },
        { $group: { _id: "$aiCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: "$_id", count: 1, _id: 0 } },
      ]),

      Complaint.aggregate([
        { $match: { aiStatus: "COMPLETED", aiPriority: { $ne: null } } },
        { $group: { _id: "$aiPriority", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { priority: "$_id", count: 1, _id: 0 } },
      ]),

      Complaint.aggregate([
        { $match: { aiStatus: "COMPLETED", aiConfidence: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: "$aiConfidence" },
            count: { $sum: 1 },
          },
        },
      ]),

      Complaint.aggregate([
        { $group: { _id: "$aiStatus", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),

      Complaint.aggregate([
        {
          $match: {
            aiPriority: "CRITICAL",
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),

      Complaint.aggregate([
        {
          $match: {
            aiStatus: "COMPLETED",
            aiTags: { $exists: true, $not: { $size: 0 } },
          },
        },
        { $unwind: "$aiTags" },
        { $group: { _id: "$aiTags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { tag: "$_id", count: 1, _id: 0 } },
      ]),
    ]);

    const statusMap = Object.fromEntries(
      aiStatusCounts.map((s) => [s.status, s.count])
    );
    const completed = statusMap.COMPLETED || 0;
    const failed = statusMap.FAILED || 0;
    const skipped = statusMap.SKIPPED || 0;
    const pending = statusMap.PENDING || 0;
    const totalProcessed = completed + failed + skipped;

    return res.json({
      success: true,
      data: {
        processing: {
          total: completed + failed + skipped + pending,
          pending,
          completed,
          failed,
          skipped,
          successRate: totalProcessed > 0
            ? Number((completed / totalProcessed).toFixed(4))
            : 0,
        },
        confidence: {
          average: Number((confidenceAgg[0]?.avgConfidence || 0).toFixed(4)),
          totalAnalyzed: confidenceAgg[0]?.count || 0,
        },
        categoryDistribution,
        priorityDistribution,
        criticalTrend,
        topTags,
        runtimeMetrics: getAiRuntimeMetrics(),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getAdminAnalytics, getAiAnalytics };
