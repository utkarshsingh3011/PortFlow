import os
import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.onboarding import OnboardingFlow, OnboardingStep, FlowStatus, StepStatus
from app.models.customer_activity import CustomerActivity
from app.models.customer_document import CustomerDocument
from app.services.onboarding_service import DEFAULT_CUSTOMS_ONBOARDING_STEPS

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "documents")


class SeedService:
    """Service to automatically provision realistic demo data for broker onboarding."""

    def __init__(self, db: AsyncSession):
        self.db = db
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    async def ensure_demo_data_for_broker(self, broker_id: uuid.UUID) -> Optional[Customer]:
        """Check if broker has any existing customers. If empty, seed a realistic demo customer journey."""
        stmt = select(func.count(Customer.id)).where(Customer.broker_id == broker_id)
        res = await self.db.execute(stmt)
        count = res.scalar_one() or 0
        if count > 0:
            return None  # Broker already has customer data

        now = datetime.now(timezone.utc)

        # 1. Seed Customer: Apex Global Maritime & Logistics Private Limited
        customer = Customer(
            broker_id=broker_id,
            name="Apex Global Maritime & Logistics Private Limited",
            email="compliance@apexglobal.com",
            gstin="27AAACA1234A1Z5",
            customer_type="Corporate",
            created_at=now - timedelta(days=5),
        )
        self.db.add(customer)
        await self.db.flush()

        # 2. Seed Onboarding Flow
        flow = OnboardingFlow(
            user_id=broker_id,
            customer_id=customer.id,
            title="Customs Onboarding: Apex Global Maritime & Logistics",
            description="Standard Customs Broker KYC, Authorization, ICEGATE & Compliance Onboarding Workflow",
            status=FlowStatus.IN_PROGRESS,
            created_at=now - timedelta(days=5),
        )
        self.db.add(flow)
        await self.db.flush()

        # 3. Seed 7 Steps (Steps 1, 2, 3 Completed with Data; Steps 4-7 Pending)
        step1_data = {
            "iec_number": "0398012345",
            "pan_number": "AAACA1234A",
            "gstin": "27AAACA1234A1Z5",
            "iec_issue_date": "2018-04-12",
            "dgft_verified": True,
        }

        step2_data = {
            "poa_reference_no": "POA/JNPT/2026/049",
            "signatory_name": "Vikramaditya Mehta (Managing Director)",
            "stamp_paper_value": "₹500",
            "execution_date": "2026-07-15",
        }

        step3_data = {
            "ad_code": "6390012",
            "customs_port": "INNSA1 - JNPT Nhava Sheva",
            "bank_name": "HDFC Bank Ltd",
            "branch_name": "Fort Branch, Mumbai - HDFC0000060",
        }

        steps_data_map = {1: step1_data, 2: step2_data, 3: step3_data}

        for step_def in DEFAULT_CUSTOMS_ONBOARDING_STEPS:
            order = step_def["order"]
            is_completed = order <= 3
            step_status = StepStatus.COMPLETED if is_completed else StepStatus.PENDING
            s_data = steps_data_map.get(order)

            step = OnboardingStep(
                flow_id=flow.id,
                title=step_def["title"],
                description=step_def["description"],
                order=order,
                status=step_status,
                data=s_data,
                created_at=now - timedelta(days=5),
                updated_at=now - timedelta(days=5 - order),
            )
            self.db.add(step)

        # 4. Seed Activity Timeline Events
        activities = [
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="customer_created",
                title="Customer Account Registered",
                description="Registered customer 'Apex Global Maritime & Logistics Private Limited' (Corporate).",
                metadata_json={"email": customer.email, "gstin": customer.gstin},
                created_at=now - timedelta(days=5),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="workflow_provisioned",
                title="Customs Onboarding Journey Assigned",
                description="Standard 7-step Customs Broker Clearance Journey provisioned.",
                created_at=now - timedelta(days=5),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="step_completed",
                title="Step #1 Completed: DGFT IEC & GSTIN Verification",
                description="IEC 0398012345 & GSTIN 27AAACA1234A1Z5 verified active on DGFT Portal.",
                metadata_json=step1_data,
                created_at=now - timedelta(days=4),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="document_uploaded",
                title="Document Uploaded: GST CERTIFICATE",
                description="Uploaded file 'GST_Registration_ApexGlobal.pdf' (470.7 KB).",
                created_at=now - timedelta(days=3, hours=12),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="document_uploaded",
                title="Document Uploaded: POWER OF ATTORNEY",
                description="Uploaded file 'Executed_Customs_PoA_Apex.pdf' (1.1 MB).",
                created_at=now - timedelta(days=3),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="step_completed",
                title="Step #2 Completed: Customs Power of Attorney (PoA) Authorization",
                description="PoA/JNPT/2026/049 executed on ₹500 stamp paper by Managing Director Vikramaditya Mehta.",
                metadata_json=step2_data,
                created_at=now - timedelta(days=3),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="document_uploaded",
                title="Document Uploaded: CANCELLED CHEQUE",
                description="Uploaded file 'Cancelled_Cheque_HDFC.pdf' (312.5 KB).",
                created_at=now - timedelta(days=2),
            ),
            CustomerActivity(
                customer_id=customer.id,
                user_id=broker_id,
                event_type="step_completed",
                title="Step #3 Completed: AD Code & Customs Bank Account Registration",
                description="AD Code 6390012 registered for INNSA1 - JNPT Nhava Sheva Sea Port.",
                metadata_json=step3_data,
                created_at=now - timedelta(days=2),
            ),
        ]

        for act in activities:
            self.db.add(act)

        # 5. Seed Uploaded Documents Metadata & File Placeholders
        dummy_docs = [
            ("gst_certificate", "GST_Registration_ApexGlobal.pdf", 482000, "application/pdf"),
            ("iec_certificate", "DGFT_IEC_Certificate_0398012345.pdf", 320000, "application/pdf"),
            ("power_of_attorney", "Executed_Customs_PoA_Apex.pdf", 1150000, "application/pdf"),
            ("cancelled_cheque", "Cancelled_Cheque_HDFC.pdf", 320000, "application/pdf"),
        ]

        for doc_type, filename, size, mime in dummy_docs:
            disk_path = os.path.join(UPLOAD_DIR, f"demo_{filename}")
            if not os.path.exists(disk_path):
                with open(disk_path, "wb") as f:
                    f.write(b"%PDF-1.4 Demo Customs Onboarding Document Placeholder Content")

            doc = CustomerDocument(
                customer_id=customer.id,
                document_type=doc_type,
                filename=filename,
                file_path=disk_path,
                file_size=size,
                content_type=mime,
                created_at=now - timedelta(days=3),
            )
            self.db.add(doc)

        await self.db.commit()
        await self.db.refresh(customer)
        return customer
