import { NextRequest, NextResponse } from 'next/server';
import { AlertConfig } from '@/types/dashboard';

// Mock storage for alert configurations
// In a real implementation, this would be stored in a database
let alertConfigurations: Record<string, AlertConfig[]> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    const alerts = alertConfigurations[widgetId] || [];
    
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alert configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { widgetId, alerts } = await request.json();

    if (!widgetId || !Array.isArray(alerts)) {
      return NextResponse.json(
        { error: 'Widget ID and alerts array are required' },
        { status: 400 }
      );
    }

    // Validate alert configurations
    for (const alert of alerts) {
      if (!alert.id || !alert.name || !alert.condition) {
        return NextResponse.json(
          { error: 'Invalid alert configuration' },
          { status: 400 }
        );
      }
    }

    alertConfigurations[widgetId] = alerts;

    return NextResponse.json({ 
      success: true, 
      message: 'Alert configurations saved successfully' 
    });
  } catch (error) {
    console.error('Error saving alert configurations:', error);
    return NextResponse.json(
      { error: 'Failed to save alert configurations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { widgetId, alertId, alert } = await request.json();

    if (!widgetId || !alertId || !alert) {
      return NextResponse.json(
        { error: 'Widget ID, alert ID, and alert data are required' },
        { status: 400 }
      );
    }

    const alerts = alertConfigurations[widgetId] || [];
    const alertIndex = alerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    alerts[alertIndex] = { ...alert, id: alertId };
    alertConfigurations[widgetId] = alerts;

    return NextResponse.json({ 
      success: true, 
      message: 'Alert configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating alert configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update alert configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');
    const alertId = searchParams.get('alertId');

    if (!widgetId || !alertId) {
      return NextResponse.json(
        { error: 'Widget ID and alert ID are required' },
        { status: 400 }
      );
    }

    const alerts = alertConfigurations[widgetId] || [];
    const filteredAlerts = alerts.filter(a => a.id !== alertId);

    if (filteredAlerts.length === alerts.length) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    alertConfigurations[widgetId] = filteredAlerts;

    return NextResponse.json({ 
      success: true, 
      message: 'Alert configuration deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting alert configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert configuration' },
      { status: 500 }
    );
  }
}