
let mockComplaints = [
  {
    _id: "demo_1",
    title: "Burst Pipe in Basement",
    description: "Major water leak in the main basement area, needs immediate attention.",
    status: "IN_PROGRESS",
    priority: "critical",
    token: "REQ-001",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: { name: "John Doe" },
    assignedTo: { _id: "tech_1", name: "Mike Fixer" },
  },
  {
    _id: "demo_2",
    title: "Elevator B Display Glitch",
    description: "The floor indicator in Elevator B is flickering and showing wrong numbers.",
    status: "ASSIGNED",
    priority: "high",
    token: "REQ-002",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: { name: "Jane Smith" },
    assignedTo: { _id: "tech_1", name: "Mike Fixer" },
  },
  {
    _id: "demo_3",
    title: "Common Room AC Not Cooling",
    description: "The AC unit in the common room is running but not cooling the air.",
    status: "NEW",
    priority: "medium",
    token: "REQ-003",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: { name: "Alice Wong" },
  },
  {
    _id: "demo_4",
    title: "Broken Window in Hallway",
    description: "A window on the 3rd-floor hallway is cracked.",
    status: "COMPLETED",
    priority: "low",
    token: "REQ-004",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    createdBy: { name: "Bob Miller" },
    assignedTo: { _id: "tech_2", name: "Sarah Tech" },
  },
  {
    _id: "demo_5",
    title: "Faulty Smoke Detector",
    description: "Beeping sound coming from the smoke detector in Unit 402.",
    status: "REJECTED",
    priority: "critical",
    token: "REQ-005",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    createdBy: { name: "Charlie Davis" },
    rejectedReason: "The resident fixed it by changing batteries.",
  }
];

const mockAnalytics = {
  overview: {
    totalComplaints: 42,
    open: 12,
    assigned: 8,
    inProgress: 5,
    completed: 15,
    closed: 12,
    rejected: 2
  },
  priority: {
    critical: 3, high: 7, medium: 15, low: 17
  },
  time: {
    avgResolutionMs: 12600000,
    todayCreated: 4, todayClosed: 2
  },
  technicians: {
    total: 5
  }
};

const mockNotifications = [
  {
    _id: "notif_1",
    type: "COMPLAINT_ASSIGNED",
    message: "New complaint assigned to you: REQ-001",
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedToken: "REQ-001"
  }
];

const mockTechnicians = [
  { _id: "tech_1", name: "Mike Fixer" },
  { _id: "tech_2", name: "Sarah Tech" },
  { _id: "tech_3", name: "John Builder" }
];

export const getMockRes = (data) => ({
  data: { data },
  status: 200,
});

export const mockHandlers = {
  "/complaints": () => getMockRes(mockComplaints),
  "/complaints?includeClosed=false&limit=10": () => getMockRes(mockComplaints.filter(c => c.status !== "CLOSED")),
  "/admin/analytics": () => getMockRes(mockAnalytics),
  "/notifications": () => getMockRes(mockNotifications),
  "/auth/technicians": () => getMockRes(mockTechnicians),
  "/audit": () => getMockRes([]),
};

export const handleMockAction = (config) => {
  const url = config.url.replace(/^.*\/api/, "");
  const method = config.method.toLowerCase();
  const body = config.data;

  // Simulate Specific Actions
  if (method === "put" && url.includes("/complaints/assign/")) {
    const id = url.split("/").pop();
    const complaint = mockComplaints.find(c => c._id === id);
    if (complaint) {
      const tech = mockTechnicians.find(t => t._id === body.technicianId);
      complaint.assignedTo = tech;
      complaint.status = "ASSIGNED";
      // Ensure priority remains
      if (!complaint.priority) complaint.priority = "medium";
    }
  }

  if (method === "put" && url.includes("/complaints/status/")) {
    const id = url.split("/").pop();
    const complaint = mockComplaints.find(c => c._id === id);
    if (complaint) {
      complaint.status = body.status;
      if (body.status === "REJECTED") {
         complaint.rejectReason = body.reason || "No reason provided";
      }
      if (body.status === "COMPLETED") {
         complaint.resolutionNote = body.resolutionNote || "Fixed";
      }
    }
  }

  if (method === "put" && url.includes("/complaints/priority/")) {
    const id = url.split("/").pop();
    const complaint = mockComplaints.find(c => c._id === id);
    if (complaint) {
      complaint.priority = body.priority;
    }
  }

  if (method === "delete" && url.includes("/complaints/")) {
    const id = url.split("/").pop();
    mockComplaints = mockComplaints.filter(c => c._id !== id);
  }

  return { data: { message: "Success (Demo Mode)" }, status: 200 };
};

