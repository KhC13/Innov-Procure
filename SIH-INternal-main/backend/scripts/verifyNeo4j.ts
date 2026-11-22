import 'dotenv/config';
import { closeNeo4j, isNeo4jConfigured, verifyNeo4jConnection } from '../src/services/neo4j.js';

async function main() {
  if (!isNeo4jConfigured()) {
    console.error('Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, and optionally NEO4J_DATABASE.');
    process.exitCode = 1;
    return;
  }

  try {
    const result = await verifyNeo4jConnection();
    console.log(`Neo4j connection verified successfully (${result.latencyMs} ms).`);
  } catch {
    console.error('Neo4j connection verification failed.');
    process.exitCode = 1;
  } finally {
    await closeNeo4j();
  }
}

void main();
