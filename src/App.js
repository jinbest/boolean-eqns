import React, { useState } from "react";
import ReactFileReader from "react-file-reader";
import { generateVariablesConditions } from "./utils/calculator";
import "./App.css";

function App() {
  const [inputed, setInputed] = useState([]);
  const [variables, setVariables] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [noSolution, setNoSolution] = useState({
    status: false,
    text: "",
  });

  const handleFiles = (files) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const ptrs = reader.result ? reader.result.split("\n") : [];
      initialize(ptrs);
    };
    reader.readAsText(files[0]);
  };

  const initialize = (ptrs) => {
    const {
      vars,
      cons,
      enable,
      noSolution: solutionStatus,
    } = generateVariablesConditions(ptrs);

    if (!enable) {
      alert("Can't parse current txt file. Please upload another one.");
      return;
    }

    setVariables(vars);
    setConditions(cons);
    setInputed(ptrs);
    setNoSolution(solutionStatus);
  };

  const calculate = () => {
    console.log("calculate", variables, conditions);
    if (noSolution && noSolution.status) {
      alert(noSolution.text);
      setVariables([]);
      setConditions([]);
      setInputed([]);
      setNoSolution({
        status: false,
        text: "",
      });
      return;
    }
  };

  return (
    <div className="App">
      <div className="buttons">
        <ReactFileReader handleFiles={handleFiles} fileTypes={".txt"}>
          <button>Upload</button>
        </ReactFileReader>
        <button onClick={calculate}>Calculate</button>
      </div>
      {inputed.length ? (
        <div className="inputed custom-scroll-bar">
          {inputed.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default App;
