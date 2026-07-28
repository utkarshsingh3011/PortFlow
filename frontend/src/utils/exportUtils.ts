import { Customer, OnboardingFlow } from '@/types';
import { CustomerDocument } from '@/services/documentService';
import { CustomerActivity } from '@/services/customerService';

export const exportCustomerJSON = (
  customer: Customer,
  flow: OnboardingFlow | null,
  documents: CustomerDocument[],
  activities: CustomerActivity[]
) => {
  const steps = flow?.steps || [];
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const exportData = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      platform: 'PortFlow Customs Broker Onboarding Portal',
      version: '1.0.0',
    },
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      gstin: customer.gstin || null,
      customer_type: customer.customer_type,
      broker_id: customer.broker_id,
      created_at: customer.created_at,
    },
    onboarding_summary: {
      flow_id: flow?.id || null,
      flow_title: flow?.title || 'Customs Broker Onboarding Journey',
      flow_status: flow?.status || 'not_started',
      progress_percentage: progressPercent,
      completed_steps_count: completedCount,
      total_steps_count: steps.length,
      steps: steps.map((s) => ({
        step_id: s.id,
        order: s.order,
        title: s.title,
        status: s.status,
        description: s.description || null,
        submitted_data: s.data || null,
        updated_at: s.updated_at,
      })),
    },
    uploaded_documents: documents.map((d) => ({
      document_id: d.id,
      document_type: d.document_type,
      filename: d.filename,
      file_size_bytes: d.file_size,
      content_type: d.content_type,
      uploaded_at: d.created_at,
    })),
    activity_timeline: activities.map((a) => ({
      activity_id: a.id,
      event_type: a.event_type,
      title: a.title,
      description: a.description || null,
      timestamp: a.created_at,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = customer.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PortFlow_Onboarding_Summary_${cleanName}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportCustomerPDF = (
  customer: Customer,
  flow: OnboardingFlow | null,
  documents: CustomerDocument[],
  activities: CustomerActivity[]
) => {
  const steps = flow?.steps || [];
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      return new Date(dStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dStr;
    }
  };

  const stepsRowsHtml = steps
    .map(
      (s) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 12px;">Step #${s.order}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 12px;">${s.title}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 10px; background-color: ${
          s.status === 'completed' ? '#d1fae5; color: #065f46;' : s.status === 'in_progress' ? '#dbeafe; color: #1e40af;' : '#fef3c7; color: #92400e;'
        }">${s.status.toUpperCase()}</span>
      </td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${formatDate(s.updated_at)}</td>
    </tr>
  `
    )
    .join('');

  const docsRowsHtml =
    documents.length === 0
      ? `<tr><td colspan="4" style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-style: italic;">No documents uploaded</td></tr>`
      : documents
          .map(
            (d) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; font-weight: bold;">${d.document_type.replace('_', ' ').toUpperCase()}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${d.filename}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${roundSize(d.file_size)}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${formatDate(d.created_at)}</td>
    </tr>
  `
          )
          .join('');

  const actRowsHtml =
    activities.length === 0
      ? `<tr><td colspan="3" style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-style: italic;">No activity log events recorded</td></tr>`
      : activities
          .slice(0, 10)
          .map(
            (a) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; font-weight: bold;">${a.title}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${a.description || '-'}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; font-family: monospace;">${formatDate(a.created_at)}</td>
    </tr>
  `
          )
          .join('');

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PortFlow Onboarding Summary - ${customer.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #2563eb; }
          .title { font-size: 14px; font-weight: 600; color: #6b7280; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
          .field-label { color: #6b7280; font-size: 11px; }
          .field-val { font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background-color: #f9fafb; padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #4b5563; text-align: left; }
          .progress-bar { width: 100%; height: 10px; background-color: #e5e7eb; border-radius: 5px; overflow: hidden; margin-top: 6px; }
          .progress-fill { height: 100%; background-color: ${progressPercent === 100 ? '#10b981' : '#2563eb'}; width: ${progressPercent}%; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">PortFlow</div>
            <div class="title">Customs Clearance & Broker Onboarding Report</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #6b7280;">
            <div>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>Ref ID: ${customer.id.slice(0, 8)}</div>
          </div>
        </div>

        <!-- Customer Company Profile -->
        <div class="section">
          <div class="section-title">1. Customer Company Profile</div>
          <div class="grid">
            <div><span class="field-label">Legal Business Name:</span> <div class="field-val">${customer.name}</div></div>
            <div><span class="field-label">Primary Contact Email:</span> <div class="field-val">${customer.email}</div></div>
            <div><span class="field-label">GSTIN Registration:</span> <div class="field-val">${customer.gstin || 'Not Provided'}</div></div>
            <div><span class="field-label">Customer Category:</span> <div class="field-val">${customer.customer_type}</div></div>
            <div><span class="field-label">Broker Account Reference:</span> <div class="field-val">${customer.broker_id}</div></div>
            <div><span class="field-label">Registration Date:</span> <div class="field-val">${formatDate(customer.created_at)}</div></div>
          </div>
        </div>

        <!-- Onboarding Progress Summary -->
        <div class="section">
          <div class="section-title">2. Customs Onboarding Progress Summary</div>
          <div style="font-size: 12px; font-weight: bold;">
            Flow: ${flow?.title || 'Customs Broker Onboarding Journey'} (${completedCount} of ${steps.length} Steps Completed - ${progressPercent}%)
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>

        <!-- Onboarding Steps Breakdown -->
        <div class="section">
          <div class="section-title">3. Onboarding Steps Audit & Status</div>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Step Title</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              ${stepsRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Uploaded Document Vault -->
        <div class="section">
          <div class="section-title">4. Uploaded Customs Document Vault</div>
          <table>
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Upload Date</th>
              </tr>
            </thead>
            <tbody>
              ${docsRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Activity Audit Log -->
        <div class="section">
          <div class="section-title">5. Recent Activity Audit Trail</div>
          <table>
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${actRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This audit report was automatically generated by PortFlow Customs Clearance & Broker Onboarding Portal. Confidential.
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

function roundSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
