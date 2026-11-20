import { redirect } from 'next/navigation';
import { Dashboard } from '../../components/dashboard/Dashboard';
import { currentUser } from '../../lib/auth/session';

export default async function DominoPage() {
  if (!await currentUser()) redirect('/auth/login');
  return <Dashboard />;
}
