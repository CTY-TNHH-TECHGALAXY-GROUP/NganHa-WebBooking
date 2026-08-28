import { redirect } from 'next/navigation';

const SERVICE_MENU_URL = '/#services';

export default function SpaCelestialMenuPage() {
  redirect(SERVICE_MENU_URL);
}
