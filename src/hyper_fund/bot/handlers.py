from telegram import Update
from telegram.ext import ContextTypes

from hyper_fund.core import FundingAggregator
from hyper_fund.bot.formatters import format_spread_table, format_coin_detail, format_help


# Shared aggregator instance
_aggregator: FundingAggregator | None = None


def get_aggregator() -> FundingAggregator:
    global _aggregator
    if _aggregator is None:
        _aggregator = FundingAggregator()
    return _aggregator


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(format_help(), parse_mode="HTML")


async def funding_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    agg = get_aggregator()

    # Check if a specific coin was requested
    if context.args:
        coin = context.args[0].upper()
        msg = await update.message.reply_text("Scanning...")
        rates = await agg.get_coin_detail(coin)
        await msg.edit_text(format_coin_detail(coin, rates), parse_mode="HTML")
    else:
        msg = await update.message.reply_text("Scanning all exchanges...")
        spreads = await agg.get_top_spreads(15)
        await msg.edit_text(format_spread_table(spreads), parse_mode="HTML")
