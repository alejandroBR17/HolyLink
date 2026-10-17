import { connectFjuProjects, isFjuProject } from './fju-content.ts';
import { connectFjuMoments, isFjuMoment } from './fju-moments.ts';

interface QueueMedia {
  id: string;
  enabledInLoop: boolean;
}

interface ActiveQueueOptions {
  available: readonly string[];
  order: readonly string[];
  disabled: readonly string[];
  media: readonly QueueMedia[];
  youth: boolean;
}

/** Apply participation and saved order; availability is decided by agenda/mode upstream. */
export function buildActiveQueue({available, order, disabled, media, youth}: ActiveQueueOptions): string[] {
  const participating = available.filter(id => {
    // Prepared FJU blocks have their own controls, independent of legacy hidden flags.
    if (!isFjuProject(id) && !isFjuMoment(id) && disabled.includes(id)) return false;
    if (id.startsWith('custom_')) {
      return media.find(item => item.id === id)?.enabledInLoop ?? false;
    }
    return true;
  });

  const active = order.filter(id => participating.includes(id));
  for (const id of participating) {
    if (!active.includes(id)) active.push(id);
  }

  return youth ? connectFjuMoments(connectFjuProjects(active)) : active;
}
