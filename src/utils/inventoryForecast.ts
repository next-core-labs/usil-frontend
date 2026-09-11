import { InventoryItem, InventoryDemandForecast, VendorBooking } from '../types';

/**
 * Calculates demand forecasting for inventory items based on upcoming scheduled events/bookings.
 * Formula:
 * Projected Usage = Sum of (guestCount * item.estimatedUsagePerGuest) for all upcoming active bookings
 * Remaining Projected Stock = currentStock - Projected Usage
 * Shortage Amount = max(0, minStockThreshold + Projected Usage - currentStock)
 */
export function calculateInventoryForecasts(
  inventoryItems: InventoryItem[],
  bookings: VendorBooking[]
): InventoryDemandForecast[] {
  // Filter active upcoming bookings (not cancelled or completed)
  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'completed'
  );

  const upcomingEventsCount = activeBookings.length;
  const totalUpcomingGuests = activeBookings.reduce((sum, b) => {
    const guests = b.guestCount || (b.serviceTitle?.includes('50') ? 50 : 80);
    return sum + (typeof guests === 'number' && !isNaN(guests) ? guests : 75);
  }, 0);

  return inventoryItems.map((item) => {
    // Calculated expected consumption based on rate per guest
    const forecastedUsageCount = Math.ceil(totalUpcomingGuests * (item.estimatedUsagePerGuest || 1));
    const remainingProjectedStock = Math.round((item.currentStock - forecastedUsageCount) * 100) / 100;
    
    let shortageAmount = 0;
    let status: 'safe' | 'low_stock' | 'critical_shortage' = 'safe';

    if (remainingProjectedStock < 0) {
      // Immediate deficit: will run out during upcoming events
      shortageAmount = Math.abs(remainingProjectedStock) + item.minStockThreshold;
      status = 'critical_shortage';
    } else if (remainingProjectedStock <= item.minStockThreshold) {
      // Below safety threshold
      shortageAmount = item.minStockThreshold - remainingProjectedStock;
      status = 'low_stock';
    } else {
      status = 'safe';
    }

    // Urgency days estimation (e.g. days until next shortage)
    const urgencyDays = status === 'critical_shortage' ? 2 : status === 'low_stock' ? 5 : 14;

    // Suggested reorder quantity (covers shortage + safety buffer)
    const bufferMultiplier = 1.3;
    const suggestedReorderQuantity = shortageAmount > 0
      ? Math.ceil(shortageAmount * bufferMultiplier)
      : item.currentStock <= item.minStockThreshold
      ? Math.ceil((item.minStockThreshold * 2) - item.currentStock)
      : 0;

    const estimatedReorderCost = Math.round(suggestedReorderQuantity * item.unitCost * 100) / 100;

    return {
      item,
      forecastedUsageCount,
      upcomingEventsCount,
      upcomingGuestsCount: totalUpcomingGuests,
      remainingProjectedStock,
      shortageAmount: Math.ceil(shortageAmount),
      status,
      urgencyDays,
      suggestedReorderQuantity,
      estimatedReorderCost,
    };
  });
}

export function getInventorySummaryStats(forecasts: InventoryDemandForecast[]) {
  const criticalCount = forecasts.filter((f) => f.status === 'critical_shortage').length;
  const lowStockCount = forecasts.filter((f) => f.status === 'low_stock').length;
  const safeCount = forecasts.filter((f) => f.status === 'safe').length;
  const totalItemsCount = forecasts.length;
  
  const totalRestockEstimatedCost = forecasts.reduce(
    (sum, f) => sum + (f.estimatedReorderCost || 0),
    0
  );

  return {
    criticalCount,
    lowStockCount,
    safeCount,
    totalItemsCount,
    totalRestockEstimatedCost,
    needsAttentionCount: criticalCount + lowStockCount,
  };
}
