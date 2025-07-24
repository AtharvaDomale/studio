

import { StudentDashboard } from '@/components/student-dashboard';

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-dvh">
            <main className="flex-1">
                <StudentDashboard />
            </main>
        </div>
    );
}
