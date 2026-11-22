import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

type Neo4jConfig = {
  uri: string;
  username: string;
  password: string;
  database: string;
};

function readConfig(): Neo4jConfig | null {
  const uri = process.env.NEO4J_URI?.trim();
  const username = process.env.NEO4J_USERNAME?.trim();
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE?.trim() || 'neo4j';

  if (!uri && !username && !password) return null;
  if (uri?.includes('your-instance')) return null;
  if (!uri || !username || !password) {
    throw new Error('Neo4j configuration is incomplete. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.');
  }

  return { uri, username, password, database };
}

export function isNeo4jConfigured(): boolean {
  return readConfig() !== null;
}

export function getNeo4jDriver(): Driver {
  if (driver) return driver;

  const config = readConfig();
  if (!config) {
    throw new Error('Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.');
  }

  driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password),
    {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 10_000,
      connectionTimeout: 10_000,
      disableLosslessIntegers: true,
    }
  );

  return driver;
}

export function getNeo4jSession(accessMode: 'READ' | 'WRITE' = 'READ'): Session {
  const config = readConfig();
  if (!config) {
    throw new Error('Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.');
  }

  return getNeo4jDriver().session({
    database: config.database,
    defaultAccessMode: accessMode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });
}

export async function verifyNeo4jConnection(): Promise<{ configured: boolean; connected: boolean; latencyMs?: number }> {
  if (!isNeo4jConfigured()) {
    return { configured: false, connected: false };
  }

  const startedAt = Date.now();
  const config = readConfig();
  if (!config) {
    return { configured: false, connected: false };
  }

  const neo4jDriver = getNeo4jDriver();
  await neo4jDriver.verifyConnectivity();
  const session = neo4jDriver.session({
    database: config.database,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const result = await session.run('RETURN 1 AS ok');
    const ok = result.records[0]?.get('ok') === 1;
    if (!ok) throw new Error('Neo4j connectivity query returned an unexpected result.');
    return { configured: true, connected: true, latencyMs: Date.now() - startedAt };
  } finally {
    await session.close();
  }
}

export async function closeNeo4j(): Promise<void> {
  if (!driver) return;
  const activeDriver = driver;
  driver = null;
  await activeDriver.close();
}
