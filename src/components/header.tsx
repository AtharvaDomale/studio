import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card">
      <Link href="#" className="flex items-center justify-center" prefetch={false}>
        <BrainCircuit className="h-6 w-6 text-primary" />
        <span className="ml-3 text-xl font-bold font-headline text-foreground">TeachAI</span>
      </Link>
    </header>
  );
}
