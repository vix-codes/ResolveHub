const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Counter = require("../models/Counter");
const logAction = require("../utils/actionLogger");
const { createNotification, notifyRoles } = require("../utils/notifier");

const PRIORITY_RULES = {
  critical: ["electricity", "fire", "gas leak", "lift stuck", "water flooding"],
  high: ["water leak", "power issue", "security", "internet down"],
  medium: ["plumbing slow", "fan/light issue", "door lock"],
  low: ["noise", "painting", "cleaning", "minor repair"],
};

const detectPriority = (text) => {
  const haystack = (text || "").toLowerCase();
  if (!haystack) return "medium";
  const matches = (list) => list.some((term) => haystack.includes(term));
  if (matches(PRIORITY_RULES.critical)) return "critical";
  if (matches(PRIORITY_RULES.high)) return "high";
  if (matches(PRIORITY_RULES.medium)) return "medium";
  if (matches(PRIORITY_RULES.low)) return "low";
  return "medium";
};

const normalizeCategory = (category) => {
  if (!category) return "general";
  return String(category).trim().toLowerCase() || "general";
};

const normalizeImage = (image) => {
  if (!image) return "";
  const value = String(image).trim();
  if (!value) return "";

  const isHttpUrl = /^https?:\/\/.+/i.test(value);
  const isDataImage =
    /^data:image\/(png|jpe?g|gif|webp|bmp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(
      value
    );

  if (!isHttpUrl && !isDataImage) {
    return null;
  }

  // Keep payload bounded when base64 image is sent.
  if (isDataImage && value.length > 8 * 1024 * 1024) {
    return null;
  }

  return value;
};

const generateToken = async () => {
  const year = new Date().getFullYear();
  const prefix = `APT-${year}-`;
  const counterId = `complaint_token_${year}`;

  let counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: false } // Don't upsert yet, need to check fallback
  );

  if (!counter) {
    // Fallback: seed from existing complaints
    const latest = await Complaint.findOne({ token: new RegExp(`^${prefix}`) })
      .sort({ token: -1 })
      .select("token")
      .lean();
    let next = 1;
    if (latest && latest.token) {
      const raw = latest.token.slice(prefix.length);
      const num = parseInt(raw, 10);
      if (!Number.isNaN(num)) next = num + 1;
    }
    try {
      counter = await Counter.create({ _id: counterId, seq: next });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true }
      );
    }
  }

  return `${prefix}${String(counter.seq).padStart(4, "0")}`;
};

