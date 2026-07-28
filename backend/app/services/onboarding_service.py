import uuid
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.customer_activity import CustomerActivity
from app.models.onboarding import OnboardingFlow, OnboardingStep, FlowStatus, StepStatus
from app.schemas.onboarding import (
    OnboardingFlowCreate,
    OnboardingFlowUpdate,
    OnboardingStepUpdate,
)

DEFAULT_CUSTOMS_ONBOARDING_STEPS = [
    {
        "title": "KYC & Import Export Code (IEC) Verification",
        "description": "Verify customer IEC code on DGFT portal, check active PAN status, and validate GSTIN registration details.",
        "order": 1,
    },
    {
        "title": "Customs Power of Attorney (PoA) Authorization",
        "description": "Obtain and verify executed Customs Authorization Letter (Power of Attorney) on required stamp paper.",
        "order": 2,
    },
    {
        "title": "AD Code & Customs Bank Account Registration",
        "description": "Register Authorised Dealer (AD) Code bank letter and account details with Customs EDI at target ports.",
        "order": 3,
    },
    {
        "title": "KYC Document Vault & Document Verification",
        "description": "Upload & verify Director/Proprietor ID proof, registered office address proof, GST Certificate, and cancelled cheque.",
        "order": 4,
    },
    {
        "title": "ICEGATE Portal Linkage & EDI Registration",
        "description": "Link customer IEC/GSTIN to Customs ICEGATE portal for filing Bills of Entry & Shipping Bills online.",
        "order": 5,
    },
    {
        "title": "Duty Deferment & Bank Guarantee Setup",
        "description": "Set up Duty Deferment Facility, EPCG / Advance License registration, or Customs Bond execution if applicable.",
        "order": 6,
    },
    {
        "title": "Compliance Audit & Account Activation",
        "description": "Perform final risk assessment, verify compliance checklist, and mark customer account active for customs clearance.",
        "order": 7,
    },
]


