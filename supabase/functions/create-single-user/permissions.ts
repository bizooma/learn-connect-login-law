
import { validateAdminPermissions } from '../shared/adminValidation.ts';

export async function checkUserPermissions(userId: string, userEmail: string) {
  return await validateAdminPermissions(userId, userEmail);
}
