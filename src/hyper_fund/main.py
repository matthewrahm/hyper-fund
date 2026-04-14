import os
import logging

from dotenv import load_dotenv
from telegram.ext import Application, CommandHandler

from hyper_fund.bot.handlers import help_handler, funding_handler


logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main():
    load_dotenv()

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not set in .env")
        return

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("start", help_handler))
    app.add_handler(CommandHandler("funding", funding_handler))

    logger.info("Hyper-Fund bot starting...")
    app.run_polling()


if __name__ == "__main__":
    main()
