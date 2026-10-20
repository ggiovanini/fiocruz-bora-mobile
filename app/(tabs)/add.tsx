import { Redirect } from "expo-router";
// Direct links also open the activity flow; the tab itself acts as an action.
export default function AddActivity() { return <Redirect href="/activity" />; }
