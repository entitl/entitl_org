const { BigQuery } = require('@google-cloud/bigquery');

// Dataset configuration
const datasetConfig = {
  location: 'US',
  labels: {
    environment: 'production',
    service: 'bot_detection',
    data_classification: 'sensitive'
  }
};

// Table configuration
const tableConfig = {
  timePartitioning: {
    type: 'DAY',
    field: 'timestamp',
    expirationMs: 365 * 24 * 60 * 60 * 1000  // 1 year retention
  },
  clustering: {
    fields: ['is_bot', 'client_ip', 'user_agent', 'detection_confidence']
  },
  labels: {
    environment: 'production',
    service: 'bot_detection',
    data_type: 'logs',
    pii_level: 'contains_ip',
    retention: '1year'
  }
};

module.exports = {
  datasetConfig,
  tableConfig
};
