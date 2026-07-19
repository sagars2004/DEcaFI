import state from '../../../.midnight-state.json';

// In a real app, you would select this based on environment or URL params.
export const NETWORK = 'preprod';

export const NETWORK_CONFIG = {
  indexer: 'https://indexer.preprod.midnight.network/api/v1/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws',
  node: 'wss://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
};

// Extracted from the shared project state
export const CONTRACT_ADDRESS = (state as any).deployments?.[NETWORK]?.address || '';
