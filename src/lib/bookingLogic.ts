import { CartItem } from "@/components/Menu/types";

// Constants
export const BUFFER_TIME_MINUTES = 15;

/**
 * Calculates total price and duration from a list of items.
 * Can be used by both Frontend (Cart) and Backend (Order Validation).
 */
export const calculateOrderTotals = (items: any[]) => {
    const totalVND = items.reduce((sum, item) => {
        // Handle different item structures if necessary (e.g. backend vs frontend)
        // Assuming consistent field names: priceVND, qty, timeValue
        const price = item.priceVND || 0;
        const qty = item.qty || 1;
        return sum + (price * qty);
    }, 0);

    const totalMinutes = items.reduce((sum, item) => {
        const time = item.timeValue || 0;
        const qty = item.qty || 1;
        return sum + (time * qty);
    }, 0);

    return { totalVND, totalMinutes };
};

/**
 * Calculates start and end times based on a reference time (usually 'now').
 */
export const calculateBookingTimes = (referenceDate: Date, totalMinutes: number) => {
    // Start Time = Reference + Buffer
    const startTimeNumber = referenceDate.getTime() + (BUFFER_TIME_MINUTES * 60000);
    const startTime = new Date(startTimeNumber);

    // End Time = Start Time + Duration
    const endTimeNumber = startTimeNumber + (totalMinutes * 60000);
    const endTime = new Date(endTimeNumber);

    return { startTime, endTime };
};

/**
 * Helper to format time as HH:mm (24h)
 */
export const formatTimeHHMM = (date: Date) => {
    // Ensure 2-digit format
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
};
