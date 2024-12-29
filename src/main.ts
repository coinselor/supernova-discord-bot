import {
	Client,
	Events,
	GatewayIntentBits,
	ClientUser,
} from "npm:discord.js@14.14.1";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { ValidatorTracker } from "./services/ValidatorTracker.ts";

const env = await load();
const TOKEN: string | undefined =
	env["DISCORD_TOKEN"] || Deno.env.get("DISCORD_TOKEN");
const CHANNEL_ID: string | undefined =
	env["NOTIFICATION_CHANNEL_ID"] || Deno.env.get("NOTIFICATION_CHANNEL_ID");
const ALERT_ROLE_ID: string | undefined =
	env["ALERT_ROLE_ID"] || Deno.env.get("ALERT_ROLE_ID");

if (!TOKEN) {
	console.error("No token provided");
	Deno.exit(1);
}

if (!CHANNEL_ID) {
	console.error("No notification channel ID provided");
	Deno.exit(1);
}

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessages,
	],
});

client.once(Events.ClientReady, async (readyClient: Client<true>) => {
	const botUser: ClientUser = readyClient.user;
	console.log(`Supernova Tracker v0.0.1 - Logged in as ${botUser.tag}`);

	const validatorTracker = ValidatorTracker.getInstance(
		readyClient,
		CHANNEL_ID,
		ALERT_ROLE_ID
	);
	await validatorTracker.startPolling();
});

client.login(TOKEN);
