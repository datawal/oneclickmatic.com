import { WalletProvider, GasProvider } from './hooks/useWalletAndGas';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import { Helmet } from 'react-helmet';
import ReactGA from 'react-ga4';
import './App.css';

// Initialize Google Analytics
ReactGA.initialize('G-XXXXXXXXXX'); // Replace with your actual GA4 measurement ID

function App() {
  return (
    <WalletProvider>
      <GasProvider>
        <div className="app">
          {/* SEO and Meta Tags */}
          <Helmet>
            <title>OneClickMatic | Save on Polygon Gas Fees with One Click</title>
            <meta name="description" content="Optimize your Polygon (MATIC) transaction fees with just one click. Save money on gas fees with our simple, effective optimization tool." />
            <meta name="keywords" content="polygon, matic, gas fees, gas optimization, crypto, blockchain, ethereum, web3" />
            <meta property="og:title" content="OneClickMatic | Save on Polygon Gas Fees" />
            <meta property="og:description" content="Optimize your Polygon (MATIC) transaction fees with just one click. Save money on gas fees with our simple, effective optimization tool." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://oneclickmatic.com" />
            <meta property="og:image" content="https://oneclickmatic.com/og-image.jpg" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="OneClickMatic | Save on Polygon Gas Fees" />
            <meta name="twitter:description" content="Optimize your Polygon (MATIC) transaction fees with just one click." />
            <meta name="twitter:image" content="https://oneclickmatic.com/twitter-image.jpg" />
            <link rel="canonical" href="https://oneclickmatic.com" />
          </Helmet>

          {/* Main Layout */}
          <Sidebar />
          <div className="main-container">
            <Header />
            <main className="main-content">
              <HomePage />
            </main>
            <Footer />
          </div>
        </div>
      </GasProvider>
    </WalletProvider>
  );
}

export default App;
