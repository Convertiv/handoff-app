import { LogOut, UserRound } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

export function AuthControls({ mobile = false }: { mobile?: boolean }) {
  if (!isRegistryRuntime) return null;
  return <RegistryAuthControls mobile={mobile} />;
}

function RegistryAuthControls({ mobile }: { mobile: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading')
    return <div className={mobile ? 'h-9 w-full animate-pulse rounded-md bg-muted' : 'h-8 w-20 animate-pulse rounded-md bg-muted'} />;

  if (!session?.user) {
    return (
      <Button asChild variant="outline" size="sm" className={mobile ? 'w-full' : undefined}>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const user = session.user as typeof session.user & { role?: string };
  const displayName = user.name || user.email || 'Account';

  if (mobile) {
    return (
      <div className="space-y-2 border-t pt-4">
        <Link href="/account" className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-accent/50">
          <UserRound className="h-4 w-4" />
          <span className="truncate">{displayName}</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start font-normal"
          onClick={() => void signOut({ callbackUrl: `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/login` })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-48 gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1 font-normal">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.role ? (
            <Badge className="mt-1" variant="secondary">
              {user.role}
            </Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOut({ redirect: false }).then(() => void router.push('/login'));
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
