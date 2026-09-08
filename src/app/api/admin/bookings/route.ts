import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';

// Booking operations belong to the separate internal operations system.
// This CMS must never read customer/order data from the shared database.
export const GET = withAuth(async () => {
  return apiResponse.error('Booking operations are managed in the internal system.', 'NOT_FOUND', 404);
});
