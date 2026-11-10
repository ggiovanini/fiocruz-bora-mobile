import { Redirect } from "expo-router";
export default function HealthRoute() {
  return <Redirect href={{pathname:"/history",params:{source:"device"}}}/>;
}
