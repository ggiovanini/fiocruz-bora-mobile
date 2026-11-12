import { SegmentedTabs } from '@/ui/SegmentedTabs';
export type EventTab = 'upcoming'|'ended'|'attended';
export function EventTabs({value,onChange}:{value:EventTab;onChange:(tab:EventTab)=>void}) {
  return <SegmentedTabs label="Categorias de eventos" options={[{ id: 'upcoming', label: 'Próximos' }, { id: 'ended', label: 'Encerrados' }, { id: 'attended', label: 'Com presença' }]} value={value} onChange={onChange}/>;
}
export const eventEmptyCopy={upcoming:{title:'Novos encontros vêm aí',body:'Nenhum evento próximo ou em andamento no momento.'},ended:{title:'Nenhum evento encerrado',body:'Os eventos que terminarem aparecerão aqui.'},attended:{title:'Seus encontros ficam aqui',body:'Você ainda não confirmou presença em nenhum evento.'}};
