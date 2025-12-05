/**
 * AI Agent Tools
 * Typed tool registry for agent actions with RBAC and preview/execute workflow
 */

export type ToolRole = 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ToolPreview {
  action: string;
  description: string;
  impact: string;
  requiresApproval: boolean;
  estimatedTime?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  allowedRoles: ToolRole[];
  preview: (params: any) => ToolPreview;
  execute: (params: any) => Promise<ToolResult>;
}

const tools: Map<string, Tool> = new Map();

export function registerTool(tool: Tool): void {
  tools.set(tool.id, tool);
}

export function getTool(id: string): Tool | undefined {
  return tools.get(id);
}

export function getAllTools(): Tool[] {
  return Array.from(tools.values());
}

export function getToolsForRole(role: ToolRole): Tool[] {
  return Array.from(tools.values()).filter(tool => 
    tool.allowedRoles.includes(role)
  );
}

export function initializeTools(): void {
  registerTool({
    id: 'send_message',
    name: 'Send Message',
    description: 'Send SMS or email to members/leads',
    allowedRoles: ['owner', 'manager', 'front-desk'],
    preview: (params: { recipients: string[]; message: string; type: 'sms' | 'email' }) => ({
      action: 'Send Message',
      description: `Send ${params.type} to ${params.recipients.length} recipient(s)`,
      impact: `${params.recipients.length} people will receive: "${params.message.substring(0, 50)}..."`,
      requiresApproval: false,
      estimatedTime: '< 1 minute',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `Sent ${params.type} to ${params.recipients.length} recipient(s)`,
        data: { sent: params.recipients.length },
      };
    },
  });

  registerTool({
    id: 'create_promotion',
    name: 'Create Promotion',
    description: 'Create a new promotional campaign',
    allowedRoles: ['owner', 'manager'],
    preview: (params: { name: string; discount: number; duration: number }) => ({
      action: 'Create Promotion',
      description: `Create "${params.name}" with ${params.discount}% off`,
      impact: `New promo code will be active for ${params.duration} days`,
      requiresApproval: false,
      estimatedTime: '< 1 minute',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `Created promotion: ${params.name}`,
        data: { promoId: `promo-${Date.now()}` },
      };
    },
  });

  registerTool({
    id: 'process_payments',
    name: 'Process Missed Payments',
    description: 'Attempt to process overdue payments',
    allowedRoles: ['owner', 'manager', 'front-desk'],
    preview: (params: { memberIds: string[]; amount: number }) => ({
      action: 'Process Payments',
      description: `Process ${params.memberIds.length} overdue payment(s)`,
      impact: `Attempt to collect $${params.amount.toFixed(2)} in overdue payments`,
      requiresApproval: false,
      estimatedTime: '2-5 minutes',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `Processed ${params.memberIds.length} payment(s)`,
        data: { processed: params.memberIds.length, collected: params.amount },
      };
    },
  });

  registerTool({
    id: 'schedule_shift',
    name: 'Schedule Staff Shift',
    description: 'Create a new staff shift',
    allowedRoles: ['owner', 'manager'],
    preview: (params: { staffId: string; date: string; startTime: string; endTime: string }) => ({
      action: 'Schedule Shift',
      description: `Schedule shift for ${params.date} ${params.startTime}-${params.endTime}`,
      impact: `Staff member will be scheduled for this shift`,
      requiresApproval: false,
      estimatedTime: '< 1 minute',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `Scheduled shift for ${params.date}`,
        data: { shiftId: `shift-${Date.now()}` },
      };
    },
  });

  registerTool({
    id: 'generate_report',
    name: 'Generate Report',
    description: 'Generate business analytics report',
    allowedRoles: ['owner', 'manager'],
    preview: (params: { reportType: string; dateRange: string }) => ({
      action: 'Generate Report',
      description: `Generate ${params.reportType} report for ${params.dateRange}`,
      impact: `Detailed analytics report will be created`,
      requiresApproval: false,
      estimatedTime: '< 1 minute',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `Generated ${params.reportType} report`,
        data: { reportId: `report-${Date.now()}` },
      };
    },
  });

  registerTool({
    id: 'qb_sync',
    name: 'Sync QuickBooks',
    description: 'Sync financial data with QuickBooks',
    allowedRoles: ['owner', 'manager'],
    preview: (params: { syncType: 'full' | 'incremental' }) => ({
      action: 'QuickBooks Sync',
      description: `Perform ${params.syncType} sync with QuickBooks`,
      impact: `Financial data will be synchronized`,
      requiresApproval: false,
      estimatedTime: '2-5 minutes',
    }),
    execute: async (params) => {
      return {
        success: true,
        message: `QuickBooks sync completed`,
        data: { synced: true, type: params.syncType },
      };
    },
  });
}
