import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { navFor } from '@/components/layout/nav';
import { Card, CardBody, PageHeader } from '@/components/ui';

const greetingByRole: Record<string, string> = {
  ADMIN: 'Manage students, staff, timetables and school-wide notices.',
  TEACHER: 'Mark attendance, post homework, and record exam results.',
  PARENT: "Follow your child's attendance, homework, results and fees.",
};

export function DashboardPage() {
  const { user, role } = useAuth();
  if (!role) return null;

  const links = navFor(role).filter((i) => i.to !== '/dashboard');

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
        description={greetingByRole[role]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardBody className="flex items-center gap-4">
                <span className="text-2xl" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">Go to {item.label.toLowerCase()}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
