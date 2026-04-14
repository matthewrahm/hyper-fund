import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hyper_fund.core import FundingAggregator
from api.routes import router

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FundingAggregator...")
    app.state.aggregator = FundingAggregator()
    yield
    logger.info("Shutting down FundingAggregator...")
    await app.state.aggregator.close()


app = FastAPI(
    title="hyper-fund",
    description="Hyperliquid funding rate scanner API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)
