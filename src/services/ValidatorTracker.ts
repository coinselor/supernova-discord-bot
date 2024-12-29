import { Client, Message, TextChannel } from "npm:discord.js@14.14.1";
import { ValidatorState, ValidatorResponse } from "../types/validator.ts";
import {
	EMOJI,
	API_ENDPOINT,
	POLL_INTERVAL,
	MESSAGE_LIFETIME,
	TOTAL_PILLARS,
} from "../config/constants.ts";

export class ValidatorTracker {
	private static instance: ValidatorTracker;
	private validators: Map<string, ValidatorState>;
	private lastPollTime: string;
	private discordClient: Client;
	private channelId: string;
	private alertRoleId: string | undefined;
	private pinnedStatusMessage: Message | null;
	private isInitialLoad = true;

	private constructor(
		client: Client,
		channelId: string,
		alertRoleId?: string
	) {
		this.validators = new Map();
		this.lastPollTime = "";
		this.discordClient = client;
		this.channelId = channelId;
		this.pinnedStatusMessage = null;
		this.isInitialLoad = true;
		this.alertRoleId = alertRoleId;
	}

	public static getInstance(
		client: Client,
		channelId: string,
		alertRoleId?: string
	): ValidatorTracker {
		if (!ValidatorTracker.instance) {
			ValidatorTracker.instance = new ValidatorTracker(
				client,
				channelId,
				alertRoleId
			);
		}
		return ValidatorTracker.instance;
	}

	private async updatePinnedStatus(): Promise<void> {
		try {
			const channel = await this.discordClient.channels.fetch(
				this.channelId
			);
			if (!channel || !(channel instanceof TextChannel)) {
				console.error("Channel not found or not a text channel");
				return;
			}

			const bondedPillars = Array.from(this.validators.values())
				.filter((v) => v.status === "BOND_STATUS_BONDED")
				.map((v) => `${EMOJI.BONDED} ${v.moniker}`);

			const unbondingPillars = Array.from(this.validators.values())
				.filter((v) => v.status === "BOND_STATUS_UNBONDING")
				.map((v) => `${EMOJI.UNBONDING} ${v.moniker}`);

			const unbondedPillars = Array.from(this.validators.values())
				.filter((v) => v.status === "BOND_STATUS_UNBONDED")
				.map((v) => `${EMOJI.UNBONDED} ${v.moniker}`);

			const statusMessage = [
				`<:znn:1234991433820278805> **Supernova Pillars (${bondedPillars.length}/${TOTAL_PILLARS})**`,
				`\n**ONLINE**`,
				...bondedPillars,
				`\n**STANDBY**`,
				...(unbondingPillars.length ? unbondingPillars : ["*None*"]),
				`\n**OFFLINE**`,
				...(unbondedPillars.length ? unbondedPillars : ["*None*"]),
				`\n\nLast Updated: ${new Intl.DateTimeFormat("en-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}).format(new Date())}`,
			].join("\n");

			if (!this.pinnedStatusMessage) {
				const clientUser = this.discordClient.user;
				if (!clientUser) {
					console.error("Discord client user is not available");
					return;
				}

				const pins = await channel.messages.fetchPinned();
				this.pinnedStatusMessage =
					pins.find(
						(msg) =>
							msg.author.id === clientUser.id &&
							msg.content.includes("Supernova Pillars")
					) || null;

				if (!this.pinnedStatusMessage) {
					this.pinnedStatusMessage =
						await channel.send(statusMessage);
					await this.pinnedStatusMessage!.pin();
				}
			}

			await this.pinnedStatusMessage?.edit(statusMessage);
		} catch (error) {
			console.error("Error updating pinned status:", error);
		}
	}

	private async notifyChanges(
		changes: Array<{
			address: string;
			before: ValidatorState | undefined;
			after: ValidatorState;
		}>
	): Promise<void> {
		try {
			const channel = await this.discordClient.channels.fetch(
				this.channelId
			);
			if (!channel || !(channel instanceof TextChannel)) {
				console.error("Channel not found or not a text channel");
				return;
			}

			// Update pinned status first
			await this.updatePinnedStatus();

			// Send temporary change notifications
			for (const change of changes) {
				const emoji = this.getStatusEmoji(change.after.status);
				const roleMention = this.alertRoleId
					? `<@&${this.alertRoleId}> `
					: "";
				const statusChange = change.before
					? `changed status from \`${change.before.status}\` to \`${change.after.status}\``
					: `is now \`${change.after.status}\``;
				const message = `${roleMention}${emoji} Pillar **${change.after.moniker}** ${statusChange}`;

				const sentMessage = await channel.send(message);

				// Delete message after 24 hours
				setTimeout(() => {
					sentMessage.delete().catch(console.error);
				}, MESSAGE_LIFETIME);
			}
		} catch (error) {
			console.error("Error sending Discord notification:", error);
		}
	}

	private getStatusEmoji(status: string): string {
		switch (status) {
			case "BOND_STATUS_BONDED":
				return EMOJI.BONDED;
			case "BOND_STATUS_UNBONDING":
				return EMOJI.UNBONDING;
			case "BOND_STATUS_UNBONDED":
				return EMOJI.UNBONDED;
			default:
				return EMOJI.UNKNOWN;
		}
	}

	public async startPolling(): Promise<void> {
		try {
			await this.poll();
			setInterval(() => this.poll(), POLL_INTERVAL);
		} catch (error) {
			console.error("Error starting validator polling:", error);
		}
	}

	private async poll(): Promise<void> {
		try {
			const response = await fetch(API_ENDPOINT);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data: ValidatorResponse = await response.json();
			await this.processValidators(data);
			this.lastPollTime = new Date().toISOString();
		} catch (error) {
			console.error("Error polling validators:", error);
		}
	}

	private async processValidators(data: ValidatorResponse): Promise<void> {
		const changes: Array<{
			address: string;
			before: ValidatorState | undefined;
			after: ValidatorState;
		}> = [];

		for (const validator of data.validators) {
			const address = validator.operator_address;
			const newState: ValidatorState = {
				moniker: validator.description.moniker,
				status: validator.status,
			};

			const currentState = this.validators.get(address);
			// Only track changes if it's not the initial load
			if (
				!this.isInitialLoad &&
				(!currentState ||
					currentState.status !== newState.status ||
					currentState.moniker !== newState.moniker)
			) {
				changes.push({
					address,
					before: currentState,
					after: newState,
				});
			}
			this.validators.set(address, newState);
		}

		await this.updatePinnedStatus();

		// Only notify about changes if it's not the initial load
		if (!this.isInitialLoad && changes.length > 0) {
			await this.notifyChanges(changes);
		}

		// After first load, set initial load to false
		this.isInitialLoad = false;
	}

	public getValidatorState(address: string): ValidatorState | undefined {
		return this.validators.get(address);
	}

	public getAllValidators(): Map<string, ValidatorState> {
		return new Map(this.validators);
	}
}
