# Supernova Discord Bot

A Discord bot for tracking and monitoring Supernova validators (pillars).

## Features

- Real-time tracking of validator states (BONDED, UNBONDING, UNBONDED)
- Automatic status updates every 6 seconds
- Pinned status message showing current validator states
- Role-based notifications for status changes
- Custom emojis for different validator states
- 24-hour temporary notifications for status changes

## Prerequisites

- [Deno](https://deno.land/) installed
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Notification Channel ID (Discord channel ID where bot will post updates)
- Alert Role ID (optional, Discord role ID to mention in notifications)

## Configuration

The bot uses the following configuration:

- **API Endpoint**: `https://rest.supernova.zenon.red/cosmos/staking/v1beta1/validators`
- **Poll Interval**: 6 seconds
- **Message Lifetime**: 24 hours
- **Total Pillars**: 8

## Development

1. Copy `.env.example` to `.env` and fill in your environment variables:
   ```bash
   DISCORD_TOKEN=your_discord_bot_token
   NOTIFICATION_CHANNEL_ID=your_channel_id
   ALERT_ROLE_ID=your_role_id (optional)
   ```

2. Run the development server:
   ```bash
   deno task dev
   ```

## Production

This bot is designed to be deployed on Deno Deploy. Follow these steps:

1. Push your code to GitHub
2. Connect your repository to Deno Deploy
3. Add your environment variables in Deno Deploy dashboard
4. Deploy!

## License

MIT
