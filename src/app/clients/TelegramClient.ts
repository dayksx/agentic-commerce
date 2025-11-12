/**
 * Telegram Client for managing Telegram bot interactions.
 */
import { Telegraf, Context } from "telegraf";
import { message } from "telegraf/filters";
import { Client } from "../interfaces";

export class TelegramClient implements Client {
    private executeWorkflow: (prompt: string) => Promise<string>;
    private bot: Telegraf<Context> | null = null;

    constructor(executeWorkflow: (prompt: string) => Promise<string>) {
        this.executeWorkflow = executeWorkflow;
    }

    /**
     * Starts the Telegram client
     */
    public async start(): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set");
        this.bot = new Telegraf(token);

        this.bot.start((context) => context.reply("Hey buddy!! Let's buidl!"));
        
        this.bot.on(message('text'), async(context) => {
            const msg = context.message;
            if (msg) {
                try {
                    const response = await this.executeWorkflow(msg.text);
                    await context.reply(response);
                } catch (error) {
                    console.error("Error executing workflow:", error);
                    await context.reply("Sorry, I encountered an error processing your message.");
                }
            }
        });
        
        // Launch bot without awaiting (Telegraf 4.x promise may not resolve)
        this.bot.launch().catch((error) => {
            console.error("💬 Telegram Client: Failed to launch bot:", error);
        });
        
        // Verify bot is running after a short delay (workaround for promise not resolving)
        setTimeout(async () => {
            try {
                const botInfo = await this.bot!.telegram.getMe();
                console.log(`💬 Telegram Agent @${botInfo.username} is running`);
            } catch (error) {
                console.error("💬 Telegram Client: Could not verify bot status:", error);
            }
        }, 500);
        
        // Enable graceful stop
        process.once('SIGINT', () => this.bot?.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
    }

    /**
     * Stops the Telegram client
     */
    public async stop(): Promise<void> {
        if (this.bot) {
            await this.bot.stop();
            this.bot = null;
        }
    }

    /**
     * Checks if the client is currently running
     */
    public isRunning(): boolean {
        return this.bot !== null;
    }
}

