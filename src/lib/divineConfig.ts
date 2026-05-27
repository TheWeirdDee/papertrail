export type DivineEnvConfig = {
  friendlyDeployer: string;
  socialContract: string;
  autoSetUsername: boolean;
  friendReset: boolean;
  idleRetryMs: number;
};

export function getDivineConfig(): DivineEnvConfig {
  return {
    friendlyDeployer: process.env.FRIEND_DEPLOYER || 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX',
    socialContract: process.env.SOCIAL_CONTRACT || 'gm-social-final-v5',
    autoSetUsername: process.env.AUTO_SET_USERNAME === '1',
    friendReset: process.env.FRIEND_RESET === '1',
    idleRetryMs: Number(process.env.IDLE_RETRY_MS || 60000),
  };
}
