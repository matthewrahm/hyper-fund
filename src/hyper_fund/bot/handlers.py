import asyncio
import re

from telegram import Update
from telegram.ext import ContextTypes

from hyper_fund.core import FundingAggregator
from hyper_fund.bot.formatters import (
    format_spread_table,
    format_coin_detail,
    format_predicted,
    format_cost,
    format_help,
)


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

    if context.args:
        coin = context.args[0].upper()
        msg = await update.message.reply_text("Scanning...")
        rates = await agg.get_coin_detail(coin)
        await msg.edit_text(format_coin_detail(coin, rates), parse_mode="HTML")
    else:
        msg = await update.message.reply_text("Scanning all exchanges...")
        spreads = await agg.get_top_spreads(15)
        await msg.edit_text(format_spread_table(spreads), parse_mode="HTML")


async def predicted_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    agg = get_aggregator()
    msg = await update.message.reply_text("Fetching predicted rates...")

    loop = asyncio.get_event_loop()
    predicted = await loop.run_in_executor(None, agg.hl.get_predicted_funding)

    def max_abs_hourly(entry):
        if not entry["venues"]:
            return 0
        return max(abs(v["rate"] / v["interval_hours"]) for v in entry["venues"])

    predicted.sort(key=max_abs_hourly, reverse=True)
    await msg.edit_text(format_predicted(predicted), parse_mode="HTML")


async def cost_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    agg = get_aggregator()

    if not context.args:
        await update.message.reply_text("Usage: /cost 0x...")
        return

    address = context.args[0]
    if not re.match(r"^0x[0-9a-fA-F]{40}$", address):
        await update.message.reply_text("Invalid address. Expected 0x + 40 hex characters.")
        return

    msg = await update.message.reply_text("Calculating funding costs...")

    loop = asyncio.get_event_loop()
    cost_data = await loop.run_in_executor(None, agg.hl.get_user_funding_cost, address)
    await msg.edit_text(format_cost(cost_data), parse_mode="HTML")
