"""add_customer_unique_constraints

Revision ID: a1b2c3d4e5f6
Revises: e797776b4f3c
Create Date: 2026-07-26 11:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e797776b4f3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Deduplicate existing rows by email per broker keeping newest row
    op.execute("""
        DELETE FROM customers c1
        USING customers c2
        WHERE c1.broker_id = c2.broker_id
          AND LOWER(c1.email) = LOWER(c2.email)
          AND c1.created_at < c2.created_at
    """)

    # 2. Deduplicate existing rows by GSTIN per broker keeping newest row (where gstin is not null)
    op.execute("""
        DELETE FROM customers c1
        USING customers c2
        WHERE c1.broker_id = c2.broker_id
          AND c1.gstin IS NOT NULL
          AND c2.gstin IS NOT NULL
          AND c1.gstin = c2.gstin
          AND c1.created_at < c2.created_at
    """)

    # 3. Add unique constraints
    op.create_unique_constraint(
        'uq_customer_broker_email',
        'customers',
        ['broker_id', 'email']
    )
    op.create_unique_constraint(
        'uq_customer_broker_gstin',
        'customers',
        ['broker_id', 'gstin']
    )


def downgrade() -> None:
    op.drop_constraint('uq_customer_broker_gstin', 'customers', type_='unique')
    op.drop_constraint('uq_customer_broker_email', 'customers', type_='unique')
