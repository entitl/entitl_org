const { BigQuery } = require('@google-cloud/bigquery');
const { datasetConfig, tableConfig } = require('./bigquery-config');
const schema = require('./bigquery-schema');
const { createViews } = require('./bigquery-views');
const { DATASET, TABLES } = require('./bigquery-constants');

async function createBotDetectionSchema() {
  const bigquery = new BigQuery();

  try {
    // Create dataset if it doesn't exist
    console.log(`Creating dataset ${DATASET.NAME} if it doesn't exist...`);
    const [dataset] = await bigquery.dataset(DATASET.NAME).get({ autoCreate: true });
    await dataset.setMetadata(datasetConfig);

    // Create table with schema if it doesn't exist
    console.log(`Creating table ${TABLES.DETECTION_LOGS}...`);
    const [table] = await dataset.table(TABLES.DETECTION_LOGS).get({ autoCreate: true });

    // Set table schema and configuration
    const tableMetadata = {
      ...tableConfig,
      schema: schema
    };

    await table.setMetadata(tableMetadata);
    console.log('Schema setup completed successfully!');

    // Create views
    await createViews(dataset);

  } catch (error) {
    console.error('Error setting up BigQuery schema:', error);
    throw error;
  }
}

// Export the function for use in other modules
module.exports = {
  createBotDetectionSchema
};

// Run the setup if this is the main module
if (require.main === module) {
  createBotDetectionSchema()
    .then(() => {
      console.log('Setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
