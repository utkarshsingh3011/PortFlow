import { FC, useState, useEffect } from 'react';
import {
  CheckCircle2,
  Save,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Building2,
  Lock,
  Globe,
  Award,
  UserCheck,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/common';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { OnboardingStep } from '@/types';

export interface StepFormWizardProps {
  step: OnboardingStep;
  customerId?: string;
  initialData?: Record<string, any>;
  onSave: (formData: Record<string, any>, completeStep: boolean) => Promise<void>;
  onPrevious?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  isSaving: boolean;
}

export const StepFormWizard: FC<StepFormWizardProps> = ({
  step,
  customerId,
  initialData = {},
  onSave,
  onPrevious,
  hasNext,
  hasPrev,
  isSaving,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialData || step.data || {});
  }, [step, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = (completeStep: boolean): boolean => {
    if (!completeStep) return true;

    const errors: Record<string, string> = {};
    const stepOrder = step.order;

    if (stepOrder === 1) {
      if (!formData.iec_number) errors.iec_number = '10-digit IEC Number is required';
      if (!formData.pan_number) errors.pan_number = 'PAN Number is required';
      if (!formData.gstin) errors.gstin = 'GSTIN Registration is required';
    } else if (stepOrder === 2) {
      if (!formData.poa_reference_no) errors.poa_reference_no = 'PoA Reference No is required';
      if (!formData.signatory_name) errors.signatory_name = 'Authorized Signatory Name is required';
    } else if (stepOrder === 3) {
      if (!formData.ad_code) errors.ad_code = 'AD Code Number is required';
      if (!formData.customs_port) errors.customs_port = 'Target Customs Port is required';
    } else if (stepOrder === 4) {
      if (!formData.identity_proof_no) errors.identity_proof_no = 'ID Proof Document Number is required';
    } else if (stepOrder === 5) {
      if (!formData.icegate_user_id) errors.icegate_user_id = 'ICEGATE Username ID is required';
    } else if (stepOrder === 6) {
      if (!formData.duty_deferment_facility) errors.duty_deferment_facility = 'Duty Deferment status is required';
    } else if (stepOrder === 7) {
      if (!formData.risk_assessment) errors.risk_assessment = 'Risk assessment selection is required';
      if (!formData.final_approval) errors.final_approval = 'Final compliance approval confirmation is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent, completeStep: boolean) => {
    e.preventDefault();
    if (!validateCurrentStep(completeStep)) return;
    await onSave(formData, completeStep);
  };

  const stepOrder = step.order;

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-6">
        {/* Step 1: KYC & IEC Verification */}
        {stepOrder === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <ShieldCheck className="h-4 w-4" />
              <span>Step 1: DGFT IEC & GSTIN Verification Form</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Import Export Code (IEC)"
                placeholder="e.g. 0123456789"
                value={formData.iec_number || ''}
                onChange={(e) => handleChange('iec_number', e.target.value)}
                error={validationErrors.iec_number}
                required
              />
              <Input
                label="PAN Number"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan_number || ''}
                onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                error={validationErrors.pan_number}
                required
              />
              <Input
                label="GSTIN Number"
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={formData.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                error={validationErrors.gstin}
                required
              />
              <Input
                label="IEC Issue Date"
                type="date"
                value={formData.iec_issue_date || ''}
                onChange={(e) => handleChange('iec_issue_date', e.target.value)}
              />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.dgft_verified)}
                  onChange={(e) => handleChange('dgft_verified', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-gray-700">
                  DGFT Portal Verification Status Confirmed (Active & Valid)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Customs Power of Attorney */}
        {stepOrder === 2 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <FileText className="h-4 w-4" />
              <span>Step 2: Customs Authorization (PoA) Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customs PoA Reference Number"
                placeholder="e.g. POA/2026/089"
                value={formData.poa_reference_no || ''}
                onChange={(e) => handleChange('poa_reference_no', e.target.value)}
                error={validationErrors.poa_reference_no}
                required
              />
              <Input
                label="Authorized Signatory Name"
                placeholder="e.g. Rajesh Sharma (Director)"
                value={formData.signatory_name || ''}
                onChange={(e) => handleChange('signatory_name', e.target.value)}
                error={validationErrors.signatory_name}
                required
              />
              <Input
                label="Stamp Paper Denomination (INR)"
                placeholder="e.g. ₹500"
                value={formData.stamp_paper_value || ''}
                onChange={(e) => handleChange('stamp_paper_value', e.target.value)}
              />
              <Input
                label="PoA Execution Date"
                type="date"
                value={formData.execution_date || ''}
                onChange={(e) => handleChange('execution_date', e.target.value)}
              />
            </div>

            {/* Document Upload Module for PoA */}
            {customerId && (
              <div className="pt-4 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-900 mb-2">Upload Executed Power of Attorney (PoA) Document</h5>
                <DocumentManager
                  customerId={customerId}
                  stepId={step.id}
                  filterTypes={['power_of_attorney']}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: AD Code & Port Registration */}
        {stepOrder === 3 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <Building2 className="h-4 w-4" />
              <span>Step 3: AD Code & Customs Port Registration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="AD Code (7 Digits)"
                placeholder="e.g. 6390001"
                value={formData.ad_code || ''}
                onChange={(e) => handleChange('ad_code', e.target.value)}
                error={validationErrors.ad_code}
                required
              />
              <Select
                label="Target Customs Port Location"
                value={formData.customs_port || ''}
                onChange={(e) => handleChange('customs_port', e.target.value)}
                error={validationErrors.customs_port}
                options={[
                  { value: '', label: 'Select Customs Port' },
                  { value: 'INNSA1 - JNPT Nhava Sheva', label: 'INNSA1 - JNPT Nhava Sheva (Sea Port)' },
                  { value: 'INDEL4 - Delhi Air Cargo', label: 'INDEL4 - Delhi Air Cargo (Airport)' },
                  { value: 'INBOM1 - Mumbai Sea Port', label: 'INBOM1 - Mumbai Sea Port' },
                  { value: 'INMUN1 - Mundra Port', label: 'INMUN1 - Mundra Port (Gujarat)' },
                  { value: 'INMAA1 - Chennai Sea Port', label: 'INMAA1 - Chennai Sea Port' },
                ]}
                required
              />
              <Input
                label="AD Code Bank Name"
                placeholder="e.g. State Bank of India"
                value={formData.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
              />
              <Input
                label="Bank Branch & IFSC Code"
                placeholder="e.g. Main Branch - SBIN0000300"
                value={formData.branch_name || ''}
                onChange={(e) => handleChange('branch_name', e.target.value)}
              />
            </div>

            {/* Document Upload Module for Cancelled Cheque */}
            {customerId && (
              <div className="pt-4 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-900 mb-2">Upload AD Code Bank Cancelled Cheque</h5>
                <DocumentManager
                  customerId={customerId}
                  stepId={step.id}
                  filterTypes={['cancelled_cheque']}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: KYC Document Vault */}
        {stepOrder === 4 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <Lock className="h-4 w-4" />
              <span>Step 4: KYC Document Vault Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Director / Proprietor ID Proof Type"
                value={formData.identity_proof_type || 'Aadhaar Card'}
                onChange={(e) => handleChange('identity_proof_type', e.target.value)}
                options={[
                  { value: 'Aadhaar Card', label: 'Aadhaar Card' },
                  { value: 'Passport', label: 'Passport' },
                  { value: 'Voter ID', label: 'Voter ID Card' },
                ]}
              />
              <Input
                label="ID Document Number"
                placeholder="e.g. 1234-5678-9012"
                value={formData.identity_proof_no || ''}
                onChange={(e) => handleChange('identity_proof_no', e.target.value)}
                error={validationErrors.identity_proof_no}
                required
              />
              <Select
                label="Registered Office Address Proof"
                value={formData.address_proof_type || 'Electricity Bill'}
                onChange={(e) => handleChange('address_proof_type', e.target.value)}
                options={[
                  { value: 'Electricity Bill', label: 'Utility / Electricity Bill' },
                  { value: 'Rent Agreement', label: 'Registered Rent Agreement' },
                  { value: 'Property Certificate', label: 'Property Tax Certificate' },
                ]}
              />
              <Input
                label="Bank Account Cancelled Cheque Ref"
                placeholder="e.g. CHQ-987654"
                value={formData.cancelled_cheque_ref || ''}
                onChange={(e) => handleChange('cancelled_cheque_ref', e.target.value)}
              />
            </div>

            {/* Document Management Vault Module */}
            {customerId && (
              <div className="pt-4 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-900 mb-2">Upload Required KYC Documents</h5>
                <DocumentManager
                  customerId={customerId}
                  stepId={step.id}
                  filterTypes={['gst_certificate', 'iec_certificate', 'pan_card', 'address_proof']}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: ICEGATE Portal Linkage */}
        {stepOrder === 5 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <Globe className="h-4 w-4" />
              <span>Step 5: ICEGATE Portal Integration & EDI Linkage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ICEGATE Portal Username ID"
                placeholder="e.g. ACME_CUSTOMS_EDI"
                value={formData.icegate_user_id || ''}
                onChange={(e) => handleChange('icegate_user_id', e.target.value)}
                error={validationErrors.icegate_user_id}
                required
              />
              <Input
                label="Registered ICEGATE Email Address"
                type="email"
                placeholder="e.g. customs@acmetrade.com"
                value={formData.registered_email || ''}
                onChange={(e) => handleChange('registered_email', e.target.value)}
              />
              <Select
                label="Digital Signature Certificate (DSC) Status"
                value={formData.dsc_class_type || 'Class 3 DSC Active'}
                onChange={(e) => handleChange('dsc_class_type', e.target.value)}
                options={[
                  { value: 'Class 3 DSC Active', label: 'Class 3 DSC Active & Registered' },
                  { value: 'Pending Registration', label: 'Pending DSC Linkage' },
                  { value: 'Expired', label: 'DSC Renewal Required' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 6: Duty Deferment & Bank Guarantee */}
        {stepOrder === 6 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <Award className="h-4 w-4" />
              <span>Step 6: Duty Deferment Facility & Licenses</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Duty Deferment Facility Status"
                value={formData.duty_deferment_facility || ''}
                onChange={(e) => handleChange('duty_deferment_facility', e.target.value)}
                error={validationErrors.duty_deferment_facility}
                options={[
                  { value: '', label: 'Select Facility Status' },
                  { value: 'Enabled - Tier 1 AEO', label: 'Enabled (Tier 1 AEO Importer)' },
                  { value: 'Enabled - Tier 2 AEO', label: 'Enabled (Tier 2 AEO Importer)' },
                  { value: 'Not Applicable', label: 'Not Applicable (Standard Payment)' },
                ]}
                required
              />
              <Input
                label="Customs Bond Number (if applicable)"
                placeholder="e.g. BOND/JNPT/2026/001"
                value={formData.deferment_bond_no || ''}
                onChange={(e) => handleChange('deferment_bond_no', e.target.value)}
              />
              <Select
                label="Export / Export Incentive License Type"
                value={formData.license_type || 'None'}
                onChange={(e) => handleChange('license_type', e.target.value)}
                options={[
                  { value: 'None', label: 'None / Regular Customs Clearance' },
                  { value: 'EPCG License', label: 'EPCG License (Capital Goods)' },
                  { value: 'Advance Authorisation', label: 'Advance Authorisation Scheme' },
                  { value: 'LUT Export Bond', label: 'LUT Export Bond' },
                ]}
              />
              <Input
                label="License Reference Number"
                placeholder="e.g. LIC-01020304"
                value={formData.license_number || ''}
                onChange={(e) => handleChange('license_number', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 7: Compliance Review & Final Approval */}
        {stepOrder === 7 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm pb-2 border-b border-gray-100">
              <UserCheck className="h-4 w-4" />
              <span>Step 7: Compliance Audit Sign-Off & Final Approval</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Risk Assessment Category"
                value={formData.risk_assessment || ''}
                onChange={(e) => handleChange('risk_assessment', e.target.value)}
                error={validationErrors.risk_assessment}
                options={[
                  { value: '', label: 'Select Risk Assessment Level' },
                  { value: 'Low Risk - Approved', label: 'Low Risk (Verified & Cleared)' },
                  { value: 'Medium Risk - Monitored', label: 'Medium Risk (Monitored Account)' },
                  { value: 'High Risk - Additional Documents Needed', label: 'High Risk' },
                ]}
                required
              />
              <Input
                label="Approving Broker Agent Name"
                placeholder="e.g. Customs Agent License #11/2018"
                value={formData.broker_auditor_name || ''}
                onChange={(e) => handleChange('broker_auditor_name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Compliance Auditor Notes & Observations
              </label>
              <textarea
                rows={3}
                value={formData.compliance_notes || ''}
                onChange={(e) => handleChange('compliance_notes', e.target.value)}
                placeholder="Enter final verification comments and port clearance approval notes..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.final_approval)}
                  onChange={(e) => handleChange('final_approval', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-gray-900">
                  Confirm Final Compliance Clearance & Activate Customer Account for Customs Operations
                </span>
              </label>
              {validationErrors.final_approval && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.final_approval}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {hasPrev && (
              <Button type="button" variant="outline" size="sm" onClick={onPrevious}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Previous Step
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleFormSubmit(e, false)}
              isLoading={isSaving}
            >
              <Save className="h-4 w-4 mr-1.5" /> Save Progress
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => handleFormSubmit(e, true)}
            isLoading={isSaving}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete Step & Next{' '}
            {hasNext && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </form>
    </div>
  );
};
