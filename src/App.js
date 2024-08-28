import React from "react";
import ParentFeature from "./components/ParentFeature";
import "./App.css";

function App() {
  return (
    <div className="App">
      <ParentFeature /> {/* Use ParentFeature to encapsulate the feature-specific components */}
    </div>
  );
}

export default App;
