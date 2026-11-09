import {useMock} from '@/mocks/MockProvider';
import {apiEnabled} from '@/api/session';
import {useHealthImports} from '@/health/HealthImportProvider';
import type {HealthWorkout} from '@/health/model';
import {WorkoutImportView} from './health/WorkoutImportView';

export default function HealthWorkoutImport({workout}:{workout:HealthWorkout}) {
 const {state,api}=useMock();
 const imports=useHealthImports();
 return <WorkoutImportView workout={workout} entry={imports.statuses[workout.id]} items={api.data.catalog}
  membershipLabel={state.membershipId==='personal' ? 'Jornada pessoal' : api.data.memberships.find(m=>m.id===state.membershipId)?.organization_name ?? 'Selecione um vínculo'}
  available={apiEnabled} canSend={!!state.membershipId} consentGranted={api.data.consent?.status==='granted'}
  sharedDemo={api.data.profile?.email?.toLowerCase().endsWith('@bora.example') ?? false}
  onSend={(type,dimension)=>imports.submit(workout,type,dimension)}/>;
}
