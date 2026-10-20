import { useRouter } from 'expo-router';
import Introduction from '@/features/introduction/Introduction';
import { hasAccess, useMock } from '@/mocks/MockProvider';

/** Manual replay never clears first-launch completion or participant state. */
export default function Presentation() {
  const router = useRouter();
  const { state } = useMock();
  return <Introduction finishLabel="Voltar ao app" onFinish={async () => {
    if (router.canGoBack()) router.back();
    else router.replace(hasAccess(state) ? '/home' : '/onboarding');
  }} />;
}
