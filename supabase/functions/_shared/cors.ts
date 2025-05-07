export const allowedOrigins = [
  'https://tubeboost.com',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8085', 
  'http://localhost:19000',
  'http://localhost:19006',
  'http://localhost:9999',
  'https://*.expo.direct',
  'http://localhost:*'
];

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true'
};
