import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  generateSocialCopy,
  getCommunityManagerPreferences,
} from '@/services/community-manager';
import { campaignPlatformsForCommunityManager } from '@/utils/campaignPlatforms';

interface CampaignGeneratePostsProps {
  campaignId: string;
  productId: string | null;
  platforms: string[];
  linkedContentCount?: number;
}

export function CampaignGeneratePosts({
  campaignId,
  productId,
  platforms,
  linkedContentCount = 0,
}: CampaignGeneratePostsProps) {
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['cm-preferences'],
    queryFn: getCommunityManagerPreferences,
  });

  const cmPlatforms = campaignPlatformsForCommunityManager(platforms);
  const postCount = preferencesQuery.data?.count ?? 5;

  const generateMutation = useMutation({
    mutationFn: () =>
      generateSocialCopy({
        platforms: cmPlatforms,
        count: postCount,
        campaignId,
        productId: productId ?? undefined,
      }),
    onSuccess: (result) => {
      const generated = result.postsGenerated ?? 0;
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
      void queryClient.invalidateQueries({ queryKey: ['cm-batches'] });

      if (generated > 0) {
        toast.success(`${generated} post${generated === 1 ? '' : 's'} programado${generated === 1 ? '' : 's'} en el calendario`);
      } else {
        toast.message('Generación iniciada — revisa el calendario en unos segundos');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron generar los posts');
    },
  });

  if (cmPlatforms.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-muted)]">
        Añade al menos una red social (Instagram, LinkedIn, TikTok, Facebook o X) en las plataformas
        de la campaña para generar copy.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/20 px-3 py-3">
      <p className="mb-1 text-sm font-medium text-[var(--foreground)]">
        {linkedContentCount > 0
          ? `${linkedContentCount} contenido${linkedContentCount === 1 ? '' : 's'} vinculado${linkedContentCount === 1 ? '' : 's'}`
          : 'Sin posts en el calendario'}
      </p>
      <p className="mb-3 text-xs text-[var(--foreground-muted)]">
        Genera {postCount} posts con Community Manager para{' '}
        {cmPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}. Se programan
        día a día y quedan vinculados a esta campaña.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="gap-2"
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          <Sparkles className="h-4 w-4" />
          Generar posts para esta campaña
        </Button>
        <Link to="/calendar">
          <Button type="button" variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Ver calendario
          </Button>
        </Link>
      </div>
    </div>
  );
}
