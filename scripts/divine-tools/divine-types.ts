export type DivineWallet = {
  index: number;
  address: string;
  privateKey: string;
};

export type DivineWalletState = {
  usernameSet: boolean;
  lastSayGmTs: number;
  lastFollowTs: number;
  lastTipTs: number;
  followedTargets: string[];
  tipsSent: number;
};
