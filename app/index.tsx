import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { hasAccess, useMock } from "@/mocks/MockProvider";
export default function Index() {
  const { state, dispatch } = useMock();
  const [destination] = useState<"/activity" | "/home">(
    state.resumePath === "/activity" ? "/activity" : "/home",
  );
  useEffect(() => {
    if (hasAccess(state) && state.resumePath)
      dispatch({ type: "patch", value: { resumePath: null } });
  }, [state, dispatch]);
  return <Redirect href={hasAccess(state) ? destination : "/onboarding"} />;
}
