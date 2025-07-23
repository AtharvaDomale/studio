
import { Header } from '@/components/header';
import { StudentDashboard } from '@/components/student-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Student Dashboard</CardTitle>
                        <CardDescription>Manage your students and view their AI-powered evaluations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StudentDashboard />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
