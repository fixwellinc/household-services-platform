/**
 * Data Export Service
 * 
 * Provides functionality to export dashboard data in various formats
 */

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

interface ExportData {
  type: string;
  data: any[];
  metadata?: {
    exportedAt: Date;
    exportedBy: string;
    totalRecords: number;
    filters?: Record<string, any>;
  };
}

class DataExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON(data: any[], filename: string, includeMetadata = false): void {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const exportData: ExportData = {
      type: 'dashboard-export',
      data,
      metadata: includeMetadata ? {
        exportedAt: new Date(),
        exportedBy: 'Customer Dashboard',
        totalRecords: data.length,
      } : undefined,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Export data to PDF format
   */
  static async exportToPDF(data: any[], filename: string, title: string): Promise<void> {
    // This would typically use a PDF library like jsPDF or Puppeteer
    // For now, we'll create a simple HTML table that can be printed as PDF
    const htmlContent = this.generatePDFHTML(data, title);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Export data to Excel format
   */
  static exportToExcel(data: any[], filename: string): void {
    // This would typically use a library like SheetJS
    // For now, we'll export as CSV with .xlsx extension
    this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }

  /**
   * Export subscription data
   */
  static exportSubscriptionData(subscription: any, options: ExportOptions = { format: 'json' }): void {
    const data = [{
      'Plan Name': subscription.plan?.name || 'N/A',
      'Tier': subscription.tier,
      'Status': subscription.status,
      'Current Period Start': subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString() : 'N/A',
      'Current Period End': subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A',
      'Payment Frequency': subscription.paymentFrequency,
      'Next Payment Amount': subscription.nextPaymentAmount || 0,
      'Created At': subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'N/A',
    }];

    const filename = `subscription-data-${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        this.exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        this.exportToJSON(data, `${filename}.json`, options.includeMetadata);
        break;
      case 'pdf':
        this.exportToPDF(data, `${filename}.pdf`, 'Subscription Data');
        break;
      case 'excel':
        this.exportToExcel(data, `${filename}.xlsx`);
        break;
    }
  }

  /**
   * Export usage analytics data
   */
  static exportUsageAnalytics(analytics: any[], options: ExportOptions = { format: 'json' }): void {
    const data = analytics.map(item => ({
      'Date': item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
      'Services Used': item.servicesUsed || 0,
      'Priority Bookings': item.priorityBookings || 0,
      'Emergency Services': item.emergencyServices || 0,
      'Discounts Saved': item.discountsSaved || 0,
      'Total Usage': item.totalUsage || 0,
      'Period': item.period || 'N/A',
    }));

    const filename = `usage-analytics-${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        this.exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        this.exportToJSON(data, `${filename}.json`, options.includeMetadata);
        break;
      case 'pdf':
        this.exportToPDF(data, `${filename}.pdf`, 'Usage Analytics');
        break;
      case 'excel':
        this.exportToExcel(data, `${filename}.xlsx`);
        break;
    }
  }

  /**
   * Export service requests data
   */
  static exportServiceRequests(requests: any[], options: ExportOptions = { format: 'json' }): void {
    const data = requests.map(request => ({
      'Service Name': request.service?.name || 'N/A',
      'Category': request.service?.category || 'N/A',
      'Status': request.status,
      'Requested Date': request.requestedDate ? new Date(request.requestedDate).toLocaleDateString() : 'N/A',
      'Scheduled Date': request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'N/A',
      'Completed Date': request.completedDate ? new Date(request.completedDate).toLocaleDateString() : 'N/A',
      'Price': request.price || 0,
      'Discount Applied': request.discountApplied || 0,
      'Final Price': request.finalPrice || 0,
      'Notes': request.notes || '',
    }));

    const filename = `service-requests-${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        this.exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        this.exportToJSON(data, `${filename}.json`, options.includeMetadata);
        break;
      case 'pdf':
        this.exportToPDF(data, `${filename}.pdf`, 'Service Requests');
        break;
      case 'excel':
        this.exportToExcel(data, `${filename}.xlsx`);
        break;
    }
  }

  /**
   * Export notifications data
   */
  static exportNotifications(notifications: any[], options: ExportOptions = { format: 'json' }): void {
    const data = notifications.map(notification => ({
      'Title': notification.title,
      'Message': notification.message,
      'Type': notification.type,
      'Priority': notification.priority,
      'Created At': notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A',
      'Read At': notification.readAt ? new Date(notification.readAt).toLocaleDateString() : 'N/A',
      'Is Read': notification.isRead ? 'Yes' : 'No',
      'Action Required': notification.actionRequired ? 'Yes' : 'No',
    }));

    const filename = `notifications-${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        this.exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        this.exportToJSON(data, `${filename}.json`, options.includeMetadata);
        break;
      case 'pdf':
        this.exportToPDF(data, `${filename}.pdf`, 'Notifications');
        break;
      case 'excel':
        this.exportToExcel(data, `${filename}.xlsx`);
        break;
    }
  }

  /**
   * Export comprehensive dashboard data
   */
  static exportDashboardData(dashboardData: {
    subscription?: any;
    usageAnalytics?: any[];
    serviceRequests?: any[];
    notifications?: any[];
  }, options: ExportOptions = { format: 'json' }): void {
    const exportData = {
      subscription: dashboardData.subscription,
      usageAnalytics: dashboardData.usageAnalytics || [],
      serviceRequests: dashboardData.serviceRequests || [],
      notifications: dashboardData.notifications || [],
      metadata: {
        exportedAt: new Date(),
        exportedBy: 'Customer Dashboard',
        totalRecords: (dashboardData.usageAnalytics?.length || 0) + 
                     (dashboardData.serviceRequests?.length || 0) + 
                     (dashboardData.notifications?.length || 0),
        filters: options.filters,
      },
    };

    const filename = `dashboard-export-${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        // Export each section separately for CSV
        if (dashboardData.subscription) {
          this.exportSubscriptionData(dashboardData.subscription, { ...options, format: 'csv' });
        }
        if (dashboardData.usageAnalytics) {
          this.exportUsageAnalytics(dashboardData.usageAnalytics, { ...options, format: 'csv' });
        }
        if (dashboardData.serviceRequests) {
          this.exportServiceRequests(dashboardData.serviceRequests, { ...options, format: 'csv' });
        }
        if (dashboardData.notifications) {
          this.exportNotifications(dashboardData.notifications, { ...options, format: 'csv' });
        }
        break;
      case 'json':
        this.exportToJSON([exportData], `${filename}.json`, true);
        break;
      case 'pdf':
        this.exportToPDF([exportData], `${filename}.pdf`, 'Dashboard Export');
        break;
      case 'excel':
        this.exportToExcel([exportData], `${filename}.xlsx`);
        break;
    }
  }

  /**
   * Download file to user's device
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate HTML content for PDF export
   */
  private static generatePDFHTML(data: any[], title: string): string {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="no-print">Generated on ${new Date().toLocaleDateString()}</p>
          
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Customer Dashboard on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default DataExportService;
