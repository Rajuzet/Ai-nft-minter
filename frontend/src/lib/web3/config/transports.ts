import { http } from "wagmi";
import { WCOS_CHAINS } from "./chains";

export const getTransports = () => {
  const transports: Record<number, any> = {};
  Object.values(WCOS_CHAINS).forEach((config) => {
    if (config.enabled && config.rpcUrl) {
      transports[config.id] = http(config.rpcUrl);
    }
  });
  return transports;
};
