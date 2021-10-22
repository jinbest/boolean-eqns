import React, { useState } from "react";
import ReactFileReader from "react-file-reader";
import {
  generateVariablesConditions,
  isEqualCondition,
} from "./utils/calculator";
import CustomLoader from "./component/custom-loader";
import "./App.css";

function App() {
  const [inputed, setInputed] = useState([]);
  const [variables, setVariables] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [noSolution, setNoSolution] = useState({
    status: false,
    text: "",
  });
  const [solutions, setSolutions] = useState([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const init = () => {
    setVariables([]);
    setConditions([]);
    setInputed([]);
    setNoSolution({
      status: false,
      text: "",
    });
    setSolutions([]);
    setFinished(false);
    setLoading(false);
  };

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
    } = generateVariablesConditions(ptrs, setLoading);

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
    if (noSolution && noSolution.status) {
      alert(noSolution.text);
      init();
      return;
    }
    const sols = isEqualCondition(variables, conditions, setLoading);
    if (sols && sols.length) {
      setSolutions([...sols]);
    }
    setFinished(true);
  };

  const download = () => {
    let exportData = [];
    solutions.forEach((item, index) => {
      exportData.push({
        id: index + 1,
        solution: item,
      });
    });
    handleSaveToPC(exportData);
    init();
  };

  const handleSaveToPC = (jsonData) => {
    const fileData = JSON.stringify(jsonData);
    const blob = new Blob([fileData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `solutions.json`;
    link.href = url;
    link.click();
  };

  return (
    <div className="App">
      <div className="buttons">
        <ReactFileReader handleFiles={handleFiles} fileTypes={".txt"}>
          <button>Upload</button>
        </ReactFileReader>
        <button onClick={calculate}>Calculate</button>
        <button disabled={!solutions.length || !finished} onClick={download}>
          Download
        </button>
      </div>
      <div className="viewer">
        {inputed.length ? (
          <div>
            <p>Import</p>
            <div className="inputed custom-scroll-bar">
              {inputed.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          </div>
        ) : null}
        {finished ? (
          <div>
            <p>Export</p>
            {solutions.length ? (
              <div className="exported custom-scroll-bar">
                {solutions.map((item, index) => (
                  <div key={index}>
                    <p>{`solution-${index + 1}`}</p>
                    {item.map((it, idx) => {
                      return (
                        <p key={`${index}-${idx}`}>
                          {`${it.name} = ${it.value}`}
                        </p>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="inputed custom-scroll-bar">
                <i>Your eqns does not have right solution.</i>
              </div>
            )}
          </div>
        ) : null}
      </div>
      {loading ? <CustomLoader loaded={loading} /> : null}
    </div>
  );
}

export default App;
