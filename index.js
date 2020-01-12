const actions = [];
let actionId = 0;
const pascalCase = (input) => `${input[0].toUpperCase()}${_.camelCase(input).substring(1)}`
const addAction = () => {
    const action = document.createElement("div");
    action.innerHTML = `
        <hr>
        <div>
            <label>Name</label>
            <input id="name" type="text" value="">
        </div>
        <div>
            <label>Description</label>
            <input id="description" type="text" value="">
        </div>
        <button class="buttonRemove buttonSecondary" onclick="removeAction(${actionId})">Remove Action</button>
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
    const groupNameRaw = document.getElementById("groupName").value;
    if(!groupNameRaw){
	return [];
    }
    const groupName = pascalCase(groupNameRaw);
    const groupNameFirstLower = `${groupName[0].toLowerCase()}${groupName.substring(1)}`
    return actions.map(action => {
        const name = _.camelCase(action.querySelector("#name").value);
        const description = action.querySelector("#description").value;
        if (!name || !description) {
            return;
        }
        const actionName = `${name[0].toUpperCase()}${name.substring(1)}${groupName}`
        return { groupName, groupNameFirstLower, name, actionName, description };
    }).filter(action => action);
}

const generateActionEnum = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    // Enum naming convention
    return `${actionName} = '[${groupName}] ${description}',
            ${actionName}Success = '[${groupName}] ${description} Success'`;
}

const generateAction = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    // Enum naming convention
    return `export const ${name}${groupName}Action = createAction(${groupName}Actions.${actionName}, props<{}>());
    export const ${name}${groupName}SuccessAction = createAction(${groupName}Actions.${actionName}Success, props<{}>());`;
}

const generateActionImports = ({ groupName, groupNameFirstLower, name, actionName, description }) => `${name}${groupName}Action, ${name}${groupName}SuccessAction`;

const generateEffect = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    return `
        ${name}${groupName}$ = createEffect(() =>
            this.actions$.pipe(
            ofType(${name}${groupName}Action),
            switchMap((action: any) =>
                this.${groupNameFirstLower}Service.${name}${groupName}().pipe(
                map(() => ${name}${groupName}SuccessAction({})),
                catchError(() => EMPTY)
                )
            )
            )
        );
    `
};

const generateService = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    return `${name}${groupName}(): Observable<any> {
                return null;
            }`;
}

const generateStateImports = ({ groupName, groupNameFirstLower, name, actionName, description }) => `I${groupName}State, Initial${groupName}State`;

const generateReducer = ({ groupName, groupNameFirstLower, name, actionName, description }) => {
    return `on(${name}${groupName}Action, state => ({ ...state })),
    on(${name}${groupName}SuccessAction, state => ({ ...state }))
    `;
};

const generate = (event) => {
    const actionsData = setActionsData();

    document.getElementById("results").style.display = "hidden";
    if (actionsData.length === 0) {
        return;
    }
    document.getElementById("results").style.display = "block";
    const groupName = pascalCase(document.getElementById("groupName").value);
    const groupNameFirstLower = `${groupName[0].toLowerCase()}${groupName.substring(1)}`

    // Set actions
    document.getElementById("action").innerText = js_beautify(`
        import { createAction, props } from '@ngrx/store';
        export enum ${groupName}Actions {
        ${actionsData.map(generateActionEnum).join(',')}
        }
    ${actionsData.map(generateAction).join('')}`);

    // Set effects
    document.getElementById("effect").innerText = js_beautify(`
        import { Injectable } from '@angular/core';
        import { createEffect, ofType, Actions } from '@ngrx/effects';
        import { switchMap, map, catchError } from 'rxjs/operators';
        import { EMPTY } from 'rxjs';
        import { ${actionsData.map(generateActionImports).join(',')} } from '../actions/${_.kebabCase(groupName)}.action';
        @Injectable()
        export class ${groupName}Effect {
            ${actionsData.map(generateEffect).join('')}
        constructor(private actions$: Actions, private ${groupNameFirstLower}Service: ${groupName}Service) {}
        }
    `);

    // Set services
    document.getElementById('service').innerText = js_beautify(`
        import { Injectable } from '@angular/core';
        import { Observable } from 'rxjs';
        import { HttpClient } from '@angular/common/http';
        @Injectable({
            providedIn: 'root'
        })
        export class ${groupName}Service {
            constructor(private http: HttpClient) {}
            ${actionsData.map(generateService).join('')}
        }`);

    // Set reducers
    document.getElementById('reducer').innerText = js_beautify(`
      import { createReducer, on, Action } from '@ngrx/store';
      import { ${actionsData.map(generateActionImports).join(',')} } from '../actions/${_.kebabCase(groupName)}.action';
      import { ${actionsData.map(generateStateImports).join(',')} } from '../states/${_.kebabCase(groupName)}.state';
      const ${groupNameFirstLower}Reducers = createReducer(
        Initial${groupName}State,
        ${actionsData.map(generateReducer).join(',')}
      );
      
      export function ${groupName}Reducer(state: I${groupName}State, action: Action) {
        return ${groupNameFirstLower}Reducers(state, action);
      }
    `);

    // Set state
    document.getElementById('state').innerText = js_beautify(`
        export interface I${groupName}State {}
        export const Initial${groupName}State: I${groupName}State = {};
    `);

    // Set header file names
    const fileName = (type) => `${_.kebabCase(groupName)}.${type}.ts`;
    document.getElementById("actionFileName").innerText = fileName("action");
    document.getElementById("effectFileName").innerText = fileName("effect");
    document.getElementById("serviceFileName").innerText = fileName("service");
    document.getElementById("reducerFileName").innerText = fileName("reducer");
    document.getElementById("stateFileName").innerText = fileName("state");
    // Apply syntax highlighting
    document.querySelectorAll('pre code').forEach((block) => hljs.highlightBlock(block));
};
