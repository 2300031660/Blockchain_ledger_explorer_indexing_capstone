import Verification from "./pages/Verification";
import "./App.css";

import { Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Blocks from "./pages/Blocks";
import Wallets from "./pages/Wallets";

import TransactionDetails from "./pages/TransactionDetails";
import BlockDetails from "./pages/BlockDetails";
import WalletDetails from "./pages/WalletDetails";

function App() {
  return (
    <div>

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">
          ⛓ Ledger Explorer
        </div>

        <div className="nav-links">

          <Link to="/">
            Dashboard
          </Link>

          <Link to="/transactions">
            Transactions
          </Link>

          <Link to="/blocks">
            Blocks
          </Link>

          <Link to="/wallets">
            Wallets
          </Link>
          <Link to="/verification">
  Verification
</Link>
        </div>

      </nav>

      {/* PAGE ROUTES */}

      <Routes>

        {/* MAIN PAGES */}
        <Route
  path="/verification"
  element={<Verification />}
/>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/transactions"
          element={<Transactions />}
        />

        <Route
          path="/blocks"
          element={<Blocks />}
        />

        <Route
          path="/wallets"
          element={<Wallets />}
        />

        {/* TRANSACTION DETAILS */}

        <Route
          path="/transaction/:hash"
          element={<TransactionDetails />}
        />

        {/* BLOCK DETAILS */}

        <Route
          path="/block/:number"
          element={<BlockDetails />}
        />

        {/* WALLET DETAILS */}

        <Route
          path="/wallet/:address"
          element={<WalletDetails />}
        />

      </Routes>

    </div>
  );
}

export default App;