// ==============================
// CREATE COMPLAINT (TENANT)
// ==============================
exports.createComplaint = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ message: "Tenant only" });
    }

    const { title, description, image, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title & description required" });
    }

    const normalizedImage = normalizeImage(image);
    if (normalizedImage === null) {
      return res.status(400).json({
        message: "Image must be a valid URL or base64 data URL (max 8MB)",
      });
    }

    const token = await generateToken();
    const priority = detectPriority(`${title} ${description}`);

    const complaint = await Complaint.create({
      title,
      description,
      image: normalizedImage || "",
      category: normalizeCategory(category),
      priority,
      token,
      status: "NEW",
      createdBy: req.user.id,
    });

    await logAction({
      action: "COMPLAINT_CREATED",
      complaintId: complaint._id,
      relatedToken: complaint.token,
      performedBy: req.user.id,
      performedByRole: req.user.role,
      note: `Complaint created: ${title}`,
      req,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Token conflict, try again" });
    }
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// GET COMPLAINTS (ROLE FILTERED)
// ==============================
exports.getComplaints = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const {
      status,
      excludeStatus,
      includeClosed = "true",
      limit,
    } = req.query;

    const filter = {};
    if (role === "tenant") {
      filter.createdBy = userId;
    } else if (role === "technician") {
      filter.assignedTo = userId;
    }

    const statuses = [
      "NEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
      "CLOSED",
      "REJECTED",
    ];
    if (status && statuses.includes(String(status).toUpperCase())) {
      filter.status = String(status).toUpperCase();
    }

    const exclude = String(excludeStatus || "").toUpperCase();
    const shouldExcludeClosed =
      String(includeClosed).toLowerCase() === "false" || exclude === "CLOSED";
    if (shouldExcludeClosed) {
      if (filter.status) {
        if (filter.status === "CLOSED") {
          return res.json({ success: true, data: [] });
        }
      } else {
        filter.status = { $ne: "CLOSED" };
      }
    }

    const parsedLimit = Number(limit);
    const hasLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100;

    let query = Complaint.find(filter)
      .populate("createdBy", "name role")
      .populate("assignedTo", "name role")
      .populate("assignedBy", "name role")
      .populate("completedBy", "name role")
      .populate("closedBy", "name role")
      .populate("rejectedBy", "name role")
      .sort({ createdAt: -1 });

    if (hasLimit) {
      query = query.limit(parsedLimit);
    }

    const complaints = await query;

    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// ASSIGN TO TECHNICIAN (MANAGER/ADMIN)
// ==============================
exports.assignComplaint = async (req, res) => {
  try {
    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Manager/Admin only" });
    }

    const { id } = req.params;
    const technicianId = req.body.technicianId || req.body.staffId;

    if (!technicianId) {
      return res.status(400).json({ message: "Technician required" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (!["NEW", "REJECTED"].includes(complaint.status)) {
      return res.status(400).json({ message: "Complaint not assignable" });
    }

    const tech = await User.findById(technicianId);
    if (!tech || tech.role !== "technician") {
      return res.status(400).json({ message: "Invalid technician" });
    }

    const previousStatus = complaint.status;
    complaint.assignedTo = technicianId;
    complaint.assignedBy = req.user.id;
    complaint.assignedAt = new Date();
    complaint.status = "ASSIGNED";
    complaint.rejectReason = "";
    complaint.rejectedAt = null;
    complaint.rejectedBy = null;
    await complaint.save();

    await logAction({
      action: "COMPLAINT_ASSIGNED",
      complaintId: complaint._id,
      relatedToken: complaint.token,
      performedBy: req.user.id,
      performedByRole: req.user.role,
      assignedTo: technicianId,
      previousStatus,
      newStatus: "ASSIGNED",
      note: `Assigned to ${tech.name}`,
      req,
    });

    await createNotification({
      userId: technicianId,
      title: "New complaint assigned",
      message: `Complaint ${complaint.token} assigned to you.`,
      type: "COMPLAINT_ASSIGNED",
      complaintId: complaint._id,
      relatedToken: complaint.token,
    });

    await createNotification({
      userId: complaint.createdBy,
      title: "Complaint assigned",
      message: `Your complaint ${complaint.token} was assigned.`,
      type: "COMPLAINT_ASSIGNED",
      complaintId: complaint._id,
      relatedToken: complaint.token,
    });

    res.json({ success: true, message: "Assigned to technician" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// UPDATE STATUS
// ==============================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, resolutionNote } = req.body;
    const role = req.user.role;
    const userId = req.user.id;

    const normalizedStatus = String(status || "").toUpperCase();
    if (!normalizedStatus) {
      return res.status(400).json({ message: "Unsupported status" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Not found" });

    const previousStatus = complaint.status;

    if (normalizedStatus === "IN_PROGRESS") {
      if (role !== "technician") {
        return res.status(403).json({ message: "Technician only" });
      }
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }
      if (complaint.status !== "ASSIGNED") {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      complaint.status = "IN_PROGRESS";
      complaint.startedAt = new Date();

      await logAction({
        action: "COMPLAINT_STARTED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
        performedBy: userId,
        performedByRole: role,
        previousStatus,
        newStatus: "IN_PROGRESS",
        note: "Work started",
        req,
      });
    } else if (normalizedStatus === "COMPLETED") {
      if (role !== "technician") {
        return res.status(403).json({ message: "Technician only" });
      }
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }
      if (complaint.status !== "IN_PROGRESS") {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      complaint.status = "COMPLETED";
      complaint.completedAt = new Date();
      complaint.completedBy = userId;
      complaint.resolutionNote = resolutionNote || "";

      await logAction({
        action: "COMPLAINT_COMPLETED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
        performedBy: userId,
        performedByRole: role,
        previousStatus,
        newStatus: "COMPLETED",
        note: "Marked completed",
        req,
      });

      await notifyRoles({
        roles: ["manager", "admin"],
        title: "Complaint completed",
        message: `Complaint ${complaint.token} marked completed.`,
        type: "COMPLAINT_COMPLETED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
      });
    } else if (normalizedStatus === "REJECTED") {
      if (role !== "technician") {
        return res.status(403).json({ message: "Technician only" });
      }
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }
      if (!["ASSIGNED", "IN_PROGRESS"].includes(complaint.status)) {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      complaint.status = "REJECTED";
      complaint.rejectedAt = new Date();
      complaint.rejectedBy = userId;
      complaint.rejectReason = reason || "Rejected";
      complaint.assignedTo = null;

      await logAction({
        action: "COMPLAINT_REJECTED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
        performedBy: userId,
        performedByRole: role,
        previousStatus,
        newStatus: "REJECTED",
        note: complaint.rejectReason,
        req,
      });

      await createNotification({
        userId: complaint.createdBy,
        title: "Complaint rejected",
        message: `Your complaint ${complaint.token} was rejected.`,
        type: "COMPLAINT_REJECTED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
      });
    } else if (normalizedStatus === "CLOSED") {
      if (!["manager", "admin"].includes(role)) {
        return res.status(403).json({ message: "Manager/Admin only" });
      }
      if (complaint.status !== "COMPLETED") {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      complaint.status = "CLOSED";
      complaint.closedAt = new Date();
      complaint.closedBy = userId;

      await logAction({
        action: "COMPLAINT_CLOSED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
        performedBy: userId,
        performedByRole: role,
        previousStatus,
        newStatus: "CLOSED",
        note: "Closed",
        req,
      });

      await createNotification({
        userId: complaint.createdBy,
        title: "Complaint closed",
        message: `Your complaint ${complaint.token} was closed.`,
        type: "COMPLAINT_CLOSED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
      });
    } else if (normalizedStatus === "NEW") {
      const isManagerOrAdmin = ["manager", "admin"].includes(role);
      const isTenantOwner =
        role === "tenant" && complaint.createdBy?.toString() === userId;
      if (!isManagerOrAdmin && !isTenantOwner) {
        return res.status(403).json({ message: "Not allowed" });
      }
      if (isTenantOwner && complaint.status !== "REJECTED") {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      if (isManagerOrAdmin && !["REJECTED", "CLOSED"].includes(complaint.status)) {
        return res.status(400).json({ message: "Invalid status transition" });
      }
      complaint.status = "NEW";
      complaint.assignedTo = null;
      complaint.assignedBy = null;
      complaint.assignedAt = null;
      complaint.startedAt = null;
      complaint.completedAt = null;
      complaint.completedBy = null;
      complaint.closedAt = null;
      complaint.closedBy = null;
      complaint.rejectedAt = null;
      complaint.rejectedBy = null;
      complaint.rejectReason = "";
      complaint.resolutionNote = "";

      await logAction({
        action: "COMPLAINT_REOPENED",
        complaintId: complaint._id,
        relatedToken: complaint.token,
        performedBy: userId,
        performedByRole: role,
        previousStatus,
        newStatus: "NEW",
        note: "Reopened",
        req,
      });
    } else {
      return res.status(400).json({ message: "Unsupported status" });
    }

    complaint.lastUpdatedBy = userId;
    await complaint.save();

    res.json({ success: true, message: "Status updated", data: complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// UPDATE PRIORITY (MANAGER/ADMIN)
// ==============================
exports.updatePriority = async (req, res) => {
  try {
    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Manager/Admin only" });
    }

    const { id } = req.params;
    const { priority } = req.body;

    const allowed = ["low", "medium", "high", "critical"];
    if (!allowed.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Not found" });

    const previous = complaint.priority;
    complaint.priority = priority;
    complaint.lastUpdatedBy = req.user.id;
    await complaint.save();

    await logAction({
      action: "PRIORITY_UPDATED",
      complaintId: complaint._id,
      relatedToken: complaint.token,
      performedBy: req.user.id,
      performedByRole: req.user.role,
      note: `Priority ${previous} -> ${priority}`,
      req,
    });

    res.json({ success: true, message: "Priority updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// DELETE complaint (ADMIN)
// ==============================
exports.deleteComplaint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    const complaint = await Complaint.findByIdAndDelete(id);
    if (!complaint) return res.status(404).json({ message: "Not found" });

    await logAction({
      action: "COMPLAINT_DELETED",
      complaintId: id,
      relatedToken: complaint.token || "",
      performedBy: req.user.id,
      performedByRole: req.user.role,
      note: "Complaint deleted",
      req,
    });

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
