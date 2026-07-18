import state from '../../../.midnight-state.json';

// In a real app, you would select this based on environment or URL params.
export const NETWORK = 'undeployed';

export const NETWORK_CONFIG = {
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
};

// Extracted from the shared project state
export const CONTRACT_ADDRESS = (state as any).deployments?.[NETWORK]?.address || '';
