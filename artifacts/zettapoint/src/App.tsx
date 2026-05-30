import { Switch, Route, Router as WouterRouter } from "wouter";
import { AppProvider } from "@/context/AppProvider";
import HomePage from "@/pages/HomePage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import SpinPage from "@/pages/SpinPage";
import TasksPage from "@/pages/TasksPage";
import WalletPage from "@/pages/WalletPage";
import MiniGamesPage from "@/pages/MiniGamesPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/spin" component={SpinPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/minigames" component={MiniGamesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </AppProvider>
  );
}

export default App;
