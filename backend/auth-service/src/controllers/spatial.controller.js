const { CATS, FACILITIES, JUNCTIONS, RAW_EDGES, PERSONAS } = require('../data/spatialData');

// Simulated in-memory digital twin state
let twinState = {};

function initializeTwinState() {
  FACILITIES.forEach((f) => {
    let crowd = 0.15 + Math.random() * 0.35;
    if (f.cat === 'platform') crowd = 0.35 + Math.random() * 0.5;
    if (f.cat === 'waiting') crowd = 0.25 + Math.random() * 0.45;
    twinState[f.id] = {
      facility_id: f.id,
      name: f.name,
      category: f.cat,
      crowd: parseFloat(crowd.toFixed(2)),
      cleanliness: parseFloat((3.6 + Math.random() * 1.3).toFixed(1)),
      operational: true,
      capacity: f.cat === 'platform' ? (1200 + Math.floor(Math.random() * 600)) : (f.cat === 'waiting' ? 300 + Math.floor(Math.random() * 200) : null),
    };
  });
}

initializeTwinState();

// Periodically update crowd levels on backend
setInterval(() => {
  FACILITIES.forEach((f) => {
    const t = twinState[f.id];
    if (t && (f.cat === 'platform' || f.cat === 'waiting' || f.cat === 'food')) {
      t.crowd = Math.min(0.97, Math.max(0.05, parseFloat((t.crowd + (Math.random() - 0.5) * 0.06).toFixed(2))));
    }
  });
}, 5000);

/**
 * Get station spatial map structure data (facilities, graph, personas)
 */
exports.getStationData = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      station: {
        code: 'LJN',
        name: 'Lucknow Junction',
        digital_twin_active: true,
      },
      categories: CATS,
      facilities: FACILITIES,
      junctions: JUNCTIONS,
      raw_edges: RAW_EDGES,
      personas: PERSONAS,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get live Digital Twin facility crowd & operational status
 */
exports.getDigitalTwinStatus = (req, res) => {
  try {
    const agents = [
      { id: 'CART-01', type: 'Golf Cart', status: 'Active (Concourse)', battery: 92, last_ping: 'Just now' },
      { id: 'CART-02', type: 'Golf Cart', status: 'Active (Platform 4)', battery: 84, last_ping: 'Just now' },
      { id: 'ROBOT-01', type: 'Sanitation Bot', status: 'Cleaning (Platform 2)', battery: 78, last_ping: '1m ago' },
      { id: 'HELP-BOT-01', type: 'AI Info Kiosk', status: 'Online (Gate 1)', battery: 100, last_ping: 'Just now' },
    ];

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      facility_twin_state: twinState,
      agents,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
