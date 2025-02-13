const { DATASET, TABLES, VIEWS } = require('./bigquery-constants');

// SQL queries for each view
const SQL_QUERIES = {
  DAILY_TRENDS: `
    SELECT
      DATE(timestamp) as detection_date,
      COUNT(*) as total_requests,
      COUNTIF(is_bot) as bot_requests,
      ROUND(COUNTIF(is_bot) / COUNT(*) * 100, 2) as bot_percentage,
      AVG(detection_confidence) as avg_confidence,
      ARRAY_AGG(DISTINCT suspicious_factors IGNORE NULLS) as unique_suspicious_factors,
      COUNTIF(user_agent_match) as user_agent_matches,
      COUNTIF(ip_match) as ip_matches,
      AVG(detection_scores.behavioral_score) as avg_behavioral_score,
      AVG(performance_metrics.total_duration_ms) as avg_detection_duration,
      COUNT(DISTINCT client_ip) as unique_ips,
      COUNT(DISTINCT user_agent) as unique_user_agents
    FROM \${TABLE}
    GROUP BY detection_date
    ORDER BY detection_date DESC
  `,

  GEO_DISTRIBUTION: `
    SELECT
      geo_details.country,
      geo_details.country_code,
      geo_details.region,
      geo_details.city,
      geo_details.asn,
      geo_details.isp,
      COUNT(*) as total_requests,
      COUNTIF(is_bot) as bot_requests,
      ROUND(COUNTIF(is_bot) / COUNT(*) * 100, 2) as bot_percentage,
      AVG(detection_confidence) as avg_confidence,
      COUNT(DISTINCT client_ip) as unique_ips,
      COUNT(DISTINCT user_agent) as unique_user_agents,
      ARRAY_AGG(DISTINCT suspicious_factors IGNORE NULLS LIMIT 10) as common_factors
    FROM \${TABLE}
    WHERE geo_details.country IS NOT NULL
    GROUP BY
      geo_details.country,
      geo_details.country_code,
      geo_details.region,
      geo_details.city,
      geo_details.asn,
      geo_details.isp
    ORDER BY total_requests DESC
  `,

  SUSPICIOUS_IPS: `
    WITH request_patterns AS (
      SELECT
        client_ip,
        ARRAY_AGG(STRUCT(timestamp, user_agent, detection_confidence)
          ORDER BY timestamp DESC LIMIT 1000) as recent_requests
      FROM \${TABLE}
      GROUP BY client_ip
    )
    SELECT
      l.client_ip,
      l.geo_details.country,
      l.geo_details.isp,
      COUNT(*) as request_count,
      COUNTIF(l.is_bot) as bot_detections,
      AVG(l.detection_confidence) as avg_confidence,
      ARRAY_AGG(DISTINCT l.suspicious_factors IGNORE NULLS) as factors,
      MIN(l.timestamp) as first_seen,
      MAX(l.timestamp) as last_seen,
      COUNT(DISTINCT l.user_agent) as unique_user_agents,
      ARRAY_AGG(DISTINCT l.user_agent LIMIT 5) as common_user_agents,
      p.recent_requests,
      AVG(l.performance_metrics.total_duration_ms) as avg_response_time
    FROM \${TABLE} l
    JOIN request_patterns p ON l.client_ip = p.client_ip
    WHERE l.is_bot = TRUE
    GROUP BY l.client_ip, l.geo_details.country, l.geo_details.isp, p.recent_requests
    HAVING request_count > 10
    ORDER BY bot_detections DESC
  `,

  BOT_PATTERNS: `
    SELECT
      DATE(timestamp) as detection_date,
      device_info.browser_name,
      device_info.os_name,
      COUNT(*) as request_count,
      AVG(detection_confidence) as avg_confidence,
      ARRAY_AGG(DISTINCT suspicious_factors IGNORE NULLS) as suspicious_factors,
      AVG(detection_scores.behavioral_score) as avg_behavioral_score,
      AVG(detection_scores.network_score) as avg_network_score,
      COUNT(DISTINCT client_ip) as unique_ips,
      COUNT(DISTINCT user_agent) as unique_user_agents,
      ARRAY_AGG(STRUCT(
        detection_scores.user_agent_score,
        detection_scores.ip_score,
        performance_metrics.total_duration_ms
      ) LIMIT 1000) as detection_metrics
    FROM \${TABLE}
    WHERE is_bot = TRUE
    GROUP BY detection_date, device_info.browser_name, device_info.os_name
    ORDER BY detection_date DESC, request_count DESC
  `,

  URL_PATTERNS: `
    SELECT
      url_info.pathname,
      COUNT(*) as total_hits,
      COUNTIF(is_bot) as bot_hits,
      ROUND(COUNTIF(is_bot) / COUNT(*) * 100, 2) as bot_percentage,
      AVG(detection_confidence) WHERE is_bot as avg_bot_confidence,
      COUNT(DISTINCT client_ip) as unique_ips,
      COUNT(DISTINCT user_agent) as unique_user_agents,
      ARRAY_AGG(DISTINCT suspicious_factors IGNORE NULLS LIMIT 10) as common_factors,
      AVG(url_info.url_length) as avg_url_length,
      AVG(url_info.query_params_count) as avg_query_params,
      ARRAY_AGG(STRUCT(
        url_info.protocol,
        url_info.query_params_count,
        performance_metrics.total_duration_ms
      ) LIMIT 1000) as url_metrics
    FROM \${TABLE}
    GROUP BY url_info.pathname
    HAVING total_hits > 100
    ORDER BY bot_hits DESC
  `,

  DETECTION_EFFICIENCY: `
    SELECT
      DATE(timestamp) as detection_date,
      detection_type,
      model_version,
      COUNT(*) as total_detections,
      AVG(detection_confidence) as avg_confidence,
      STDDEV(detection_confidence) as confidence_stddev,
      MIN(detection_confidence) as min_confidence,
      MAX(detection_confidence) as max_confidence,
      AVG(performance_metrics.total_duration_ms) as avg_duration_ms,
      AVG(performance_metrics.detection_time_ms) as avg_detection_time_ms,
      AVG(performance_metrics.scoring_time_ms) as avg_scoring_time_ms,
      COUNT(DISTINCT client_ip) as unique_ips,
      COUNT(DISTINCT user_agent) as unique_user_agents,
      ARRAY_AGG(STRUCT(
        detection_scores.user_agent_score,
        detection_scores.ip_score,
        detection_scores.behavioral_score,
        detection_scores.network_score,
        detection_scores.fingerprint_score
      ) LIMIT 1000) as score_distributions
    FROM \${TABLE}
    GROUP BY detection_date, detection_type, model_version
    ORDER BY detection_date DESC
  `
};

