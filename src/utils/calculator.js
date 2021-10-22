import _, { isEmpty } from "lodash";

export const generateVariablesConditions = (ptrs) => {
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
              contents.forEach((it) => {
                if (it && it.length === 3) {
                  const itIndex = _.findIndex(newVariables, { name: it });
                  if (itIndex > -1) {
                    newVariables[itIndex].value = 0;
                  } else {
                    result.noSolution = {
                      status: true,
                      text: `"${it}" is not existed in variables.`,
                    };
                  }
                } else if (it && it.length % 3 === 0) {
                  newConditions.push({
                    contents: [it],
                    value,
                  });
                } else {
                  result.noSolution = {
                    status: true,
                    text: `"${it}" is not parsed as variables.`,
                  };
                }
              });
            }
          }
        }
      }
    }
  }

  if (result.noSolution.status) {
    return result;
  }

  const value = {
    variables: newVariables,
    conditions: newConditions,
    result,
  };
  result = sortBy0(value);

  return result;
};

const sortBy0 = (value) => {
  const { variables, conditions, result } = value;

  let newResult = _.cloneDeep(result),
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
        if (!isEmpty(itItem) && itItem.value === 0) {
          ignore = true;
          break;
        }
      }
      if (!ignore) {
        sortConditions1.push(item);
      }
    }
  });

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
