import json
import logging
import time
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)

ALERTS_DIR = Path.home() / ".hyper-fund"
ALERTS_FILE = ALERTS_DIR / "alerts.json"
COOLDOWN_SECONDS = 30 * 60  # 30 minutes


@dataclass
class Alert:
    chat_id: int
    coin: str
    threshold_bps: float
    created_at: float


class AlertManager:
    """Manages funding rate spread alerts with JSON persistence."""

    def __init__(self):
        self.alerts: list[Alert] = []
        self._last_fired: dict[str, float] = {}  # "chat_id:coin" -> timestamp
        self._load()

    def _alert_key(self, chat_id: int, coin: str) -> str:
        return f"{chat_id}:{coin}"

    def _load(self):
        if not ALERTS_FILE.exists():
            return
        try:
            data = json.loads(ALERTS_FILE.read_text())
            self.alerts = [Alert(**a) for a in data]
            logger.info(f"Loaded {len(self.alerts)} alerts")
        except Exception as e:
            logger.error(f"Failed to load alerts: {e}")

    def _save(self):
        ALERTS_DIR.mkdir(parents=True, exist_ok=True)
        data = [asdict(a) for a in self.alerts]
        ALERTS_FILE.write_text(json.dumps(data, indent=2))

    def add(self, chat_id: int, coin: str, threshold_bps: float) -> bool:
        """Add an alert. Returns False if duplicate."""
        coin = coin.upper()
        for a in self.alerts:
            if a.chat_id == chat_id and a.coin == coin:
                a.threshold_bps = threshold_bps
                self._save()
                return True

        self.alerts.append(Alert(
            chat_id=chat_id,
            coin=coin,
            threshold_bps=threshold_bps,
            created_at=time.time(),
        ))
        self._save()
        return True

    def remove(self, chat_id: int, coin: str) -> bool:
        """Remove an alert. Returns False if not found."""
        coin = coin.upper()
        before = len(self.alerts)
        self.alerts = [a for a in self.alerts if not (a.chat_id == chat_id and a.coin == coin)]
        if len(self.alerts) < before:
            self._save()
            return True
        return False

    def get_user_alerts(self, chat_id: int) -> list[Alert]:
        return [a for a in self.alerts if a.chat_id == chat_id]

    def check_triggered(self, spreads: dict[str, float]) -> list[tuple[Alert, float]]:
        """Check which alerts are triggered.

        Args:
            spreads: dict of coin -> spread in bps

        Returns list of (alert, current_spread_bps) for triggered alerts.
        """
        now = time.time()
        triggered = []

        for alert in self.alerts:
            current = spreads.get(alert.coin)
            if current is None:
                continue

            if current < alert.threshold_bps:
                continue

            key = self._alert_key(alert.chat_id, alert.coin)
            last = self._last_fired.get(key, 0)
            if now - last < COOLDOWN_SECONDS:
                continue

            self._last_fired[key] = now
            triggered.append((alert, current))

        return triggered
