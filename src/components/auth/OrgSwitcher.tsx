import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, ChevronDown } from 'lucide-react';

export const OrgSwitcher = () => {
  const org = useAuthStore((s) => s.org);
  const orgs = useAuthStore((s) => s.orgs);
  const switchOrg = useAuthStore((s) => s.switchOrg);

  if (!org) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass-pill text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none">
          <Building2 className="h-3.5 w-3.5" />
          <span>{org.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[220px] border-white/[0.08] bg-card/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        {orgs.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onClick={() => switchOrg(o.id)}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span>{o.name}</span>
            {o.id === org.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
