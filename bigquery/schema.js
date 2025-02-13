const schema = [
  // Request Metadata
  { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'request_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'environment', type: 'STRING', mode: 'REQUIRED' },
  { name: 'function_version', type: 'STRING' },
  { name: 'processing_region', type: 'STRING' },
  { name: 'processing_datacenter', type: 'STRING' },

  // Client Information
  { name: 'client_ip', type: 'STRING', mode: 'REQUIRED' },
  { name: 'client_ip_version', type: 'STRING' },
  { name: 'is_proxy_ip', type: 'BOOLEAN' },
  { name: 'is_datacenter_ip', type: 'BOOLEAN' },
  { name: 'user_agent', type: 'STRING' },
  { name: 'user_agent_hash', type: 'STRING' },
  { name: 'origin', type: 'STRING' },
  { name: 'request_headers', type: 'STRING', mode: 'REPEATED' },

  // Session Information
  {
    name: 'session_data',
    type: 'RECORD',
    fields: [
      { name: 'session_id', type: 'STRING' },
      { name: 'is_new_session', type: 'BOOLEAN' },
      { name: 'session_duration_ms', type: 'INTEGER' },
      { name: 'previous_requests_count', type: 'INTEGER' },
      { name: 'first_seen_timestamp', type: 'TIMESTAMP' }
    ]
  },

  // Enhanced Geolocation Data
  {
    name: 'geo_details',
    type: 'RECORD',
    fields: [
      { name: 'country', type: 'STRING' },
      { name: 'country_code', type: 'STRING' },
      { name: 'region', type: 'STRING' },
      { name: 'region_code', type: 'STRING' },
      { name: 'city', type: 'STRING' },
      { name: 'postal_code', type: 'STRING' },
      { name: 'timezone', type: 'STRING' },
      { name: 'asn', type: 'STRING' },
      { name: 'isp', type: 'STRING' },
      { name: 'organization', type: 'STRING' },
      { name: 'connection_type', type: 'STRING' },
      {
        name: 'coordinates',
        type: 'RECORD',
        fields: [
          { name: 'latitude', type: 'FLOAT' },
          { name: 'longitude', type: 'FLOAT' },
          { name: 'accuracy_radius', type: 'INTEGER' }
        ]
      }
    ]
  },

  // Enhanced URL Information
  {
    name: 'url_info',
    type: 'RECORD',
    fields: [
      { name: 'protocol', type: 'STRING' },
      { name: 'hostname', type: 'STRING' },
      { name: 'pathname', type: 'STRING' },
      { name: 'search', type: 'STRING' },
      { name: 'hash', type: 'STRING' },
      { name: 'full_url', type: 'STRING' },
      { name: 'url_length', type: 'INTEGER' },
      { name: 'query_params_count', type: 'INTEGER' },
      {
        name: 'tracking_params',
        type: 'RECORD',
        mode: 'REPEATED',
        fields: [
          { name: 'key', type: 'STRING' },
          { name: 'value', type: 'STRING' },
          { name: 'category', type: 'STRING' }
        ]
      }
    ]
  },

  // Device and Browser Information
  {
    name: 'device_info',
    type: 'RECORD',
    fields: [
      { name: 'type', type: 'STRING' },
      { name: 'os_name', type: 'STRING' },
      { name: 'os_version', type: 'STRING' },
      { name: 'browser_name', type: 'STRING' },
      { name: 'browser_version', type: 'STRING' },
      { name: 'browser_engine', type: 'STRING' },
      { name: 'screen_width', type: 'INTEGER' },
      { name: 'screen_height', type: 'INTEGER' },
      { name: 'window_width', type: 'INTEGER' },
      { name: 'window_height', type: 'INTEGER' },
      { name: 'pixel_ratio', type: 'FLOAT' },
      { name: 'color_depth', type: 'INTEGER' },
      { name: 'hardware_concurrency', type: 'INTEGER' },
      { name: 'device_memory_gb', type: 'FLOAT' },
      { name: 'is_mobile', type: 'BOOLEAN' },
      { name: 'is_tablet', type: 'BOOLEAN' },
      { name: 'is_desktop', type: 'BOOLEAN' }
    ]
  },

  // Bot Detection Results
  { name: 'is_bot', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'detection_confidence', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'user_agent_match', type: 'BOOLEAN' },
  { name: 'ip_match', type: 'BOOLEAN' },
  { name: 'suspicious_factors', type: 'STRING', mode: 'REPEATED' },
  {
    name: 'detection_scores',
    type: 'RECORD',
    fields: [
      { name: 'user_agent_score', type: 'FLOAT' },
      { name: 'ip_score', type: 'FLOAT' },
      { name: 'behavioral_score', type: 'FLOAT' },
      { name: 'network_score', type: 'FLOAT' },
      { name: 'fingerprint_score', type: 'FLOAT' }
    ]
  },
  { name: 'detection_type', type: 'STRING' },
  { name: 'model_version', type: 'STRING' },

  // Performance Metrics
  {
    name: 'performance_metrics',
    type: 'RECORD',
    fields: [
      { name: 'total_duration_ms', type: 'FLOAT' },
      { name: 'detection_time_ms', type: 'FLOAT' },
      { name: 'scoring_time_ms', type: 'FLOAT' },
      { name: 'lookup_time_ms', type: 'FLOAT' },
      { name: 'validation_time_ms', type: 'FLOAT' }
    ]
  },

  // Error Information
  {
    name: 'error_info',
    type: 'RECORD',
    fields: [
      { name: 'error_code', type: 'STRING' },
      { name: 'error_message', type: 'STRING' },
      { name: 'error_type', type: 'STRING' },
      { name: 'stack_trace', type: 'STRING' }
    ]
  }
];

module.exports = schema;
