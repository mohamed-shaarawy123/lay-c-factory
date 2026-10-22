/** Tracking stages already shown on the customer order page, keyed by order slug. */
const ORDER_STAGES = {
  manufacturing: ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
  seniors: ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
  "seniors-uniform": ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
  designing: ["Viewing order", "Creating the design"],
  web: [
    "Viewing order",
    "Discovery & Planning",
    "Wireframing & UI/UX Design",
    "Front-End & Back-End Development",
    "Content Integration & Populating Data",
    "Testing, QA & Optimization",
    "Deployment & Launch",
    "Post-Launch Maintenance & Handover",
  ],
  photo: ["Viewing order", "Mood boards", "Scouting location", "Confirmation", "Equipment", "Day of the shoot", "Photo selection", "Coloring", "Delivery"],
  "photo-shoot": ["Viewing order", "Mood boards", "Scouting location", "Confirmation", "Equipment", "Day of the shoot", "Photo selection", "Coloring", "Delivery"],
  "photo-studio": ["Viewing order", "Confirmation", "Day of the shoot", "Delivery"],
  "media-buying": ["Viewing order", "Strategy & planning", "Campaign setup", "Launch", "Optimization", "Reporting"],
  ugc: ["Viewing order", "Brief & creator matching", "Filming", "Editing", "Review & revisions", "Delivery"],
};

function stagesFor(slug) {
  return ORDER_STAGES[slug] || ["Viewing order", "Confirmed", "Done"];
}

function stageIndex(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return 0;
  return n;
}

function trackingState(slug, value) {
  const stages = stagesFor(slug);
  const stage = Math.min(stageIndex(value), stages.length);
  const complete = stage >= stages.length;
  const completed = complete ? stages.length : stage;
  return {
    slug: slug || "",
    stages,
    stage,
    complete,
    current: complete ? "Complete" : stages[stage],
    progress: stages.length ? Math.round((completed / stages.length) * 100) : 0,
  };
}

module.exports = { ORDER_STAGES, stagesFor, stageIndex, trackingState };
