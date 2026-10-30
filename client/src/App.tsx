import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-charcoal mb-4">
          AI Resume Builder
        </h1>
        <p className="text-charcoal-light text-lg">
          Build professional resumes with the power of AI
        </p>
        <div className="mt-8">
          <span className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium">
            Get Started
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