class OnboardingService:
    """Service handling SaaS customer onboarding flows and step updates."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _log_activity(
        self,
        customer_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        event_type: str,
        title: str,
        description: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ):
        """Internal helper to log activity events in PostgreSQL."""
        activity = CustomerActivity(
            customer_id=customer_id,
            user_id=user_id,
            event_type=event_type,
            title=title,
            description=description,
            metadata_json=metadata_json,
        )
        self.db.add(activity)

    async def get_flow(self, flow_id: uuid.UUID) -> Optional[OnboardingFlow]:
        """Fetch onboarding flow details by ID."""
        stmt = (
            select(OnboardingFlow)
            .where(OnboardingFlow.id == flow_id)
            .options(selectinload(OnboardingFlow.steps), selectinload(OnboardingFlow.customer))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def auto_provision_flow_for_customer(self, customer: Customer) -> OnboardingFlow:
        """Create a default 7-step Customs Broker Onboarding Journey for a customer."""
        flow = OnboardingFlow(
            user_id=customer.broker_id,
            customer_id=customer.id,
            title=f"Customs Onboarding: {customer.name}",
            description="Standard Customs Broker KYC, Authorization, ICEGATE & Compliance Onboarding Workflow",
            status=FlowStatus.NOT_STARTED,
        )
        self.db.add(flow)
        await self.db.flush()

        for step_data in DEFAULT_CUSTOMS_ONBOARDING_STEPS:
            step = OnboardingStep(
                flow_id=flow.id,
                title=step_data["title"],
                description=step_data["description"],
                order=step_data["order"],
                status=StepStatus.PENDING,
            )
            self.db.add(step)

        await self._log_activity(
            customer_id=customer.id,
            user_id=customer.broker_id,
            event_type="workflow_provisioned",
            title="Customs Onboarding Journey Assigned",
            description="Standard 7-step Customs Broker Clearance Journey provisioned.",
        )

        await self.db.commit()
        return await self.get_flow(flow.id)

    async def get_flow_by_customer_id(self, customer_id: uuid.UUID) -> Optional[OnboardingFlow]:
        """Fetch onboarding flow associated with a specific customer (auto-provisions if missing)."""
        stmt = (
            select(OnboardingFlow)
            .where(OnboardingFlow.customer_id == customer_id)
            .options(selectinload(OnboardingFlow.steps), selectinload(OnboardingFlow.customer))
        )
        result = await self.db.execute(stmt)
        flow = result.scalar_one_or_none()

        if flow is None:
            # Auto-provision flow for customer if customer exists
            cust_stmt = select(Customer).where(Customer.id == customer_id)
            cust_res = await self.db.execute(cust_stmt)
            customer = cust_res.scalar_one_or_none()
            if customer:
                flow = await self.auto_provision_flow_for_customer(customer)

        return flow

    async def get_user_flows(self, user_id: uuid.UUID) -> List[OnboardingFlow]:
        """Fetch all onboarding flows assigned to a user (broker). Auto-provisions missing flows for customers."""
        # First ensure all customers owned by this broker have an assigned flow
        cust_stmt = select(Customer).where(Customer.broker_id == user_id)
        cust_res = await self.db.execute(cust_stmt)
        customers = list(cust_res.scalars().all())

        for cust in customers:
            flow_check = (
                select(OnboardingFlow.id)
                .where(OnboardingFlow.customer_id == cust.id)
            )
            flow_res = await self.db.execute(flow_check)
            if flow_res.scalar_one_or_none() is None:
                await self.auto_provision_flow_for_customer(cust)

        stmt = (
            select(OnboardingFlow)
            .where(OnboardingFlow.user_id == user_id)
            .options(selectinload(OnboardingFlow.steps), selectinload(OnboardingFlow.customer))
            .order_by(OnboardingFlow.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_flow(self, user_id: uuid.UUID, flow_in: OnboardingFlowCreate) -> OnboardingFlow:
        """Initialize a new onboarding flow sequence for a user."""
        flow = OnboardingFlow(
            user_id=user_id,
            customer_id=flow_in.customer_id,
            title=flow_in.title,
            description=flow_in.description,
            status=FlowStatus.NOT_STARTED,
        )
        self.db.add(flow)
        await self.db.flush()

        steps_to_add = flow_in.steps if flow_in.steps else [
            {"title": s["title"], "description": s["description"], "order": s["order"]}
            for s in DEFAULT_CUSTOMS_ONBOARDING_STEPS
        ]

        for idx, step_in in enumerate(steps_to_add):
            title = step_in.title if hasattr(step_in, "title") else step_in["title"]
            desc = step_in.description if hasattr(step_in, "description") else step_in["description"]
            order = step_in.order if hasattr(step_in, "order") and step_in.order else (idx + 1)

            step = OnboardingStep(
                flow_id=flow.id,
                title=title,
                description=desc,
                order=order,
                status=StepStatus.PENDING,
            )
            self.db.add(step)

        if flow_in.customer_id:
            await self._log_activity(
                customer_id=flow_in.customer_id,
                user_id=user_id,
                event_type="workflow_created",
                title="Customs Onboarding Journey Created",
                description=f"Flow '{flow.title}' created with {len(steps_to_add)} steps.",
            )

        await self.db.commit()
        return await self.get_flow(flow.id)

    async def update_flow(
        self, flow_id: uuid.UUID, flow_in: OnboardingFlowUpdate
    ) -> Optional[OnboardingFlow]:
        """Update onboarding flow metadata or status."""
        flow = await self.get_flow(flow_id)
        if not flow:
            return None

        update_data = flow_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(flow, field, value)

        self.db.add(flow)
        await self.db.commit()
        return await self.get_flow(flow_id)

    async def update_step(
        self, step_id: uuid.UUID, step_in: OnboardingStepUpdate
    ) -> Optional[OnboardingStep]:
        """Update individual onboarding step state/progress."""
        stmt = select(OnboardingStep).where(OnboardingStep.id == step_id)
        result = await self.db.execute(stmt)
        step = result.scalar_one_or_none()
        if not step:
            return None

        update_data = step_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(step, field, value)

        self.db.add(step)
        await self.db.flush()

        # Recalculate parent flow status
        flow_stmt = (
            select(OnboardingFlow)
            .where(OnboardingFlow.id == step.flow_id)
            .options(selectinload(OnboardingFlow.steps))
        )
        flow_res = await self.db.execute(flow_stmt)
        flow = flow_res.scalar_one_or_none()

        if flow and flow.steps:
            all_completed = all(s.status in (StepStatus.COMPLETED, StepStatus.SKIPPED) for s in flow.steps)
            any_in_progress = any(
                s.status in (StepStatus.IN_PROGRESS, StepStatus.COMPLETED) for s in flow.steps
            )

            if all_completed:
                flow.status = FlowStatus.COMPLETED
            elif any_in_progress:
                flow.status = FlowStatus.IN_PROGRESS
            else:
                flow.status = FlowStatus.NOT_STARTED
            self.db.add(flow)

        # Log Activity to PostgreSQL
        if flow and flow.customer_id:
            event_type = "step_completed" if step.status == StepStatus.COMPLETED else "step_updated"
            event_title = f"Step #{step.order} {step.status.value.replace('_', ' ').capitalize()}: {step.title}"
            await self._log_activity(
                customer_id=flow.customer_id,
                user_id=flow.user_id,
                event_type=event_type,
                title=event_title,
                description=f"Status set to {step.status.value.upper()}.",
                metadata_json={"step_id": str(step.id), "status": step.status.value, "data": step.data},
            )

        await self.db.commit()
        await self.db.refresh(step)
        return step

    async def add_step_to_flow(
        self, flow_id: uuid.UUID, title: str, description: Optional[str] = None
    ) -> Optional[OnboardingStep]:
        """Add a new custom step to an onboarding flow."""
        flow = await self.get_flow(flow_id)
        if not flow:
            return None

        order = len(flow.steps) + 1 if flow.steps else 1
        step = OnboardingStep(
            flow_id=flow.id,
            title=title.strip(),
            description=description.strip() if description else None,
            order=order,
            status=StepStatus.PENDING,
        )
        self.db.add(step)
        await self.db.commit()
        await self.db.refresh(step)
        return step

    async def delete_step(self, step_id: uuid.UUID) -> bool:
        """Delete a step from an onboarding flow."""
        stmt = select(OnboardingStep).where(OnboardingStep.id == step_id)
        result = await self.db.execute(stmt)
        step = result.scalar_one_or_none()
        if not step:
            return False

        await self.db.delete(step)
        await self.db.commit()
        return True
