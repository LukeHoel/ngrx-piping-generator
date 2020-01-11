const actions = [];
let actionId = 0;
const addAction = () => {
    const action = document.createElement("div");
    action.innerHTML = `
        <div>
            <label>Name</label>
            <input id="name" type="text" value="">
        </div>
        <div>
            <label>Description</label>
            <input id="description" type="text" value="">
        </div>
        <button onclick="removeAction(${actionId})">Remove Action</button>
    `;
    action.setAttribute("actionId", actionId);
    document.getElementById("actions").appendChild(action);
    actions.push(action);
    actionId++;
};

const removeAction = (id) => {
    const index = actions.findIndex(action => action.getAttribute("actionId") === `${id}`);
    document.getElementById("actions").removeChild(actions[index]);
    actions.splice(index, 1);
};

const parseActionEnum = (action) => {
    const groupName = document.getElementById("groupName").value;

    const name = action.querySelector("#name").value;
    // Enum naming convention
    const actionName = `${name[0].toUpperCase()}${name.substring(1)}${groupName}`

    const description = action.querySelector("#description").value;
    return `${actionName} = '[${groupName}] ${description}',
            ${actionName}Success = '[${groupName}] ${description} Success'`;
}

const parseAction = (action) => {
    const groupName = document.getElementById("groupName").value;

    const name = action.querySelector("#name").value;
    // Enum naming convention
    const actionName = `${name[0].toUpperCase()}${name.substring(1)}${groupName}`
    return `export const ${name}${groupName} = createAction(${groupName}Actions.${actionName}, props<{}>());
    export const ${name}${groupName}Success = createAction(${groupName}Actions.${actionName}Success, props<{}>());`;
}

const generate = (event) => {
    document.getElementById("results").style.display = "block";

    const groupName = document.getElementById("groupName").value;

    document.getElementById("action").innerText = `
    export enum ${groupName}Actions {
      ${actions.map(parseActionEnum).join(',')}
    }
    ${actions.map(parseAction).join('')}`;

};