// Function to create a view query with proper table reference
const createViewQuery = (viewName, sqlQuery) => {
  const fullTableName = `\`${DATASET.NAME}.${TABLES.DETECTION_LOGS}\``;
  const sql = sqlQuery.replace(/\${TABLE}/g, fullTableName);
  return `CREATE OR REPLACE VIEW \`${DATASET.NAME}.${viewName}\` AS ${sql}`;
};

// Create view objects with their respective queries
const views = {
  [VIEWS.DAILY_TRENDS]: createViewQuery(VIEWS.DAILY_TRENDS, SQL_QUERIES.DAILY_TRENDS),
  [VIEWS.GEO_DISTRIBUTION]: createViewQuery(VIEWS.GEO_DISTRIBUTION, SQL_QUERIES.GEO_DISTRIBUTION),
  [VIEWS.SUSPICIOUS_IPS]: createViewQuery(VIEWS.SUSPICIOUS_IPS, SQL_QUERIES.SUSPICIOUS_IPS),
  [VIEWS.BOT_PATTERNS]: createViewQuery(VIEWS.BOT_PATTERNS, SQL_QUERIES.BOT_PATTERNS),
  [VIEWS.URL_PATTERNS]: createViewQuery(VIEWS.URL_PATTERNS, SQL_QUERIES.URL_PATTERNS),
  [VIEWS.DETECTION_EFFICIENCY]: createViewQuery(VIEWS.DETECTION_EFFICIENCY, SQL_QUERIES.DETECTION_EFFICIENCY)
};

// Function to create all views in BigQuery
const createViews = async (dataset) => {
  console.log('Creating views...');
  try {
    for (const [viewName, viewQuery] of Object.entries(views)) {
      console.log(`Creating view: ${viewName}`);
      await dataset.createQueryJob(viewQuery);
    }
    console.log('All views created successfully!');
  } catch (error) {
    console.error('Error creating views:', error);
    throw error;
  }
};

module.exports = {
  views,
  createViews
};
