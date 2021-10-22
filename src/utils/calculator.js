import _, { isEmpty } from "lodash";

export const generateVariablesConditions = (ptrs, setLoading) => {
  if (setLoading) {
    setLoading(true);
  }

  let result = {
    vars: [],
    cons: [],
    enable: true,
    noSolution: {
      status: false,
      text: "",
    },
  };

  if (
    !ptrs.length ||
    !ptrs.includes("variables:") ||
    !ptrs.includes("equations:")
  ) {
    console.log("Can't parse current txt file.");
    result.enable = false;

    if (setLoading) {
      setLoading(false);
    }
    return result;
  }

  let status = "";
  const newVariables = [],
    newConditions = [];

  for (let i = 0; i < ptrs.length; i++) {
    const item = ptrs[i] ? ptrs[i].trim() : "";

    if (item === "variables:") {
      status = "generate_variables";
    } else if (item === "equations:") {
      status = "generate_conditions";
    } else if (status === "generate_variables" && item) {
      newVariables.push({
        name: item,
        value: -1,
      });
    } else if (status === "generate_conditions" && item && item.includes("=")) {
      const ptrItems = item.split("=");
      if (ptrItems && ptrItems.length === 2 && ptrItems[0] && ptrItems[1]) {
        const ptrsLeft = ptrItems[0].split("+");
        if (ptrsLeft && ptrsLeft.length) {
          const contents = [],
            value = Number(ptrItems[1]);
          ptrsLeft.forEach((it) => {
            if (it && it.trim()) {
              contents.push(it.trim());
            }
          });

          /* Here, current results
            contents = ['sE0', 'sE1sE2', 'sE2sE3', 'rTa'], value = 1 or 0
          */

          if (contents && contents.length) {
            if (value) {
              newConditions.push({
                contents,
                value,
              });
            } else {
              // contents.forEach((it) => {
              //   if (it && it.length === 3) {
              //     const itIndex = _.findIndex(newVariables, { name: it });
              //     if (itIndex > -1) {
              //       newVariables[itIndex].value = 0;
              //     } else {
              //       // eslint-disable-next-line no-loop-func
              //       result.noSolution = {
              //         status: true,
              //         text: `"${it}" is not existed in variables.`,
              //       };
              //     }
              //   } else if (it && it.length % 3 === 0) {
              //     newConditions.push({
              //       contents: [it],
              //       value,
              //     });
              //   } else {
              //     // eslint-disable-next-line no-loop-func
              //     result.noSolution = {
              //       status: true,
              //       text: `"${it}" is not parsed as variables.`,
              //     };
              //   }
              // });
              for (let i = 0; i < contents.length; i++) {
                const it = contents[i];
                if (it && it.length === 3) {
                  const itIndex = _.findIndex(newVariables, { name: it });
                  if (itIndex > -1) {
                    newVariables[itIndex].value = 0;
                  } else {
                    // eslint-disable-next-line no-loop-func
                    result.noSolution = {
                      status: true,
                      text: `"${it}" is not existed in variables.`,
                    };
                    break;
                  }
                } else if (it && it.length % 3 === 0) {
                  newConditions.push({
                    contents: [it],
                    value,
                  });
                } else {
                  // eslint-disable-next-line no-loop-func
                  result.noSolution = {
                    status: true,
                    text: `"${it}" is not parsed as variables.`,
                  };
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  // eslint-disable-next-line no-loop-func
  if (result.noSolution.status) {
    if (setLoading) {
      setLoading(false);
    }
    return result;
  }

  result.vars = newVariables;
  result.cons = newConditions;

  result = sortBy0(result);
  // eslint-disable-next-line no-loop-func
  if (result.noSolution.status) {
    if (setLoading) {
      setLoading(false);
    }
    return result;
  }

  result = sortBy1(result);

  if (setLoading) {
    setLoading(false);
  }

  return result;
};

const sortBy0 = (result) => {
  const { vars: variables, cons: conditions } = result;

  const newResult = _.cloneDeep(result),
    newVariables = _.cloneDeep(variables);

  const sortConditions1 = [];
  conditions.forEach((item) => {
    if (item.value) {
      const newItem = {
        contents: [],
        value: item.value,
      };
      /* 
      If sE0 + sE1sE2 + sE2sE3 + rTa = 1 && sE1 = 0 && sE3 = 0, then it can be sE0 + rTa = 1
      */
      item.contents.forEach((name) => {
        if (name) {
          const steps = name.length / 3;
          let ignore = false;
          for (let i = 0; i < steps; i++) {
            const it = name.substring(i * 3, (i + 1) * 3);
            const itItem = _.find(newVariables, { name: it });
            if (!isEmpty(itItem) && itItem.value === 0) {
              ignore = true;
              break;
            }
          }
          if (!ignore) {
            newItem.contents.push(name);
          }
        }
      });

      if (newItem.contents.length) {
        sortConditions1.push(newItem);
      } else {
        let text1 = 'Condition "',
          text2 = "";
        item.contents.forEach((it, index) => {
          const steps = it.length / 3;
          for (let i = 0; i < steps; i++) {
            const cnt = it.substring(i * 3, (i + 1) * 3);
            const itItem = _.find(newVariables, { name: cnt });
            if (!isEmpty(itItem) && itItem.value === 0) {
              text2 += `${itItem.name} = 0, `;
            }
          }
          if (index === item.contents.length - 1) {
            text1 += `${it} = `;
          } else {
            text1 += `${it} + `;
          }
        });
        text1 += `${item.value}, ${text2}" is impossible.`;
        // eslint-disable-next-line no-loop-func
        newResult.noSolution = {
          status: true,
          text: text1,
        };
      }
    } else {
      const content = item.contents[0],
        steps = content.length / 3;
      let ignore = false;
      /* 
      If sE1sE2 = 0 && sE1 = 0, then this condition can be ignored.
      */
      for (let i = 0; i < steps; i++) {
        const it = content.substring(i * 3, (i + 1) * 3);
        const itItem = _.find(newVariables, { name: it });

        if (!itItem || isEmpty(itItem)) {
          ignore = true;
          // eslint-disable-next-line no-loop-func
          newResult.noSolution = {
            status: true,
            text: `"${it}" is not existed in variables.`,
          };
          break;
        } else if (itItem.value === 0) {
          ignore = true;
          break;
        }
      }

      if (!ignore) {
        sortConditions1.push(item);
      }
    }
  });

  // eslint-disable-next-line no-loop-func
  if (newResult.noSolution.status) {
    return newResult;
  }

  const sortConditions2 = [];
  sortConditions1.forEach((item) => {
    if (item.value && item.contents.length === 1) {
      const content = item.contents[0],
        steps = content.length / 3;

      for (let i = 0; i < steps; i++) {
        const it = content.substring(i * 3, (i + 1) * 3);
        const itIndex = _.findIndex(newVariables, { name: it });

        if (itIndex > -1) {
          newVariables[itIndex].value = 1;
        } else {
          // eslint-disable-next-line no-loop-func
          newResult.noSolution = {
            status: true,
            text: `"${it}" is not existed in variables.`,
          };
        }
      }
    } else {
      sortConditions2.push(item);
    }
  });

  newResult.vars = newVariables;
  newResult.cons = sortConditions2;

  return newResult;
};

const sortBy1 = (result) => {
  const { vars: variables, cons: conditions } = result;

  const newResult = _.cloneDeep(result),
    newVariables = _.cloneDeep(variables);

  const newConditions = [];
  conditions.forEach((item) => {
    if (item.value) {
      const newItem = {
        contents: [],
        value: item.value,
      };
      let ignore = false;
      item.contents.forEach((it) => {
        if (it && it.length === 3) {
          const itIndex = _.findIndex(newVariables, { name: it });
          if (itIndex > -1 && newVariables[itIndex].value === 0) {
            ignore = true;
          }
        } else {
          const filtered = _.filter(conditions, (o) => o.value === 0);
          if (filtered && filtered.length) {
            const matchIndex = _.findIndex(
              filtered,
              (o) => o.contents[0] === it
            );
            if (matchIndex > -1) {
              ignore = true;
            }
          }
        }
        if (!ignore) {
          newItem.contents.push(it);
        }
      });
      newConditions.push(newItem);
    } else {
      let content = item.contents[0],
        newContent = "";
      const steps = content.length / 3;
      for (let i = 0; i < steps; i++) {
        const it = content.substring(i * 3, (i + 1) * 3);
        const itIndex = _.findIndex(newVariables, { name: it });
        if (itIndex > -1 && newVariables[itIndex].value === -1) {
          newContent += it;
        }
      }
      newConditions.push({
        contents: [newContent],
        value: 0,
      });
    }
  });

  newResult.vars = newVariables;
  newResult.cons = newConditions;

  return newResult;
};

export const isEqualCondition = (variables, conditions, setLoading) => {
  if (setLoading) {
    setLoading(true);
  }

  const solutions = [];
  let counter = 0;

  const noValIndexes = _.filter(
    _.range(variables.length),
    (i) => variables[i].value === -1
  );

  if (noValIndexes && noValIndexes.length) {
    const maxCounter = Math.min(Math.pow(2, noValIndexes.length), 1024);
    // console.log("noValIndexes", noValIndexes, maxCounter);

    while (counter < maxCounter) {
      const newVariables = _.cloneDeep(variables);
      for (let i = 0; i < noValIndexes.length; i++) {
        const modular = Math.pow(2, i + 1),
          itIndex = noValIndexes[i];
        if (counter % modular >= modular / 2) {
          newVariables[itIndex].value = 0;
        } else {
          newVariables[itIndex].value = 1;
        }
      }
      counter += 1;
      // console.log("newVariables", newVariables);

      if (!conditions.length) {
        solutions.push(_.cloneDeep(newVariables));
      } else if (isRightForConditions(newVariables, conditions)) {
        solutions.push(_.cloneDeep(newVariables));
      }
    }
  } else {
    // console.log("all variables have been defined already", variables);

    if (!conditions.length) {
      solutions.push(_.cloneDeep(variables));
    } else if (isRightForConditions(variables, conditions)) {
      solutions.push(_.cloneDeep(variables));
    }
  }

  if (setLoading) {
    setLoading(false);
  }

  return solutions;
};

const isRightForConditions = (variables, conditions) => {
  let result = true;

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    if (!isSolutionForCondition(variables, condition)) {
      result = false;
      break;
    }
  }

  return result;
};

const isSolutionForCondition = (variables, condition) => {
  let result = true,
    leftTotal = 0;

  condition.contents.forEach((item) => {
    leftTotal += convertNameToValue(variables, item);
  });

  if (condition.value === 0 && leftTotal !== condition.value) {
    result = false;
  } else if (condition.value === 1 && leftTotal < 1) {
    result = false;
  }

  // console.log("isSolutionForCondition", variables, condition, leftTotal);
  return result;
};

const convertNameToValue = (variables, value) => {
  if (!value || value.length % 3 !== 0) return -1000;

  const steps = value.length / 3;
  let result = 1,
    error = false;

  for (let i = 0; i < steps; i++) {
    const name = value.substring(i * 3, (i + 1) * 3);
    const nameIndex = _.findIndex(variables, { name: name });
    if (nameIndex > -1) {
      result *= variables[nameIndex].value;
    } else {
      error = true;
    }
  }

  if (error) {
    return -1000;
  } else {
    return result;
  }
};
