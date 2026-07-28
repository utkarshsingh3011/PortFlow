"""add_customer_id_to_onboarding_flows

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-07-26 12:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'onboarding_flows',
        sa.Column('customer_id', sa.UUID(), nullable=True)
    )
    op.create_foreign_key(
        'fk_onboarding_flows_customer_id_customers',
        'onboarding_flows',
        'customers',
        ['customer_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_unique_constraint(
        'uq_onboarding_flows_customer_id',
        'onboarding_flows',
        ['customer_id']
    )
    op.create_index(
        op.f('ix_onboarding_flows_customer_id'),
        'onboarding_flows',
        ['customer_id'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_onboarding_flows_customer_id'), table_name='onboarding_flows')
    op.drop_constraint('uq_onboarding_flows_customer_id', 'onboarding_flows', type_='unique')
    op.drop_constraint('fk_onboarding_flows_customer_id_customers', 'onboarding_flows', type_='foreignkey')
    op.drop_column('onboarding_flows', 'customer_id')
