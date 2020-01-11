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

const setActionsData = () => {
    const groupName = document.getElementById("groupName").value;
    const groupNameFirstLower = `${groupName[0].toLowerCase()}${groupName.substring(1)}`
    return actions.map(action => {
        const name = action.querySelector("#name").value;
        const actionName = `${name[0].toUpperCase()}${name.substring(1)}${groupName}`
        const description = action.querySelector("#description").value;
        return { groupName, groupNameFirstLower, name, actionName, description };
    });
}

const generateActionEnum = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    // Enum naming convention
    return `${actionName} = '[${groupName}] ${description}',
            ${actionName}Success = '[${groupName}] ${description} Success'`;
}

const generateAction = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    // Enum naming convention
    return `export const ${name}${groupName} = createAction(${groupName}Actions.${actionName}, props<{}>());
    export const ${name}${groupName}Success = createAction(${groupName}Actions.${actionName}Success, props<{}>());`;
}

const generateEffect = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    return `
        ${name}${groupName}$ = createEffect(() =>
            this.actions$.pipe(
            ofType(${name}${groupName}Action),
            switchMap((action: any) =>
                this.${groupNameFirstLower}Service.${name}${groupName}().pipe(
                map(() => ${name}${groupName}SuccessAction()),
                catchError(() => EMPTY)
                )
            )
            )
        );
    `
};

const generate = (event) => {
    document.getElementById("results").style.display = "block";
    const actionsData = setActionsData();

    const groupName = document.getElementById("groupName").value;
    const groupNameFirstLower = `${groupName[0].toLowerCase()}${groupName.substring(1)}`

    // Set actions
    document.getElementById("action").innerText = js_beautify(`
        export enum ${groupName}Actions {
        ${actionsData.map(generateActionEnum).join(',')}
        }
    ${actionsData.map(generateAction).join('')}`);

    // Set effects
    document.getElementById("effect").innerText = js_beautify(`
        @Injectable()
        export class ${groupName}Effect {
            ${actionsData.map(generateEffect).join('')}
        constructor(private actions$: Actions, private ${groupNameFirstLower}Service: ${groupName}Service) {}
        }
    `);
};