import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';

// Status changes are owned by the separate internal operations system.
export const PUT = withAuth(async () => {
  return apiResponse.error('Booking operations are managed in the internal system.', 'NOT_FOUND', 404);
});
