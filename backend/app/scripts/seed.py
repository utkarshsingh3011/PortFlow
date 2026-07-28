"""Explicit development database seed script.

Run manually via CLI:
python -m app.scripts.seed
"""
import asyncio
import logging
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.customer import Customer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_demo_data() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        user = result.scalars().first()

        if not user:
            logger.error("No user found. Please register or login a user before running seed.")
            return

        demo_customers = [
            {
                "name": "Acme Pvt Ltd",
                "email": "contact@acmepvtltd.com",
                "gstin": "27AAAAA0000A1Z5",
                "customer_type": "Corporate",
            },
            {
                "name": "Global Shipping Corp",
                "email": "info@globalshipping.com",
                "gstin": "27BBBBB0000B1Z6",
                "customer_type": "Enterprise",
            },
            {
                "name": "Acme Logistics Global Ltd",
                "email": "support@acmelogistics.com",
                "gstin": "27CCCCC0000C1Z7",
                "customer_type": "SMB",
            },
        ]

        for item in demo_customers:
            stmt = select(Customer).where(
                Customer.broker_id == user.id,
                Customer.email == item["email"]
            )
            existing = await session.execute(stmt)
            if existing.scalar_one_or_none() is None:
                cust = Customer(
                    broker_id=user.id,
                    name=item["name"],
                    email=item["email"],
                    gstin=item["gstin"],
                    customer_type=item["customer_type"],
                )
                session.add(cust)
                logger.info(f"Seeded demo customer: {item['name']}")

        await session.commit()
        logger.info("Demo seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
