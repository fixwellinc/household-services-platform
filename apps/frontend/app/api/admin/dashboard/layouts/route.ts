import { NextRequest, NextResponse } from 'next/server';
import { DashboardLayout } from '@/types/dashboard';

// Mock storage for dashboard layouts
// In a real implementation, this would be stored in a database
let dashboardLayouts: Record<string, DashboardLayout> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const layoutId = searchParams.get('layoutId');

    if (layoutId) {
      // Get specific layout
      const layout = dashboardLayouts[layoutId];
      if (!layout) {
        return NextResponse.json(
          { error: 'Layout not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ layout });
    }

    if (userId) {
      // Get all layouts for user
      const userLayouts = Object.values(dashboardLayouts).filter(
        layout => layout.userId === userId
      );
      return NextResponse.json({ layouts: userLayouts });
    }

    // Get all layouts (admin only)
    return NextResponse.json({ layouts: Object.values(dashboardLayouts) });
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard layouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const layout: DashboardLayout = await request.json();

    // Validate layout data
    if (!layout.name || !layout.userId || !Array.isArray(layout.widgets)) {
      return NextResponse.json(
        { error: 'Name, userId, and widgets are required' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!layout.id) {
      layout.id = `layout-${Date.now()}`;
    }

    // Set timestamps
    layout.createdAt = new Date();
    layout.updatedAt = new Date();

    dashboardLayouts[layout.id] = layout;

    return NextResponse.json({
      success: true,
      layout
    });
  } catch (error) {
    console.error('Error creating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard layout' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const layout: DashboardLayout = await request.json();

    if (!layout.id) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const existingLayout = dashboardLayouts[layout.id];
    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Update layout
    const updatedLayout = {
      ...existingLayout,
      ...layout,
      updatedAt: new Date()
    };

    dashboardLayouts[layout.id] = updatedLayout;

    return NextResponse.json({
      success: true,
      layout: updatedLayout
    });
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard layout' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('layoutId');

    if (!layoutId) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const layout = dashboardLayouts[layoutId];
    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of default layouts
    if (layout.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default layout' },
        { status: 400 }
      );
    }

    delete dashboardLayouts[layoutId];

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard layout' },
      { status: 500 }
    );
  }
}