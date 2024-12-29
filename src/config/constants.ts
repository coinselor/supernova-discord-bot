export const EMOJI = {
    BONDED: "<:pillargreen:1323005495132295208>",
    UNBONDING: "<:pillaryellow:1323007061386072205>",
    UNBONDED: "<:pillarred:1323005563612692550>",
    UNKNOWN: "❓",
} as const;

export const API_ENDPOINT = "https://rest.supernova.zenon.red/cosmos/staking/v1beta1/validators";
export const POLL_INTERVAL = 6000; // 6 seconds
export const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours
export const TOTAL_PILLARS = 8;
