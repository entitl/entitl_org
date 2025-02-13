// Dataset and Table Names
const DATASET = {
  NAME: 'bot_detection',
  LOCATION: 'US'
};

const TABLES = {
  DETECTION_LOGS: 'detection_logs'
};

// View Names
const VIEWS = {
  DAILY_TRENDS: 'daily_trends',
  GEO_DISTRIBUTION: 'geographic_distribution',
  SUSPICIOUS_IPS: 'suspicious_ips',
  BOT_PATTERNS: 'bot_behavior_patterns',
  URL_PATTERNS: 'url_patterns',
  DETECTION_EFFICIENCY: 'detection_efficiency'
};

// Full Qualified Names (project.dataset.table)
const getFullyQualifiedName = (projectId, name) => `${projectId}.${DATASET.NAME}.${name}`;

module.exports = {
  DATASET,
  TABLES,
  VIEWS,
  getFullyQualifiedName
};
